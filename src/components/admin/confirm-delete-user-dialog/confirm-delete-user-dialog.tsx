import { useState } from 'react';
import { useTranslation } from '@sun/i18n';
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sun/components';
import styles from './confirm-delete-user-dialog.module.css';

type ConfirmDeleteUserDialogProps = {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Email of the account being deleted.
   */
  email: string;
  /**
   * Closes the dialog.
   */
  onClose: () => void;
  /**
   * Deletes the account.
   */
  onConfirm: () => Promise<void>;
};

/**
 * Confirmation dialog for deleting an account.
 */
const ConfirmDeleteUserDialog = (props: ConfirmDeleteUserDialogProps) => {
  const { open, email, onClose, onConfirm } = props;
  const { t } = useTranslation('admin');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('action-failed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value: boolean) => !value && onClose()}>
      <DialogHeader>
        <DialogTitle>{t('delete-title', { email })}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p>{t('delete-body')}</p>
        {error && <p className={styles.error}>{error}</p>}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
          {t('cancel')}
        </Button>
        <Button type="button" variant="destructive" onClick={handleConfirm} disabled={pending}>
          {t('delete')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ConfirmDeleteUserDialog;
