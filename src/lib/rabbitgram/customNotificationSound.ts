import AppStorage from '@lib/storage';
import {AccountDatabase, getDatabaseState} from '@config/databases/state';
import {getCurrentAccount} from '@lib/accounts/getCurrentAccount';

// RabbitGram: user-uploadable custom notification sound. Stored as a base64
// data URL in IndexedDB so it survives page reloads. The main thread loads it
// once on module init and caches it so testSound() can check synchronously.

export type CustomSoundRecord = {
  data: string;  // base64 data URL, e.g. "data:audio/mp3;base64,..."
  name: string;  // original filename, shown in settings UI
  mime: string;
};

const SOUND_KEY = 'sound' as const;
type SoundStore = Record<typeof SOUND_KEY, CustomSoundRecord>;

const storage = new AppStorage<SoundStore, AccountDatabase>(
  getDatabaseState(getCurrentAccount()),
  'customNotificationSound'
);

let cachedSound: CustomSoundRecord | null = null;
let nextPlayAt = 0;

// Called once at module load (UI thread only). Subsequent reads are sync via
// getCustomNotificationSound().
export async function loadCustomNotificationSound(): Promise<void> {
  const record = await storage.get(SOUND_KEY);
  cachedSound = record ?? null;
}

export function getCustomNotificationSound(): CustomSoundRecord | null {
  return cachedSound;
}

export async function setCustomNotificationSound(
  name: string,
  data: string,
  mime: string
): Promise<void> {
  const record: CustomSoundRecord = {data, name, mime};
  cachedSound = record;
  await storage.set({[SOUND_KEY]: record} as SoundStore);
}

export async function clearCustomNotificationSound(): Promise<void> {
  cachedSound = null;
  await storage.delete(SOUND_KEY);
}

// Plays the cached custom sound at the given volume with a 1-second throttle
// to match the default AudioAssetPlayer.playWithThrottle behaviour.
export function playCustomNotificationSound(volume: number): boolean {
  const sound = cachedSound;
  if(!sound) return false;

  // Defense-in-depth: only ever hand an audio data URL to the Audio element,
  // even though the upload path already restricts to audio/* files.
  if(!sound.data.startsWith('data:audio/')) return false;

  const now = Date.now();
  if(now < nextPlayAt) return true; // throttled but custom sound IS set
  nextPlayAt = now + 1000;

  try {
    const audio = new Audio(sound.data);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});
  } catch(e) {
    // ignore
  }

  return true;
}
