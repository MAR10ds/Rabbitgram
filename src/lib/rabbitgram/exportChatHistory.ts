import type {AppManagers} from '@lib/managers';
import type {Message} from '@layer';
import getPeerTitle from '@components/wrappers/getPeerTitle';
import {formatFullSentTime} from '@helpers/date';
import rootScope from '@lib/rootScope';

// RabbitGram: exports a chat's message history to a standalone, readable
// HTML file the user can open in any browser — no import tooling needed.
// Paginates through the same getHistory()/getMessageByPeer() calls the chat
// UI itself uses; capped so a huge channel can't hang the tab indefinitely.

const EXPORT_BATCH_SIZE = 100;
export const EXPORT_MAX_MESSAGES = 5000;

export async function fetchChatHistoryForExport(
  managers: AppManagers,
  peerId: PeerId,
  onProgress?: (loaded: number, total: number | undefined) => void
): Promise<Message.message[]> {
  const messages: Message.message[] = [];
  let offsetId = 0;
  let total: number | undefined;

  while(messages.length < EXPORT_MAX_MESSAGES) {
    const result = await managers.appMessagesManager.getHistory({peerId, offsetId, limit: EXPORT_BATCH_SIZE});
    if(total === undefined) total = result.count;

    const mids = result.history || [];
    if(!mids.length) break;

    for(const mid of mids) {
      const message = await managers.appMessagesManager.getMessageByPeer(peerId, mid);
      if(message && message._ === 'message') {
        messages.push(message);
      }
    }

    onProgress?.(messages.length, total);
    offsetId = mids[mids.length - 1];
    if(mids.length < EXPORT_BATCH_SIZE) break;
  }

  // getHistory pages newest-first; a human-readable transcript reads top-to-bottom chronologically.
  return messages.reverse();
}

function escapeHtml(value: string) {
  return value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
}

function describeNonTextMessage(message: Message.message) {
  if(!message.media) return '';
  switch(message.media._) {
    case 'messageMediaPhoto': return '[photo]';
    case 'messageMediaDocument': return '[file]';
    case 'messageMediaGeo': case 'messageMediaGeoLive': return '[location]';
    case 'messageMediaContact': return '[contact]';
    case 'messageMediaPoll': return '[poll]';
    default: return '[media]';
  }
}

export async function buildChatHistoryHtml(managers: AppManagers, peerId: PeerId, messages: Message.message[]): Promise<string> {
  const chatTitle = await getPeerTitle({peerId, plainText: true, useManagers: true, managers});

  const nameCache = new Map<PeerId, string>();
  const getName = async(fromId: PeerId) => {
    if(!nameCache.has(fromId)) {
      nameCache.set(fromId, await getPeerTitle({peerId: fromId, plainText: true, useManagers: true, managers}));
    }
    return nameCache.get(fromId);
  };

  const rows: string[] = [];
  for(const message of messages) {
    const fromId = message.fromId ?? (message.pFlags.out ? rootScope.myId : message.peerId);
    const name = await getName(fromId);
    const date = formatFullSentTime(message.date, true);
    const text = message.message ? escapeHtml(message.message) : `<i>${escapeHtml(describeNonTextMessage(message))}</i>`;
    rows.push(
      `<div class="msg"><div class="meta"><b>${escapeHtml(name)}</b><span class="date">${date}</span></div>` +
      `<div class="text">${text}</div></div>`
    );
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(chatTitle)} — RabbitGram export</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; background: #0f0f0f; color: #e7e7e7; }
  h1 { font-size: 1.25rem; }
  .note { color: #9a9a9a; font-size: .85rem; }
  .msg { padding: .5rem 0; border-bottom: 1px solid #262626; }
  .meta { font-size: .8rem; color: #9a9a9a; }
  .meta .date { margin-left: .5rem; }
  .text { white-space: pre-wrap; word-break: break-word; margin-top: .15rem; }
</style>
</head><body>
<h1>${escapeHtml(chatTitle)}</h1>
<p class="note">Exported ${messages.length} message(s) via RabbitGram on ${new Date().toLocaleString()}.</p>
${rows.join('\n')}
</body></html>`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
