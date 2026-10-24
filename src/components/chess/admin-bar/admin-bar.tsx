import { useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation, makeCacheKey, revalidatePageData } from '@sun/ssr';
import { Button } from '@sun/components';
import ConfirmGameActionDialog from '~/components/admin/confirm-game-action-dialog';
import BoardPickerDialog from '~/components/admin/board-picker-dialog';
import RoleCheck from '~/utils/role-check';
import type { AdminColor } from '~/utils/admin-command';
import styles from './admin-bar.module.css';

type GameAction = 'reset' | 'clear-white' | 'clear-black' | 'clear-all' | 'list';

const clearColorByAction: Record<Exclude<GameAction, 'reset' | 'list'>, AdminColor> = {
  'clear-white': 'white',
  'clear-black': 'black',
  'clear-all': 'all',
};

const confirmKeysByAction: Partial<Record<GameAction, { title: string; body: string }>> = {
  reset: { title: 'confirm-reset-title', body: 'confirm-reset-body' },
  'clear-all': { title: 'confirm-clear-title', body: 'confirm-clear-body' },
};

/**
 * Floating game-control bar for admins.
 */
const AdminBar = () => {
  const { t } = useTranslation('admin');
  const [pending, setPending] = useState<GameAction | null>(null);
  const [confirming, setConfirming] = useState<GameAction | null>(null);
  const [pickingBoard, setPickingBoard] = useState(false);
  const busy = pending !== null;

  const runAction = async (action: GameAction) => {
    setPending(action);

    try {
      if (action === 'reset') {
        await executeMutation('game/reset', {});
      } else if (action === 'list') {
        await executeMutation('game/list-sessions', {});
        revalidatePageData([makeCacheKey('adminSessions', {})]);
      } else {
        await executeMutation('game/clear', {
          color: clearColorByAction[action],
        });
      }
      if (action !== 'list') {
        revalidatePageData([makeCacheKey('adminSessions', {})]);
      }
    } catch (_) {
      // Don't do anything
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
    <RoleCheck roles={['admin', 'game-admin']} match="any">
      <div className={styles.bar}>
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
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => requestAction('list')}
          >
            {t('refresh')}
          </Button>
        </div>

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
            revalidatePageData([makeCacheKey('adminSessions', {})]);
          }}
        />
      </div>
    </RoleCheck>
  );
};

export default AdminBar;
