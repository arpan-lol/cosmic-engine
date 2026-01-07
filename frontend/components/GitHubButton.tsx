"use client";

import { Github } from "lucide-react";
import Link from "next/link";
import { useFileViewer } from "@/contexts/FileViewerContext";

export function GitHubButton() {
  const { isFileViewerOpen } = useFileViewer();

  if (isFileViewerOpen) {
    return null;
  }

  return (
    <Link
      href="https://github.com/arpan-lol/cosmic-engine"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-black"
      aria-label="View on GitHub"
    >
      <Github className="size-5 text-white" />
    </Link>
  );
}
