import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { isMac } from "@/lib/utils";

export const MOD = isMac ? "\u2318" : "Ctrl+";

export default function ShortcutsModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Shortcuts</DialogTitle>
          <DialogDescription>
            Keyboard shortcuts for navigating Dacin.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-3">
          {[
            {
              type: "category",
              label: "Navigation",
            },
            {
              type: "action",
              key: ["↑", "↓", "←", "→"],
              label: "Move selection",
            },
            {
              type: "action",
              key: ["↵"],
              label: "Open item",
            },
            {
              type: "action",
              key: ["Esc"],
              label: "Deselect",
            },
            {
              type: "action",
              key: [`${isMac ? "\u2303\u21E7/" : "Ctrl+Shift+/"}`],
              label: "Show shortcuts",
            },
            {
              type: "category",
              label: "Actions",
            },
            {
              type: "action",
              key: [`${MOD}R`],
              label: "Rename selected",
            },
            {
              type: "action",
              key: [`${MOD}D`],
              label: "Download selected",
            },
            {
              type: "action",
              key: [`${MOD}⌫`],
              label: "Delete selected",
            },
            {
              type: "category",
              label: "Search",
            },
            {
              type: "action",
              key: [`${MOD}K`],
              label: "Focus search",
            },
            {
              type: "action",
              key: ["Esc"],
              label: "Clear search",
            },

            {
              type: "category",
              label: "Theme",
            },
            {
              type: "action",
              key: [`D`],
              label: "Toggle Theme",
            },
          ].map((item) => {
            if (item.type === "category") {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2 not-first:mt-4 tracking-wider uppercase"
                >
                  {item.label} <hr className="flex-1 bg-border" />
                </div>
              );
            } else {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{item.label}</span>
                  <span className="flex items-center gap-1">
                    {item.key.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </div>
              );
            }
          })}
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Close</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
