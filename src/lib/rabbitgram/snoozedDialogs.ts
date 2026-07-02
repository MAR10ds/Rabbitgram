import AppStorage from '@lib/storage';
import {AccountDatabase, getDatabaseState} from '@config/databases/state';
import {getCurrentAccount} from '@lib/accounts/getCurrentAccount';
import rootScope from '@lib/rootScope';
import type {AppManagers} from '@lib/managers';

// RabbitGram: purely client-side "snooze a chat" — hides it from the dialog
// list until a timestamp, then it reappears on its own. Never touches the
// server (no archive/mute call), so it's invisible to other devices/clients.
//
// `snoozedUntil` is the single source of truth `isSnoozed()` reads — it's
// consulted synchronously from AutonomousDialogList's canUpdateDialog() on
// every dialog update (new messages, edits, etc.), which is what keeps a
// chat hidden even while it keeps receiving messages during the snooze,
// not just at the moment Snooze was clicked.

// v1 ships one fixed duration rather than a picker popup — simplest thing
// that's still useful ("hide until later today"); a duration picker is a
// reasonable follow-up if it turns out to matter.
export const SNOOZE_DURATION_MS = 8 * 60 * 60 * 1000;

const snoozedUntil = new Map<PeerId, number>();
const timers = new Map<PeerId, ReturnType<typeof setTimeout>>();

const storage = new AppStorage<Record<PeerId, number>, AccountDatabase>(
  getDatabaseState(getCurrentAccount()),
  'snoozedDialogs'
);

export function isSnoozed(peerId: PeerId): boolean {
  return snoozedUntil.has(peerId);
}

async function refreshInLists(managers: AppManagers, peerId: PeerId) {
  const dialog = await managers.appMessagesManager.getDialogOnly(peerId);
  if(!dialog) return;
  rootScope.dispatchEvent('dialogs_multiupdate', new Map([[peerId, {dialog}]]));
}

async function dropFromLists(managers: AppManagers, peerId: PeerId) {
  const dialog = await managers.appMessagesManager.getDialogOnly(peerId);
  if(!dialog) return;
  rootScope.dispatchEvent('dialog_drop', dialog);
}

function scheduleExpiry(managers: AppManagers, peerId: PeerId, expiresAt: number) {
  const existing = timers.get(peerId);
  if(existing !== undefined) clearTimeout(existing);

  const delay = Math.max(0, expiresAt - Date.now());
  timers.set(peerId, setTimeout(() => unsnooze(managers, peerId), delay));
}

export async function snooze(managers: AppManagers, peerId: PeerId, durationMs: number) {
  const expiresAt = Date.now() + durationMs;
  snoozedUntil.set(peerId, expiresAt);
  scheduleExpiry(managers, peerId, expiresAt);
  await storage.set({[peerId]: expiresAt});
  await dropFromLists(managers, peerId);
}

export async function unsnooze(managers: AppManagers, peerId: PeerId) {
  if(!snoozedUntil.has(peerId)) return;

  snoozedUntil.delete(peerId);
  const timer = timers.get(peerId);
  if(timer !== undefined) {
    clearTimeout(timer);
    timers.delete(peerId);
  }

  await storage.delete(peerId);
  await refreshInLists(managers, peerId);
}

// Runs once, as soon as the worker's managers are ready (see createManagers.ts's
// 'managers_ready' dispatch) — loads persisted snoozes, drops anything already
// expired while the app was closed, and re-hides anything still active in case
// a dialog list rendered it before this had a chance to load.
rootScope.addEventListener('managers_ready', async() => {
  const managers = rootScope.managers;
  const entries = await storage.getAllEntries();
  const now = Date.now();

  for(const [key, expiresAt] of entries) {
    const peerId = key as unknown as PeerId;
    if(expiresAt <= now) {
      storage.delete(peerId);
      continue;
    }

    snoozedUntil.set(peerId, expiresAt);
    scheduleExpiry(managers, peerId, expiresAt);
    dropFromLists(managers, peerId);
  }
});
