import { useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation } from '@sun/ssr';
import {
  Button,
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
    sprite: piece?.sprite ?? { headKey: '', bodyKey: '', footKey: '' },
  }));
  const [saving, setSaving] = useState(false);

  const states = (form.moveStates.length ? form.moveStates : [{ index: 0, vectors: [] }]) as {
    index: number;
    vectors: { dx: number; dy: number; range: string; capture: string }[];
  }[];
  const current = states[0];
  const vectors = current?.vectors ?? [];

  /**
   * Toggle a move vector for the current state.
   *
   * @param dx Horizontal offset.
   * @param dy Vertical offset.
   */
  const toggleCell = (dx: number, dy: number) => {
    const typedVectors = current.vectors;
    const existing = typedVectors.find((v) => v.dx === dx && v.dy === dy);
    const newVectors = existing
      ? typedVectors.filter((v) => v.dx !== dx || v.dy !== dy)
      : [...typedVectors, { dx, dy, range: 'step', capture: 'optional' }];
    const nextStates = states.map((state, index) =>
      index === 0 ? { ...state, vectors: newVectors } : state,
    );
    setForm({ ...form, moveStates: nextStates });
  };

  /**
   * Save the piece.
   *
   * @param event Form event.
   */
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await executeMutation('pieces/save', form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form className={styles.form} onSubmit={handleSave}>
      <FormField name="name">
        <FormLabel>{t('piece-name')}</FormLabel>
        <FormItem>
          <Input
            value={form.name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, name: event.currentTarget.value })
            }
            required
          />
        </FormItem>
      </FormField>
      <FormField name="slug">
        <FormLabel>{t('piece-slug')}</FormLabel>
        <FormItem>
          <Input
            value={form.slug}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, slug: event.currentTarget.value })
            }
            required
          />
        </FormItem>
      </FormField>
      <FormField name="isKing">
        <FormLabel>{t('piece-king')}</FormLabel>
        <FormItem>
          <Checkbox
            checked={form.isKing}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, isKing: event.currentTarget.checked })
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
      <FormField name="headKey">
        <FormLabel>{t('head-key')}</FormLabel>
        <FormItem>
          <Input
            value={form.sprite.headKey}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, sprite: { ...form.sprite, headKey: event.currentTarget.value } })
            }
          />
        </FormItem>
      </FormField>
      <FormField name="bodyKey">
        <FormLabel>{t('body-key')}</FormLabel>
        <FormItem>
          <Input
            value={form.sprite.bodyKey}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, sprite: { ...form.sprite, bodyKey: event.currentTarget.value } })
            }
          />
        </FormItem>
      </FormField>
      <FormField name="footKey">
        <FormLabel>{t('foot-key')}</FormLabel>
        <FormItem>
          <Input
            value={form.sprite.footKey}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, sprite: { ...form.sprite, footKey: event.currentTarget.value } })
            }
          />
        </FormItem>
      </FormField>
      <MoveGrid vectors={vectors} onToggle={toggleCell} />
      <Button type="submit" disabled={saving}>
        {saving ? t('saving') : t('save')}
      </Button>
    </Form>
  );
};

export default PieceForm;
