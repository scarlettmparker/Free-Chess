import { useTranslation } from '@sun/i18n';
import type { GameResult } from '~/game/consts/board';
import { useGameReplay } from '~/hooks/use-game-replay';
import type { ReplayGameData } from '~/utils/games-data';
import Board from '../board';
import styles from './replay-game.module.css';

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
 * Does nothing when a replay square is selected.
 */
const noop = () => {};

type ReplayGameProps = {
  /**
   * Stored game data.
   */
  game: ReplayGameData;
};

/**
 * Stored game replay with arrow key navigation.
 */
const ReplayGame = (props: ReplayGameProps) => {
  const { game } = props;
  const { t: tChess } = useTranslation('chess');
  const { t } = useTranslation('play');
  const { view } = useGameReplay({
    initialState: game.initial,
    moves: game.moves,
    result: game.result,
  });
  const resultKey = game.result ? resultKeys[game.result] : 'game-over';

  return (
    <div className={styles.game}>
      <Board view={view} onSelect={noop} />

      {game.result ? (
        <section className={styles.result} aria-labelledby="replay-game-over">
          <h2 id="replay-game-over" className={styles.result_text}>
            {t('game-over')}
          </h2>
          <p className={styles.result_text}>{tChess(resultKey)}</p>
        </section>
      ) : null}
    </div>
  );
};

export default ReplayGame;
