// Downscales + re-encodes an image client-side before upload, so a 4000px
// phone-camera photo doesn't get sent as-is over a slow mobile connection.
// Falls back to the original file whenever compression wouldn't help or the
// browser can't decode it (never blocks the upload on a compression failure).
export async function compressImage(file, { maxDimension = 1200, quality = 0.8 } = {}) {
  if (!file.type?.startsWith('image/') || file.type === 'image/svg+xml') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

    // Already small and reasonably sized — re-encoding would only add work.
    if (scale === 1 && file.size < 300 * 1024) {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^./\\]+$/, '');
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export default compressImage;
