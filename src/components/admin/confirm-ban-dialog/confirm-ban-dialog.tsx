import { useState } from 'react';
import { useTranslation } from '@sun/i18n';
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormField,
  FormItem,
  FormLabel,
  Input,
} from '@sun/components';
import styles from './confirm-ban-dialog.module.css';

type ConfirmBanDialogProps = {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Email of the account being banned.
   */
  email: string;
  /**
   * Closes the dialog.
   */
  onClose: () => void;
  /**
   * Bans the account.
   */
  onConfirm: (reason: string, expiresInDays?: number) => Promise<void>;
};

/**
 * Form for banning an account with an optional reason and duration.
 */
const ConfirmBanDialog = (props: ConfirmBanDialogProps) => {
  const { open, email, onClose, onConfirm } = props;
  const { t } = useTranslation('admin');
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const parsedDays = Number(days);
      await onConfirm(
        reason,
        Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : undefined,
      );
      setReason('');
      setDays('');
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('action-failed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value: boolean) => !value && onClose()}>
      <Form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{t('ban-title', { email })}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormField name="reason">
            <FormLabel>{t('ban-reason')}</FormLabel>
            <FormItem>
              <Input
                value={reason}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setReason(event.currentTarget.value)
                }
              />
            </FormItem>
          </FormField>
          <FormField name="days">
            <FormLabel>{t('ban-days')}</FormLabel>
            <FormItem>
              <Input
                type="number"
                min="1"
                value={days}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setDays(event.currentTarget.value)
                }
              />
            </FormItem>
          </FormField>
          {error && <p className={styles.error}>{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {t('ban')}
          </Button>
        </DialogFooter>
      </Form>
    </Dialog>
  );
};

export default ConfirmBanDialog;
