import { useState } from 'react';
import { usePageData } from '@sun/ssr/react';
import { Card, CardBody, CardHeader, CardTitle, Button } from '@sun/components';
import RoleCheck from '~/utils/role-check';
import PieceForm from '~/components/piece-editor/piece-form';
import type { PieceDefinitionDto } from '~/utils/piece-types';
import styles from './piece-editor.module.css';

/**
 * Piece editor page.
 */
const PieceEditor = () => {
  return (
    <RoleCheck roles={['admin']} match="any">
      <PieceEditorInner />
    </RoleCheck>
  );
};

/**
 * Inner data component.
 */
const PieceEditorInner = () => {
  const { data } = usePageData<{ pieces: PieceDefinitionDto[] }>('pieces', 'pieces', {});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = data?.pieces?.find((piece) => piece.id === selectedId) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pieces</CardTitle>
      </CardHeader>
      <CardBody>
        <div className={styles.layout}>
          <aside className={styles.list}>
            {(data?.pieces ?? []).map((piece: PieceDefinitionDto) => (
              <Button
                key={piece.id}
                variant={piece.id === selectedId ? 'default' : 'secondary'}
                onClick={() => setSelectedId(piece.id)}
              >
                {piece.name}
              </Button>
            ))}
            <Button variant="secondary" onClick={() => setSelectedId(-1)}>
              New piece
            </Button>
          </aside>
          <section className={styles.editor}>
            <PieceForm key={selectedId ?? 'new'} piece={selected} />
          </section>
        </div>
      </CardBody>
    </Card>
  );
};

export default PieceEditor;
