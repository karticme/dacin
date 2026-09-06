import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AddFolderModal({ children, onCreate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setOpen(false);
    setName("");
    onCreate?.(trimmed);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <DialogTrigger render={children} />
      <DialogPopup render={<form onSubmit={handleSubmit} />}>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription className="sr-only">
            Give your new folder a name.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>Folder Name</Label>
            <Input
              autoFocus
              placeholder="Personal"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button type="submit" disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
