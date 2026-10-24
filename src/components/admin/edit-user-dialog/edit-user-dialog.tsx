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
import type { AdminUser, EditUserValues } from '~/utils/admin-user-types';
import styles from './edit-user-dialog.module.css';

type EditUserDialogProps = {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Account being edited.
   */
  user: AdminUser;
  /**
   * Closes the dialog.
   */
  onClose: () => void;
  /**
   * Saves the changes.
   */
  onSubmit: (values: EditUserValues) => Promise<void>;
};

/**
 * Form for editing an account's name and email.
 */
const EditUserDialog = (props: EditUserDialogProps) => {
  const { open, user, onClose, onSubmit } = props;
  const { t } = useTranslation('admin');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onSubmit({ name, email });
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
          <DialogTitle>{t('edit-user-title')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormField name="name">
            <FormLabel>{t('name')}</FormLabel>
            <FormItem>
              <Input
                value={name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setName(event.currentTarget.value)
                }
                required
              />
            </FormItem>
          </FormField>
          <FormField name="email">
            <FormLabel>{t('email')}</FormLabel>
            <FormItem>
              <Input
                type="email"
                value={email}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(event.currentTarget.value)
                }
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
            {t('save')}
          </Button>
        </DialogFooter>
      </Form>
    </Dialog>
  );
};

export default EditUserDialog;
