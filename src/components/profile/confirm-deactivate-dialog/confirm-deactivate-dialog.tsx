import { useTransition } from 'react';
import { useTranslation } from '@sun/i18n';
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sun/components';

type ConfirmDeactivateDialogProps = {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Closes the dialog without confirming.
   */
  onClose: () => void;
  /**
   * Runs the deactivation mutation.
   */
  onConfirm: () => Promise<void>;
  /**
   * Username of the account being deactivated.
   */
  username: string;
};

/**
 * Confirms deactivation of the signed-in account.
 */
const ConfirmDeactivateDialog = (props: ConfirmDeactivateDialogProps) => {
  const { open, onClose, onConfirm, username } = props;
  const { t } = useTranslation('profile');
  const [pending, startTransition] = useTransition();

  /**
   * Confirms deactivation.
   */
  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next && !pending) onClose();
      }}
    >
      <DialogHeader>
        <DialogTitle>{t('deactivate-title', { username })}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p>{t('deactivate-body')}</p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
          {t('cancel-label')}
        </Button>
        <Button type="button" variant="destructive" onClick={handleConfirm} disabled={pending}>
          {t('confirm-label')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ConfirmDeactivateDialog;
