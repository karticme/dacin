"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  DashboardSquare01Icon,
  FilterMailSquareIcon,
  LeftToRightListDashIcon,
  Hugeicons,
} from "@/components/utils/hugeicons";
import React from "react";
import { Button } from "@/components/ui/button";

import { TabsList, TabsTab } from "@/components/ui/tabs";
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
  { value: "size", label: "Size" },
  { value: "created", label: "Created" },
];

export default function ActionBar({
  disabled,
  currentFolderName = "Folder",
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  sortOrder: controlledSortOrder,
  onSortChange,
}) {
  const [internalSortOrder, setInternalSortOrder] = React.useState("created");
  const sortOrder = controlledSortOrder ?? internalSortOrder;
  const setSortOrder = onSortChange ?? setInternalSortOrder;

  return (
    <header
      className="w-full h-10 bg-sidebar flex items-center justify-between border-b px-2 tauri-drag-region select-none"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger render={<div className="space-x-0.5" />}>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!canGoBack}
              onClick={onGoBack}
            >
              <Hugeicons icon={ArrowLeft01Icon} />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={!canGoForward}
              onClick={onGoForward}
            >
              <Hugeicons icon={ArrowRight01Icon} />
            </Button>
          </TooltipTrigger>
          <TooltipPopup>See folders you viewed previously</TooltipPopup>
        </Tooltip>
        <h1 className="text-sm font-medium truncate max-w-64">{currentFolderName}</h1>
      </div>
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Select
            items={SORT_OPTIONS}
            value={sortOrder}
            onValueChange={setSortOrder}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <SelectTrigger
                    size="sm"
                    className="min-w-24 [&>span]:data-[slot=select-icon]:hidden"
                    disabled={disabled}
                  />
                }
              >
                <Hugeicons icon={FilterMailSquareIcon} />
                <SelectValue />
              </TooltipTrigger>
              <TooltipPopup>Sort A -&gt; Z</TooltipPopup>
            </Tooltip>
            <SelectPopup>
              <SelectGroup>
                <SelectGroupLabel>Sort by</SelectGroupLabel>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectPopup>
          </Select>
          <TabsList>
            {[
              {
                id: "grid",
                label: "Grid",
                icon: DashboardSquare01Icon,
              },
              {
                id: "list",
                label: "List",
                icon: LeftToRightListDashIcon,
              },
            ].map((tab) => (
              <Tooltip key={tab.id}>
                <TooltipTrigger
                  render={
                    <TabsTab
                      className="size-6!"
                      value={tab.id}
                      disabled={disabled}
                    />
                  }
                >
                  <Hugeicons icon={tab.icon} />
                </TooltipTrigger>
                <TooltipPopup>View as {tab.label}</TooltipPopup>
              </Tooltip>
            ))}
          </TabsList>
        </TooltipProvider>
      </div>
    </header>
  );
}
