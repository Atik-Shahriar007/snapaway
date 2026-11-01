const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const execFileAsync = promisify(execFile);

let running = false;

async function hasDevice() {
  try {
    const { stdout } = await execFileAsync('sh', ['-lc', 'ls /dev/video* 2>/dev/null | head -1']);
    return Boolean(stdout.trim());
  } catch {
    return false;
  }
}

function createLinuxAdapter() {
  return {
    status: async () => ({
      platform: 'linux',
      available: await hasDevice(),
      running,
      driver: 'v4l2loopback',
      reason: 'A v4l2loopback device and a native frame writer are required.'
    }),
    start: async () => {
      const available = await hasDevice();
      if (!available) return { ok: false, reason: 'No /dev/video device found. Install and load v4l2loopback on the target machine.' };
      running = true;
      return { ok: false, reason: 'Driver boundary is scaffolded; native frame writer is not yet connected to the renderer.' };
    },
    stop: async () => { running = false; return { ok: true }; }
  };
}

module.exports = { createLinuxAdapter };
