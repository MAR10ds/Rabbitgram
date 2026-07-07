import AppStorage from '@lib/storage';
import {AccountDatabase, getDatabaseState} from '@config/databases/state';
import {getCurrentAccount} from '@lib/accounts/getCurrentAccount';
import rootScope from '@lib/rootScope';

// RabbitGram: user-defined message filters — each entry is a pattern
// (tried as a regex first, falling back to a case-insensitive substring
// match if it doesn't compile) and any message whose text matches at least
// one of them simply isn't rendered. The list lives in its own IDB store so
// it survives reloads; a compiled-matcher cache keeps the per-message check
// cheap for bubbles' renderMessage.

const storage = new AppStorage<{filters: string[]}, AccountDatabase>(
  getDatabaseState(getCurrentAccount()),
  'messageFilters'
);

let filters: string[] = [];
let matchers: Array<(text: string) => boolean> = [];

function compile(patterns: string[]) {
  filters = patterns;
  matchers = patterns.map((pattern) => {
    try {
      const regExp = new RegExp(pattern, 'i');
      return (text: string) => regExp.test(text);
    } catch(err) {
      const lowered = pattern.toLowerCase();
      return (text: string) => text.toLowerCase().includes(lowered);
    }
  });
}

rootScope.addEventListener('managers_ready', async() => {
  const saved = await storage.get('filters');
  if(saved?.length) {
    compile(saved);
  }
});

export function getMessageFilters(): string[] {
  return filters;
}

export async function addMessageFilter(pattern: string) {
  pattern = pattern.trim();
  if(!pattern || filters.includes(pattern)) {
    return;
  }

  compile([...filters, pattern]);
  await storage.set({filters});
}

export async function removeMessageFilter(pattern: string) {
  compile(filters.filter((f) => f !== pattern));
  await storage.set({filters});
}

export function messageMatchesFilters(text: string | undefined): boolean {
  if(!text || !matchers.length) {
    return false;
  }

  return matchers.some((matches) => matches(text));
}
