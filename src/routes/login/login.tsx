import { useTranslation } from '@sun/i18n';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@sun/components';
import LoginForm from '~/components/auth/login-form';
import styles from './login.module.css';

/**
 * Login page.
 */
const Login = () => {
  const { t } = useTranslation('login');

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardBody>
          <LoginForm />
        </CardBody>
      </Card>
    </div>
  );
};

export default Login;
