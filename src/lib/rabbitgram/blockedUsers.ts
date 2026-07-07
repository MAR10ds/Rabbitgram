import {createRoot, createEffect} from 'solid-js';
import rootScope from '@lib/rootScope';
import {appSettings} from '@stores/appSettings';

// RabbitGram: "fully hide blocked users" — stock Telegram still shows a
// blocked user's messages in groups; this keeps a main-thread cache of the
// blocked list so bubbles' renderMessage can synchronously skip their
// messages. The cache is only populated while the setting is on (the list
// fetch is one paged contacts.getBlocked sweep), and kept fresh through the
// 'peer_block' updates the server pushes on every block/unblock.

const blockedPeers = new Set<PeerId>();
let loadedForSetting = false;

const PAGE_SIZE = 100;
const MAX_PAGES = 20; // 2000 blocked peers is plenty for a render filter

async function loadBlockedList() {
  const managers = rootScope.managers;
  for(let page = 0; page < MAX_PAGES; ++page) {
    const {count, peerIds} = await managers.appUsersManager.getBlocked(page * PAGE_SIZE, PAGE_SIZE);
    peerIds.forEach((peerId) => blockedPeers.add(peerId));
    if((page + 1) * PAGE_SIZE >= count || !peerIds.length) {
      break;
    }
  }
}

rootScope.addEventListener('peer_block', ({peerId, blocked}) => {
  if(blocked) {
    blockedPeers.add(peerId);
  } else {
    blockedPeers.delete(peerId);
  }
});

createRoot(() => {
  createEffect(() => {
    if(appSettings.hideBlockedUsers && !loadedForSetting) {
      loadedForSetting = true;
      loadBlockedList();
    }
  });
});

// Synchronous check used from hot render paths; reads the Solid store so
// callers inside computations re-run when the toggle flips.
export function isHiddenBlockedPeer(peerId: PeerId): boolean {
  return !!appSettings.hideBlockedUsers && blockedPeers.has(peerId);
}
