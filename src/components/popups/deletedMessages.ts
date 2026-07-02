import PopupElement from '.';
import SettingSection from '@components/settingSection';
import Row from '@components/row';
import wrapPeerTitle from '@components/wrappers/peerTitle';
import wrapRichText from '@lib/richTextProcessor/wrapRichText';
import {formatFullSentTime} from '@helpers/date';
import {i18n} from '@lib/langPack';
import Button from '@components/button';
import type {DeletedMessageRecord} from '@appManagers/appMessagesManager';

// RabbitGram: browse messages the server told us were deleted from this
// chat, recovered from the local snapshot appMessagesManager keeps (see
// getDeletedMessages / saveDeletedMessageSnapshot).
export default class PopupDeletedMessages extends PopupElement {
  constructor(private peerId: PeerId) {
    super('popup-deleted-messages', {
      closable: true,
      overlayClosable: true,
      body: true,
      scrollable: true,
      title: 'RabbitGram.DeletedMessages.Title'
    });

    this.construct();
  }

  private async construct() {
    const middleware = this.middlewareHelper.get();
    const records = await this.managers.appMessagesManager.getDeletedMessages(this.peerId);
    if(!middleware()) return;

    const section = new SettingSection({noDelimiter: true});

    if(!records.length) {
      const empty = document.createElement('div');
      empty.classList.add('popup-deleted-messages-empty');
      empty.append(i18n('RabbitGram.DeletedMessages.Empty'));
      section.content.append(empty);
    } else {
      const sorted = records.slice().sort((a, b) => b.deletedAt - a.deletedAt);
      for(const record of sorted) {
        await this.appendRow(section, record);
        if(!middleware()) return;
      }

      const clearButton = Button('btn-primary btn-transparent danger popup-deleted-messages-clear', {
        text: 'RabbitGram.DeletedMessages.ClearAll'
      });
      clearButton.addEventListener('click', async() => {
        await this.managers.appMessagesManager.clearDeletedMessages(this.peerId);
        this.hide();
      });
      section.content.append(clearButton);
    }

    this.body.append(section.container);
    this.show();
  }

  private async appendRow(section: SettingSection, record: DeletedMessageRecord) {
    const {message, deletedAt} = record;

    const peerTitle = await wrapPeerTitle({peerId: message.fromId ?? this.peerId, onlyFirstName: false});

    const subtitle = message.message ?
      wrapRichText(message.message, {entities: message.entities}) :
      i18n('RabbitGram.DeletedMessages.NonTextMessage');

    const row = new Row({
      title: peerTitle,
      titleRight: formatFullSentTime(deletedAt, false),
      subtitle,
      havePadding: true
    });

    section.content.append(row.container);
  }
}
