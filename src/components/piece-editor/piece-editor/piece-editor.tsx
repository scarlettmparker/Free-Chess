import { useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation, makeCacheKey, revalidatePageData } from '@sun/ssr';
import { usePageData } from '@sun/ssr/react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ScrollArea,
} from '@sun/components';
import { EllipsisVerticalOutline, TrashOutline } from 'preact-heroicons';
import PieceForm from '~/components/piece-editor/piece-form';
import type { PieceDefinitionDto } from '~/utils/piece-types';
import styles from './piece-editor.module.css';

/**
 * Piece editor page.
 */
const PieceEditor = () => {
  const { t } = useTranslation('admin');
  const { data } = usePageData<PieceDefinitionDto[]>('pieces', 'pieces', {});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PieceDefinitionDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const selected = data?.find((piece: PieceDefinitionDto) => piece.id === selectedId) ?? null;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await executeMutation('pieces/delete', { id: deleteTarget.id });
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
      revalidatePageData([makeCacheKey('pieces', {})]);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : t('action-failed'));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <div className={styles.list_panel}>
          <Card>
            <CardHeader>
              <CardTitle>{t('pieces')}</CardTitle>
            </CardHeader>
            <CardBody className={styles.list}>
              {(data ?? []).map((piece: PieceDefinitionDto) => (
                <Button
                  key={piece.id}
                  variant={piece.id === selectedId ? 'default' : 'secondary'}
                  className={styles.piece_button}
                  disabled={piece.isSystem}
                  onClick={() => setSelectedId(piece.id)}
                >
                  <span className={styles.piece_name}>{piece.name || t('unnamed-piece')}</span>
                  {piece.isSystem ? null : (
                    <span className={styles.piece_actions}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                            event.preventDefault();
                          }}
                        >
                          <EllipsisVerticalOutline width={16} height={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(piece)}
                          >
                            <TrashOutline width={16} height={16} />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  )}
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
                <ScrollArea maxHeight="85vh" className={styles.scroll_area}>
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
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('delete-piece-title')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p>
            {t('delete-piece-body', {
              name: deleteTarget?.name || t('unnamed-piece'),
            })}
          </p>
          {deleteError ? <p className={styles.error}>{deleteError}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setDeleteTarget(null);
              setDeleteError(null);
            }}
          >
            {t('cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            {t('delete')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default PieceEditor;
