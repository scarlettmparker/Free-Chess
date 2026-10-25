import { useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from '@sun/i18n';
import { executeMutation, makeCacheKey, revalidatePageData } from '@sun/ssr';
import { usePageData } from '@sun/ssr/react';
import {
  Badge,
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
import BoardForm from '~/components/board-editor/board-form';
import type { BoardLayoutDto } from '~/utils/board-layout-types';
import styles from './board-editor.module.css';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const EllipsisIcon = EllipsisVerticalOutline as IconComponent;
const TrashIcon = TrashOutline as IconComponent;

/**
 * Board layout editor page.
 */
const BoardEditor = () => {
  const { t } = useTranslation('admin');
  const { data } = usePageData<BoardLayoutDto[]>('boards', 'boards', {});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BoardLayoutDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const selected = data?.find((layout: BoardLayoutDto) => layout.id === selectedId) ?? null;

  /**
   * Deletes the layout pending in the confirmation dialog.
   */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await executeMutation('boards/delete', { id: deleteTarget.id });
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
      revalidatePageData([makeCacheKey('boards', {})]);
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
              <CardTitle>{t('boards')}</CardTitle>
            </CardHeader>
            <CardBody className={styles.list}>
              {(data ?? []).map((layout: BoardLayoutDto) => (
                <Button
                  key={layout.id}
                  variant={layout.id === selectedId ? 'default' : 'secondary'}
                  className={styles.layout_button}
                  onClick={() => setSelectedId(layout.id)}
                >
                  <span className={styles.layout_name}>{layout.name || t('unnamed-layout')}</span>
                  {layout.isSystem ? (
                    <Badge variant="secondary">{t('system-board')}</Badge>
                  ) : null}
                  {layout.isSystem ? null : (
                    <span className={styles.layout_actions}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                            event.preventDefault();
                          }}
                        >
                          <EllipsisIcon
                            className={styles.menu_trigger}
                            width={16}
                            height={16}
                            aria-label={t('board-actions')}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(layout)}
                          >
                            <TrashIcon width={16} height={16} />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  )}
                </Button>
              ))}
              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                {t('new-layout')}
              </Button>
            </CardBody>
          </Card>
        </div>
        <div className={styles.editor_panel}>
          <div className={styles.editor}>
            <Card>
              <CardBody>
                <ScrollArea maxHeight="85vh" className={styles.scroll_area}>
                  <BoardForm
                    key={selectedId ?? 'new'}
                    layout={selected}
                    readOnly={Boolean(selected?.isSystem)}
                  />
                </ScrollArea>
              </CardBody>
            </Card>
            {selected?.isSystem ? null : (
              <Button className={styles.save_button} type="submit" form="board-form">
                {t('save')}
              </Button>
            )}
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
          <DialogTitle>{t('delete-layout-title')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p>
            {t('delete-layout-body', {
              name: deleteTarget?.name || t('unnamed-layout'),
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

export default BoardEditor;
