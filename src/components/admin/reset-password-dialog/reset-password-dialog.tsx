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
import styles from './reset-password-dialog.module.css';

type ResetPasswordDialogProps = {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Email of the account being changed.
   */
  email: string;
  /**
   * Closes the dialog.
   */
  onClose: () => void;
  /**
   * Sets the new password.
   */
  onSubmit: (password: string) => Promise<void>;
};

/**
 * Form for setting an account password.
 */
const ResetPasswordDialog = (props: ResetPasswordDialogProps) => {
  const { open, email, onClose, onSubmit } = props;
  const { t } = useTranslation('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onSubmit(password);
      setPassword('');
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('action-failed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value: boolean) => !value && onClose()}>
      <Form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{t('reset-password-title', { email })}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormField name="password">
            <FormLabel>{t('new-password')}</FormLabel>
            <FormItem>
              <Input
                type="password"
                value={password}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(event.currentTarget.value)
                }
                autoComplete="new-password"
                required
              />
            </FormItem>
          </FormField>
          {error && <p className={styles.error}>{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={pending}>
            {t('set-password')}
          </Button>
        </DialogFooter>
      </Form>
    </Dialog>
  );
};

export default ResetPasswordDialog;
