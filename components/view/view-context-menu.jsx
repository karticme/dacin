import React from "react";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuTrigger,
} from "../ui/context-menu";

export default function ViewContextMenu({ children }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger render={children} />
      <ContextMenuPopup>
        <ContextMenuItem>Back</ContextMenuItem>
      </ContextMenuPopup>
    </ContextMenu>
  );
}
