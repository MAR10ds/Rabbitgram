import {createEffect, createRoot} from 'solid-js';
import {createStore, SetStoreFunction, unwrap} from 'solid-js/store';
import {StateSettings} from '@config/state';
import rootScope from '@lib/rootScope';
import {joinDeepPath} from '@helpers/object/setDeepProperty';
import getDeepProperty from '@helpers/object/getDeepProperty';
import {MOUNT_CLASS_TO} from '@config/debug';

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
