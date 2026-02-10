"use client";

import type { BrakeDetails } from "@/types/maintenance";

interface BrakeFieldsProps {
    details: BrakeDetails;
    onChange: (details: BrakeDetails) => void;
}

export function BrakeFields({ details, onChange }: BrakeFieldsProps) {
    const update = (field: keyof BrakeDetails, value: BrakeDetails[keyof BrakeDetails]) => {
        onChange({ ...details, [field]: value });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Position
                    </label>
                    <select
                        value={details.position || ""}
                        onChange={(e) => update("position", e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="">Select...</option>
                        <option value="front">Front</option>
                        <option value="rear">Rear</option>
                        <option value="all">All (Front & Rear)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Pad Type
                    </label>
                    <select
                        value={details.padType || ""}
                        onChange={(e) => update("padType", e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="">Select...</option>
                        <option value="ceramic">Ceramic</option>
                        <option value="semi-metallic">Semi-Metallic</option>
                        <option value="organic">Organic</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Brand
                    </label>
                    <input
                        type="text"
                        value={details.brand || ""}
                        onChange={(e) => update("brand", e.target.value)}
                        placeholder="e.g. Akebono"
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Pad Thickness (mm)
                    </label>
                    <input
                        type="text"
                        value={details.padThickness || ""}
                        onChange={(e) => update("padThickness", e.target.value)}
                        placeholder="e.g. 10mm"
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>
            </div>

            <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={!!details.rotorReplaced}
                        onChange={(e) => update("rotorReplaced", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                    Rotors Replaced
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={!!details.fluidFlushed}
                        onChange={(e) => update("fluidFlushed", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                    Fluid Flushed
                </label>
            </div>
        </div>
    );
}
