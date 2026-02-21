"use client";

import type { TireDetails } from "@/types/maintenance";

interface TireFieldsProps {
    details: TireDetails;
    onChange: (details: TireDetails) => void;
}

export function TireFields({ details, onChange }: TireFieldsProps) {
    const update = (field: keyof TireDetails, value: TireDetails[keyof TireDetails]) => {
        onChange({ ...details, [field]: value });
    };

    const togglePosition = (pos: string) => {
        const current = details.positions || [];
        const next = current.includes(pos)
            ? current.filter((p) => p !== pos)
            : [...current, pos];
        update("positions", next);
    };

    const positions = [
        { id: "FL", label: "Front Left" },
        { id: "FR", label: "Front Right" },
        { id: "RL", label: "Rear Left" },
        { id: "RR", label: "Rear Right" },
    ];

    return (
        <div className="space-y-4">
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Positions
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {positions.map((pos) => (
                        <button
                            key={pos.id}
                            type="button"
                            onClick={() => togglePosition(pos.id)}
                            className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${(details.positions || []).includes(pos.id)
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                        >
                            {pos.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Brand
                    </label>
                    <input
                        type="text"
                        value={details.brand || ""}
                        onChange={(e) => update("brand", e.target.value)}
                        placeholder="e.g. Michelin"
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Model / Type
                    </label>
                    <input
                        type="text"
                        value={details.model || ""}
                        onChange={(e) => update("model", e.target.value)}
                        placeholder="e.g. Defender LTX"
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Size
                    </label>
                    <input
                        type="text"
                        value={details.size || ""}
                        onChange={(e) => update("size", e.target.value)}
                        placeholder="e.g. 235/65R17"
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tread Depth
                    </label>
                    <input
                        type="text"
                        value={details.treadDepth || ""}
                        onChange={(e) => update("treadDepth", e.target.value)}
                        placeholder="e.g. 8/32"
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Pressure (PSI)
                    </label>
                    <input
                        type="number"
                        value={details.pressure || ""}
                        onChange={(e) => update("pressure", e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="e.g. 32"
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>
            </div>
        </div>
    );
}
