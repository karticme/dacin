import { useState } from "react";
import Truncated from "@/components/utils/truncated";
import ViewContextMenu from "@/components/view/view-context-menu";
import { formatFileSize } from "@/lib/formats";
import { isFolderItem, getItemThumbnail } from "@/lib/item-utils";

export default function GridView({
  data = [],
  onOpen,
  onRename,
  onDelete,
  onDownload,
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-4 py-6">
      {data.map((item) => {
        const isFolder = isFolderItem(item);
        const thumbnail = getItemThumbnail(item);
        const formattedSize = isFolder ? "" : formatFileSize(item.size);

        return (
          <ViewContextMenu
            key={item.id}
            item={item}
            onOpen={onOpen}
            onRename={onRename}
            onDelete={onDelete}
            onDownload={onDownload}
            onOpenChange={(open) => open && setSelectedItem(item)}
          >
            <div
              className="group/item flex flex-col items-center gap-2 transition-colors ease-in-out cursor-pointer select-none"
              data-selected={selectedItem?.id === item.id}
              onClick={() => setSelectedItem(item)}
              onDoubleClick={() => onOpen?.(item)}
            >
              <div className="w-3/5 aspect-square p-1 rounded-sm group-data-selected/item:bg-muted group-data-pressed/item:bg-muted overflow-hidden transition-colors ease-in-out duration-600 flex items-center justify-center">
                <img
                  src={thumbnail}
                  alt={item.name}
                  className="drop-shadow-sm/8 select-none max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>
              <div className="relative flex flex-col pb-2 w-full px-1">
                <Truncated
                  value={item.name}
                  lines={2}
                  className="text-muted-foreground text-[13px] text-center group-data-selected/item:text-info group-data-pressed/item:text-info transition-colors ease-in-out break-all"
                />
                {formattedSize && (
                  <div className="absolute hidden group-data-selected/item:block group-data-pressed/item:hidden -bottom-1 left-1/2 -translate-x-1/2 text-muted-foreground text-[10px] leading-none text-center text-nowrap transition-[display] ease-in-out">
                    {formattedSize}
                  </div>
                )}
              </div>
            </div>
          </ViewContextMenu>
        );
      })}
    </div>
  );
}
