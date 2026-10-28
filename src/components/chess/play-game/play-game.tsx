import { Link } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@sun/components';
import type { GameResult } from '~/game/consts/board';
import { useChessSession } from '~/hooks/use-chess-session';
import type { PlayGameData } from '~/utils/games-data';
import Board from '../board';
import PromotionDialog from '../promotion-dialog';
import styles from './play-game.module.css';

/**
 * Translation key for each finished-game result.
 */
const resultKeys: Record<NonNullable<GameResult>, string> = {
  'white-checkmate': 'result-white-checkmate',
  'black-checkmate': 'result-black-checkmate',
  stalemate: 'result-stalemate',
  draw: 'result-draw',
};

type PlayGameProps = {
  /**
   * Live game data.
   */
  game: PlayGameData;
};

/**
 * Live game board and status.
 */
const PlayGame = (props: PlayGameProps) => {
  const { game } = props;
  const { t: tChess } = useTranslation('chess');
  const { t } = useTranslation('play');
  const {
    view,
    status,
    notice,
    gameStatus,
    selectSquare,
    promotion,
    choosePromotion,
    cancelPromotion,
  } = useChessSession({ gameId: game.id, token: game.token });

  const waiting = gameStatus === 'waiting' || (gameStatus === null && game.status === 'waiting');
  const finished = gameStatus === 'finished' || view.gameOver || game.status === 'finished';
  const result = view.result ?? game.result;
  const resultKey = result ? resultKeys[result] : 'game-over';

  return (
    <div className={styles.game}>
      <div className={styles.layout}>
        <Board view={view} onSelect={selectSquare} />
        {waiting ? (
          <aside className={styles.side}>
            <Card className={styles.card}>
              <CardHeader>
                <CardTitle>{t('waiting-title')}</CardTitle>
                <CardDescription>{t('waiting-body')}</CardDescription>
              </CardHeader>
              <CardBody>
                <p className={styles.code}>
                  {t('game-code')} {game.id}
                </p>
              </CardBody>
            </Card>
          </aside>
        ) : null}
      </div>

      <p className={styles.status} role="status">
        {status === 'connected' ? null : tChess(status)}
        {notice ? <> | {tChess(notice)}</> : null}
      </p>

      {finished ? (
        <section className={styles.game_over} aria-labelledby="play-game-over">
          <h2 id="play-game-over" className={styles.game_over_text}>
            {t('game-over')}
          </h2>
          <p className={styles.game_over_text}>{tChess(resultKey)}</p>
          <Link to={`/replay/${game.id}`}>{t('view-replay')}</Link>
        </section>
      ) : null}

      <PromotionDialog moves={promotion} onChoose={choosePromotion} onCancel={cancelPromotion} />
    </div>
  );
};

export default PlayGame;
