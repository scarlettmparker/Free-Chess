import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import GoogleForm from '~/components/auth/google-form';
import LoginForm from '~/components/auth/login-form';
import MagicLinkForm from '~/components/auth/magic-link-form';
import styles from './login-panel.module.css';

type LoginPanelProps = {
  /**
   * Whether Google sign-in is configured.
   */
  googleEnabled: boolean;
};

/**
 * Switches between the password and magic-link forms.
 */
const LoginPanel = (props: LoginPanelProps) => {
  const { googleEnabled } = props;
  const { t } = useTranslation('login');
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'password' | 'magic'>(
    searchParams.get('mode') === 'magic' ? 'magic' : 'password',
  );

  return (
    <div className={styles.panel}>
      {mode === 'magic' ? (
        <MagicLinkForm onBack={() => setMode('password')} />
      ) : (
        <LoginForm onShowMagicLink={() => setMode('magic')} />
      )}
      {googleEnabled && (
        <div className={styles.divider}>
          <hr className={styles.divider_line} />
          <span className={styles.divider_text}>{t('or')}</span>
          <hr className={styles.divider_line} />
        </div>
      )}
      {googleEnabled && <GoogleForm />}
    </div>
  );
};

export default LoginPanel;
