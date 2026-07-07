import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {i18n} from '@lib/langPack';
import {useAppSettings} from '@stores/appSettings';
import {useSuperTab} from '@components/solidJsTabs/superTabProvider';
import {AppRabbitGramMessageFiltersTab, AppRabbitGramContextMenuTab} from '@components/solidJsTabs/tabs';
import RangeSettingSelector from '@components/rangeSettingSelector';
import {ConfettiContainer, ConfettiRef} from '@components/confetti';
import {toastNew} from '@components/toast';
import styles from './rabbitgramSettings.module.scss';
import {createSignal} from 'solid-js';
import {
  getCustomNotificationSound,
  setCustomNotificationSound,
  clearCustomNotificationSound,
  playCustomNotificationSound
} from '@lib/rabbitgram/customNotificationSound';

const MAX_SOUND_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// RabbitGram: dedicated settings page for the app's own privacy/recovery
// features (deleted-message recovery, edit history, status hiding) — kept
// separate from the stock Privacy & Security screen so they're easy to find
// instead of buried at the bottom of Telegram's own privacy list. See
// appMessagesManager.ts / appUsersManager.ts for the logic these toggles gate.

// Easter egg: tap the bunny logo 5 times within 3 seconds for a confetti burst.
const EASTER_EGG_TAPS = 5;
const EASTER_EGG_WINDOW_MS = 3000;

const RabbitGramSettingsTab = () => {
  const [appSettings, setAppSettings] = useAppSettings();
  const [tab] = useSuperTab();
  const [customSoundName, setCustomSoundName] = createSignal(
    getCustomNotificationSound()?.name ?? null
  );

  let confetti!: ConfettiRef;
  let tapCount = 0;
  let tapResetTimer: number;

  const onSoundUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async() => {
      const file = input.files?.[0];
      if(!file) return;
      if(file.size > MAX_SOUND_SIZE_BYTES) {
        toastNew({langPackKey: 'RabbitGram.Settings.Sound.TooLarge'});
        return;
      }
      const reader = new FileReader();
      reader.onload = async(e) => {
        const data = e.target?.result as string;
        if(!data) return;
        await setCustomNotificationSound(file.name, data, file.type);
        setCustomSoundName(file.name);
        toastNew({langPackKey: 'RabbitGram.Settings.Sound.Saved'});
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const onSoundPreview = () => {
    if(!playCustomNotificationSound(1)) {
      toastNew({langPackKey: 'RabbitGram.Settings.Sound.NoCustom'});
    }
  };

  const onSoundRemove = async() => {
    await clearCustomNotificationSound();
    setCustomSoundName(null);
    toastNew({langPackKey: 'RabbitGram.Settings.Sound.Removed'});
  };

  const onLogoClick = () => {
    tapCount++;
    clearTimeout(tapResetTimer);
    tapResetTimer = window.setTimeout(() => {
      tapCount = 0;
    }, EASTER_EGG_WINDOW_MS);

    if(tapCount >= EASTER_EGG_TAPS) {
      tapCount = 0;
      clearTimeout(tapResetTimer);
      confetti.create({mode: 'poppers', size: 5, speedScale: 0.8, count: 120});
      toastNew({langPackKey: 'RabbitGram.EasterEgg.Toast'});
    }
  };

  return (
    <>
      <div class={styles.easterEgg} onClick={onLogoClick}>
        <ConfettiContainer ref={confetti} class={styles.confetti} />
        <div class={styles.logo}>🐰</div>
        <div class={styles.hint}>{i18n('RabbitGram.Settings.MenuTitle')}</div>
      </div>
      <Section name="RabbitGram.Settings.SectionTitle" caption="RabbitGram.Settings.SectionCaption">
        <Row>
          <Row.Icon icon="undo" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.keepDeletedMessages}
              onChange={(value) => setAppSettings('keepDeletedMessages', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.KeepDeletedMessages')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.KeepDeletedMessagesSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="clock" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.keepEditedMessages}
              onChange={(value) => setAppSettings('keepEditedMessages', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.KeepEditedMessages')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.KeepEditedMessagesSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="keyboard" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.hideTypingStatus}
              onChange={(value) => setAppSettings('hideTypingStatus', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.HideTypingStatus')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.HideTypingStatusSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="online" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.hideOnlineStatus}
              onChange={(value) => setAppSettings('hideOnlineStatus', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.HideOnlineStatus')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.HideOnlineStatusSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="checks" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.hideReadStatus}
              onChange={(value) => setAppSettings('hideReadStatus', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.HideReadStatus')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.HideReadStatusSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="timer" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.autoGoOffline}
              onChange={(value) => setAppSettings('autoGoOffline', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.AutoGoOffline')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.AutoGoOfflineSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="stories" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.dontReadStories}
              onChange={(value) => setAppSettings('dontReadStories', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.DontReadStories')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.DontReadStoriesSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="message" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.readOnInteract}
              onChange={(value) => setAppSettings('readOnInteract', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.ReadOnInteract')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.ReadOnInteractSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="sending" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.ghostSendDelay}
              onChange={(value) => setAppSettings('ghostSendDelay', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.GhostSendDelay')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.GhostSendDelaySubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="send" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.confirmBeforeSend}
              onChange={(value) => setAppSettings('confirmBeforeSend', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.ConfirmBeforeSend')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.ConfirmBeforeSendSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="unmute" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.disableNotifyDelay}
              onChange={(value) => setAppSettings('disableNotifyDelay', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.DisableNotifyDelay')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.DisableNotifyDelaySubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="eye2" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.keepViewOnceMedia}
              onChange={(value) => setAppSettings('keepViewOnceMedia', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.KeepViewOnceMedia')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.KeepViewOnceMediaSubtitle')}</Row.Subtitle>
        </Row>
      </Section>
      <Section name="RabbitGram.Settings.ContentSectionTitle">
        <Row>
          <Row.Icon icon="ads" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.hideSponsoredMessages}
              onChange={(value) => setAppSettings('hideSponsoredMessages', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.HideSponsoredMessages')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.HideSponsoredMessagesSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="forward" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.noForwardRestrictions}
              onChange={(value) => setAppSettings('noForwardRestrictions', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.NoForwardRestrictions')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.NoForwardRestrictionsSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="deleteuser" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.hideBlockedUsers}
              onChange={(value) => setAppSettings('hideBlockedUsers', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.HideBlockedUsers')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.HideBlockedUsersSubtitle')}</Row.Subtitle>
        </Row>
        <Row clickable={() => tab.slider.createTab(AppRabbitGramMessageFiltersTab).open()}>
          <Row.Icon icon="filter" />
          <Row.Title>{i18n('RabbitGram.MessageFilters.Title')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.MessageFilters.MenuSubtitle')}</Row.Subtitle>
        </Row>
        <Row clickable={() => tab.slider.createTab(AppRabbitGramContextMenuTab).open()}>
          <Row.Icon icon="more" />
          <Row.Title>{i18n('RabbitGram.ContextMenuCustomize.Title')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.ContextMenuCustomize.MenuSubtitle')}</Row.Subtitle>
        </Row>
      </Section>
      <Section name="RabbitGram.Settings.SoundSectionTitle" caption="RabbitGram.Settings.SoundSectionCaption">
        <Row clickable={onSoundUpload}>
          <Row.Icon icon="music" />
          <Row.Title>{i18n('RabbitGram.Settings.Sound.Upload')}</Row.Title>
          <Row.Subtitle>{customSoundName() ?? i18n('RabbitGram.Settings.Sound.Default')}</Row.Subtitle>
        </Row>
        <Row clickable={onSoundPreview}>
          <Row.Icon icon="play" />
          <Row.Title>{i18n('RabbitGram.Settings.Sound.Preview')}</Row.Title>
        </Row>
        {customSoundName() && (
          <Row clickable={onSoundRemove}>
            <Row.Icon icon="delete" />
            <Row.Title class="danger">{i18n('RabbitGram.Settings.Sound.Remove')}</Row.Title>
          </Row>
        )}
      </Section>
      <Section name="RabbitGram.Settings.AppearanceSectionTitle">
        <Row>
          <Row.Icon icon="menu" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.compactChatList}
              onChange={(value) => setAppSettings('compactChatList', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.CompactChatList')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.CompactChatListSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="channel" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.hideSimilarChannels}
              onChange={(value) => setAppSettings('hideSimilarChannels', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.HideSimilarChannels')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.HideSimilarChannelsSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="folder" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.hideFolderCounters}
              onChange={(value) => setAppSettings('hideFolderCounters', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.HideFolderCounters')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.HideFolderCountersSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="chatsplaceholder" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.hideAllChatsFolder}
              onChange={(value) => setAppSettings('hideAllChatsFolder', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.HideAllChatsFolder')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.HideAllChatsFolderSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="videochat" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.streamerMode}
              onChange={(value) => setAppSettings('streamerMode', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.StreamerMode')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.StreamerModeSubtitle')}</Row.Subtitle>
        </Row>
        <RangeSettingSelector
          textLeft={i18n('RabbitGram.Settings.MessageWidth')}
          textRight={(value) => value + '%'}
          step={5}
          value={appSettings.messageWidthPercent}
          minValue={60}
          maxValue={100}
          onChange={(value) => setAppSettings('messageWidthPercent', value)}
        />
        <Row>
          <Row.Icon icon="quote" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.monochromeReplies}
              onChange={(value) => setAppSettings('monochromeReplies', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.MonochromeReplies')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.MonochromeRepliesSubtitle')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.Icon icon="stickers" />
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              checked={appSettings.roundedStickers}
              onChange={(value) => setAppSettings('roundedStickers', value)}
              toggle
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('RabbitGram.Settings.RoundedStickers')}</Row.Title>
          <Row.Subtitle>{i18n('RabbitGram.Settings.RoundedStickersSubtitle')}</Row.Subtitle>
        </Row>
      </Section>
    </>
  );
};

export default RabbitGramSettingsTab;
