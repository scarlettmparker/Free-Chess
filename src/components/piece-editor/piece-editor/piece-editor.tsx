import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { useTranslation } from "@sun/i18n";
import { executeMutation, makeCacheKey, revalidatePageData } from "@sun/ssr";
import { usePageData } from "@sun/ssr/react";
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
} from "@sun/components";
import {
  EllipsisVerticalOutline,
  PlusOutline,
  TrashOutline,
} from "preact-heroicons";
import PieceForm from "~/components/piece-editor/piece-form";
import { isPieceReadOnly } from "~/utils/piece-access";
import type { MedusaPieceDefinitionDto } from "~/utils/piece-types";
import type { MeQuery } from "~/generated/graphql";
import styles from "./piece-editor.module.css";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const EllipsisIcon = EllipsisVerticalOutline as IconComponent;
const PlusIcon = PlusOutline as IconComponent;
const TrashIcon = TrashOutline as IconComponent;

/**
 * Piece editor page.
 */
const PieceEditor = () => {
  const { t } = useTranslation("admin");
  const { data } = usePageData<MedusaPieceDefinitionDto[]>(
    "pieces",
    "pieces",
    {},
  );
  const { data: currentUser } = usePageData<
    MeQuery["gaiaQueries"]["me"] | null
  >("currentUser", "currentUser", {});
  const pieces = data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<MedusaPieceDefinitionDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const selected =
    pieces.find((piece: MedusaPieceDefinitionDto) => piece.id === selectedId) ??
    null;
  const selectedReadOnly = selected
    ? isPieceReadOnly(selected, currentUser?.id)
    : false;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await executeMutation("pieces/delete", { id: deleteTarget.id });
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
      revalidatePageData([makeCacheKey("pieces", {})]);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : t("action-failed"),
      );
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <div className={styles.list_panel}>
          <Card>
            <Button
              type="button"
              variant="default"
              className={styles.create_piece_button}
              onClick={() => setSelectedId(null)}
            >
              <PlusIcon width={16} height={16} />
              {t("new-piece")}
            </Button>
            <CardHeader>
              <CardTitle>{t("pieces")}</CardTitle>
            </CardHeader>
            <CardBody className={styles.list}>
              {pieces.map((piece: MedusaPieceDefinitionDto) => {
                const readOnly = isPieceReadOnly(piece, currentUser?.id);
                return (
                  <Button
                    key={piece.id}
                    variant={piece.id === selectedId ? "default" : "secondary"}
                    className={styles.piece_button}
                    onClick={() => setSelectedId(piece.id)}
                  >
                    <span className={styles.piece_name}>
                      {piece.name || t("unnamed-piece")}
                    </span>
                    {readOnly ? (
                      <Badge variant="secondary">
                        {piece.ownerName ?? t("system-piece")}
                      </Badge>
                    ) : null}
                    {readOnly ? null : (
                      <span className={styles.piece_actions}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(event: React.MouseEvent<HTMLElement>) => {
                              event.stopPropagation();
                              event.preventDefault();
                            }}
                          >
                            <EllipsisIcon
                              className={styles.menu_trigger}
                              width={16}
                              height={16}
                              aria-label={t("piece-actions")}
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(piece)}
                            >
                              <TrashIcon width={16} height={16} />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </span>
                    )}
                  </Button>
                );
              })}
            </CardBody>
          </Card>
        </div>
        <div className={styles.editor_panel}>
          <div className={styles.editor}>
            <Card>
              <CardBody>
                <ScrollArea maxHeight="85vh" className={styles.scroll_area}>
                  <PieceForm
                    key={selectedId ?? "new"}
                    piece={selected}
                    readOnly={selectedReadOnly}
                  />
                </ScrollArea>
              </CardBody>
            </Card>
            {selectedReadOnly ? null : (
              <Button
                className={styles.save_button}
                type="submit"
                form="piece-form"
              >
                {t("save")}
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
          <DialogTitle>{t("delete-piece-title")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p>
            {t("delete-piece-body", {
              name: deleteTarget?.name || t("unnamed-piece"),
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
            {t("cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            {t("delete")}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default PieceEditor;
