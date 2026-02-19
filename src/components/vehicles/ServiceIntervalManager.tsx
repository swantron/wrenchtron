import { useState } from "react";
import { Vehicle, ServiceInterval, IntervalType } from "@/types/firestore";
import type { MaintenanceType } from "@/types/maintenance";
import { updateVehicle } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

interface ServiceIntervalManagerProps {
    vehicle: Vehicle;
}

const INTERVAL_TYPES: { value: IntervalType; label: string }[] = [
    { value: "mileage", label: "Mileage Based" },
    { value: "time", label: "Time Based" },
    { value: "seasonal", label: "Seasonal" },
    { value: "composite", label: "Mileage or Time (Whichever first)" },
];

const SEASONS = [
    { value: "spring", label: "Spring" },
    { value: "summer", label: "Summer" },
    { value: "fall", label: "Fall" },
    { value: "winter", label: "Winter" },
];

const MAINTENANCE_TYPES: { value: MaintenanceType; label: string }[] = [
    { value: "oil_change", label: "Oil Change" },
    { value: "tire_rotation", label: "Tire Rotation" },
    { value: "tire_replacement", label: "Tire Replacement" },
    { value: "brake_pads", label: "Brake Pads" },
    { value: "brake_rotors", label: "Brake Rotors" },
    { value: "air_filter", label: "Air Filter" },
    { value: "cabin_filter", label: "Cabin Filter" },
    { value: "spark_plugs", label: "Spark Plugs" },
    { value: "transmission_fluid", label: "Transmission Fluid" },
    { value: "coolant_flush", label: "Coolant Flush" },
    { value: "battery", label: "Battery" },
    { value: "wiper_blades", label: "Wiper Blades" },
    { value: "alignment", label: "Alignment" },
    { value: "inspection", label: "Inspection" },
    { value: "other", label: "Other" },
];

export function ServiceIntervalManager({ vehicle }: ServiceIntervalManagerProps) {
    const { user } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [name, setName] = useState("");
    const [type, setType] = useState<IntervalType>("mileage");
    const [targetMaintenanceType, setTargetMaintenanceType] = useState<MaintenanceType | "">("");
    const [mileageInterval, setMileageInterval] = useState<string>("");
    const [timeIntervalMonths, setTimeIntervalMonths] = useState<string>("");
    const [season, setSeason] = useState<"spring" | "fall" | "summer" | "winter">("spring");
    const [notes, setNotes] = useState("");

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !vehicle.id) return;

        setLoading(true);
        setError("");

        const newInterval: ServiceInterval = {
            id: crypto.randomUUID(),
            name,
            type,
            notes: notes || undefined,
        };

        if (targetMaintenanceType) {
            newInterval.targetMaintenanceType = targetMaintenanceType;
        }

        if (type === "mileage" || type === "composite") {
            newInterval.mileageInterval = parseInt(mileageInterval);
        }

        if (type === "time" || type === "composite") {
            newInterval.timeIntervalMonths = parseInt(timeIntervalMonths);
        }

        if (type === "seasonal") {
            newInterval.season = season;
        }

        const updatedIntervals = [...(vehicle.serviceIntervals || []), newInterval];

        try {
            await updateVehicle(user.uid, vehicle.id, {
                serviceIntervals: updatedIntervals,
            });
            setIsAdding(false);
            resetForm();
        } catch (err) {
            console.error("Error adding interval:", err);
            setError("Failed to add service goal. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (intervalId: string) => {
        if (!user || !vehicle.id) return;
        if (!confirm("Are you sure you want to remove this goal?")) return;

        setError("");
        const updatedIntervals = (vehicle.serviceIntervals || []).filter(
            (i) => i.id !== intervalId
        );

        try {
            await updateVehicle(user.uid, vehicle.id, {
                serviceIntervals: updatedIntervals,
            });
        } catch (err) {
            console.error("Error removing interval:", err);
            setError("Failed to remove service goal. Please try again.");
        }
    };

    const resetForm = () => {
        setName("");
        setType("mileage");
        setTargetMaintenanceType("");
        setMileageInterval("");
        setTimeIntervalMonths("");
        setSeason("spring");
        setNotes("");
        setError("");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Maintenance Goals
                </h3>
                <button
                    onClick={() => { setIsAdding(!isAdding); setError(""); }}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                >
                    {isAdding ? "Cancel" : "Add Goal"}
                </button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {isAdding && (
                <form onSubmit={handleAdd} className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Goal Name
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Oil Change"
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as IntervalType)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                {INTERVAL_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Matches Log Type <span className="normal-case font-normal">(optional — improves tracking accuracy)</span>
                            </label>
                            <select
                                value={targetMaintenanceType}
                                onChange={(e) => setTargetMaintenanceType(e.target.value as MaintenanceType | "")}
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">— None (use name matching) —</option>
                                {MAINTENANCE_TYPES.map((mt) => (
                                    <option key={mt.value} value={mt.value}>
                                        {mt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {(type === "mileage" || type === "composite") && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Mileage Interval
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={mileageInterval}
                                        onChange={(e) => setMileageInterval(e.target.value)}
                                        placeholder="e.g. 5000"
                                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-12 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-gray-500 sm:text-sm">mi</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(type === "time" || type === "composite") && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Time Interval
                                </label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={timeIntervalMonths}
                                        onChange={(e) => setTimeIntervalMonths(e.target.value)}
                                        placeholder="e.g. 6"
                                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-16 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-gray-500 sm:text-sm">months</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {type === "seasonal" && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Season
                                </label>
                                <select
                                    value={season}
                                    onChange={(e) => setSeason(e.target.value as "spring" | "fall" | "summer" | "winter")}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                >
                                    {SEASONS.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Details about parts, oil weight, etc."
                                rows={2}
                                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsAdding(false); resetForm(); }}
                            className="rounded-lg px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Goal"}
                        </button>
                    </div>
                </form>
            )}

            {/* List of existing intervals */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(vehicle.serviceIntervals || []).map((interval) => (
                    <div
                        key={interval.id}
                        className="relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500/30"
                    >
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {INTERVAL_TYPES.find((t) => t.value === interval.type)?.label}
                                </span>
                                <button
                                    onClick={() => handleDelete(interval.id)}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                    title="Remove Goal"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            <h4 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                                {interval.name}
                            </h4>

                            {interval.targetMaintenanceType && (
                                <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                                    Tracks: {MAINTENANCE_TYPES.find(m => m.value === interval.targetMaintenanceType)?.label}
                                </p>
                            )}

                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                {interval.type === "mileage" && `Every ${interval.mileageInterval?.toLocaleString()} miles`}
                                {interval.type === "time" && `Every ${interval.timeIntervalMonths} months`}
                                {interval.type === "composite" &&
                                    `Every ${interval.mileageInterval?.toLocaleString()} mi or ${interval.timeIntervalMonths} mo`}
                                {interval.type === "seasonal" && `Every ${interval.season}`}
                            </div>

                            {interval.notes && (
                                <p className="mt-2 text-xs italic text-gray-500">
                                    {interval.notes}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                {(!vehicle.serviceIntervals || vehicle.serviceIntervals.length === 0) && !isAdding && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50 sm:col-span-full">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            No custom goals set. Using defaults based on vehicle type.
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Add a goal to override defaults.
                        </p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                            Add a custom goal
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
