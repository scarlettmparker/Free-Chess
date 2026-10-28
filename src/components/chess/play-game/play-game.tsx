import { Link } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@sun/components';
import { colors, type GameResult } from '~/game/consts/board';
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
    playerColor,
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
  const whiteName =
    playerColor === colors.WHITE ? t('you') : (game.whiteUsername ?? t('unknown-player'));
  const blackName =
    playerColor === colors.BLACK ? t('you') : (game.blackUsername ?? t('unknown-player'));
  const turn = view.side === colors.WHITE ? tChess('white-to-move') : tChess('black-to-move');
  const side =
    playerColor !== colors.WHITE && playerColor !== colors.BLACK ? tChess('spectator') : null;

  return (
    <div className={styles.game}>
      <ul className={styles.players} aria-label={t('players')}>
        <li>
          {t('white')} | {whiteName}
        </li>
        <li>
          {t('black')} | {blackName}
        </li>
      </ul>

      {waiting ? (
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
      ) : null}

      <p className={styles.status} role="status">
        {turn}
        {status === 'connected' ? null : <> | {tChess(status)}</>}
        {notice ? <> | {tChess(notice)}</> : null}
        {side ? <> | {side}</> : null}
      </p>

      <Board view={view} onSelect={selectSquare} />

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
