"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Hugeicons } from "@/lib/utils";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  DashboardSquare01Icon,
  LeftToRightListDashIcon,
} from "@hugeicons/core-free-icons";

export default function ActionBar() {
  const [layout, setLayout] = useState("grid");
  return (
    <header
      className="w-full h-10 bg-sidebar flex items-center justify-between border-b px-1 tauri-drag-region"
      data-tauri-drag-region
    >
      <div className="flex items-center">
        <Button size="icon-sm" variant="ghost">
          <Hugeicons icon={ArrowLeft01Icon} />
        </Button>
        <Button size="icon-sm" variant="ghost">
          <Hugeicons icon={ArrowRight01Icon} />
        </Button>
      </div>
      <div className="flex items-center gap-px p-0.5 rounded-[12px]">
        {[
          {
            id: "grid",
            icon: DashboardSquare01Icon,
          },
          {
            id: "list",
            icon: LeftToRightListDashIcon,
          },
        ].map((item) => (
          <Button
            key={item.id}
            size="icon-sm"
            variant={layout === item.id ? "default" : "ghost"}
            onClick={() => setLayout(item.id)}
          >
            <Hugeicons className="duration-0 transition-none" icon={item.icon} />
          </Button>
        ))}
      </div>
    </header>
  );
}
