import { useState } from "react";
import Truncated from "@/components/utils/truncated";
import ViewContextMenu from "@/components/view/view-context-menu";

export default function ListView({ data }) {
  const [selectedItem, setSelectedItem] = useState(null);
  return (
    <div className="flex flex-col p-1.5">
      <div className="sticky top-0 h-8 bg-background/50 grid grid-cols-[20px_repeat(11,minmax(0,1fr))] items-center gap-3 px-3.5 -mx-1.5 -mt-1.5 backdrop-blur border-b text-xs text-muted-foreground z-10">
        <div className="size-5" />
        <div className="col-span-5 lg:col-span-6">Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-4 lg:col-span-3">Date Created</div>
      </div>
      {data.map((item) => (
        <ViewContextMenu
          key={item.id}
          onOpenChange={(open) => open && setSelectedItem(item)}
        >
          <div
            className="group/item grid grid-cols-[20px_repeat(11,minmax(0,1fr))] items-center gap-3 px-2 py-1.5 text-[13px] rounded-sm transition-colors ease-in-out data-selected:bg-muted data-pressed:bg-muted nth-[2]:mt-1.5"
            data-selected={selectedItem === item}
            onClick={() => setSelectedItem(item)}
          >
            <img
              src={item.thumbnail}
              alt={item.name}
              className="size-5 drop-shadow-sm/8"
              draggable={false}
            />
            <Truncated
              value={item.name}
              className="col-span-5 lg:col-span-6 group-data-selected/item:text-info group-data-pressed/item:text-info"
            />
            <div className="col-span-2 text-muted-foreground">{item.type}</div>
            <div className="col-span-4 lg:col-span-3 text-muted-foreground">
              {item.date}
            </div>
          </div>
        </ViewContextMenu>
      ))}
    </div>
  );
}
