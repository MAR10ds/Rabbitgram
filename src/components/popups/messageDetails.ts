import PopupElement from '.';
import SettingSection from '@components/settingSection';
import Row from '@components/row';
import {i18n} from '@lib/langPack';
import {formatFullSentTime} from '@helpers/date';
import {copyTextToClipboard} from '@helpers/clipboard';
import {toastNew} from '@components/toast';
import showStickersPopup from '@components/popups/stickers';
import getUniqueCustomEmojisFromMessage from '@appManagers/utils/messages/getUniqueCustomEmojisFromMessage';
import wrapEmojiText from '@lib/richTextProcessor/wrapEmojiText';
import type {Message, Document, InputStickerSet, MessageMedia} from '@layer';

// RabbitGram: "Message Details" — a read-only inspector for a single message.
// Shows the raw identifiers useful for bot development / debugging (message id,
// timestamps, sender & chat ids, views/forwards) and, mirroring AyuGram, the
// sticker or custom-emoji pack(s) the message uses, each openable in one tap.
export default class PopupMessageDetails extends PopupElement {
  constructor(private peerId: PeerId, private mid: number, private message: Message.message) {
    super('popup-message-details', {
      closable: true,
      overlayClosable: true,
      body: true,
      scrollable: true,
      title: 'RabbitGram.MessageDetails.Title'
    });

    this.construct();
  }

  private copyRow(section: SettingSection, titleKey: Parameters<typeof i18n>[0], value: string) {
    const row = new Row({
      title: value,
      subtitle: i18n(titleKey),
      clickable: () => {
        copyTextToClipboard(value);
        toastNew({langPackKey: 'TextCopied'});
      },
      havePadding: true
    });
    section.content.append(row.container);
  }

  private infoRow(section: SettingSection, titleKey: Parameters<typeof i18n>[0], value: string | DocumentFragment) {
    const row = new Row({
      title: value,
      subtitle: i18n(titleKey),
      havePadding: true
    });
    section.content.append(row.container);
  }

  private async construct() {
    const middleware = this.middlewareHelper.get();
    const message = this.message;

    const section = new SettingSection({noDelimiter: true});

    this.copyRow(section, 'RabbitGram.MessageDetails.Id', '' + this.mid);
    this.infoRow(section, 'RabbitGram.MessageDetails.Date', formatFullSentTime(message.date, false));

    if(message.edit_date) {
      this.infoRow(section, 'RabbitGram.MessageDetails.EditDate', formatFullSentTime(message.edit_date, false));
    }

    if(message.fromId) {
      const raw = message.fromId.isUser() ? message.fromId : message.fromId.toChatId();
      this.copyRow(section, 'RabbitGram.MessageDetails.SenderId', '' + raw);
    }

    const chatRaw = this.peerId.isUser() ? this.peerId : this.peerId.toChatId();
    this.copyRow(section, 'RabbitGram.MessageDetails.ChatId', '' + chatRaw);

    if(message.views) {
      this.infoRow(section, 'RabbitGram.MessageDetails.Views', '' + message.views);
    }

    if(message.forwards) {
      this.infoRow(section, 'RabbitGram.MessageDetails.Forwards', '' + message.forwards);
    }

    this.body.append(section.container);

    // Resolve the sticker / custom-emoji packs referenced by the message.
    const inputs = await this.collectPackInputs();
    if(!middleware() || !inputs.length) {
      this.show();
      return;
    }

    const packsSection = new SettingSection({name: 'RabbitGram.MessageDetails.Packs'});
    for(const input of inputs) {
      const set = await this.managers.appStickersManager.getStickerSet(input);
      if(!middleware()) return;
      if(!set?.set) continue;

      const row = new Row({
        icon: 'stickers',
        title: wrapEmojiText(set.set.title),
        subtitle: '@' + (set.set.short_name || ''),
        clickable: () => {
          showStickersPopup(input);
        },
        havePadding: true
      });
      packsSection.content.append(row.container);
    }

    if(packsSection.content.childElementCount) {
      this.body.append(packsSection.container);
    }

    this.show();
  }

  // A message can carry a sticker as its own media and/or custom emoji inside
  // its text, reactions or poll — gather the unique input sets for all of them.
  private async collectPackInputs(): Promise<InputStickerSet.inputStickerSetID[]> {
    const seen = new Set<string>();
    const inputs: InputStickerSet.inputStickerSetID[] = [];

    const push = (input: InputStickerSet.inputStickerSetID) => {
      if(!input || input._ !== 'inputStickerSetID') {
        return;
      }
      const id = '' + input.id;
      if(seen.has(id)) {
        return;
      }
      seen.add(id);
      inputs.push(input);
    };

    const doc = (this.message.media as MessageMedia.messageMediaDocument)?.document as Document.document;
    push(doc?.stickerSetInput);

    const docIds = getUniqueCustomEmojisFromMessage(this.message);
    if(docIds.length) {
      const docs = await this.managers.appEmojiManager.getCustomEmojiDocuments(docIds);
      docs.forEach((doc) => push(doc?.stickerSetInput));
    }

    return inputs;
  }
}
