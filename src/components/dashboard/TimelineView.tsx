import { ActionItem } from "@/utils/maintenance";
import Link from "next/link";
import { useMemo } from "react";

interface TimelineViewProps {
    items: ActionItem[];
}

interface TimelineGroup {
    title: string;
    items: ActionItem[];
    isOverdue?: boolean;
}

export function TimelineView({ items }: TimelineViewProps) {
    const groups = useMemo(() => {
        const overdue: ActionItem[] = [];
        const upcoming: Record<string, ActionItem[]> = {};
        const noDate: ActionItem[] = [];

        // Sort items by date first
        const sortedItems = [...items].sort((a, b) => {
            const dateA = a.projectedDate || a.dueDate;
            const dateB = b.projectedDate || b.dueDate;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
        });

        sortedItems.forEach((item) => {
            if (item.status === "overdue") {
                overdue.push(item);
                return;
            }

            const date = item.projectedDate || item.dueDate;
            if (!date) {
                noDate.push(item);
                return;
            }

            const key = date.toLocaleString("default", { month: "long", year: "numeric" });
            if (!upcoming[key]) {
                upcoming[key] = [];
            }
            upcoming[key].push(item);
        });

        const result: TimelineGroup[] = [];

        if (overdue.length > 0) {
            result.push({
                title: "Overdue",
                items: overdue,
                isOverdue: true,
            });
        }

        Object.entries(upcoming).forEach(([title, groupItems]) => {
            result.push({
                title,
                items: groupItems,
            });
        });

        if (noDate.length > 0) {
            result.push({
                title: "Future / Unknown Date",
                items: noDate,
            });
        }

        return result;
    }, [items]);

    if (items.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Clear!</h3>
                <p className="text-gray-500 dark:text-gray-400">No upcoming maintenance scheduled.</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 pl-8 before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
            {groups.map((group) => (
                <div key={group.title} className="relative">
                    <div className={`absolute -left-[2.1rem] flex h-7 w-7 items-center justify-center rounded-full border-4 border-[#fafafa] dark:border-gray-950 ${group.isOverdue ? "bg-red-500" : "bg-blue-500"
                        }`}>
                        <div className="h-2 w-2 rounded-full bg-white" />
                    </div>

                    <h3 className={`mb-4 text-lg font-bold ${group.isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
                        }`}>
                        {group.title}
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((item) => (
                            <div
                                key={item.id}
                                className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500/50"
                            >
                                <div>
                                    <div className="mb-2 flex items-start justify-between">
                                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                            {item.vehicleName}
                                        </span>
                                        {item.isProjected && (
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">EST</span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{item.serviceName}</h4>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.reason}</p>

                                    {(item.projectedDate || item.dueDate) && (
                                        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {(item.projectedDate || item.dueDate)!.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                    <Link
                                        href={`/maintenance/new?vehicleId=${item.vehicleId}&type=${item.serviceName.toLowerCase().replace(/ /g, "_")}`}
                                        className="block w-full rounded-lg bg-gray-50 py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-600 transition-colors hover:bg-gray-100 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        Log Service
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
