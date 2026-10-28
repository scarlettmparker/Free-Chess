import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { executeMutation } from '@sun/ssr';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormField,
  FormFooter,
  FormItem,
  FormLabel,
  Select,
  SelectOption,
} from '@sun/components';
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
  const [layoutId, setLayoutId] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLayoutChoice = layouts.length > 1;

  /**
   * Creates the game and opens its play page.
   *
   * @param event Form submission.
   */
  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signedIn) {
      navigate('/login?redirect=/');
      return;
    }

    setPending(true);
    setError(null);
    try {
      const result = await executeMutation<{ id: string }>(
        'game/create',
        layoutId ? { boardLayoutId: layoutId } : {},
      );
      navigate(`/play/${result.id}`);
    } catch {
      setError(t('create-failed'));
      setPending(false);
    }
  };

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>{t('create-title')}</CardTitle>
        <CardDescription>{t('create-description')}</CardDescription>
      </CardHeader>
      <CardBody>
        {signedIn ? (
          <Form onSubmit={handleCreate}>
            {hasLayoutChoice ? (
              <FormField name="layout">
                <FormLabel>{t('layout-label')}</FormLabel>
                <FormItem>
                  <Select
                    name="layout"
                    value={layoutId}
                    onChange={(event) => setLayoutId(event.currentTarget.value)}
                  >
                    <SelectOption value="">{t('layout-standard')}</SelectOption>
                    {layouts.map((layout) => (
                      <SelectOption key={layout.id} value={layout.id}>
                        {layout.name}
                      </SelectOption>
                    ))}
                  </Select>
                </FormItem>
              </FormField>
            ) : null}
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
            <FormFooter className={styles.footer}>
              <Button type="submit" disabled={pending}>
                {pending ? t('creating') : t('create-game')}
              </Button>
            </FormFooter>
          </Form>
        ) : (
          <div className={styles.signed_out}>
            <p className={styles.notice}>{t('sign-in-required')}</p>
            <Link to="/login?redirect=/">
              <Button variant="secondary">{t('sign-in')}</Button>
            </Link>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default CreateGameForm;
