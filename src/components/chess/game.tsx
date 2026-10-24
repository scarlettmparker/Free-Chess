import { useTranslation } from '@sun/i18n';
import { colors } from '~/game/consts/board';
import { useChessSession } from '~/hooks/use-chess-session';
import Board from './board';
import styles from './board.module.css';

/**
 * Chess page body: status line and board.
 */
const Game = () => {
  const { view, status, playerColor, selectSquare } = useChessSession();
  const { t } = useTranslation('chess');

  const turn = view.side === colors.WHITE ? t('white-to-move') : t('black-to-move');
  const side =
    playerColor === colors.WHITE
      ? t('you-are-white')
      : playerColor === colors.BLACK
        ? t('you-are-black')
        : t('spectator');

  return (
    <div className={styles.game}>
      <div className={styles.status}>
        <span>{turn}</span>
        <span>{side}</span>
        {status === 'connected' ? null : <span>{t(status)}</span>}
      </div>
      <Board view={view} onSelect={selectSquare} />
      {view.gameOver ? <p className={styles.gameOver}>{t('game-over')}</p> : null}
    </div>
  );
};

export default Game;
