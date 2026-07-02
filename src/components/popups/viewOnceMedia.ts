import PopupElement from '.';
import SettingSection from '@components/settingSection';
import Row from '@components/row';
import {formatFullSentTime} from '@helpers/date';
import {i18n} from '@lib/langPack';
import Button from '@components/button';
import base64ToBytes from '@helpers/string/base64ToBytes';
import blobConstruct from '@helpers/blob/blobConstruct';
import type {ViewOnceMediaRecord} from '@appManagers/appMessagesManager';

// RabbitGram: browse view-once photos/videos captured locally at view time
// (see appMessagesManager.getViewOnceMedia / captureViewOnceMediaIfEnabled).
export default class PopupViewOnceMedia extends PopupElement {
  private objectUrls: string[] = [];

  constructor(private peerId: PeerId) {
    super('popup-view-once-media', {
      closable: true,
      overlayClosable: true,
      body: true,
      scrollable: true,
      title: 'RabbitGram.ViewOnceMedia.Title'
    });

    this.construct();

    this.addEventListener('close', () => {
      this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    });
  }

  private async construct() {
    const middleware = this.middlewareHelper.get();
    const records = await this.managers.appMessagesManager.getViewOnceMedia(this.peerId);
    if(!middleware()) return;

    const section = new SettingSection({noDelimiter: true});

    if(!records.length) {
      const empty = document.createElement('div');
      empty.classList.add('popup-view-once-media-empty');
      empty.append(i18n('RabbitGram.ViewOnceMedia.Empty'));
      section.content.append(empty);
    } else {
      const sorted = records.slice().sort((a, b) => b.capturedAt - a.capturedAt);
      for(const record of sorted) {
        this.appendRow(section, record);
      }

      const clearButton = Button('btn-primary btn-transparent danger popup-view-once-media-clear', {
        text: 'RabbitGram.ViewOnceMedia.ClearAll'
      });
      clearButton.addEventListener('click', async() => {
        await this.managers.appMessagesManager.clearViewOnceMedia(this.peerId);
        this.hide();
      });
      section.content.append(clearButton);
    }

    this.body.append(section.container);
    this.show();
  }

  private appendRow(section: SettingSection, record: ViewOnceMediaRecord) {
    const blob = blobConstruct(base64ToBytes(record.base64), record.mimeType);
    const url = URL.createObjectURL(blob);
    this.objectUrls.push(url);

    const media: HTMLImageElement | HTMLVideoElement = record.mediaType === 'video' ?
      document.createElement('video') :
      document.createElement('img');
    media.classList.add('popup-view-once-media-preview');
    media.src = url;
    if(media instanceof HTMLVideoElement) {
      media.controls = true;
    }

    const downloadButton = Button('btn-icon popup-view-once-media-download', {icon: 'download'});
    downloadButton.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `rabbitgram-viewonce-${record.mid}.${record.mediaType === 'video' ? 'mp4' : 'jpg'}`;
      document.body.append(a);
      a.click();
      a.remove();
    });

    const row = new Row({
      title: formatFullSentTime(record.capturedAt, false),
      titleRight: downloadButton,
      havePadding: true
    });
    row.container.prepend(media);

    section.content.append(row.container);
  }
}
