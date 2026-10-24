import { Suspense, useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation, makeCacheKey, revalidatePageData } from '@sun/ssr';
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sun/components';
import BoardPickerContent from '~/components/admin/board-picker-content';
import type { BoardLayoutDto } from '~/server/board-layouts';
import styles from './board-picker-dialog.module.css';

type BoardPickerDialogProps = {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Closes the dialog without resetting.
   */
  onClose: () => void;
  /**
   * Called after a successful reset.
   */
  onReset: () => void;
};

/**
 * Dialog to pick a starting layout for a game reset.
 */
const BoardPickerDialog = (props: BoardPickerDialogProps) => {
  const { open, onClose, onReset } = props;
  const { t } = useTranslation('admin');
  const [selected, setSelected] = useState<BoardLayoutDto | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Resets the game with the selected layout and closes on success.
   */
  const handleStart = async () => {
    if (!selected || starting) return;
    setStarting(true);
    setError(null);
    try {
      await executeMutation('game/reset', { boardLayoutId: selected.id });
      revalidatePageData([makeCacheKey('adminSessions', {})]);
      onReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('action-failed'));
    } finally {
      setStarting(false);
    }
  };

  /**
   * Closes the dialog and clears transient state.
   */
  const handleClose = () => {
    setSelected(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value: boolean) => {
        if (!value) handleClose();
      }}
    >
      <DialogHeader>
        <DialogTitle>{t('reset-board-title')}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div className={styles.body}>
          <Suspense fallback={null}>
            <BoardPickerContent selectedId={selected?.id ?? null} onSelect={setSelected} />
          </Suspense>
          {error ? (
            <p className={styles.error} aria-live="polite">
              {error}
            </p>
          ) : null}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={handleClose}>
          {t('cancel')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!selected || starting}
          onClick={handleStart}
        >
          {t('start-game')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default BoardPickerDialog;
