import { Suspense } from 'react';
import { useTranslation } from '@sun/i18n';
import LobbyContent from '~/components/lobby/lobby-content';
import styles from './lobby.module.css';

/**
 * Lobby page.
 */
const Lobby = () => {
  const { t } = useTranslation('lobby');

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t('title')}</h1>
      <Suspense fallback={null}>
        <LobbyContent />
      </Suspense>
    </main>
  );
};

export default Lobby;
