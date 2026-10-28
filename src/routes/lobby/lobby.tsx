import { Suspense } from 'react';
import LobbyContent from '~/components/lobby/lobby-content';
import styles from './lobby.module.css';

/**
 * Lobby page.
 */
const Lobby = () => {
  return (
    <main className={styles.page}>
      <Suspense fallback={null}>
        <LobbyContent />
      </Suspense>
    </main>
  );
};

export default Lobby;
