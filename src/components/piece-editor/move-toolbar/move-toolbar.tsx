import { Button } from '@sun/components';
import { useTranslation } from '@sun/i18n';
import styles from './move-toolbar.module.css';

type MoveToolbarProps = {
  /**
   * Active move type.
   */
  moveType: 'step' | 'slide' | 'hop';
  /**
   * Active capture policy.
   */
  capture: 'optional' | 'required' | 'forbidden';
  /**
   * Called when move type changes.
   */
  onMoveTypeChange: (value: 'step' | 'slide' | 'hop') => void;
  /**
   * Called when capture policy changes.
   */
  onCaptureChange: (value: 'optional' | 'required' | 'forbidden') => void;
};

/**
 * Toolbar for selecting move type and capture policy.
 */
const MoveToolbar = (props: MoveToolbarProps) => {
  const { moveType, capture, onMoveTypeChange, onCaptureChange } = props;
  const { t } = useTranslation('admin');

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        {(['step', 'slide', 'hop'] as const).map((value) => (
          <Button
            key={value}
            variant={value === moveType ? 'default' : 'secondary'}
            onClick={() => onMoveTypeChange(value)}
          >
            <span className={styles.label}>
              <span className={styles[`swatch_${value}`]} aria-hidden="true" />
              {t(`move-${value}`)}
            </span>
          </Button>
        ))}
      </div>
      <div className={styles.group}>
        {(['optional', 'required', 'forbidden'] as const).map((value) => (
          <Button
            key={value}
            variant={value === capture ? 'default' : 'secondary'}
            onClick={() => onCaptureChange(value)}
          >
            {t(`capture-${value}`)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MoveToolbar;
