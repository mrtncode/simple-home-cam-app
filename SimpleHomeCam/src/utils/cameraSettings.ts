import * as SecureStore from 'expo-secure-store';
import { ReolinkClient } from './reolink';

import { ReolinkClientOptions } from './reolink';

const CAMERA_SETTINGS_KEY = 'simple-home-cam.camera-settings';
let cachedClient: ReolinkClient | null = null;
let cachedSettings: string | null = null;

function clearCachedClient(): void {
  cachedClient = null;
  cachedSettings = null;
}

export type SavedCameraSettings = Required<
  Pick<ReolinkClientOptions, 'host' | 'username' | 'password' | 'port' | 'https'>
> & {
  channel: number;
};

export async function saveCameraSettings(
  settings: SavedCameraSettings,
): Promise<void> {
  clearCachedClient();
  await SecureStore.setItemAsync(
    CAMERA_SETTINGS_KEY,
    JSON.stringify(settings),
  );
}

export async function clearCameraSettings(): Promise<void> {
  clearCachedClient();
  await SecureStore.deleteItemAsync(CAMERA_SETTINGS_KEY);
}

export async function getCameraClient(): Promise<ReolinkClient | null> {
  const settings = await loadCameraSettings();
  if (!settings) {
    clearCachedClient();
    return null;
  }

  const settingsKey = JSON.stringify(settings);
  if (!cachedClient || cachedSettings !== settingsKey) {
    cachedClient = new ReolinkClient(settings);
    cachedSettings = settingsKey;
  }

  return cachedClient;
}

export async function loadCameraSettings(): Promise<SavedCameraSettings | null> {
  const value = await SecureStore.getItemAsync(CAMERA_SETTINGS_KEY);

  if (!value) {
    return null;
  }

  try {
    const settings = JSON.parse(value) as Partial<SavedCameraSettings>;

    if (
      typeof settings.host !== 'string' ||
      typeof settings.username !== 'string' ||
      typeof settings.password !== 'string' ||
      typeof settings.port !== 'number' ||
      typeof settings.https !== 'boolean' ||
      typeof settings.channel !== 'number'
    ) {
      return null;
    }

    return settings as SavedCameraSettings;
  } catch {
    return null;
  }
}
