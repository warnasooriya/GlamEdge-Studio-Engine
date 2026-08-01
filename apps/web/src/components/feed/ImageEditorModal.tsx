import { useCallback, useState } from "react";
import Cropper, { Area, MediaSize } from "react-easy-crop";
import { RotateCcw, RotateCw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ASPECT_PRESETS: { label: string; value: number | null }[] = [
  { label: "Original", value: null },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "16:9", value: 16 / 9 },
];

interface ImageEditorModalProps {
  imageSrc: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageEditorModal({ imageSrc, onSave, onCancel }: ImageEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [naturalAspect, setNaturalAspect] = useState(4 / 3);
  const [aspectPreset, setAspectPreset] = useState<number | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onMediaLoaded = useCallback((mediaSize: MediaSize) => {
    setNaturalAspect(mediaSize.naturalWidth / mediaSize.naturalHeight);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (blob) onSave(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Edit photo</DialogTitle>

        <div className="relative mt-2 h-80 w-full overflow-hidden rounded-lg bg-plum-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectPreset ?? naturalAspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
            onMediaLoaded={onMediaLoaded}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {ASPECT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setAspectPreset(preset.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  aspectPreset === preset.value
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-plum-100 text-plum-500 hover:bg-brand-50 dark:border-white/10 dark:text-cream-100/70"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs text-plum-400 dark:text-cream-100/50">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs text-plum-400 dark:text-cream-100/50">Rotate</span>
            <div className="flex gap-2">
              <Button type="button" size="icon" variant="outline" onClick={() => setRotation((r) => r - 90)}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="outline" onClick={() => setRotation((r) => r + 90)}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !croppedAreaPixels}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.src = url;
  });
}

function getRadianAngle(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function rotatedBoundingBox(width: number, height: number, rotation: number) {
  const rad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

// Adapted from react-easy-crop's own documented example (croppedImage.js).
async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const rotatedCanvas = document.createElement("canvas");
  const rotatedCtx = rotatedCanvas.getContext("2d");
  if (!rotatedCtx) return null;

  const { width: boxWidth, height: boxHeight } = rotatedBoundingBox(image.width, image.height, rotation);
  rotatedCanvas.width = boxWidth;
  rotatedCanvas.height = boxHeight;

  rotatedCtx.translate(boxWidth / 2, boxHeight / 2);
  rotatedCtx.rotate(getRadianAngle(rotation));
  rotatedCtx.translate(-image.width / 2, -image.height / 2);
  rotatedCtx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) return null;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    rotatedCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => croppedCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92));
}
