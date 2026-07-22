import {createEffect, createRoot} from 'solid-js';
import {createStore, SetStoreFunction, unwrap} from 'solid-js/store';
import {StateSettings} from '@config/state';
import rootScope from '@lib/rootScope';
import {joinDeepPath} from '@helpers/object/setDeepProperty';
import getDeepProperty from '@helpers/object/getDeepProperty';
import {MOUNT_CLASS_TO} from '@config/debug';

// RabbitGram: draw an emoji onto a canvas and use it as the browser-tab
// favicon. Web equivalent of AyuGram's desktop application-icon picker. An
// empty value removes our override so the static favicons in index.html apply.
const RABBITGRAM_FAVICON_ID = 'rabbitgram-favicon';
function applyFavicon(emoji: string) {
  const existing = document.getElementById(RABBITGRAM_FAVICON_ID) as HTMLLinkElement | null;

  if(!emoji) {
    existing?.remove();
    return;
  }

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if(!ctx) {
    return;
  }

  ctx.font = `${size * 0.82}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.06);

  const link = existing ?? document.createElement('link');
  link.id = RABBITGRAM_FAVICON_ID;
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = canvas.toDataURL('image/png');
  if(!existing) {
    document.head.appendChild(link);
  }
}

const [appSettings, _setAppSettings] = createRoot(() => {
  const store = createStore<StateSettings>({} as any);

  // RabbitGram: compact chat list is a pure CSS toggle (hides the last-message
  // preview line), so it's wired here at the app root rather than inside the
  // settings tab component — it has to apply globally regardless of whether
  // that tab is ever opened. See src/scss/partials/_chatlist.scss.
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-compact-chatlist', !!store[0].compactChatList);
  });

  // RabbitGram: more CSS-only toggles, rules in scss/partials/_rabbitgram.scss.
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-hide-similar-channels', !!store[0].hideSimilarChannels);
  });
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-hide-folder-counters', !!store[0].hideFolderCounters);
  });
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-hide-all-chats-folder', !!store[0].hideAllChatsFolder);
  });
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-streamer-mode', !!store[0].streamerMode);
  });
  createEffect(() => {
    const percent = store[0].messageWidthPercent || 100;
    document.documentElement.style.setProperty('--rabbitgram-bubble-width-scale', '' + percent / 100);
  });
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-monochrome-replies', !!store[0].monochromeReplies);
  });
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-rounded-stickers', !!store[0].roundedStickers);
  });
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-top-center-notifications', !!store[0].topCenterNotifications);
  });
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-material-switches', !!store[0].materialSwitches);
  });
  createEffect(() => {
    document.documentElement.classList.toggle('rabbitgram-collapse-similar-channels', !!store[0].collapseSimilarChannels);
  });
  // RabbitGram: mono font — override the --font-monospace variable used by all
  // code/monospace text. Empty falls back to the stylesheet's default.
  createEffect(() => {
    const font = store[0].monoFont;
    if(font) {
      document.documentElement.style.setProperty('--font-monospace', font);
    } else {
      document.documentElement.style.removeProperty('--font-monospace');
    }
  });
  // RabbitGram: app icon — swap the browser-tab favicon for an emoji-drawn one.
  // Empty restores the static <link rel="icon"> tags from index.html.
  createEffect(() => {
    applyFavicon(store[0].appIcon);
  });

  return store;
});

let silent = false;
const setAppSettings: SetStoreFunction<StateSettings, Promise<void>> = (...args: any[]) => {
  const keys = args.slice(0, -1);
  // @ts-ignore
  _setAppSettings(...args);
  const newValue = getDeepProperty(unwrap(appSettings), keys);

  if(silent) {
    return Promise.resolve();
  }

  return rootScope.managers.appStateManager.setByKey(joinDeepPath('settings', ...keys), newValue);
};

const setAppSettingsSilent = (...args: any[]) => {
  const key = args[0];
  if(typeof(key) === 'object') {
    _setAppSettings(key);
    return;
  }

  silent = true;
  // @ts-ignore
  setAppSettings(...args);
  silent = false;
};

const useAppSettings = () => [appSettings, setAppSettings] as const;

export {
  appSettings,
  useAppSettings,
  setAppSettings,
  setAppSettingsSilent
};

MOUNT_CLASS_TO && (MOUNT_CLASS_TO.useAppSettings = useAppSettings);
