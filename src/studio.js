import { FilesetResolver, ImageSegmenter, HandLandmarker } from '@mediapipe/tasks-vision';

const video = document.querySelector('#video');
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const startButton = document.querySelector('#start');
const triggerButton = document.querySelector('#trigger');
const restoreButton = document.querySelector('#restore');
const status = document.querySelector('#status');
const modelStatus = document.querySelector('#modelStatus');
const intensityInput = document.querySelector('#intensity');
const durationInput = document.querySelector('#duration');
const outputVideo = document.querySelector('#outputVideo');
const streamStatus = document.querySelector('#streamStatus');
const obsMode = new URLSearchParams(location.search).get('obs') === '1';
if (obsMode) document.body.classList.add('obs-mode');

let stream;
let segmenter;
let handLandmarker;
let modelReady = false;
let animationId;
let particles = [];
let mask = null;
let maskWidth = 0;
let maskHeight = 0;
let maskCanvas;
let maskCtx;
let maskImageData;
let vanishing = false;
let vanishStarted = 0;
let snapPoint = { x: 0.5, y: 0.42 };
let lastFrame = 0;
let lastInference = 0;
let pinchArmed = false;
let pinchAt = 0;
let lastPinchDistance = 1;
let lastHandSeen = 0;
let processedStream;
let processedTrack;
let outputHealthTimer;

const setStatus = (text) => { status.textContent = text; };
const extensionUrl = (path) => globalThis.chrome?.runtime?.getURL(path) || path;

async function loadModels() {
  try {
    const vision = await FilesetResolver.forVisionTasks(extensionUrl('wasm'));
    [segmenter, handLandmarker] = await Promise.all([
      ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: extensionUrl('models/selfie_segmenter_landscape.tflite'), delegate: 'GPU' },
        runningMode: 'VIDEO',
        outputCategoryMask: true,
        outputConfidenceMasks: false
      }),
      HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: extensionUrl('models/hand_landmarker.task'), delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: .62,
        minHandPresenceConfidence: .62,
        minTrackingConfidence: .62
      })
    ]);
    modelReady = true;
    modelStatus.textContent = 'Vision models ready';
    setStatus('Models ready. Enable the camera to begin.');
  } catch (error) {
    modelStatus.textContent = 'Model error';
    setStatus(`Vision model error: ${error.message}`);
    console.error(error);
  }
}

function resize() {
  if (!video.videoWidth) return;
  const scale = Math.min(1, 960 / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  if (!maskCanvas) {
    maskCanvas = document.createElement('canvas');
    maskCtx = maskCanvas.getContext('2d');
  }
}

function ensureProcessedStream() {
  if (processedStream && processedTrack?.readyState === 'live') return;
  processedStream?.getTracks().forEach((track) => track.stop());
  processedStream = canvas.captureStream(30);
  processedTrack = processedStream.getVideoTracks()[0];
  outputVideo.srcObject = processedStream;
  outputVideo.play().catch(() => {});
  streamStatus.textContent = `Live · ${canvas.width}×${canvas.height} · 30 fps target`;
  globalThis.snapAwayOutput = {
    stream: processedStream,
    getStream: () => processedStream,
    getTrack: () => processedTrack,
    stop: () => processedTrack?.stop()
  };
  clearInterval(outputHealthTimer);
  outputHealthTimer = setInterval(() => {
    const live = processedTrack?.readyState === 'live';
    streamStatus.textContent = live ? `Live · ${canvas.width}×${canvas.height} · 30 fps target` : 'Stopped';
  }, 1000);
}

function sampleMask(x, y) {
  if (!mask || !maskWidth || !maskHeight) return 0;
  const mx = Math.max(0, Math.min(maskWidth - 1, Math.floor(x / canvas.width * maskWidth)));
  const my = Math.max(0, Math.min(maskHeight - 1, Math.floor(y / canvas.height * maskHeight)));
  // SelfieSegmenter category 0 is background and category 1 is person.
  return (mask[my * maskWidth + mx] || 0) > 0 ? 255 : 0;
}

function captureParticles() {
  const w = canvas.width; const h = canvas.height;
  ctx.drawImage(video, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  particles = [];
  const step = Math.max(3, Math.round(10 - Number(intensityInput.value) / 16));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (sampleMask(x, y) < 80) continue;
      const i = (y * w + x) * 4;
      particles.push({
        x, y, ox: x, oy: y,
        r: image.data[i], g: image.data[i + 1], b: image.data[i + 2],
        vx: (Math.random() - .18) * 2.2,
        vy: (Math.random() - .58) * 1.5,
        size: 1.5 + Math.random() * 3.8,
        delay: Math.max(0, Math.min(.48, Math.hypot(x / w - snapPoint.x, y / h - snapPoint.y) * .72 + Math.random() * .14)),
        angle: Math.atan2(y / h - snapPoint.y, x / w - snapPoint.x),
        seed: Math.random() * 10
      });
    }
  }
}

function trigger(reason = 'manual') {
  if (!stream || !modelReady || vanishing) return;
  captureParticles();
  vanishing = true;
  vanishStarted = performance.now();
  setStatus(reason === 'snap' ? 'Snap detected — disintegration active.' : 'Disintegration active.');
  restoreButton.disabled = false;
}

function restore() {
  vanishing = false;
  particles = [];
  setStatus('Restored. Ready for another trigger.');
}

function handSnap(now, result) {
  const landmarks = result?.landmarks?.[0];
  if (!landmarks) {
    if (now - lastHandSeen > 500) { pinchArmed = false; lastPinchDistance = 1; }
    return;
  }
  lastHandSeen = now;
  const thumb = landmarks[4];
  const index = landmarks[8];
  snapPoint = { x: (thumb.x + index.x) / 2, y: (thumb.y + index.y) / 2 };
  const distance = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  const closing = distance < .065 && lastPinchDistance > .075;
  const opening = distance > .13 && pinchArmed && now - pinchAt < 650;
  if (closing) { pinchArmed = true; pinchAt = now; }
  if (opening) { pinchArmed = false; if (!vanishing) trigger('snap'); }
  lastPinchDistance = distance;
}

function inference(now) {
  if (!modelReady || !video.videoWidth || now - lastInference < 85) return;
  lastInference = now;
  try {
    const segmentation = segmenter.segmentForVideo(video, now);
    const categoryMask = segmentation.categoryMask;
    mask = categoryMask?.getAsUint8Array?.() || null;
    maskWidth = categoryMask?.width || 0;
    maskHeight = categoryMask?.height || 0;
    if (mask && maskWidth && maskHeight) {
      if (maskCanvas.width !== maskWidth || maskCanvas.height !== maskHeight) {
        maskCanvas.width = maskWidth;
        maskCanvas.height = maskHeight;
        maskImageData = maskCtx.createImageData(maskWidth, maskHeight);
      }
      for (let i = 0; i < mask.length; i++) {
        const alpha = mask[i] > 0 ? 255 : 0;
        const j = i * 4;
        maskImageData.data[j] = 255;
        maskImageData.data[j + 1] = 255;
        maskImageData.data[j + 2] = 255;
        maskImageData.data[j + 3] = alpha;
      }
      maskCtx.putImageData(maskImageData, 0, 0);
    }
    const handResult = handLandmarker.detectForVideo(video, now);
    handSnap(now, handResult);
    segmentation.close?.();
  } catch (error) {
    console.warn('Inference frame skipped:', error);
  }
}

function render(now) {
  animationId = requestAnimationFrame(render);
  if (!video.videoWidth || now - lastFrame < 30) return;
  lastFrame = now;
  inference(now);
  const w = canvas.width; const h = canvas.height;
  if (!vanishing) {
    ctx.globalAlpha = 1;
    ctx.drawImage(video, 0, 0, w, h);
    return;
  }
  const t = Math.min(1, (now - vanishStarted) / Number(durationInput.value));
  ctx.globalAlpha = 1;
  ctx.drawImage(video, 0, 0, w, h);
  // Fade only the segmented subject while retaining the unmodified background.
  const subjectFade = Math.min(1, t * 1.25);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = subjectFade;
  if (maskCanvas) ctx.drawImage(maskCanvas, 0, 0, w, h);
  ctx.restore();
  const reveal = Math.max(0, 1 - t);
  for (const p of particles) {
    const local = Math.max(0, Math.min(1, (t - p.delay) / .68));
    const drift = local * local;
    const wind = Math.sin(now / 260 + p.seed) * drift * 9;
    p.x = p.ox + p.vx * drift * 120 + Math.cos(p.angle) * drift * 26 + wind;
    p.y = p.oy + p.vy * drift * 100 + Math.sin(p.angle) * drift * 18;
    const alpha = reveal * (1 - p.delay * .8) * (0.82 + Math.sin(now / 90 + p.seed) * .18);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    if (Math.random() < .025) { ctx.globalAlpha = alpha * .3; ctx.fillStyle = '#9bb2ff'; ctx.fillRect(p.x - 3, p.y - 3, p.size + 6, p.size + 6); }
  }
  ctx.globalAlpha = 1;
  if (t >= 1) setStatus('Complete. Press Restore or trigger again.');
}

startButton.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    resize();
    ensureProcessedStream();
    window.addEventListener('resize', resize);
    triggerButton.disabled = false;
    restoreButton.disabled = false;
    startButton.disabled = true;
    setStatus('Camera ready. Pinch-and-release or press Trigger vanish.');
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(render);
  } catch (error) { setStatus(`Camera access failed: ${error.message}`); }
});
triggerButton.addEventListener('click', () => trigger('manual'));
restoreButton.addEventListener('click', restore);
window.addEventListener('keydown', (event) => { if (event.code === 'Space') { event.preventDefault(); trigger('manual'); } });
globalThis.chrome?.storage?.onChanged?.addListener((changes) => { if (changes.trigger) trigger('popup'); if (changes.restore) restore(); });
window.addEventListener('beforeunload', () => {
  clearInterval(outputHealthTimer);
  stream?.getTracks().forEach((track) => track.stop());
  processedStream?.getTracks().forEach((track) => track.stop());
});
loadModels();
