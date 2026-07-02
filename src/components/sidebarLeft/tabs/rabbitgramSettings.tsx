import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {i18n} from '@lib/langPack';
import {useAppSettings} from '@stores/appSettings';

// RabbitGram: dedicated settings page for the app's own privacy/recovery
// features (deleted-message recovery, edit history, status hiding) — kept
// separate from the stock Privacy & Security screen so they're easy to find
// instead of buried at the bottom of Telegram's own privacy list. See
// appMessagesManager.ts / appUsersManager.ts for the logic these toggles gate.
const RabbitGramSettingsTab = () => {
  const [appSettings, setAppSettings] = useAppSettings();

  return (
    <>
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
      </Section>
    </>
  );
};

export default RabbitGramSettingsTab;
