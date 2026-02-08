"use client";

import { useState } from "react";
import { compressImage } from "@/lib/image/compress";
import { uploadReceipt } from "@/lib/firebase/storage";

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (
    userId: string,
    vehicleId: string,
    file: File
  ): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const compressed = await compressImage(file);
      const filename = `${Date.now()}-${file.name}`;
      const path = await uploadReceipt(userId, vehicleId, compressed, filename);
      return path;
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
