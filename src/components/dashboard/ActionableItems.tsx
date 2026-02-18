import { ActionItem } from "@/utils/maintenance";
import Link from "next/link";

interface ActionableItemsProps {
    items: ActionItem[];
}

export function ActionableItems({ items }: ActionableItemsProps) {
    if (items.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Upcoming Maintenance
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {items.length} items require your attention
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${item.status === "overdue"
                                ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10"
                                : item.status === "due_soon"
                                    ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10"
                                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    {item.serviceName}
                                </h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {item.vehicleName}
                                </p>
                            </div>
                            <div
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${item.status === "overdue"
                                        ? "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        : item.status === "due_soon"
                                            ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                    }`}
                            >
                                {item.status.replace("_", " ")}
                            </div>
                        </div>

                        <div className="mt-4">
                            <p
                                className={`text-sm font-medium ${item.status === "overdue"
                                        ? "text-red-700 dark:text-red-300"
                                        : item.status === "due_soon"
                                            ? "text-yellow-700 dark:text-yellow-300"
                                            : "text-gray-600 dark:text-gray-400"
                                    }`}
                            >
                                {item.reason}
                            </p>
                            {item.dueDate && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Target Date: {item.dueDate.toLocaleDateString()}
                                </p>
                            )}
                        </div>

                        {/* Action Button */}
                        <div className="mt-4 flex justify-end">
                            <Link
                                href={`/maintenance/new?vehicleId=${item.vehicleId}&type=${item.serviceName
                                    .toLowerCase()
                                    .replace(/ /g, "_")}`}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${item.status === "overdue"
                                        ? "bg-red-600 text-white hover:bg-red-700"
                                        : item.status === "due_soon"
                                            ? "bg-yellow-600 text-white hover:bg-yellow-700"
                                            : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
                                    }`}
                            >
                                Log Service
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
