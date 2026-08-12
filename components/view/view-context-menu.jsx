import React, { useState } from "react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Hugeicons } from "@/components/utils/hugeicons";
import {
  ArrowUpRight03Icon,
  Delete01Icon,
  Download01Icon,
  Edit03Icon,
} from "@hugeicons/core-free-icons";
import RenameModal from "../models/rename-item";

export default function ViewContextMenu({ children, onOpenChange }) {
  const [renameOpen, setRenameOpen] = useState(false);
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
        <ContextMenuItem variant="destructive">
          <Hugeicons icon={Delete01Icon} /> Delete
        </ContextMenuItem>
      </ContextMenuPopup>
    </ContextMenu>
    <RenameModal type="File" open={renameOpen} onOpenChange={setRenameOpen} />
    </>
  );
}
