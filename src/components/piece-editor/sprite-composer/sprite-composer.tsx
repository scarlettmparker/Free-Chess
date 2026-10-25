import { Button } from '@sun/components';
import { useTranslation } from '@sun/i18n';
import { partUrl } from '~/components/chess/piece';
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
  /**
   * Whether the composer is read-only.
   */
  readOnly?: boolean;
};

const PARTS = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn', 'balloon', 'pogo', 'spongebob'];

/**
 * Interactive sprite composer with live preview.
 */
const SpriteComposer = (props: SpriteComposerProps) => {
  const { headKey, bodyKey, footKey, onChange, readOnly = false } = props;
  const { t } = useTranslation('admin');

  const cycle = (part: 'head' | 'body' | 'foot', current: string, delta: number) => {
    if (readOnly) return;
    const base = current.split('-')[0] || PARTS[0];
    const index = PARTS.indexOf(base);
    const next = PARTS[(index + delta + PARTS.length) % PARTS.length];
    onChange(part, `${next}-${part === 'head' ? 'head' : part === 'body' ? 'body' : 'foot'}`);
  };

  return (
    <div className={styles.composer}>
      <div className={styles.preview}>
        <img src={partUrl(headKey, 0)} alt={t('piece-head')} />
        <img src={partUrl(bodyKey, 0)} alt={t('piece-body')} />
        <img src={partUrl(footKey, 0)} alt={t('piece-foot')} />
      </div>
      {readOnly ? null : (
        <div className={styles.controls}>
          {(['head', 'body', 'foot'] as const).map((part, index) => {
            const value = part === 'head' ? headKey : part === 'body' ? bodyKey : footKey;
            return (
              <div
                key={part}
                className={styles.arrow_pair}
                style={{ top: `${index * 33.333}%` }}
              >
                <Button variant="secondary" onClick={() => cycle(part, value, -1)}>
                  {'<'}
                </Button>
                <Button variant="secondary" onClick={() => cycle(part, value, 1)}>
                  {'>'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpriteComposer;
