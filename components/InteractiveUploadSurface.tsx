"use client";

import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";

export function InteractiveUploadSurface({
  children,
  label,
  uploading = false,
  progress = 0,
}: {
  children: ReactNode;
  label: string;
  uploading?: boolean;
  progress?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);

  function openPicker(event?: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) {
    const target = event?.target as HTMLElement | null;
    if (target?.closest("button, a, input")) return;
    event?.preventDefault();
    rootRef.current?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }

  function onDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    dragDepth.current += 1;
    setDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function resetDrag() {
    dragDepth.current = 0;
    setDragging(false);
  }

  return (
    <div
      ref={rootRef}
      role="group"
      tabIndex={0}
      aria-label={label}
      data-mesalink-upload-surface
      data-dragging={dragging ? "true" : "false"}
      className="relative cursor-pointer rounded-[28px] outline-none transition focus-visible:ring-2 focus-visible:ring-[#C8A56A] focus-visible:ring-offset-2"
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) return;
        if (event.key === "Enter" || event.key === " ") openPicker(event);
      }}
      onDragEnterCapture={onDragEnter}
      onDragLeaveCapture={onDragLeave}
      onDropCapture={resetDrag}
      onDragEndCapture={resetDrag}
    >
      {children}

      {dragging && !uploading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] border-2 border-[#A97936] bg-[#FFF7E8]/95 shadow-[0_20px_60px_rgba(101,68,31,0.18)]">
          <div className="text-center text-[#704E27]">
            <UploadCloud size={30} className="mx-auto" />
            <p className="mt-2 text-sm font-black">Larga aqui para carregar</p>
            <p className="mt-1 text-[11px] font-semibold opacity-70">O upload começa automaticamente</p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-[#17120D]/90 text-white backdrop-blur-sm">
          <div className="w-52 text-center">
            <Loader2 size={27} className="mx-auto animate-spin text-[#D7B267]" />
            <p className="mt-3 text-sm font-black">A carregar… {Math.round(progress)}%</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#D7B267] transition-[width]" style={{ width: `${Math.max(4, progress)}%` }} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
