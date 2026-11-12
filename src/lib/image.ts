/**
 * Reduz a foto no próprio celular antes de enviar: menos dados, resposta mais rápida
 * e a IA lê igual. Devolve JPEG em base64 (sem o prefixo "data:").
 */
export async function fileToJpegBase64(file: File, maxSide = 1280, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não consegui processar a foto neste navegador.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), mediaType: 'image/jpeg' as const, preview: dataUrl };
}
