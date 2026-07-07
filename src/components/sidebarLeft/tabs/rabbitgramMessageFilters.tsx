import {createSignal, For, Show} from 'solid-js';
import Row from '@components/rowTsx';
import Section from '@components/section';
import InputField from '@components/inputField';
import confirmationPopup from '@components/confirmationPopup';
import {i18n} from '@lib/langPack';
import {addMessageFilter, getMessageFilters, removeMessageFilter} from '@lib/rabbitgram/messageFilters';

// RabbitGram: management screen for the message filters — patterns whose
// matching messages are skipped at render time. The matching itself lives in
// lib/rabbitgram/messageFilters.ts; this tab is just add/remove UI over it.

const RabbitGramMessageFiltersTab = () => {
  const [filters, setFilters] = createSignal<string[]>([...getMessageFilters()]);

  const onAdd = async() => {
    const inputField = new InputField({
      maxLength: 200,
      placeholder: 'RabbitGram.MessageFilters.Placeholder',
      required: true
    });

    try {
      await confirmationPopup({
        titleLangKey: 'RabbitGram.MessageFilters.AddTitle',
        inputField,
        button: {langKey: 'Add'}
      });
    } catch(err) {
      return;
    }

    await addMessageFilter(inputField.value);
    setFilters([...getMessageFilters()]);
  };

  const onRemove = async(pattern: string) => {
    await removeMessageFilter(pattern);
    setFilters([...getMessageFilters()]);
  };

  return (
    <Section name="RabbitGram.MessageFilters.SectionTitle" caption="RabbitGram.MessageFilters.SectionCaption">
      <Row clickable={onAdd}>
        <Row.Icon icon="add" />
        <Row.Title>{i18n('RabbitGram.MessageFilters.Add')}</Row.Title>
      </Row>
      <For each={filters()}>
        {(pattern) => (
          <Row clickable={() => onRemove(pattern)}>
            <Row.Icon icon="delete" />
            <Row.Title>{pattern}</Row.Title>
            <Row.Subtitle>{i18n('RabbitGram.MessageFilters.ClickToRemove')}</Row.Subtitle>
          </Row>
        )}
      </For>
      <Show when={!filters().length}>
        <Row>
          <Row.Icon icon="info" />
          <Row.Title>{i18n('RabbitGram.MessageFilters.Empty')}</Row.Title>
        </Row>
      </Show>
    </Section>
  );
};

export default RabbitGramMessageFiltersTab;
