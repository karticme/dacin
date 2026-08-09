import { useState } from "react";
import Truncated from "@/components/utils/truncated";
import ViewContextMenu from "@/components/view/view-context-menu";

export default function GridView({ data }) {
  const [selectedItem, setSelectedItem] = useState(null);
  return (
    <div className="grid grid-cols-4 gap-4 p-4 py-6">
      {data.map((item) => (
        <ViewContextMenu
          key={item.id}
          onOpenChange={(open) => open && setSelectedItem(item)}
        >
          <div
            className="group/item flex flex-col items-center gap-2 transition-colors ease-in-out"
            data-selected={selectedItem === item}
            onClick={() => setSelectedItem(item)}
          >
            <div className="w-3/5 aspect-square p-1 rounded-sm group-data-selected/item:bg-muted group-data-pressed/item:bg-muted">
              <img
                src={item.thumbnail}
                alt={item.name}
                className="drop-shadow-sm/8"
                draggable={false}
              />
            </div>
            <Truncated
              value={item.name}
              lines={2}
              className="text-muted-foreground text-[13px] text-center group-data-selected/item:text-info group-data-pressed/item:text-info"
            />
          </div>
        </ViewContextMenu>
      ))}
    </div>
  );
}
