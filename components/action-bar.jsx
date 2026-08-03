"use client";

import React from "react";
import { Button } from "./ui/button";
import { Hugeicons } from "@/lib/utils";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  DashboardSquare01Icon,
  FilterMailSquareIcon,
  LeftToRightListDashIcon,
} from "@hugeicons/core-free-icons";
import { TabsList, TabsTab } from "./ui/tabs";
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
  { value: "size", label: "Size" },
  { value: "created", label: "Created" },
];

export default function ActionBar() {
  const [sortOrder, setSortOrder] = React.useState("created");

  return (
    <header
      className="w-full h-10 bg-sidebar flex items-center justify-between border-b px-1.5 tauri-drag-region"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-2">
        <div className="space-x-1">
          <Button size="icon-sm" variant="ghost">
            <Hugeicons icon={ArrowLeft01Icon} />
          </Button>
          <Button size="icon-sm" variant="ghost">
            <Hugeicons icon={ArrowRight01Icon} />
          </Button>
        </div>
        <h1 className="text-sm">Folder</h1>
      </div>
      <div className="flex items-center gap-1">
        <Select
          items={SORT_OPTIONS}
          value={sortOrder}
          onValueChange={setSortOrder}
        >
          <SelectTrigger
            size="sm"
            className="min-w-24 [&>span]:data-[slot=select-icon]:hidden"
          >
            <Hugeicons icon={FilterMailSquareIcon} />
            <SelectValue />
          </SelectTrigger>
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
          <TabsTab className="size-6!" value="grid">
            <Hugeicons icon={DashboardSquare01Icon} />
          </TabsTab>
          <TabsTab className="size-6!" value="list">
            <Hugeicons icon={LeftToRightListDashIcon} />
          </TabsTab>
        </TabsList>
      </div>
    </header>
  );
}
