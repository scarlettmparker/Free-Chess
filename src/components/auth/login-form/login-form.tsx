import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Form, FormField, FormLabel, FormItem, FormFooter, Input, Button } from '@sun/components';
import CsrfField from '~/utils/csrf-field';
import styles from './login-form.module.css';

type LoginFormProps = {
  /**
   * Switches to the magic-link form.
   */
  onShowMagicLink: () => void;
};

/**
 * Email/password form. Native POST to /__login (PRG) so the session cookie sticks.
 */
const LoginForm = (props: LoginFormProps) => {
  const { onShowMagicLink } = props;
  const { t } = useTranslation('login');
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const redirect = searchParams.get('redirect') ?? '';
  const errorMessages: Record<string, string> = {
    rate: t('error-rate'),
    mail: t('error-mail'),
    link: t('error-link'),
    banned: t('error-banned'),
    google: t('error-google'),
  };
  const message = error ? (errorMessages[error] ?? t('error-default')) : null;

  return (
    <Form action="/__login" method="post">
      <CsrfField />
      <input type="hidden" name="redirect" value={redirect} />
      <FormField name="email">
        <FormLabel>{t('email')}</FormLabel>
        <FormItem>
          <Input
            type="email"
            placeholder={t('email-placeholder')}
            autoComplete="email"
            required
            autoFocus
          />
        </FormItem>
      </FormField>
      <FormField name="password">
        <FormLabel>{t('password')}</FormLabel>
        <FormItem>
          <Input
            type="password"
            placeholder={t('password-placeholder')}
            autoComplete="current-password"
            required
          />
        </FormItem>
      </FormField>
      {message && <p className={styles.error}>{message}</p>}
      <FormFooter className={styles.form_footer}>
        <Button type="submit" title={t('sign-in-title')}>
          {t('sign-in-label')}
        </Button>
        <Button type="button" variant="secondary" onClick={onShowMagicLink}>
          {t('use-magic-link')}
        </Button>
      </FormFooter>
    </Form>
  );
};

export default LoginForm;
