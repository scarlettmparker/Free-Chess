import { useEffect } from 'react';
import { useTranslation } from '@sun/i18n';
import { usePageData } from '@sun/ssr/react';
import { Button, ScrollArea } from '@sun/components';
import BoardPreview from '~/components/admin/board-preview';
import type { BoardLayoutDto } from '~/utils/board-layout-types';
import type { MedusaPieceDefinitionDto } from '~/utils/piece-types';
import styles from './board-picker-content.module.css';

type BoardPickerContentProps = {
  /**
   * Selected layout id.
   */
  selectedId: string | null;
  /**
   * Selects a layout.
   */
  onSelect: (layout: BoardLayoutDto) => void;
  /**
   * Translation namespace for empty and unnamed layout labels.
   */
  namespace?: 'admin' | 'lobby';
};

/**
 * Layout list and preview with data loaded inside suspense.
 */
const BoardPickerContent = (props: BoardPickerContentProps) => {
  const { selectedId, onSelect, namespace = 'admin' } = props;
  const { t: tAdmin } = useTranslation('admin');
  const { t: tLobby } = useTranslation('lobby');
  const t = namespace === 'lobby' ? tLobby : tAdmin;
  const { data: boards } = usePageData<BoardLayoutDto[]>('boards', 'boards', {});
  const { data: pieces } = usePageData<MedusaPieceDefinitionDto[]>('pieces', 'pieces', {});
  const sprites = new Map(
    (pieces ?? []).flatMap((piece) => (piece.sprite ? [[piece.id, piece.sprite] as const] : [])),
  );
  const selected = (boards ?? []).find((layout) => layout.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId !== null || !boards?.length) return;
    const standard = boards.find((layout) => layout.slug === 'standard') ?? boards[0];
    if (standard) onSelect(standard);
  }, [selectedId, boards, onSelect]);

  return (
    <div className={styles.split}>
      <ScrollArea maxHeight="20rem" className={styles.list_scroll}>
        <div className={styles.list}>
          {!(boards ?? []).length ? (
            <p className={styles.empty}>{t('no-layouts')}</p>
          ) : (
            (boards ?? []).map((layout) => (
              <Button
                key={layout.id}
                type="button"
                variant={layout.id === selectedId ? 'default' : 'secondary'}
                className={styles.layout_button}
                onClick={() => onSelect(layout)}
              >
                <span className={styles.layout_name}>{layout.name || t('unnamed-layout')}</span>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
      <div className={styles.preview_panel}>
        {selected ? <BoardPreview layout={selected} sprites={sprites} /> : null}
      </div>
    </div>
  );
};

export default BoardPickerContent;
