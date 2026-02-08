import imageCompression from "browser-image-compression";

const DEFAULT_OPTIONS = {
  maxSizeMB: 0.2, // ~200KB target
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export async function compressImage(file: File): Promise<File> {
  if (file.size <= DEFAULT_OPTIONS.maxSizeMB * 1024 * 1024) {
    return file;
  }
  return imageCompression(file, DEFAULT_OPTIONS);
}
