import Cropper, { type Area } from "react-easy-crop";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cropImage, type CropPixels } from "@/lib/image-utils";
import { readImageDimensions } from "@/lib/portfolio-storage";

const ratios = { square: 1, landscape: 4 / 3, widescreen: 16 / 9, story: 9 / 16 } as const;
type RatioId = "original" | keyof typeof ratios;

type ImageEditorProps = {
  open: boolean;
  source: string;
  title: string;
  stepLabel?: string;
  onCancel: () => void;
  onSave: (result: { src: string; width: number; height: number }) => void;
};

export function ImageEditor({ open, source, title, stepLabel, onCancel, onSave }: ImageEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState<RatioId>("original");
  const [originalAspect, setOriginalAspect] = useState(1);
  const [pixels, setPixels] = useState<CropPixels | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setCrop({ x: 0, y: 0 }); setZoom(1); setRatio("original"); setPixels(null);
    void readImageDimensions(source).then(({ width, height }) => {
      if (active) setOriginalAspect(width / height);
    });
    return () => { active = false; };
  }, [source]);

  const save = async () => {
    if (!pixels) return;
    setSaving(true);
    try { onSave(await cropImage(source, pixels)); } finally { setSaving(false); }
  };

  const keepOriginal = async () => {
    setSaving(true);
    try {
      const dimensions = await readImageDimensions(source);
      onSave({ src: source, ...dimensions });
    } finally { setSaving(false); }
  };

  return <Dialog open={open} onOpenChange={(next) => { if (!next && !saving) onCancel(); }}>
    <DialogContent className="w-[calc(100%-2rem)] max-w-3xl p-0 overflow-hidden">
      <DialogHeader className="px-5 pt-5 pr-12">
        <DialogTitle>Editar imagem</DialogTitle>
        <DialogDescription>{stepLabel ? `${stepLabel} · ` : ""}{title}</DialogDescription>
      </DialogHeader>
      <div className="relative h-[min(56vh,560px)] w-full bg-ink">
        <Cropper image={source} crop={crop} zoom={zoom} aspect={ratio === "original" ? originalAspect : ratios[ratio]} objectFit="contain" onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, areaPixels: Area) => setPixels(areaPixels)} showGrid />
      </div>
      <div className="space-y-5 px-5">
        <div className="space-y-2">
          <Label>Proporção</Label>
          <ToggleGroup type="single" value={ratio} onValueChange={(value) => { if (value) setRatio(value as RatioId); }} className="justify-start">
            <ToggleGroupItem value="original" aria-label="Proporção original">Livre</ToggleGroupItem>
            <ToggleGroupItem value="square" aria-label="Proporção um por um">1:1</ToggleGroupItem>
            <ToggleGroupItem value="landscape" aria-label="Proporção quatro por três">4:3</ToggleGroupItem>
            <ToggleGroupItem value="widescreen" aria-label="Proporção dezesseis por nove">16:9</ToggleGroupItem>
            <ToggleGroupItem value="story" aria-label="Proporção vertical nove por dezesseis">9:16</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="space-y-2"><Label htmlFor="crop-zoom">Zoom</Label><Slider id="crop-zoom" min={1} max={3} step={0.05} value={[zoom]} onValueChange={(value) => setZoom(value[0] ?? 1)} /></div>
      </div>
      <DialogFooter className="px-5 pb-5"><Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button><Button variant="secondary" onClick={() => void keepOriginal()} disabled={saving}>Manter Original</Button><Button onClick={() => void save()} disabled={!pixels || saving}>{saving ? "Processando…" : "Aplicar recorte"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}