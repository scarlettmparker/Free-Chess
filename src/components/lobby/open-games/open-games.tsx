import { Link } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@sun/components';
import type { LobbyGame } from '~/utils/games-data';
import styles from './open-games.module.css';

type OpenGamesProps = {
  /**
   * Open games for the signed-in account.
   */
  games: LobbyGame[];
};

/**
 * Translation key for each game status.
 */
const statusKeys = {
  waiting: 'status-waiting',
  active: 'status-active',
  finished: 'status-finished',
} as const;

/**
 * Lists games waiting for an opponent or already in progress.
 */
const OpenGames = (props: OpenGamesProps) => {
  const { games } = props;
  const { t } = useTranslation('lobby');

  /**
   * Labels the players shown on a game row.
   *
   * @param game Game to describe.
   * @returns Player label.
   */
  const players = (game: LobbyGame): string => {
    if (game.status === 'waiting') return t('waiting-for-opponent');
    return `${game.whiteUsername ?? t('unknown-player')} vs ${game.blackUsername ?? t('unknown-player')}`;
  };

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>{t('open-title')}</CardTitle>
        <CardDescription>{t('open-description')}</CardDescription>
      </CardHeader>
      <CardBody>
        {games.length === 0 ? (
          <p className={styles.no_games}>{t('no-open-games')}</p>
        ) : (
          <ul className={styles.list}>
            {games.map((game) => (
              <li key={game.id}>
                <Link to={`/play/${game.id}`} className={styles.item}>
                  <strong className={styles.id}>{game.id}</strong>
                  <span>{players(game)}</span>
                  <span>{game.boardLayoutName ?? t('layout-standard')}</span>
                  <span>{t(statusKeys[game.status])}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
};

export default OpenGames;
