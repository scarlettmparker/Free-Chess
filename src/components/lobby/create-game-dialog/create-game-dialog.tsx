import { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { executeMutation } from '@sun/ssr';
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sun/components';
import BoardPickerContent from '~/components/admin/board-picker-content';
import type { BoardLayoutDto } from '~/utils/board-layout-types';
import styles from './create-game-dialog.module.css';

type CreateGameDialogProps = {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Closes the dialog without creating a game.
   */
  onClose: () => void;
};

/**
 * Chooses a starting layout and creates a game.
 */
const CreateGameDialog = (props: CreateGameDialogProps) => {
  const { open, onClose } = props;
  const { t } = useTranslation('lobby');
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BoardLayoutDto | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Creates the game with the selected layout.
   */
  const handleCreate = async () => {
    if (!selected || starting) return;
    setStarting(true);
    setError(null);
    try {
      const result = await executeMutation<{ id: string }>('game/create', {
        boardLayoutId: selected.id,
      });
      navigate(`/play/${result.id}`);
    } catch {
      setError(t('create-failed'));
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
        <DialogTitle>{t('choose-layout-title')}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div className={styles.body}>
          <Suspense fallback={null}>
            <BoardPickerContent
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              namespace="lobby"
            />
          </Suspense>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={handleClose}>
          {t('cancel')}
        </Button>
        <Button type="button" disabled={!selected || starting} onClick={handleCreate}>
          {starting ? t('creating') : t('create-game')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default CreateGameDialog;
