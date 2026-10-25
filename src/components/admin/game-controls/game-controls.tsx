import { useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation, makeCacheKey, revalidatePageData } from '@sun/ssr';
import { Button, Card, CardBody, CardDescription, CardHeader, CardTitle } from '@sun/components';
import ConfirmGameActionDialog from '~/components/admin/confirm-game-action-dialog';
import BoardPickerDialog from '~/components/admin/board-picker-dialog';
import RoleCheck from '~/utils/role-check';
import type { AdminColor } from '~/utils/admin-command';
import styles from './game-controls.module.css';
import { FREE_CHESS_ADMIN_ROLE } from '~/utils/roles';

type GameAction = 'reset' | 'clear-white' | 'clear-black' | 'clear-all';

/**
 * Clear target for each colour action.
 */
const clearColorByAction: Record<Exclude<GameAction, 'reset'>, AdminColor> = {
  'clear-white': 'white',
  'clear-black': 'black',
  'clear-all': 'all',
};

/**
 * Confirmation copy for destructive actions.
 */
const confirmKeysByAction: Record<GameAction, { title: string; body: string }> = {
  reset: { title: 'confirm-reset-title', body: 'confirm-reset-body' },
  'clear-white': { title: 'confirm-clear-title', body: 'confirm-clear-body' },
  'clear-black': { title: 'confirm-clear-title', body: 'confirm-clear-body' },
  'clear-all': { title: 'confirm-clear-title', body: 'confirm-clear-body' },
};

/**
 * Reset and colour controls for the running game.
 */
const GameControls = () => {
  const { t } = useTranslation('admin');
  const [pending, setPending] = useState<GameAction | null>(null);
  const [confirming, setConfirming] = useState<GameAction | null>(null);
  const [pickingBoard, setPickingBoard] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const busy = pending !== null;

  const runAction = async (action: GameAction) => {
    setPending(action);
    setMessage(null);

    try {
      if (action === 'reset') {
        await executeMutation('game/reset', {});
      } else {
        await executeMutation('game/clear', { color: clearColorByAction[action] });
      }
      setMessage(t('action-complete'));
      revalidatePageData([makeCacheKey('adminSessions', {})]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('action-failed'));
    } finally {
      setPending(null);
      setConfirming(null);
    }
  };

  const requestAction = (action: GameAction) => {
    if (action === 'reset') {
      setPickingBoard(true);
      return;
    }
    if (action === 'clear-all') {
      setConfirming(action);
      return;
    }
    void runAction(action);
  };

  const confirmKeys = confirming ? confirmKeysByAction[confirming] : null;

  return (
    <RoleCheck roles={[FREE_CHESS_ADMIN_ROLE]} match="any">
      <Card>
        <CardHeader>
          <CardTitle>{t('game-title')}</CardTitle>
          <CardDescription>{t('game-description')}</CardDescription>
        </CardHeader>
        <CardBody>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => requestAction('reset')}
            >
              {t('reset')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => requestAction('clear-white')}
            >
              {t('clear-white')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => requestAction('clear-black')}
            >
              {t('clear-black')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => requestAction('clear-all')}
            >
              {t('clear-all')}
            </Button>
          </div>
          {message && (
            <p className={styles.message} aria-live="polite">
              {message}
            </p>
          )}
        </CardBody>
      </Card>
      <ConfirmGameActionDialog
        open={confirming !== null}
        title={confirmKeys ? t(confirmKeys.title) : ''}
        body={confirmKeys ? t(confirmKeys.body) : ''}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) void runAction(confirming);
        }}
      />
      <BoardPickerDialog
        open={pickingBoard}
        onClose={() => setPickingBoard(false)}
        onReset={() => {
          setPickingBoard(false);
          setMessage(t('action-complete'));
          revalidatePageData([makeCacheKey('adminSessions', {})]);
        }}
      />
    </RoleCheck>
  );
};

export default GameControls;
