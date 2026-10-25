import { Button } from '@sun/components';
import { useTranslation } from '@sun/i18n';
import styles from './state-tabs.module.css';

type StateTabsProps = {
  /**
   * Number of states.
   */
  count: number;
  /**
   * Active state index.
   */
  active: number;
  /**
   * Called when a tab is selected.
   */
  onSelect: (index: number) => void;
  /**
   * Called when adding a state.
   */
  onAdd: () => void;
  /**
   * Called when deleting the active state.
   */
  onDelete: () => void;
  /**
   * Whether state editing is disabled.
   */
  readOnly?: boolean;
};

/**
 * Tabs for move states.
 */
const StateTabs = (props: StateTabsProps) => {
  const { count, active, onSelect, onAdd, onDelete, readOnly = false } = props;
  const { t } = useTranslation('admin');

  return (
    <div className={styles.tabs}>
      <div className={styles.tab_group}>
        {Array.from({ length: count }, (_, index) => (
          <Button
            key={index}
            variant={index === active ? 'default' : 'secondary'}
            onClick={() => onSelect(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>
      {readOnly ? null : (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onAdd}>
            {t('add-state')}
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={count <= 1}>
            {t('delete-state')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StateTabs;
