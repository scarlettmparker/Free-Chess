import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Form, FormFooter, Button } from '@sun/components';
import CsrfField from '~/utils/csrf-field';
import styles from './google-form.module.css';

/**
 * Native form that starts the Google sign-in flow.
 */
const GoogleForm = () => {
  const { t } = useTranslation('login');
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '';

  return (
    <Form action="/__google" method="post">
      <CsrfField />
      <input type="hidden" name="redirect" value={redirect} />
      <FormFooter className={styles.google_footer}>
        <Button type="submit" variant="secondary" title={t('google-title')}>
          {t('google-label')}
        </Button>
      </FormFooter>
    </Form>
  );
};

export default GoogleForm;
