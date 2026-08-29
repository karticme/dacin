import {
  SquareLockPasswordIcon,
  SquareUnlock01Icon,
  Hugeicons,
} from "@/components/utils/hugeicons";
import React, { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

export default function RenameModal({
  type,
  open,
  onOpenChange,
  name = "",
  encrypted = false,
  onRename,
}) {
  const [value, setValue] = useState(name);

  useEffect(() => setValue(name), [name, open]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onOpenChange?.(false);
    onRename?.(trimmed);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup render={<form onSubmit={handleSubmit} />}>
        <DialogHeader>
          <DialogTitle>Rename {type}</DialogTitle>
          <DialogDescription>
            Give your {type.toLowerCase()} a new name.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>{type} Name</Label>
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
          {type === "Channel" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hugeicons
                icon={encrypted ? SquareLockPasswordIcon : SquareUnlock01Icon}
                className={cn(
                  "size-4.5",
                  encrypted ? "text-success" : "text-destructive",
                )}
              />
              {encrypted
                ? "This channel is Encrypted."
                : "This channel is not Encrypted."}
            </div>
          )}
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button type="submit" disabled={!value.trim()}>
            Rename
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
