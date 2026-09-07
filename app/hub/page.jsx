"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import HubSidebar from "@/components/hub-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ActionBar from "@/components/action-bar";
import { Tabs, TabsPanel } from "@/components/ui/tabs";
import CurrentPath from "@/components/current-path";
import GridView from "@/components/view/grid-view";
import ListView from "@/components/view/list-view";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Upload01Icon,
  FolderAddIcon,
  Hugeicons,
} from "@/components/utils/hugeicons";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import AddFolderModal from "@/components/models/add-folder";
import { toastManager } from "@/components/ui/toast";
import {
  restoreSession,
  setupStorage,
  listFiles,
  createFolder,
  renameItem,
  deleteItem,
} from "@/lib/telegram";
import {
  isFolderItem,
  buildFolderBreadcrumbs,
  getFolderItems,
} from "@/lib/item-utils";

export default function Layout() {
  const router = useRouter();
  const [view, setView] = useState("grid");
  const [activeChannel, setActiveChannel] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState("");
  const [history, setHistory] = useState([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Auth guard: verify session marker on mount
  useEffect(() => {
    let active = true;
    restoreSession()
      .then((res) => {
        if (active && res?.state !== "authorized") router.replace("/");
      })
      .catch(() => {
        if (active) router.replace("/");
      });
    return () => {
      active = false;
    };
  }, [router]);

  // Load items when activeChannel changes
  useEffect(() => {
    if (!activeChannel) {
      setItems([]);
      setCurrentFolderId("");
      setHistory([""]);
      setHistoryIndex(0);
      setSearchQuery("");
      return;
    }

    let active = true;
    setLoading(true);
    setCurrentFolderId("");
    setHistory([""]);
    setHistoryIndex(0);
    setSearchQuery("");

    async function loadChannelData() {
      try {
        await setupStorage(
          activeChannel.channel_id,
          activeChannel.access_hash,
          activeChannel.encrypted,
        );
        if (!active) return;
        const fileList = await listFiles(
          activeChannel.channel_id,
          activeChannel.access_hash,
          activeChannel.encrypted,
        );
        if (active) {
          setItems(fileList || []);
        }
      } catch (error) {
        if (active) {
          console.error("Failed to load files:", error);
          toastManager.add({
            type: "error",
            title: "Failed to load channel items",
            description: String(error?.message || error),
          });
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadChannelData();

    return () => {
      active = false;
    };
  }, [activeChannel]);

  // Navigation handlers
  const navigateToFolder = useCallback(
    (folderId) => {
      setCurrentFolderId(folderId);
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, folderId];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const handleGoBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentFolderId(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleGoForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentFolderId(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleBreadcrumbNavigate = useCallback(
    (folderId) => {
      if (folderId === currentFolderId) return;
      navigateToFolder(folderId);
    },
    [currentFolderId, navigateToFolder],
  );

  // Build breadcrumb list
  const breadcrumbs = useMemo(() => {
    if (!activeChannel) return [];
    return buildFolderBreadcrumbs(items, currentFolderId, activeChannel.name);
  }, [activeChannel, currentFolderId, items]);

  // Current folder name for action bar
  const currentFolderName = useMemo(() => {
    if (!currentFolderId) return activeChannel?.name || "Folder";
    const cur = items.find((i) => i.id === currentFolderId && isFolderItem(i));
    return cur?.name || "Folder";
  }, [currentFolderId, activeChannel, items]);

  // Filter items for the current folder and search
  const displayedItems = useMemo(() => {
    return getFolderItems(items, currentFolderId, searchQuery);
  }, [items, currentFolderId, searchQuery]);

  const isEmpty = displayedItems.length === 0;

  // Folder CRUD handlers
  const handleCreateFolder = async (folderName) => {
    if (!activeChannel) return;

    const promise = createFolder(
      activeChannel.channel_id,
      activeChannel.access_hash,
      folderName,
      currentFolderId,
      activeChannel.encrypted,
    ).then((created) => {
      setItems((prev) => [created, ...prev]);
      return created;
    });

    toastManager.promise(promise, {
      loading: {
        title: "Creating folder",
        description: `Adding "${folderName}" to current folder.`,
        iconDirection: "up",
      },
      success: (folder) => ({
        title: "Folder created",
        description: `Folder "${folder.name}" created successfully.`,
      }),
      error: (error) => ({
        title: "Failed to create folder",
        description: String(error?.message || error),
      }),
    });

    return promise;
  };

  const handleRenameItem = async (item, newName) => {
    if (!activeChannel) return;

    const messageId = item.messageId || item.message_id;
    const promise = renameItem(
      activeChannel.channel_id,
      activeChannel.access_hash,
      messageId,
      newName,
      activeChannel.encrypted,
    ).then((renamed) => {
      setItems((prev) =>
        prev.map((i) =>
          (i.messageId || i.message_id) === messageId
            ? { ...i, ...renamed }
            : i,
        ),
      );
      return renamed;
    });

    toastManager.promise(promise, {
      loading: {
        title: "Renaming item",
        description: `Updating "${item.name}" -> "${newName}"`,
        iconDirection: "right",
      },
      success: (renamed) => ({
        title: "Item renamed",
        description: `"${item.name}" renamed to "${renamed.name}".`,
      }),
      error: (error) => ({
        title: "Failed to rename item",
        description: String(error?.message || error),
      }),
    });

    return promise;
  };

  const handleDeleteItem = async (item) => {
    if (!activeChannel) return;

    const messageId = item.messageId || item.message_id;
    const promise = deleteItem(
      activeChannel.channel_id,
      activeChannel.access_hash,
      messageId,
    ).then(() => {
      setItems((prev) =>
        prev.filter((i) => (i.messageId || i.message_id) !== messageId),
      );
    });

    const isFolder = isFolderItem(item);

    toastManager.promise(promise, {
      loading: {
        title: `Deleting ${isFolder ? "folder" : "file"}`,
        description: `Removing "${item.name}" from channel.`,
        iconDirection: "down",
        iconClass: "[&_svg]:text-destructive",
      },
      success: () => ({
        title: `"${item.name}" deleted`,
        iconClass: "[&_svg]:text-destructive",
      }),
      error: (error) => ({
        title: "Failed to delete item",
        description: String(error?.message || error),
      }),
    });

    return promise;
  };

  const handleOpenItem = (item) => {
    if (isFolderItem(item)) {
      navigateToFolder(item.id);
    }
  };

  return (
    <SidebarProvider>
      <HubSidebar
        activeChannel={activeChannel}
        activeChannelId={activeChannel?.channel_id}
        onChannelChange={setActiveChannel}
        onCreateFolder={handleCreateFolder}
        channelLoading={loading}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
      <Tabs className="flex-1" value={view} onValueChange={setView}>
        <SidebarInset>
          <ActionBar
            disabled={!activeChannel || loading || isEmpty}
            currentFolderName={currentFolderName}
            canGoBack={historyIndex > 0}
            canGoForward={historyIndex < history.length - 1}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
          />
          {loading ? (
            <div className="h-[calc(100vh-80px)] flex items-center justify-center gap-3 text-foreground">
              <Loader className="size-5" />
            </div>
          ) : !activeChannel ? (
            <Empty className="h-[calc(100vh-80px)]">
              <EmptyHeader>
                <EmptyTitle>No Channel Selected</EmptyTitle>
                <EmptyDescription>
                  Select a channel from the sidebar to view files and folders.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : isEmpty ? (
            <Empty className="h-[calc(100vh-80px)]">
              <EmptyHeader>
                <img
                  src="https://i.giphy.com/Az1CJ2MEjmsp2.webp"
                  alt="Empty folder"
                  className="h-28 rounded-sm mb-6"
                  draggable={false}
                />
                <EmptyTitle>
                  {searchQuery ? "No Results Found" : "Folder is Empty"}
                </EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? `No items matching "${searchQuery}".`
                    : "No files or folders yet."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-3">
                  <Button>
                    <Hugeicons icon={Upload01Icon} />
                    Upload File
                  </Button>
                  <AddFolderModal onCreate={handleCreateFolder}>
                    <Button variant="outline">
                      <Hugeicons icon={FolderAddIcon} />
                      Add Folder
                    </Button>
                  </AddFolderModal>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <main className="h-[calc(100vh-80px)] overflow-auto">
              <TabsPanel value="grid" className="overflow-y-auto">
                <GridView
                  data={displayedItems}
                  onOpen={handleOpenItem}
                  onRename={handleRenameItem}
                  onDelete={handleDeleteItem}
                />
              </TabsPanel>
              <TabsPanel value="list">
                <ListView
                  data={displayedItems}
                  onOpen={handleOpenItem}
                  onRename={handleRenameItem}
                  onDelete={handleDeleteItem}
                />
              </TabsPanel>
            </main>
          )}
          <CurrentPath
            breadcrumbs={breadcrumbs}
            onNavigate={handleBreadcrumbNavigate}
          />
        </SidebarInset>
      </Tabs>
    </SidebarProvider>
  );
}
