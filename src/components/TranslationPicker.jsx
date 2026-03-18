import { useReader } from '../context/ReaderContext';

/**
 * Dropdown for switching between Bible translations.
 */
export default function TranslationPicker() {
  const { meta, translation, setTranslation } = useReader();

  if (!meta || !meta.translations || meta.translations.length <= 1) return null;

  return (
    <select
      className="translation-picker"
      value={translation}
      onChange={(e) => setTranslation(e.target.value)}
      aria-label="Bible translation"
    >
      {meta.translations.map(t => (
        <option key={t.id} value={t.id}>{t.id}</option>
      ))}
    </select>
  );
}
