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
  Select,
  SelectOption,
} from '@sun/components';
import type { CreateUserValues } from '~/utils/admin-user-types';
import { FREE_CHESS_USER_ROLE, ROLE_OPTIONS, roleLabel } from '~/utils/roles';
import styles from './create-user-dialog.module.css';

type CreateUserDialogProps = {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Closes the dialog.
   */
  onClose: () => void;
  /**
   * Creates the account.
   */
  onSubmit: (values: CreateUserValues) => Promise<void>;
};

/**
 * Form for creating an account.
 */
const CreateUserDialog = (props: CreateUserDialogProps) => {
  const { open, onClose, onSubmit } = props;
  const { t } = useTranslation('admin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>(FREE_CHESS_USER_ROLE);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onSubmit({ email, name, password, role });
      setEmail('');
      setName('');
      setPassword('');
      setRole(FREE_CHESS_USER_ROLE);
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
          <DialogTitle>{t('create-user-title')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormField name="email">
            <FormLabel>{t('email')}</FormLabel>
            <FormItem>
              <Input
                type="email"
                value={email}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(event.currentTarget.value)
                }
                autoComplete="off"
                required
              />
            </FormItem>
          </FormField>
          <FormField name="name">
            <FormLabel>{t('name')}</FormLabel>
            <FormItem>
              <Input
                value={name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setName(event.currentTarget.value)
                }
                autoComplete="off"
                required
              />
            </FormItem>
          </FormField>
          <FormField name="password">
            <FormLabel>{t('password')}</FormLabel>
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
          <FormField name="role">
            <FormLabel>{t('role')}</FormLabel>
            <FormItem>
              <Select
                value={role}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  setRole(event.currentTarget.value)
                }
              >
                {ROLE_OPTIONS.map((option) => (
                  <SelectOption key={option} value={option}>
                    {roleLabel(option, t)}
                  </SelectOption>
                ))}
              </Select>
            </FormItem>
          </FormField>
          {error && <p className={styles.error}>{error}</p>}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={pending}>
            {t('create-user')}
          </Button>
        </DialogFooter>
      </Form>
    </Dialog>
  );
};

export default CreateUserDialog;
