export const canRecord = !!(navigator.mediaDevices?.getDisplayMedia) &&
  !!(window.MediaRecorder) &&
  typeof MediaRecorder.isTypeSupported === 'function' &&
  MediaRecorder.isTypeSupported('video/webm') &&
  !!(window.BroadcastChannel);

// The popup HTML is written inline via document.write so no extra file is needed.
// The popup holds the MediaRecorder and survives main-page navigation.
const RECORDER_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Ano Recording</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;background:#1e293b;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:12px}
.wrap{display:flex;align-items:center;gap:10px}
.dot{width:10px;height:10px;border-radius:50%;background:#ef4444;animation:p 1s ease-in-out infinite;flex-shrink:0}
@keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
.timer{font-weight:600;font-variant-numeric:tabular-nums;font-size:15px;min-width:44px}
button{padding:5px 14px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer;font-size:13px;transition:background .15s}
button:hover{background:rgba(255,255,255,.12)}
#start{background:#ef4444;border-color:#ef4444;font-weight:600;padding:8px 20px;font-size:14px}
#start:hover{background:#dc2626}
.msg{color:#94a3b8;font-size:12px;text-align:center}
</style></head><body>
<div id="app"><button id="start">Share Tab &amp; Record</button></div>
<script>
var ch=new BroadcastChannel('ano-recording');
var rec,chunks=[],startTime=0,stream,timerIv;
ch.onmessage=function(e){
if(e.data.type==='stop')doStop();
if(e.data.type==='ping'&&rec&&rec.state==='recording')ch.postMessage({type:'pong',startTime:startTime});
};
document.getElementById('start').onclick=function(){startCapture()};
function startCapture(){
navigator.mediaDevices.getDisplayMedia({video:{frameRate:30}}).then(function(s){
stream=s;
var mime='video/webm';
if(typeof MediaRecorder.isTypeSupported==='function'&&MediaRecorder.isTypeSupported('video/webm;codecs=vp9'))mime='video/webm;codecs=vp9';
rec=new MediaRecorder(stream,{mimeType:mime});
chunks=[];
rec.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data)};
rec.onstop=onStop;
rec.start(500);
startTime=Date.now();
stream.getVideoTracks()[0].onended=function(){doStop()};
document.getElementById('app').innerHTML='<div class="wrap"><span class="dot"></span><span class="timer" id="t">0:00</span><button id="stopbtn">Stop</button></div>';
document.getElementById('stopbtn').onclick=function(){doStop()};
timerIv=setInterval(function(){
var sec=Math.floor((Date.now()-startTime)/1000);
var el=document.getElementById('t');
if(el)el.textContent=Math.floor(sec/60)+':'+(sec%60).toString().padStart(2,'0');
},250);
ch.postMessage({type:'started',startTime:startTime});
}).catch(function(){
ch.postMessage({type:'cancelled'});
try{window.close()}catch(e){}
});
}
function doStop(){if(!rec||rec.state==='inactive')return;rec.stop()}
function onStop(){
clearInterval(timerIv);
if(stream)stream.getTracks().forEach(function(t){t.stop()});
var blob=new Blob(chunks,{type:'video/webm'});
var duration=Date.now()-startTime;
ch.postMessage({type:'stopped',duration:duration,blob:blob});
document.getElementById('app').innerHTML='<div class="msg">Recording saved. Closing\\u2026</div>';
setTimeout(function(){try{window.close()}catch(e){}},2000);
}
window.onbeforeunload=function(){if(rec&&rec.state==='recording')doStop()};
</script></body></html>`;

export function createRecordingManager(ctx) {
  const channel = new BroadcastChannel('ano-recording');
  let active = false;
  let popupWindow = null;
  let startTime = 0;
  let storedBlob = null;
  let storedBlobUrl = null;
  let storedDuration = 0;

  // ── BroadcastChannel messages from popup ──

  channel.onmessage = (e) => {
    const { data } = e;
    if (data.type === 'started') {
      active = true;
      startTime = data.startTime;
      ctx.events.emit('recording:started');
    } else if (data.type === 'stopped') {
      onRecordingStopped(data);
    } else if (data.type === 'pong') {
      if (!active) {
        active = true;
        startTime = data.startTime;
      }
    } else if (data.type === 'cancelled') {
      ctx.events.emit('recording:cancelled');
    }
  };

  // ── Public API ──

  function startRecording() {
    if (active) return;
    openPopup();
  }

  function stopRecording() {
    channel.postMessage({ type: 'stop' });
  }

  function isRecording() {
    return active;
  }

  // ── Popup launcher ──

  function openPopup() {
    popupWindow = window.open(
      '',
      'ano-recorder',
      'width=460,height=600,top=60,left=60',
    );
    if (!popupWindow) {
      console.warn('[Ano] Popup blocked — allow popups for screen recording.');
      ctx.events.emit('recording:cancelled');
      return;
    }
    popupWindow.document.open();
    popupWindow.document.write(RECORDER_HTML);
    popupWindow.document.close();
  }

  // ── When recording finishes ──

  function onRecordingStopped(data) {
    active = false;

    if (data.blob) {
      storedBlob = data.blob;
      storedBlobUrl = URL.createObjectURL(data.blob);
      storedDuration = data.duration || 0;
    }

    ctx.events.emit('recording:stopped', {
      blob: storedBlob,
      blobUrl: storedBlobUrl,
      duration: storedDuration,
    });

    popupWindow = null;
  }

  // ── Blob access ──

  function getBlob() {
    return storedBlob;
  }

  function getBlobUrl() {
    return storedBlobUrl;
  }

  function clearBlob() {
    if (storedBlobUrl) {
      URL.revokeObjectURL(storedBlobUrl);
    }
    storedBlob = null;
    storedBlobUrl = null;
    storedDuration = 0;
  }

  // ── Cleanup helpers ──

  function removeRecording(id) {
    const ann = ctx.store.get(id);
    if (ann && ann.blobUrl) URL.revokeObjectURL(ann.blobUrl);
  }

  function destroy() {
    if (active) stopRecording();
    clearBlob();
    try { channel.close(); } catch { /* already closed */ }
    const recordings = ctx.store.getByType('recording');
    for (const r of recordings) {
      if (r.blobUrl) URL.revokeObjectURL(r.blobUrl);
    }
  }

  // On init, check if a recording is already in progress (cross-page navigation)
  setTimeout(() => channel.postMessage({ type: 'ping' }), 100);

  return {
    startRecording,
    stopRecording,
    isRecording,
    getBlob,
    getBlobUrl,
    clearBlob,
    removeRecording,
    destroy,
  };
}
