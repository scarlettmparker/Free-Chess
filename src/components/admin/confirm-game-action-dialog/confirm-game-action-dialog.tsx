import { useTranslation } from '@sun/i18n';
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sun/components';

type ConfirmGameActionDialogProps = {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Dialog heading.
   */
  title: string;
  /**
   * Dialog body.
   */
  body: string;
  /**
   * Closes the dialog without confirming.
   */
  onClose: () => void;
  /**
   * Runs the confirmed action.
   */
  onConfirm: () => void;
};

/**
 * Confirmation dialog for destructive game actions.
 */
const ConfirmGameActionDialog = (props: ConfirmGameActionDialogProps) => {
  const { open, title, body, onClose, onConfirm } = props;
  const { t } = useTranslation('admin');

  return (
    <Dialog open={open} onOpenChange={(value: boolean) => !value && onClose()}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p>{body}</p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm}>
          {t('confirm')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ConfirmGameActionDialog;
