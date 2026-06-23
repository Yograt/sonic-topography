import assert from 'node:assert/strict';
import {
  PRESET_TRANSFER_VERSION,
  createPresetTransferPackage,
  normalizePresetTransferPackage,
  normalizeTransferPlaylists,
  writePresetTransferPackage,
} from './presetTransfer';
import { NETEASE_COOKIE_STORAGE_KEY } from './neteaseCookie';

const storage = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
  },
};

storage.clear();
storage.set(NETEASE_COOKIE_STORAGE_KEY, 'MUSIC_U=abc;\nNMTID=def;');
let preset = createPresetTransferPackage();
assert.equal(preset.data.neteaseCookie, undefined);

preset = createPresetTransferPackage({ includeNeteaseCookie: true });
assert.equal(preset.data.neteaseCookie, 'MUSIC_U=abc; NMTID=def');

assert.throws(() => normalizePresetTransferPackage({ app: 'sonic-topography', version: 999, data: {} }), /Sonic Topography/);

const playlists = normalizeTransferPlaylists([{ id: 'custom', name: 'Custom', songs: [{ id: '123', name: 'Song' }] }]);
assert.equal(playlists[0].id, 'favorites');
assert.equal(playlists[1].songs[0].id, 123);

const imported = writePresetTransferPackage({
  app: 'sonic-topography',
  version: PRESET_TRANSFER_VERSION,
  exportedAt: '2026-01-01T00:00:00.000Z',
  data: {
    playlists,
    triggerSettings: {
      Pulse: { threshold: 2, cooldown: 999 },
      Meteor: { enabled: true },
    },
    groundEqSettings: { curve: [120, -2, 50] },
    customThemes: [{ id: 'custom-a', name: 'A', background: '#000000', cool: '#111111', warm: '#222222', accent: '#333333', glowIntensity: 5, rotationSpeed: 5, showPlayerPanel: false }],
    activeCustomThemeId: 'custom-a',
    activeThemeId: 'custom',
    themeRotation: { enabled: true, intervalSeconds: 1, themeIds: ['custom-a'] },
    neteaseCookie: 'MUSIC_U=xyz;',
  },
});

assert.equal(imported.data.triggerSettings.Pulse?.threshold, 1);
assert.equal(imported.data.triggerSettings.Pulse?.cooldown, 300);
assert.deepEqual(imported.data.groundEqSettings.curve.slice(0, 3), [100, 0, 50]);
assert.equal(imported.data.customThemes[0].glowIntensity, 2.2);
assert.equal(imported.data.customThemes[0].rotationSpeed, 2);
assert.equal(imported.data.customThemes[0].showPlayerPanel, false);
assert.equal(storage.get(NETEASE_COOKIE_STORAGE_KEY), 'MUSIC_U=xyz');

console.log('presetTransfer tests passed');
