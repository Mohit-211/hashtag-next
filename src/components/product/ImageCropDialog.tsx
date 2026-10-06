"use client";

import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, Crop as CropIcon, Loader2, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const ASPECTS: { label: string; value: number | null }[] = [
  { label: "Original", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
];

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** Draws the cropped (and rotated) area of `src` to a new image file. */
async function cropToFile(src: string, area: Area, rotation: number, source: File): Promise<File> {
  const img = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  // Render the whole rotated image first; react-easy-crop's area is relative to it.
  const boundW = img.naturalWidth * cos + img.naturalHeight * sin;
  const boundH = img.naturalWidth * sin + img.naturalHeight * cos;
  const rotated = document.createElement("canvas");
  rotated.width = Math.round(boundW);
  rotated.height = Math.round(boundH);
  const rctx = rotated.getContext("2d")!;
  rctx.translate(boundW / 2, boundH / 2);
  rctx.rotate(rad);
  rctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const out = document.createElement("canvas");
  out.width = Math.round(area.width);
  out.height = Math.round(area.height);
  out.getContext("2d")!.drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

  // Canvas can't encode SVG/GIF — fall back to PNG for those.
  const type = source.type === "image/jpeg" || source.type === "image/webp" ? source.type : "image/png";
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, type, 0.92));
  if (!blob) throw new Error("Crop failed");
  const ext = type.split("/")[1].replace("jpeg", "jpg");
  const name = source.name.replace(/\.[^.]+$/, "") + `-cropped.${ext}`;
  return new File([blob], name, { type });
}

export default function ImageCropDialog({
  file,
  onCancel,
  onDone,
}: {
  /** The image to crop; the dialog is open while this is set. */
  file: File | null;
  onCancel: () => void;
  onDone: (cropped: File) => void;
}) {
  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-2xl ring-0 sm:max-w-xl"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[#EFEFEF] px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[#E8D03A]">
            <CropIcon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold text-[#111111]">Crop image</DialogTitle>
            <DialogDescription className="truncate text-xs text-[#6B7280]">
              {file ? file.name : "Drag to reposition, scroll or use the slider to zoom."}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F3F3F0] hover:text-[#111111]"
          >
            <X size={16} />
          </button>
        </div>
        {/* Keyed so every image starts with a fresh crop state. */}
        {file && (
          <CropEditor
            key={`${file.name}-${file.size}-${file.lastModified}`}
            file={file}
            onCancel={onCancel}
            onDone={onDone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function CropEditor({
  file,
  onCancel,
  onDone,
}: {
  file: File;
  onCancel: () => void;
  onDone: (cropped: File) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [naturalAspect, setNaturalAspect] = useState(1);
  const [aspect, setAspect] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setSrc(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
  const reset = () => {
    setAspect(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };
  const isPristine = aspect === null && zoom === 1 && rotation === 0 && crop.x === 0 && crop.y === 0;

  const handleSave = async () => {
    if (!src || !area) return;
    try {
      setSaving(true);
      onDone(await cropToFile(src, area, rotation, file));
    } catch {
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white text-[#111111] transition-colors hover:border-[#111111] disabled:opacity-40 disabled:hover:border-[#E5E5E5]";
  const label = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]";

  return (
    <>
      {/* Stage */}
      <div className="relative h-64 min-h-48 w-full shrink bg-[radial-gradient(circle_at_center,#2A2A2A_0%,#111111_75%)] sm:h-96 max-sm:landscape:h-48">
        {src ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            rotation={rotation}
            aspect={aspect ?? naturalAspect}
            onCropChange={setCrop}
            onZoomChange={(z) => setZoom(clampZoom(z))}
            onRotationChange={setRotation}
            onCropComplete={(_, px) => setArea(px)}
            onMediaLoaded={(m) => setNaturalAspect(m.naturalWidth / m.naturalHeight || 1)}
            style={{ cropAreaStyle: { border: "2px solid #E8D03A", color: "rgba(0,0,0,0.6)" } }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/70">
            <Loader2 size={22} className="animate-spin" />
          </div>
        )}
        {area && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90 tabular-nums backdrop-blur-sm">
            {Math.round(area.width)} × {Math.round(area.height)} px
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex shrink-0 flex-col gap-4 px-5 py-4">
        <div className="flex flex-col gap-2">
          <span className={label}>Shape</span>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#F3F3F0] p-1">
            {ASPECTS.map((a) => {
              const active = aspect === a.value;
              const ratio = a.value ?? naturalAspect;
              // Little preview box with the shape's proportions.
              const w = ratio >= 1 ? 16 : Math.max(8, 16 * ratio);
              const h = ratio >= 1 ? Math.max(8, 16 / ratio) : 16;
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setAspect(a.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                    active ? "bg-[#111111] text-[#E8D03A] shadow-sm" : "text-[#444] hover:bg-white hover:text-[#111111]"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("rounded-[3px] border-[1.5px]", active ? "border-[#E8D03A]" : "border-current")}
                    style={{ width: w, height: h }}
                  />
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className={label}>Zoom</span>
              <span className="text-xs font-semibold text-[#111111] tabular-nums">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => clampZoom(z - 0.25))}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
                className={iconBtn}
              >
                <ZoomOut size={15} />
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(clampZoom(Number(e.target.value)))}
                aria-label="Zoom"
                className="h-1.5 flex-1 cursor-pointer accent-[#111111]"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => clampZoom(z + 0.25))}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
                className={iconBtn}
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={label}>Rotate</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 270) % 360)}
                aria-label="Rotate left"
                title="Rotate left"
                className={iconBtn}
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                aria-label="Rotate right"
                title="Rotate right"
                className={iconBtn}
              >
                <RotateCw size={15} />
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={isPristine}
                className="h-9 rounded-lg px-3 text-xs font-semibold text-[#444] transition-colors hover:bg-[#F3F3F0] hover:text-[#111111] disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center gap-3 border-t border-[#EFEFEF] bg-[#FAFAF7] px-5 py-3.5">
        <p className="hidden min-w-0 flex-1 truncate text-xs text-[#6B7280] sm:block">
          Only the highlighted area will be printed.
        </p>
        <div className="flex flex-1 gap-2 sm:flex-none">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-11 flex-1 rounded-lg border border-[#E5E5E5] bg-white px-5 text-sm font-semibold text-[#111111] transition-colors hover:border-[#111111] disabled:opacity-50 sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !area}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#111111] px-6 text-sm font-bold text-[#E8D03A] transition-transform hover:bg-black active:scale-[0.98] disabled:opacity-50 sm:flex-none"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}
