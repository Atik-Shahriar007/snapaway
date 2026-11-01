const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const startButton = document.getElementById('start');
const triggerButton = document.getElementById('trigger');
const restoreButton = document.getElementById('restore');
const status = document.getElementById('status');

let stream;
let animationId;
let particles = [];
let vanishing = false;
let vanishStarted = 0;
let vanishDuration = 2800;
let lastFrame = 0;

function setStatus(text) { status.textContent = text; }

function resize() {
  if (!video.videoWidth) return;
  const scale = Math.min(1, 960 / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
}

function subjectMask(x, y, w, h) {
  // Deliberately simple placeholder for the real segmentation model.
  const nx = (x - w * .5) / (w * .28);
  const ny = (y - h * .5) / (h * .47);
  return nx * nx + ny * ny < 1;
}

function captureParticles() {
  const w = canvas.width; const h = canvas.height;
  ctx.drawImage(video, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  particles = [];
  const step = 7;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (!subjectMask(x, y, w, h)) continue;
      const i = (y * w + x) * 4;
      particles.push({
        x, y, ox: x, oy: y,
        r: image.data[i], g: image.data[i + 1], b: image.data[i + 2],
        vx: (Math.random() - .25) * 1.8,
        vy: (Math.random() - .55) * 1.1,
        size: 2 + Math.random() * 4,
        delay: Math.random() * .32,
        seed: Math.random() * 10
      });
    }
  }
}

function trigger() {
  if (!stream) return;
  captureParticles();
  vanishing = true;
  vanishStarted = performance.now();
  setStatus('Disintegration active — local preview only.');
  restoreButton.disabled = false;
}

function restore() {
  vanishing = false;
  particles = [];
  setStatus('Restored. Ready for another manual trigger.');
}

function render(now) {
  animationId = requestAnimationFrame(render);
  if (!video.videoWidth || now - lastFrame < 30) return;
  lastFrame = now;
  const w = canvas.width; const h = canvas.height;
  if (!vanishing) {
    ctx.globalAlpha = 1;
    ctx.drawImage(video, 0, 0, w, h);
    return;
  }
  const elapsed = now - vanishStarted;
  const t = Math.min(1, elapsed / vanishDuration);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.fillStyle = 'rgba(5, 6, 12, 0.94)';
  ctx.fillRect(0, 0, w, h);
  const reveal = Math.max(0, 1 - t);
  for (const p of particles) {
    const local = Math.max(0, Math.min(1, (t - p.delay) / .68));
    const drift = local * local;
    p.x = p.ox + p.vx * drift * 120 + Math.sin(now / 220 + p.seed) * drift * 8;
    p.y = p.oy + p.vy * drift * 100;
    const alpha = reveal * (1 - p.delay * .8);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    if (Math.random() < .025) {
      ctx.globalAlpha = alpha * .3;
      ctx.fillStyle = '#9bb2ff';
      ctx.fillRect(p.x - 3, p.y - 3, p.size + 6, p.size + 6);
    }
  }
  ctx.globalAlpha = 1;
  if (t >= 1) setStatus('Complete. Press Restore or trigger again.');
}

startButton.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    resize();
    window.addEventListener('resize', resize);
    triggerButton.disabled = false;
    restoreButton.disabled = false;
    startButton.disabled = true;
    setStatus('Camera ready. Press Trigger vanish.');
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(render);
  } catch (error) {
    setStatus(`Camera access failed: ${error.message}`);
  }
});

triggerButton.addEventListener('click', trigger);
restoreButton.addEventListener('click', restore);
window.addEventListener('keydown', (event) => { if (event.code === 'Space') { event.preventDefault(); trigger(); } });
