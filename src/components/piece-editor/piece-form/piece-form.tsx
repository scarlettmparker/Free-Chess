import { useCallback, useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation, makeCacheKey, revalidatePageData } from '@sun/ssr';
import {
  Checkbox,
  Form,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Select,
  SelectOption,
} from '@sun/components';
import MoveGrid from '~/components/piece-editor/move-grid';
import MoveToolbar from '~/components/piece-editor/move-toolbar';
import SpriteComposer from '~/components/piece-editor/sprite-composer';
import StateTabs from '~/components/piece-editor/state-tabs';
import type { PieceDefinitionDto } from '~/utils/piece-types';
import type { PieceInput } from '~/server/game-pieces';
import styles from './piece-form.module.css';

type PieceFormProps = {
  /**
   * Piece to edit.
   */
  piece: PieceDefinitionDto | null;
};

type FormVector = {
  /**
   * Horizontal offset.
   */
  dx: number;
  /**
   * Vertical offset.
   */
  dy: number;
  /**
   * Reach of the vector.
   */
  range: string;
  /**
   * Take policy of the vector.
   */
  capture: string;
};

type FormState = {
  /**
   * Zero based state index.
   */
  index: number;
  /**
   * Vectors in this state.
   */
  vectors: FormVector[];
};

/**
 * Raw move states as typed vectors with a fallback empty state.
 *
 * @param moveStates Raw move states.
 * @returns Typed move states.
 */
function normalizeStates(moveStates: unknown[]): FormState[] {
  return (moveStates.length ? moveStates : [{ index: 0, vectors: [] }]) as FormState[];
}

/**
 * Piece editing form.
 */
const PieceForm = (props: PieceFormProps) => {
  const { piece } = props;
  const { t } = useTranslation('admin');
  const [form, setForm] = useState<PieceInput>(() => ({
    id: piece?.id,
    slug: piece?.slug ?? '',
    name: piece?.name ?? '',
    description: piece?.description ?? null,
    isKing: piece?.isKing ?? false,
    promotionTargets: piece?.promotionTargets ?? [],
    promotionRanks: piece?.promotionRanks ?? [],
    moveStates: piece?.moveStates ?? [{ index: 0, vectors: [] }],
    stateTransition: piece?.stateTransition ?? 'none',
    edgeReset: piece?.edgeReset ?? false,
    sprite: piece?.sprite ?? { headKey: 'king-head', bodyKey: 'king-body', footKey: 'king-foot' },
  }));
  const [stateIndex, setStateIndex] = useState(0);
  const [moveType, setMoveType] = useState<'step' | 'slide' | 'hop'>('step');
  const [capture, setCapture] = useState<'optional' | 'required' | 'forbidden'>('optional');
  const [canPromote, setCanPromote] = useState((piece?.promotionTargets.length ?? 0) > 0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const states = normalizeStates(form.moveStates);
  const current = states[stateIndex] ?? states[0];
  const vectors = current?.vectors ?? [];

  /**
   * Paints or erases one vector with the active tool.
   *
   * @param dx Horizontal offset.
   * @param dy Vertical offset.
   * @param add Whether to paint or erase.
   */
  const paintCell = useCallback(
    (dx: number, dy: number, add: boolean) => {
      setForm((prev) => {
        const prevStates = normalizeStates(prev.moveStates);
        const typedVectors = prevStates[stateIndex]?.vectors ?? [];
        const existing = typedVectors.find((v) => v.dx === dx && v.dy === dy);
        if (!add && !existing) return prev;
        if (add && existing?.range === moveType) {
          const want = moveType === 'step' ? 'forbidden' : capture;
          if (existing?.capture === want) return prev;
        }
        const nextVectors = add
          ? [
              ...typedVectors.filter((v) => v.dx !== dx || v.dy !== dy),
              { dx, dy, range: moveType, capture: moveType === 'step' ? 'forbidden' : capture },
            ]
          : typedVectors.filter((v) => v.dx !== dx || v.dy !== dy);
        const nextStates = prevStates.map((state, index) =>
          index === stateIndex ? { ...state, vectors: nextVectors } : state,
        );
        return { ...prev, moveStates: nextStates };
      });
    },
    [stateIndex, moveType, capture],
  );

  /**
   * Saves the piece and revalidates the piece list.
   *
   * @param event Form submit event.
   */
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError(null);
    const slug = form.name.toLowerCase().replace(/\s+/g, '-');
    try {
      const result = await executeMutation<{ id: number }>('pieces/save', {
        ...form,
        slug,
        promotionTargets: canPromote ? form.promotionTargets : [],
      });
      setForm((prev) => ({ ...prev, id: result.id }));
      revalidatePageData([makeCacheKey('pieces', {})]);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('action-failed'));
    }
  };

  /**
   * Swaps one sprite part.
   *
   * @param part Part slot to change.
   * @param key New part key.
   */
  const handlePartChange = useCallback((part: 'head' | 'body' | 'foot', key: string) => {
    setForm((prev) => ({ ...prev, sprite: { ...prev.sprite, [`${part}Key`]: key } }));
  }, []);

  /**
   * Appends an empty move state and selects it.
   */
  const handleAddState = useCallback(() => {
    setForm((prev) => {
      const prevStates = normalizeStates(prev.moveStates);
      const next = [...prevStates, { index: prevStates.length, vectors: [] }];
      setStateIndex(next.length - 1);
      return { ...prev, moveStates: next };
    });
  }, []);

  /**
   * Removes the active move state when more than one exists.
   */
  const handleDeleteState = useCallback(() => {
    setForm((prev) => {
      const prevStates = normalizeStates(prev.moveStates);
      if (prevStates.length <= 1) return prev;
      const next = prevStates.filter((_, index) => index !== stateIndex);
      setStateIndex(Math.max(0, stateIndex - 1));
      return { ...prev, moveStates: next };
    });
  }, [stateIndex]);

  return (
    <Form id="piece-form" className={styles.form} onSubmit={handleSave}>
      <div className={styles.field_row}>
        <FormField name="name">
          <FormLabel>{t('piece-name')}</FormLabel>
          <FormItem>
            <Input
              value={form.name}
              placeholder={t('piece-name-placeholder')}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: event.currentTarget.value })
              }
            />
          </FormItem>
        </FormField>
        <FormField name="stateTransition">
          <FormLabel>{t('state-transition')}</FormLabel>
          <FormItem>
            <Select
              value={form.stateTransition}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                setForm({ ...form, stateTransition: event.currentTarget.value })
              }
            >
              <SelectOption value="none">{t('state-none')}</SelectOption>
              <SelectOption value="advance">{t('state-advance')}</SelectOption>
              <SelectOption value="advanceReverseAtEdge">{t('state-advance-reverse')}</SelectOption>
              <SelectOption value="cycle">{t('state-cycle')}</SelectOption>
            </Select>
          </FormItem>
        </FormField>
      </div>
      <div className={styles.checkbox_row}>
        <Checkbox
          id="isKing"
          name="isKing"
          className={styles.checkbox}
          label={t('piece-king')}
          checked={form.isKing}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, isKing: event.currentTarget.checked })
          }
        />
        <Checkbox
          id="canPromote"
          name="canPromote"
          className={styles.checkbox}
          label={t('can-promote')}
          checked={canPromote}
          onChange={(event) => setCanPromote(event.currentTarget.checked)}
        />
      </div>
      <SpriteComposer
        headKey={form.sprite.headKey}
        bodyKey={form.sprite.bodyKey}
        footKey={form.sprite.footKey}
        onChange={handlePartChange}
      />
      <StateTabs
        count={states.length}
        active={stateIndex}
        onSelect={setStateIndex}
        onAdd={handleAddState}
        onDelete={handleDeleteState}
      />
      <MoveToolbar
        moveType={moveType}
        capture={capture}
        onMoveTypeChange={setMoveType}
        onCaptureChange={setCapture}
      />
      <MoveGrid vectors={vectors} sprite={form.sprite} moveType={moveType} onPaint={paintCell} />
      {saveError ? <p className={styles.error}>{saveError}</p> : null}
    </Form>
  );
};

export default PieceForm;
