import { Button } from '@sun/components';
import { useTranslation } from '@sun/i18n';
import styles from './sprite-composer.module.css';

type SpriteComposerProps = {
  /**
   * Head key.
   */
  headKey: string;
  /**
   * Body key.
   */
  bodyKey: string;
  /**
   * Foot key.
   */
  footKey: string;
  /**
   * Called when a part changes.
   */
  onChange: (part: 'head' | 'body' | 'foot', key: string) => void;
};

const PARTS = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn', 'balloon', 'pogo', 'spongebob'];

/**
 * Interactive sprite composer with live preview.
 */
const SpriteComposer = (props: SpriteComposerProps) => {
  const { headKey, bodyKey, footKey, onChange } = props;
  const { t } = useTranslation('admin');

  const cycle = (part: 'head' | 'body' | 'foot', current: string, delta: number) => {
    const base = current.split('-')[0] || PARTS[0];
    const index = PARTS.indexOf(base);
    const next = PARTS[(index + delta + PARTS.length) % PARTS.length];
    onChange(part, `${next}-${part === 'head' ? 'head' : part === 'body' ? 'body' : 'foot'}`);
  };

  return (
    <div className={styles.composer}>
      <div className={styles.preview}>
        <img src={`/piece/parts/${headKey}.png`} alt={t('piece-head')} />
        <img src={`/piece/parts/${bodyKey}.png`} alt={t('piece-body')} />
        <img src={`/piece/parts/${footKey}.png`} alt={t('piece-foot')} />
      </div>
      <div className={styles.controls}>
        {(['head', 'body', 'foot'] as const).map((part) => {
          const value = part === 'head' ? headKey : part === 'body' ? bodyKey : footKey;
          return (
            <div key={part} className={styles.row}>
              <Button variant="secondary" onClick={() => cycle(part, value, -1)}>
                {'<'}
              </Button>
              <span className={styles.key}>{t(`${part}-key`)}</span>
              <Button variant="secondary" onClick={() => cycle(part, value, 1)}>
                {'>'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpriteComposer;
