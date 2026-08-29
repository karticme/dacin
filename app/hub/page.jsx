"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HubSidebar from "@/components/hub-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isAuthorized } from "@/lib/telegram";
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
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Upload01Icon,
  FolderAddIcon,
  ZzzIcon,
  Hugeicons,
} from "@/components/utils/hugeicons";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const router = useRouter();
  const [view, setView] = useState("grid");
  const empty = !FILES || FILES.length === 0;
  const [activeChannel, setActiveChannel] = useState(null);

  useEffect(() => {
    let active = true;

    async function guardRoute() {
      try {
        const authenticated = await isAuthorized();
        if (!active) return;
        if (!authenticated) {
          router.replace("/");
          return;
        }
      } catch {
        if (active) router.replace("/");
      }
    }

    guardRoute();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <SidebarProvider>
      <HubSidebar
        activeChannelId={activeChannel?.channel_id}
        onChannelChange={setActiveChannel}
      />
      <Tabs className="flex-1" value={view} onValueChange={setView}>
        <SidebarInset>
          <ActionBar disabled={empty} />
          {empty ? (
            <Empty className="h-[calc(100vh-80px)]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Hugeicons icon={ZzzIcon} />
                </EmptyMedia>
                <EmptyTitle>Channel is Empty</EmptyTitle>
                <EmptyDescription>
                  Channel has no file or folder.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-3">
                  <Button>
                    <Hugeicons icon={Upload01Icon} />
                    Upload File
                  </Button>
                  <Button variant="outline">
                    <Hugeicons icon={FolderAddIcon} />
                    Add Folder
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <main className="h-[calc(100vh-80px)] overflow-auto">
              <TabsPanel value="grid" className="overflow-y-auto">
                <GridView data={FILES} />
              </TabsPanel>
              <TabsPanel value="list">
                <ListView data={FILES} />
              </TabsPanel>
            </main>
          )}
          <CurrentPath />
        </SidebarInset>
      </Tabs>
    </SidebarProvider>
  );
}

const FILES = [
  {
    id: 1,
    name: "Clothing",
    type: "Folder",
    thumbnail: "/files/folder.png",
    date: "12 Aug 2026 at 10:00 AM",
  },
  {
    id: 2,
    name: "Documents.pdf",
    type: "PDF",
    thumbnail: "/files/pdf.png",
    size: "1.2 MB",
    date: "05 Aug 2026 at 02:30 PM",
  },
  {
    id: 3,
    name: "Casual Portrait.png",
    type: "Image",
    thumbnail: "/files/image.png",
    size: "2.5 MB",
    date: "15 Aug 2026 at 03:45 PM",
  },
  {
    id: 4,
    name: "audioSprite a online-video-cutter cut_your_video_now.mp3",
    type: "Audio",
    thumbnail: "/files/music_file.png",
    size: "5.0 MB",
    date: "20 Aug 2026 at 04:15 PM",
  },
  {
    id: 5,
    name: "Documents.docx",
    type: "Document",
    thumbnail: "/files/word_file.png",
    size: "1.5 MB",
    date: "25 Aug 2026 at 05:30 PM",
  },
  {
    id: 10,
    name: "Clothing",
    type: "Folder",
    thumbnail: "/files/folder.png",
    date: "12 Aug 2026 at 10:00 AM",
  },
  {
    id: 20,
    name: "Documents.pdf",
    type: "PDF",
    thumbnail: "/files/pdf.png",
    size: "1.2 MB",
    date: "05 Aug 2026 at 02:30 PM",
  },
  {
    id: 30,
    name: "Casual Portrait.png",
    type: "Image",
    thumbnail: "/files/image.png",
    size: "2.5 MB",
    date: "15 Aug 2026 at 03:45 PM",
  },
  {
    id: 40,
    name: "audioSprite a online-video-cutter cut_your_video_now.mp3",
    type: "Audio",
    thumbnail: "/files/music_file.png",
    size: "5.0 MB",
    date: "20 Aug 2026 at 04:15 PM",
  },
  {
    id: 50,
    name: "Documents.docx",
    type: "Document",
    thumbnail: "/files/word_file.png",
    size: "1.5 MB",
    date: "25 Aug 2026 at 05:30 PM",
  },
  {
    id: 100,
    name: "Clothing",
    type: "Folder",
    thumbnail: "/files/folder.png",
    date: "12 Aug 2026 at 10:00 AM",
  },
  {
    id: 200,
    name: "Documents.pdf",
    type: "PDF",
    thumbnail: "/files/pdf.png",
    size: "1.2 MB",
    date: "05 Aug 2026 at 02:30 PM",
  },
  {
    id: 300,
    name: "Casual Portrait.png",
    type: "Image",
    thumbnail: "/files/image.png",
    size: "2.5 MB",
    date: "15 Aug 2026 at 03:45 PM",
  },
  {
    id: 400,
    name: "audioSprite a online-video-cutter cut_your_video_now.mp3",
    type: "Audio",
    thumbnail: "/files/music_file.png",
    size: "5.0 MB",
    date: "20 Aug 2026 at 04:15 PM",
  },
  {
    id: 500,
    name: "Documents.docx",
    type: "Document",
    thumbnail: "/files/word_file.png",
    size: "1.5 MB",
    date: "25 Aug 2026 at 05:30 PM",
  },
];
