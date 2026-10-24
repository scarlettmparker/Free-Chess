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

  const states = (form.moveStates.length ? form.moveStates : [{ index: 0, vectors: [] }]) as {
    index: number;
    vectors: { dx: number; dy: number; range: string; capture: string }[];
  }[];
  const current = states[stateIndex] ?? states[0];
  const vectors = current?.vectors ?? [];

  const paintCell = useCallback(
    (dx: number, dy: number, add: boolean) => {
      setForm((prev) => {
        const prevStates = (
          prev.moveStates.length ? prev.moveStates : [{ index: 0, vectors: [] }]
        ) as {
          index: number;
          vectors: { dx: number; dy: number; range: string; capture: string }[];
        }[];
        const typedVectors = prevStates[stateIndex]?.vectors ?? [];
        const existing = typedVectors.find((v) => v.dx === dx && v.dy === dy);
        if (add && existing) return prev;
        if (!add && !existing) return prev;
        const nextVectors = add
          ? [...typedVectors, { dx, dy, range: moveType, capture }]
          : typedVectors.filter((v) => v.dx !== dx || v.dy !== dy);
        const nextStates = prevStates.map((state, index) =>
          index === stateIndex ? { ...state, vectors: nextVectors } : state,
        );
        return { ...prev, moveStates: nextStates };
      });
    },
    [stateIndex, moveType, capture],
  );

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

  const handlePartChange = useCallback((part: 'head' | 'body' | 'foot', key: string) => {
    setForm((prev) => ({ ...prev, sprite: { ...prev.sprite, [`${part}Key`]: key } }));
  }, []);

  const handleAddState = useCallback(() => {
    setForm((prev) => {
      const prevStates = (
        prev.moveStates.length ? prev.moveStates : [{ index: 0, vectors: [] }]
      ) as {
        index: number;
        vectors: { dx: number; dy: number; range: string; capture: string }[];
      }[];
      const next = [...prevStates, { index: prevStates.length, vectors: [] }];
      setStateIndex(next.length - 1);
      return { ...prev, moveStates: next };
    });
  }, []);

  const handleDeleteState = useCallback(() => {
    setForm((prev) => {
      const prevStates = (
        prev.moveStates.length ? prev.moveStates : [{ index: 0, vectors: [] }]
      ) as {
        index: number;
        vectors: { dx: number; dy: number; range: string; capture: string }[];
      }[];
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
