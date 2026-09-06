import {
  ArrowUpRight03Icon,
  Delete01Icon,
  Download01Icon,
  Edit03Icon,
  Hugeicons,
} from "@/components/utils/hugeicons";
import React, { useState } from "react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import RenameModal from "@/components/models/rename-item";
import DeleteModal from "@/components/models/delete-item";

export default function ViewContextMenu({
  children,
  item,
  onOpenChange,
  onOpen,
  onRename,
  onDelete,
  onDownload,
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isFolder = item?.itemType === "folder" || item?.type === "folder" || item?.item_type === "folder";
  const itemTypeLabel = isFolder ? "Folder" : "File";

  return (
    <>
      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenuTrigger render={children} />
        <ContextMenuPopup align="start">
          <ContextMenuItem onClick={() => onOpen?.(item)}>
            <Hugeicons icon={ArrowUpRight03Icon} /> Open
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setRenameOpen(true)}>
            <Hugeicons icon={Edit03Icon} /> Rename
          </ContextMenuItem>
          {!isFolder && (
            <ContextMenuItem onClick={() => onDownload?.(item)}>
              <Hugeicons icon={Download01Icon} /> Download
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Hugeicons icon={Delete01Icon} /> Delete
          </ContextMenuItem>
        </ContextMenuPopup>
      </ContextMenu>
      <RenameModal
        type={itemTypeLabel}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        name={item?.name || ""}
        onRename={(newName) => onRename?.(item, newName)}
      />
      <DeleteModal
        type={itemTypeLabel}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        name={item?.name || ""}
        onDelete={() => onDelete?.(item)}
      />
    </>
  );
}
