import { useState } from "react";
import Truncated from "@/components/utils/truncated";
import ViewContextMenu from "@/components/view/view-context-menu";

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function ListView({
  data = [],
  onOpen,
  onRename,
  onDelete,
  onDownload,
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="flex flex-col p-1.5">
      <div className="sticky top-0 h-8 bg-background/50 grid grid-cols-[20px_repeat(13,minmax(0,1fr))] items-center gap-3 px-3.5 -mx-1.5 -mt-1.5 backdrop-blur border-b text-xs text-muted-foreground z-10 select-none">
        <div className="size-5" />
        <div className="col-span-5 lg:col-span-6">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-4 lg:col-span-3">Date Created</div>
      </div>
      {data.map((item) => {
        const isFolder =
          item.itemType === "folder" ||
          item.type === "folder" ||
          item.item_type === "folder";
        const thumbnail =
          item.thumbnail ||
          (isFolder ? "/item-thumbnails/folder.png" : "/item-thumbnails/document.png");
        const formattedSize = isFolder ? "-" : formatFileSize(item.size);
        const itemTypeDisplay = isFolder
          ? "Folder"
          : item.mimeType || item.mime_type || "File";
        const formattedDate = formatDate(item.createdAt || item.created_at);

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
              className="group/item grid grid-cols-[20px_repeat(13,minmax(0,1fr))] items-center gap-3 px-2 py-1.5 text-[13px] rounded-sm transition-colors ease-in-out duration-600 data-selected:bg-muted data-pressed:bg-muted nth-[2]:mt-1.5 cursor-pointer select-none"
              data-selected={selectedItem?.id === item.id}
              onClick={() => setSelectedItem(item)}
              onDoubleClick={() => onOpen?.(item)}
            >
              <img
                src={thumbnail}
                alt={item.name}
                className="size-5 drop-shadow-sm/8 object-contain"
                draggable={false}
              />
              <Truncated
                value={item.name}
                className="col-span-5 lg:col-span-6 group-data-selected/item:text-info group-data-pressed/item:text-info break-all"
              />
              <div className="col-span-2 text-muted-foreground">{formattedSize}</div>
              <div className="col-span-2 text-muted-foreground capitalize truncate">
                {itemTypeDisplay}
              </div>
              <div className="col-span-4 lg:col-span-3 text-muted-foreground truncate">
                {formattedDate}
              </div>
            </div>
          </ViewContextMenu>
        );
      })}
    </div>
  );
}
