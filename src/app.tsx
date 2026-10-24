import { Suspense } from 'react';
import { useTranslation } from '@sun/i18n';
import Game from '~/components/chess';
import styles from './app.module.css';

/**
 * Page shell. The board mounts after hydration.
 */
const App = () => {
  const { t } = useTranslation('chess');

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t('title')}</h1>
      <Suspense fallback={null}>
        <Game />
      </Suspense>
    </main>
  );
};

export default App;
