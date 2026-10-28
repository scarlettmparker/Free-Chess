import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { executeMutation } from '@sun/ssr';
import { Button, Card, CardBody, CardDescription, CardHeader, CardTitle } from '@sun/components';
import CreateGameDialog from '~/components/lobby/create-game-dialog';
import type { LobbyLayout } from '~/utils/games-data';
import styles from './create-game-form.module.css';

type CreateGameFormProps = {
  /**
   * Board layouts available to the viewer.
   */
  layouts: LobbyLayout[];
  /**
   * Whether the viewer is signed in.
   */
  signedIn: boolean;
};

/**
 * Creates an account game from the lobby.
 */
const CreateGameForm = (props: CreateGameFormProps) => {
  const { layouts, signedIn } = props;
  const { t } = useTranslation('lobby');
  const navigate = useNavigate();
  const [choosing, setChoosing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLayoutChoice = layouts.length > 1;

  /**
   * Opens the layout picker or creates a standard game.
   */
  const handleCreate = async () => {
    if (!signedIn) {
      navigate('/login?redirect=/');
      return;
    }

    if (hasLayoutChoice) {
      setChoosing(true);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const result = await executeMutation<{ id: string }>('game/create', {});
      navigate(`/play/${result.id}`);
    } catch {
      setError(t('create-failed'));
      setPending(false);
    }
  };

  return (
    <>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>{t('create-title')}</CardTitle>
          <CardDescription>{t('create-description')}</CardDescription>
        </CardHeader>
        <CardBody>
          {signedIn ? (
            <div className={styles.actions}>
              {error ? (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="button" disabled={pending} onClick={handleCreate}>
                {pending ? t('creating') : t('create-game')}
              </Button>
            </div>
          ) : (
            <p className={styles.notice}>{t('sign-in-required')}</p>
          )}
        </CardBody>
      </Card>
      <CreateGameDialog open={choosing} onClose={() => setChoosing(false)} />
    </>
  );
};

export default CreateGameForm;
