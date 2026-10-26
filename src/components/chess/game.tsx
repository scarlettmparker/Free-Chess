import { useTranslation } from '@sun/i18n';
import { colors, type GameResult } from '~/game/consts/board';
import { useChessSession } from '~/hooks/use-chess-session';
import Board from './board';
import PromotionDialog from './promotion-dialog';
import styles from './board.module.css';

/**
 * Translation key for each finished-game result.
 */
const resultKeys: Record<NonNullable<GameResult>, string> = {
  'white-checkmate': 'result-white-checkmate',
  'black-checkmate': 'result-black-checkmate',
  stalemate: 'result-stalemate',
  draw: 'result-draw',
};

/**
 * Chess page body: status line and board.
 */
const Game = () => {
  const {
    view,
    status,
    notice,
    playerColor,
    selectSquare,
    promotion,
    choosePromotion,
    cancelPromotion,
  } = useChessSession();
  const { t } = useTranslation('chess');

  const turn = view.side === colors.WHITE ? t('white-to-move') : t('black-to-move');
  const side = playerColor !== colors.WHITE && playerColor !== colors.BLACK && t('spectator');
  const resultKey = view.result ? resultKeys[view.result] : 'game-over';

  return (
    <div className={styles.game}>
      <div className={styles.status}>
        <span>{turn}</span>
        {status === 'connected' ? null : <span>{t(status)}</span>}
        {notice ? <span>{t(notice)}</span> : null}
      </div>
      <Board view={view} onSelect={selectSquare} />
      <span>{side}</span>
      {view.gameOver ? <p className={styles.game_over}>{t(resultKey)}</p> : null}
      <PromotionDialog moves={promotion} onChoose={choosePromotion} onCancel={cancelPromotion} />
    </div>
  );
};

export default Game;
