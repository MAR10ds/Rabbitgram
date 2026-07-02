import PopupElement from '.';
import SettingSection from '@components/settingSection';
import Row from '@components/row';
import wrapRichText from '@lib/richTextProcessor/wrapRichText';
import {formatFullSentTime} from '@helpers/date';
import {i18n} from '@lib/langPack';
import tsNow from '@helpers/tsNow';
import type {Message} from '@layer';

// RabbitGram: browse previous versions of a single message, recovered from
// the local snapshot appMessagesManager keeps on every edit (see
// getMessageEditHistory / saveEditedMessageSnapshot).
export default class PopupEditHistory extends PopupElement {
  constructor(private peerId: PeerId, private mid: number, private currentMessage: Message.message) {
    super('popup-edit-history', {
      closable: true,
      overlayClosable: true,
      body: true,
      scrollable: true,
      title: 'RabbitGram.EditHistory.Title'
    });

    this.construct();
  }

  private async construct() {
    const middleware = this.middlewareHelper.get();
    const records = await this.managers.appMessagesManager.getMessageEditHistory(this.peerId, this.mid);
    if(!middleware()) return;

    const section = new SettingSection({noDelimiter: true});

    if(!records.length) {
      const empty = document.createElement('div');
      empty.classList.add('popup-edit-history-empty');
      empty.append(i18n('RabbitGram.EditHistory.Empty'));
      section.content.append(empty);
    } else {
      this.appendVersionRow(section, this.currentMessage, tsNow(true), 'RabbitGram.EditHistory.Current');

      const sorted = records.slice().sort((a, b) => b.editedAt - a.editedAt);
      for(const record of sorted) {
        this.appendVersionRow(section, record.message, record.editedAt);
      }
    }

    this.body.append(section.container);
    this.show();
  }

  private appendVersionRow(section: SettingSection, message: Message.message, at: number, titleKey?: Parameters<typeof i18n>[0]) {
    const subtitle = message.message ?
      wrapRichText(message.message, {entities: message.entities}) :
      i18n('RabbitGram.EditHistory.NonTextMessage');

    const row = new Row({
      title: titleKey ? i18n(titleKey) : formatFullSentTime(at, false),
      titleRight: titleKey ? formatFullSentTime(at, false) : undefined,
      subtitle,
      havePadding: true
    });

    section.content.append(row.container);
  }
}
