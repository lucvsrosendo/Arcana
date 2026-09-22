import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cropImageToFile } from "@/lib/cropImage";

const COVER_ASPECT = 16 / 10;

type NewsCoverCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  title: string;
  hint: string;
  zoomLabel: string;
  applyLabel: string;
  cancelLabel: string;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
  onError?: (error: unknown) => void;
};

export function NewsCoverCropDialog({
  open,
  imageSrc,
  title,
  hint,
  zoomLabel,
  applyLabel,
  cancelLabel,
  onOpenChange,
  onCropped,
  onError,
}: NewsCoverCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsApplying(false);
  }, [open, imageSrc]);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels || isApplying) {
      return;
    }

    setIsApplying(true);
    try {
      const file = await cropImageToFile(imageSrc, croppedAreaPixels, "image/webp");
      onCropped(file);
      onOpenChange(false);
    } catch (error) {
      onError?.(error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="news-cover-crop-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{hint}</DialogDescription>
        </DialogHeader>

        <div className="news-cover-crop-stage">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={COVER_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              showGrid={false}
              classes={{
                containerClassName: "news-cover-cropper",
                cropAreaClassName: "news-cover-crop-area",
              }}
            />
          ) : null}
        </div>

        <label className="news-cover-crop-zoom">
          <span>{zoomLabel}</span>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={(value) => setZoom(value[0] ?? 1)}
            aria-label={zoomLabel}
          />
        </label>

        <DialogFooter className="news-cover-crop-footer">
          <button
            type="button"
            className="news-admin-quiet-action"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="news-admin-submit"
            onClick={() => void handleApply()}
            disabled={!croppedAreaPixels || isApplying}
          >
            {applyLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
