export type CropPixels = { x: number; y: number; width: number; height: number };

export async function cropImage(source: string, crop: CropPixels) {
  const image = await loadImage(source);
  const scale = Math.min(1, 1600 / Math.max(crop.width, crop.height));
  const width = Math.max(1, Math.round(crop.width * scale));
  const height = Math.max(1, Math.round(crop.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem.");
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  return { src: canvas.toDataURL("image/jpeg", 0.88), width, height };
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
    image.src = source;
  });
}