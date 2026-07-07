import {For} from 'solid-js';
import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {i18n} from '@lib/langPack';
import type {LangPackKey} from '@lib/langPack';
import {useAppSettings} from '@stores/appSettings';

// RabbitGram: pick which message context-menu items show up at all. Matched
// against the button's own langPackKey in ChatContextMenu's filterButtons —
// this list only needs to name the items worth hiding, not every possible
// button (sponsored-message-only and selection-only buttons are left out).
const CUSTOMIZABLE_ITEMS: LangPackKey[] = [
  'Reply',
  'Quote',
  'Forward',
  'Edit',
  'Copy',
  'Message.Context.Pin',
  'Message.Context.Unpin',
  'MessageContext.CopyMessageLink1',
  'TranslateMessage',
  'MediaViewer.Context.Download',
  'RabbitGram.MessageShot.MenuButton',
  'RabbitGram.EditHistory.MenuButton',
  'Message.Context.Select',
  'Message.Context.Selection.Delete'
];

const RabbitGramContextMenuTab = () => {
  const [appSettings, setAppSettings] = useAppSettings();

  const isHidden = (key: LangPackKey) => appSettings.hiddenContextMenuItems?.includes(key);

  const toggle = (key: LangPackKey, hide: boolean) => {
    const current = appSettings.hiddenContextMenuItems || [];
    const next = hide ? [...current, key] : current.filter((k) => k !== key);
    setAppSettings('hiddenContextMenuItems', next);
  };

  return (
    <Section name="RabbitGram.ContextMenuCustomize.SectionTitle" caption="RabbitGram.ContextMenuCustomize.SectionCaption">
      <For each={CUSTOMIZABLE_ITEMS}>
        {(key) => (
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                checked={!isHidden(key)}
                onChange={(value) => toggle(key, !value)}
                toggle
              />
            </Row.CheckboxFieldToggle>
            <Row.Title>{i18n(key)}</Row.Title>
          </Row>
        )}
      </For>
    </Section>
  );
};

export default RabbitGramContextMenuTab;
