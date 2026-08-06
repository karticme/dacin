import React from "react";
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
import { Hugeicons } from "@/lib/utils";
import { SidebarGroupAction } from "@/components/ui/sidebar";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";

export default function AddChannelModal() {
  return (
    <Dialog>
      <Tooltip>
        <DialogTrigger
          render={<TooltipTrigger render={<SidebarGroupAction />} />}
        >
          <Hugeicons icon={Add01Icon} />
        </DialogTrigger>
        <TooltipPopup>Add Channel</TooltipPopup>
      </Tooltip>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new channel.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Channel Name</Label>
            <Input placeholder="Personal Image" />
          </div>
          <Label>
            <Switch />
            Encrypt files
          </Label>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
