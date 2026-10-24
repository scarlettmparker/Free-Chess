import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation, makeCacheKey, revalidatePageData } from '@sun/ssr';
import { usePageData } from '@sun/ssr/react';
import { Form, FormField, FormItem, FormLabel, Input } from '@sun/components';
import { validateBoardLayout } from '~/game/board/validate-layout';
import type { BoardPlacement } from '~/game/board/validate-layout';
import type { PieceDefinition } from '~/game/piece/piece-definition';
import type { BoardLayoutDto, BoardLayoutInput } from '~/server/board-layouts';
import type { PieceDefinitionDto } from '~/utils/piece-types';
import BoardGrid from '~/components/board-editor/board-grid';
import PiecePalette from '~/components/board-editor/piece-palette';
import type { PaletteSelection } from '~/components/board-editor/piece-palette';
import styles from './board-form.module.css';

type BoardFormProps = {
  /**
   * Layout to edit, or null for a new layout.
   */
  layout: BoardLayoutDto | null;
};

/**
 * Convert a piece DTO into an engine definition for validation.
 *
 * @param dto Piece DTO.
 * @returns Engine definition.
 */
function dtoToDefinition(dto: PieceDefinitionDto): PieceDefinition {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    isKing: dto.isKing,
    promotionTargets: dto.promotionTargets,
    promotionRanks: dto.promotionRanks,
    moveStates: dto.moveStates as PieceDefinition['moveStates'],
    stateTransition: dto.stateTransition as PieceDefinition['stateTransition'],
    edgeReset: dto.edgeReset,
    sprite: dto.sprite,
  };
}

/**
 * Board layout editing form.
 */
const BoardForm = (props: BoardFormProps) => {
  const { layout } = props;
  const { t } = useTranslation('admin');
  const { data: pieces } = usePageData<PieceDefinitionDto[]>('pieces', 'pieces', {});
  const [form, setForm] = useState<BoardLayoutInput>(() => ({
    id: layout?.id,
    slug: layout?.slug ?? '',
    name: layout?.name ?? '',
    description: layout?.description ?? null,
    placements: layout?.placements ?? [],
  }));
  const [selection, setSelection] = useState<PaletteSelection>(() => {
    const king = pieces?.find((piece) => piece.isKing);
    if (king) return { definitionId: king.id, color: 0 };
    const first = pieces?.[0];
    if (first) return { definitionId: first.id, color: 0 };
    return { definitionId: -1, color: 0 };
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  const definitions = useMemo(() => (pieces ?? []).map(dtoToDefinition), [pieces]);
  const sprites = useMemo(
    () => new Map((pieces ?? []).map((piece) => [piece.id, piece.sprite])),
    [pieces],
  );
  const issues = useMemo(() => {
    if (!pieces?.length || !form.placements.length) return [];
    return validateBoardLayout(form.placements, definitions).errors;
  }, [form.placements, definitions, pieces]);

  /**
   * Paints or erases one square with the active tool, replacing any occupant.
   *
   * @param square Square index.
   * @param add Whether to paint or erase.
   */
  const paintCell = useCallback(
    (square: number, add: boolean) => {
      if (!add || !sprites.has(selection.definitionId)) {
        setForm((prev) => {
          if (!prev.placements.some((placement) => placement.square === square)) return prev;
          return {
            ...prev,
            placements: prev.placements.filter((placement) => placement.square !== square),
          };
        });
        return;
      }
      const placement: BoardPlacement = {
        definitionId: selection.definitionId,
        color: selection.color,
        square,
      };
      setForm((prev) => ({
        ...prev,
        placements: [
          ...prev.placements.filter((existing) => existing.square !== square),
          placement,
        ],
      }));
    },
    [selection, sprites],
  );

  /**
   * Saves the layout and revalidates the layout list.
   *
   * @param event Form submit event.
   */
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError(null);
    const slug = form.name.toLowerCase().replace(/\s+/g, '-');
    try {
      const result = await executeMutation<{ id: number }>('boards/save', { ...form, slug });
      setForm((prev) => ({ ...prev, id: result.id }));
      revalidatePageData([makeCacheKey('boards', {})]);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('action-failed'));
    }
  };

  return (
    <Form id="board-form" className={styles.form} onSubmit={handleSave}>
      <div className={styles.field_row}>
        <FormField name="name">
          <FormLabel>{t('board-name')}</FormLabel>
          <FormItem>
            <Input
              value={form.name}
              placeholder={t('board-name-placeholder')}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: event.currentTarget.value })
              }
            />
          </FormItem>
        </FormField>
        <FormField name="description">
          <FormLabel>{t('board-description')}</FormLabel>
          <FormItem>
            <Input
              value={form.description ?? ''}
              placeholder={t('board-description-placeholder')}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, description: event.currentTarget.value || null })
              }
            />
          </FormItem>
        </FormField>
      </div>
      <PiecePalette
        definitions={pieces ?? []}
        color={1}
        selection={selection}
        onSelect={setSelection}
      />
      <BoardGrid placements={form.placements} sprites={sprites} onPaint={paintCell} />
      <PiecePalette
        definitions={pieces ?? []}
        color={0}
        selection={selection}
        onSelect={setSelection}
      />
      {issues.length > 0 ? (
        <ul className={styles.issues}>
          {issues.map((issue) => (
            <li key={issue}>{t(`layout-error-${issue}`)}</li>
          ))}
        </ul>
      ) : null}
      {saveError ? <p className={styles.error}>{saveError}</p> : null}
    </Form>
  );
};

export default BoardForm;
