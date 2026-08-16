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
import { Hugeicons } from "@/components/utils/hugeicons";
import { SidebarGroupAction } from "@/components/ui/sidebar";
import { Add01Icon, Svg02FreeIcons } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";

export default function AddChannelModal({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [encrypted, setEncrypted] = useState(true);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setOpen(false);
    setName("");
    setEncrypted(true);
    onCreate?.(trimmed, encrypted);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <DialogTrigger
          render={<TooltipTrigger render={<SidebarGroupAction />} />}
        >
          <Hugeicons icon={Add01Icon} />
        </DialogTrigger>
        <TooltipPopup>Add Channel</TooltipPopup>
      </Tooltip>
      <DialogPopup render={<form onSubmit={handleSubmit} />}>
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
          <DialogDescription className="sr-only">
            Give your new channel a name and decide if you want to encrypt its
            files.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>Channel Name</Label>
            <Input
              autoFocus
              placeholder="Personal"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={encrypted} onCheckedChange={setEncrypted} />
            Encrypt files
          </Label>
          <p className="relative text-xs text-muted-foreground leading-normal ps-13">
            Keep ON if you want to encrypt all files and data. It's will
            unreadable in Telegram also. Turn OFF if you don't want to encrypt
            and want to access in Telegram also.
            <svg
              viewBox="0 0 39 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute w-8 -top-2.5 left-2 text-muted-foreground/40"
            >
              <path
                d="M37.0895 32.0874C13.5832 36.2322 9.15551 21.0677 6.10328 3.75768M13.8978 7.95902C9.43193 6.257 6.03525 3.46874 5.27294 0.229004C6.03525 3.46874 4.2383 7.47907 1 10.9939"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </p>
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
