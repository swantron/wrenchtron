"use client";

import type { PartDetails } from "@/types/maintenance";

interface PartFieldsProps {
  details: PartDetails;
  onChange: (details: PartDetails) => void;
}

export function PartFields({ details, onChange }: PartFieldsProps) {
  const update = (field: keyof PartDetails, value: string) => {
    onChange({ ...details, [field]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Brand
        </label>
        <input
          type="text"
          value={details.brand || ""}
          onChange={(e) => update("brand", e.target.value)}
          placeholder="e.g. K&N"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Part Number
        </label>
        <input
          type="text"
          value={details.partNumber || ""}
          onChange={(e) => update("partNumber", e.target.value)}
          placeholder="e.g. HA-1988"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
    </div>
  );
}
