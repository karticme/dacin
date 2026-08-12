"use client";

import GridView from "@/components/view/grid-view";
import React from "react";

// list of different file type (dummy data), thumbnail from public/files
const FILES = [
  {
    id: 1,
    name: "Clothing",
    type: "folder",
    thumbnail: "/files/folder.png",
  },
  {
    id: 2,
    name: "Documents.pdf",
    type: "PDF",
    thumbnail: "/files/pdf.png",
    size: "1.2 MB",
  },
  {
    id: 3,
    name: "Casual Portrait.png",
    type: "Image",
    thumbnail: "/files/image.png",
    size: "2.5 MB",
  },
  {
    id: 4,
    name: "audioSprite a online-video-cutter cut_your_video_now.mp3",
    type: "Audio",
    thumbnail: "/files/music_file.png",
    size: "5.0 MB",
  },
  {
    id: 5,
    name: "Documents.docx",
    type: "Document",
    thumbnail: "/files/word_file.png",
    size: "1.5 MB",
  },
];

export default function Hub() {
  return <GridView data={FILES} />;
}
