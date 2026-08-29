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

export default function ViewContextMenu({ children, onOpenChange }) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <>
      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenuTrigger render={children} />
        <ContextMenuPopup align="start">
          <ContextMenuItem>
            <Hugeicons icon={ArrowUpRight03Icon} /> Open
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setRenameOpen(true)}>
            <Hugeicons icon={Edit03Icon} /> Rename
          </ContextMenuItem>
          <ContextMenuItem>
            <Hugeicons icon={Download01Icon} /> Download
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Hugeicons icon={Delete01Icon} /> Delete
          </ContextMenuItem>
        </ContextMenuPopup>
      </ContextMenu>
      <RenameModal type="File" open={renameOpen} onOpenChange={setRenameOpen} />
      <DeleteModal type="File" open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
