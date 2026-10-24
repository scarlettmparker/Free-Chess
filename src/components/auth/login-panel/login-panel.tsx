import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginForm from '~/components/auth/login-form';
import MagicLinkForm from '~/components/auth/magic-link-form';
import styles from './login-panel.module.css';

/**
 * Switches between the password and magic-link forms.
 */
const LoginPanel = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'password' | 'magic'>(
    searchParams.get('mode') === 'magic' ? 'magic' : 'password',
  );

  if (mode === 'magic') {
    return (
      <div className={styles.panel}>
        <MagicLinkForm onBack={() => setMode('password')} />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <LoginForm onShowMagicLink={() => setMode('magic')} />
    </div>
  );
};

export default LoginPanel;
