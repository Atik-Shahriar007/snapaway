const { createLinuxAdapter } = require('./linux.cjs');

function unavailableAdapter(platform) {
  return {
    status: () => ({ platform, available: false, running: false, reason: 'No native virtual-camera adapter implemented for this platform yet.' }),
    start: async () => ({ ok: false, reason: 'Native virtual-camera adapter is not implemented for this platform.' }),
    stop: async () => ({ ok: true })
  };
}

function createNativeCameraAdapter(platform) {
  if (platform === 'linux') return createLinuxAdapter();
  if (platform === 'darwin') return unavailableAdapter('darwin');
  if (platform === 'win32') return unavailableAdapter('win32');
  return unavailableAdapter(platform);
}

module.exports = { createNativeCameraAdapter };
