import React from "react";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Truncated from "@/components/utils/truncated";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Hugeicons,
} from "@/components/utils/hugeicons";
import { Progress } from "@/components/ui/progress";

export default function UploadStateSheet({ children }) {
  return (
    <Sheet>
      <SheetTrigger nativeButton={false} render={children} />
      <SheetPopup showCloseButton={false}>
        <SheetHeader>
          <SheetTitle className="shimmer">Uploading</SheetTitle>
          <SheetDescription>Your files are being uploaded.</SheetDescription>
        </SheetHeader>
        <SheetPanel className="flex flex-col gap-6 py-4!">
          <FileProgress value={50} />
          <FileProgress value={32} />
          <FileProgress value={72} />
          <FileProgress value={37} />
          <FileProgress value={82} />
          <FileUploaded />
          <FileUploaded />
        </SheetPanel>
        <SheetFooter variant="bare">
          <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}

function FileProgress({ value }) {
  return (
    <div className="w-full flex items-center gap-3">
      <img
        src="/item-thumbnails/clean_file.png"
        alt="File Icon"
        className="size-12"
      />
      <div className="grid gap-2">
        <Truncated
          value="audioSprite a online-video-cutter cut_your_video_now.mp3"
          className="text-sm shimmer"
        />
        <div className="space-y-2">
          <Progress value={value} />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <p>1MB / 10MB</p>
            <p>{value}%</p>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" className="text-destructive">
        <Hugeicons icon={Cancel01Icon} />
      </Button>
    </div>
  );
}

function FileUploaded() {
  return (
    <div className="w-full flex items-center gap-3">
      <img
        src="/item-thumbnails/clean_file.png"
        alt="File Icon"
        className="size-12"
      />
      <div className="grid gap-1">
        <Truncated
          value="audioSprite a online-video-cutter cut_your_video_now.mp3"
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground tabular-nums">
          <span className="text-success">Uploaded</span> · 10MB
        </p>
      </div>
      <div className="shrink-0 size-8 sm:size-7 flex items-center justify-center [&_svg]:size-4 [&_svg]:text-success">
        <Hugeicons icon={CheckmarkCircle02Icon} />
      </div>
    </div>
  );
}
