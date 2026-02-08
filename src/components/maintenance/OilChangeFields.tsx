"use client";

import type { OilChangeDetails } from "@/types/maintenance";

interface OilChangeFieldsProps {
  details: OilChangeDetails;
  onChange: (details: OilChangeDetails) => void;
}

export function OilChangeFields({ details, onChange }: OilChangeFieldsProps) {
  const update = (field: keyof OilChangeDetails, value: string | number) => {
    onChange({ ...details, [field]: value });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Oil Type
        </label>
        <select
          value={details.oilType || ""}
          onChange={(e) => update("oilType", e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select...</option>
          <option value="conventional">Conventional</option>
          <option value="synthetic">Full Synthetic</option>
          <option value="synthetic_blend">Synthetic Blend</option>
          <option value="high_mileage">High Mileage</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Oil Weight
        </label>
        <select
          value={details.oilWeight || ""}
          onChange={(e) => update("oilWeight", e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select...</option>
          <option value="0W-20">0W-20</option>
          <option value="5W-20">5W-20</option>
          <option value="5W-30">5W-30</option>
          <option value="10W-30">10W-30</option>
          <option value="10W-40">10W-40</option>
          <option value="15W-40">15W-40</option>
          <option value="20W-50">20W-50</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Oil Brand
        </label>
        <input
          type="text"
          value={details.oilBrand || ""}
          onChange={(e) => update("oilBrand", e.target.value)}
          placeholder="e.g. Mobil 1"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Oil Quantity (quarts)
        </label>
        <input
          type="number"
          value={details.oilQuantity || ""}
          onChange={(e) =>
            update("oilQuantity", e.target.value ? parseFloat(e.target.value) : 0)
          }
          step="0.5"
          min="0"
          placeholder="e.g. 5"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter Brand
        </label>
        <input
          type="text"
          value={details.filterBrand || ""}
          onChange={(e) => update("filterBrand", e.target.value)}
          placeholder="e.g. Wix"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter Part Number
        </label>
        <input
          type="text"
          value={details.filterPartNumber || ""}
          onChange={(e) => update("filterPartNumber", e.target.value)}
          placeholder="e.g. XP10060"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
    </div>
  );
}
