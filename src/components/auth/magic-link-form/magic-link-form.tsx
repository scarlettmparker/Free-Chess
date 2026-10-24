import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Form, FormField, FormLabel, FormItem, FormFooter, Input, Button } from '@sun/components';
import CsrfField from '~/utils/csrf-field';
import styles from './magic-link-form.module.css';

type MagicLinkFormProps = {
  /**
   * Switches back to the password form.
   */
  onBack: () => void;
};

/**
 * Email-only form that requests a sign-in link.
 */
const MagicLinkForm = (props: MagicLinkFormProps) => {
  const { onBack } = props;
  const { t } = useTranslation('login');
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '';

  return (
    <Form action="/__magic-link" method="post">
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
      <FormFooter className={styles.form_footer}>
        <Button type="submit" title={t('send-link-title')}>
          {t('send-link-label')}
        </Button>
        <Button type="button" variant="secondary" onClick={onBack}>
          {t('back-to-password')}
        </Button>
      </FormFooter>
    </Form>
  );
};

export default MagicLinkForm;
