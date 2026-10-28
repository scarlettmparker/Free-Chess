import { Link } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@sun/components';
import type { GameResult } from '~/game/consts/board';
import type { GameHistoryEntry } from '~/utils/games-data';
import GameBoardPreview from '~/components/profile/game-board-preview';
import styles from './game-history-card.module.css';

/**
 * Translation key for each finished-game result.
 */
const resultKeys: Record<NonNullable<GameResult>, string> = {
  'white-checkmate': 'result-white-checkmate',
  'black-checkmate': 'result-black-checkmate',
  stalemate: 'result-stalemate',
  draw: 'result-draw',
};

type GameHistoryCardProps = {
  /**
   * Game to display.
   */
  game: GameHistoryEntry;
};

/**
 * One game in the profile history.
 */
const GameHistoryCard = (props: GameHistoryCardProps) => {
  const { game } = props;
  const { t } = useTranslation('profile');
  const { t: tChess } = useTranslation('chess');
  const whiteName = game.whiteUsername ?? t('unknown-player');
  const blackName = game.blackUsername ?? t('unknown-player');
  let opponent: string | null = null;
  if (game.viewerSeat === 'white') opponent = blackName;
  if (game.viewerSeat === 'black') opponent = whiteName;
  const title =
    game.viewerSeat === 'white' || game.viewerSeat === 'black'
      ? t('you-vs', { opponent: opponent ?? t('unknown-player') })
      : t('players-vs', { white: whiteName, black: blackName });
  const finished = game.status === 'finished';
  let statusText = t('status-active');
  if (game.status === 'waiting') statusText = t('status-waiting');
  if (finished) {
    statusText = game.result ? tChess(resultKeys[game.result]) : t('status-finished');
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {game.boardLayoutName ?? t('board-standard')} | {t(`status-${game.status}`)}
        </CardDescription>
      </CardHeader>
      <CardBody>
        <GameBoardPreview state={game.finalState} />
      </CardBody>
      <CardFooter className={styles.footer}>
        <p className={styles.score}>{game.score || statusText}</p>
        <Link to={finished ? `/replay/${game.id}` : `/play/${game.id}`}>
          {finished ? t('view-replay') : t('view-game')}
        </Link>
      </CardFooter>
    </Card>
  );
};

export default GameHistoryCard;
