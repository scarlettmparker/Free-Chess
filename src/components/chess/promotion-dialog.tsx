import { useTranslation } from '@sun/i18n';
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sun/components';
import { getMovePromoted } from '~/game/move/move-def';
import { pieceRegistry } from '~/game/piece/piece-registry';

type PromotionDialogProps = {
  /**
   * Promotion moves to choose from, or null when closed.
   */
  moves: number[] | null;
  /**
   * Plays the chosen promotion.
   */
  onChoose: (move: number) => void;
  /**
   * Closes the dialog without moving.
   */
  onCancel: () => void;
};

/**
 * Picks which piece a pawn promotes to.
 */
const PromotionDialog = (props: PromotionDialogProps) => {
  const { moves, onChoose, onCancel } = props;
  const { t } = useTranslation('chess');

  const labelFor = (move: number) => {
    const promoted = getMovePromoted(move);
    const base = promoted - (promoted % 2);
    const definitionId = pieceRegistry.getDefinitionId(base);
    if (definitionId === undefined) return t('promotion-piece');
    return pieceRegistry.getDefinition(definitionId)?.name ?? t('promotion-piece');
  };

  return (
    <Dialog
      open={moves !== null}
      onOpenChange={(open: boolean) => {
        if (!open) onCancel();
      }}
    >
      <DialogHeader>
        <DialogTitle>{t('promotion-title')}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div>
          {(moves ?? []).map((move) => (
            <Button key={move} type="button" variant="secondary" onClick={() => onChoose(move)}>
              {labelFor(move)}
            </Button>
          ))}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('promotion-cancel')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default PromotionDialog;
