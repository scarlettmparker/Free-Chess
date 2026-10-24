import { useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { usePageData } from '@sun/ssr/react';
import { Button, Card, CardBody, CardHeader, CardTitle, ScrollArea } from '@sun/components';
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
  const { t } = useTranslation('admin');
  const { data } = usePageData<{ pieces: PieceDefinitionDto[] }>('pieces', 'pieces', {});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected =
    data?.pieces?.find((piece: PieceDefinitionDto) => piece.id === selectedId) ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <div className={styles.list_panel}>
          <Card>
            <CardHeader>
              <CardTitle>{t('pieces')}</CardTitle>
            </CardHeader>
            <CardBody className={styles.list}>
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
                {t('new-piece')}
              </Button>
            </CardBody>
          </Card>
        </div>
        <div className={styles.editor_panel}>
          <div className={styles.editor}>
            <Card>
              <CardBody>
                <ScrollArea maxHeight="70vh" className={styles.scroll_area}>
                  <PieceForm key={selectedId ?? 'new'} piece={selected} />
                </ScrollArea>
              </CardBody>
            </Card>
            <Button className={styles.save_button} type="submit" form="piece-form">
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PieceEditor;
