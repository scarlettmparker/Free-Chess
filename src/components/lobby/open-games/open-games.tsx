import { Link } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@sun/components';
import { DocumentDuplicateOutline } from 'preact-heroicons';
import type { LobbyGame } from '~/utils/games-data';
import styles from './open-games.module.css';

type OpenGamesProps = {
  /**
   * Open games for the signed-in account.
   */
  games: LobbyGame[];
};

/**
 * Lists games waiting for an opponent or already in progress.
 */
const OpenGames = (props: OpenGamesProps) => {
  const { games } = props;
  const { t } = useTranslation('lobby');

  /**
   * Describes the opponent or board layout for a game.
   *
   * @param game Game to describe.
   * @returns Short detail line.
   */
  const detail = (game: LobbyGame): string => {
    if (game.status === 'active') {
      return `${game.whiteUsername ?? t('unknown-player')} vs ${game.blackUsername ?? t('unknown-player')}`;
    }
    return game.boardLayoutName ?? t('layout-standard');
  };

  /**
   * Copies the game code.
   *
   * @param id Game code to copy.
   */
  const copyCode = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch (error) {
      console.error('Could not copy game code', error);
    }
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
              <li key={game.id} className={styles.item}>
                <div className={styles.info}>
                  <div className={styles.code_line}>
                    <Link to={`/play/${game.id}`} className={styles.code_link}>
                      {game.id}
                    </Link>
                    <button
                      type="button"
                      className={styles.copy}
                      aria-label={t('copy-code', { code: game.id })}
                      onClick={() => copyCode(game.id)}
                    >
                      <DocumentDuplicateOutline width={16} height={16} aria-hidden="true" />
                    </button>
                  </div>
                  <p className={styles.detail}>{detail(game)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
};

export default OpenGames;
