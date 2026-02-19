"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceForm } from "@/components/maintenance/MaintenanceForm";
import { getMaintenanceLog } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { MaintenanceLog } from "@/types/maintenance";

function EditMaintenanceContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const vehicleId = searchParams.get("vehicleId");
    const logId = searchParams.get("logId");

    const [log, setLog] = useState<MaintenanceLog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !vehicleId || !logId) return;

        const fetchLog = async () => {
            try {
                const data = await getMaintenanceLog(user.uid, vehicleId, logId);
                if (data) {
                    setLog(data);
                } else {
                    router.push(`/vehicles/detail?id=${vehicleId}`);
                }
            } catch (err) {
                console.error("Failed to fetch log:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLog();
    }, [user, vehicleId, logId, router]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!log || !vehicleId) return null;

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                    Edit Maintenance
                </h1>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Update your logs
                </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <MaintenanceForm
                    vehicleId={vehicleId}
                    initialData={log}
                />
            </div>
        </div>
    );
}

export default function EditMaintenancePage() {
    return (
        <ProtectedRoute>
            <AppShell>
                <Suspense fallback={<div className="flex justify-center py-12"><LoadingSpinner /></div>}>
                    <EditMaintenanceContent />
                </Suspense>
            </AppShell>
        </ProtectedRoute>
    );
}
