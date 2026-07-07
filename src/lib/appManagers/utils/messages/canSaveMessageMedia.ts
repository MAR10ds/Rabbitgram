import {Document, Message, MessageMedia} from '@layer';
// RabbitGram: this util is only imported from main-thread UI code
// (contextMenu, appMediaViewer), so reading the Solid settings store here is
// safe — it would not be inside a worker bundle.
import {appSettings} from '@stores/appSettings';

export function canSaveMessageMediaWithNoForwards(message: Message.message) {
  const document = (message.media as MessageMedia.messageMediaDocument)?.document;
  if(!document) {
    return false;
  }

  return !(['video', 'gif', 'round', 'sticker'] as Document.document['type'][]).includes((document as Document.document).type);
}

export default function canSaveMessageMedia(
  message: Message.message | Message.messageService,
  noForwards?: boolean
) {
  // RabbitGram: noForwardRestrictions — protected-content flags don't limit
  // downloading either.
  const restricted = !appSettings.noForwardRestrictions &&
    ((message as Message.message)?.pFlags.noforwards || noForwards);

  return message &&
    !message.pFlags.is_outgoing &&
    !((message as Message.message).media as MessageMedia.messageMediaInvoice)?.extended_media &&
    (!restricted || canSaveMessageMediaWithNoForwards(message as Message.message));
}
