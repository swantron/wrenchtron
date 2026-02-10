"use client";

import { useRef, useState, useEffect } from "react";
import NextImage from "next/image";
import { compressImage } from "@/lib/image/compress";
import { uploadVehiclePhoto, getReceiptURL } from "@/lib/firebase/storage";

interface VehiclePhotoUploadProps {
    userId: string;
    vehicleId: string | undefined;
    currentPhotoPath?: string;
    onUpload: (path: string) => void;
    onFileSelect?: (file: File) => void;
}

export function VehiclePhotoUpload({
    userId,
    vehicleId,
    currentPhotoPath,
    onUpload,
    onFileSelect,
}: VehiclePhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentPhotoPath) {
            getReceiptURL(currentPhotoPath).then(setPreviewUrl).catch(console.error);
        }
    }, [currentPhotoPath]);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) return;

        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        if (onFileSelect) onFileSelect(file);

        if (!vehicleId) {
            // If no vehicleId yet (new vehicle), we'll have to handle this in the parent
            // But for now, let's assume we can upload if we have one, or just keep the preview
            return;
        }

        setUploading(true);
        try {
            const compressed = await compressImage(file);
            const path = await uploadVehiclePhoto(userId, vehicleId, compressed);
            onUpload(path);
        } catch (err) {
            console.error("Photo upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vehicle Photo
            </label>

            <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-blue-400 dark:border-gray-700 dark:bg-gray-900"
            >
                {previewUrl ? (
                    <>
                        <NextImage
                            src={previewUrl}
                            alt="Vehicle preview"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="font-medium text-white">Change Photo</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center">
                        <svg className="mb-2 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {uploading ? "Uploading..." : "Tap to add a photo of your vehicle"}
                        </p>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="hidden"
                />
            </div>
        </div>
    );
}
