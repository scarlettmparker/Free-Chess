import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Form, FormField, FormLabel, FormItem, FormFooter, Input, Button } from '@sun/components';
import CsrfField from '~/utils/csrf-field';
import styles from './login-form.module.css';

/**
 * Email/password form. Native POST to /__login (PRG) so the session cookie sticks.
 */
const LoginForm = () => {
  const { t } = useTranslation('login');
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const redirect = searchParams.get('redirect') ?? '';
  const message = error === 'rate' ? t('error-rate') : error ? t('error-default') : null;

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
      </FormFooter>
    </Form>
  );
};

export default LoginForm;
