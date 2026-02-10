"use client";

import Link from "next/link";
import NextImage from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceSummary } from "@/components/dashboard/MaintenanceSummary";
import type { MaintenanceType } from "@/types/maintenance";

// Mock data for the Legendary Supra
const MOCK_VEHICLE = {
    id: "demo-supra",
    name: "Legendary Supra",
    year: 1990,
    make: "Toyota",
    model: "Supra Turbo",
    currentMileage: 84200,
    engine: "3.0L Inline-6 (7M-GTE)",
    transmission: "5-Speed Manual",
    drivetrain: "RWD",
    photoUrl: "https://images.unsplash.com/photo-1626307411219-c81ca032918a?auto=format&fit=crop&q=80&w=2000",
};

const MOCK_SUMMARY = {
    status: "green" as const,
    lastService: "Oil Change",
    lastServiceType: "oil_change" as MaintenanceType,
    lastServiceMileage: 84000,
    daysSinceLastService: 12,
    milesSinceLastService: 200,
};

export default function DemoPage() {
    return (
        <AppShell>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {MOCK_VEHICLE.name}
                            </h1>
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                Demo Mode
                            </span>
                        </div>
                        <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
                            {MOCK_VEHICLE.year} {MOCK_VEHICLE.make} {MOCK_VEHICLE.model}
                        </p>
                    </div>
                    <Link
                        href="/login"
                        className="rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95"
                    >
                        Start Your Own Fleet
                    </Link>
                </div>

                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl shadow-xl">
                    <NextImage
                        src={MOCK_VEHICLE.photoUrl}
                        alt={MOCK_VEHICLE.name}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    {/* Left: Summary & Specs */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Service Status
                            </h3>
                            <MaintenanceSummary summary={MOCK_SUMMARY} />
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Vehicle Specs
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-xs font-medium uppercase text-gray-500">Mileage</dt>
                                    <dd className="font-semibold text-gray-900 dark:text-white">84,200 mi</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium uppercase text-gray-500">Engine</dt>
                                    <dd className="font-semibold text-gray-900 dark:text-white">{MOCK_VEHICLE.engine}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium uppercase text-gray-500">Transmission</dt>
                                    <dd className="font-semibold text-gray-900 dark:text-white">{MOCK_VEHICLE.transmission}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium uppercase text-gray-500">Drivetrain</dt>
                                    <dd className="font-semibold text-gray-900 dark:text-white">{MOCK_VEHICLE.drivetrain}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Right: History */}
                    <div className="lg:col-span-2">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                            Maintenance History
                        </h2>

                        {/* Hardcoded Sample History for Demo */}
                        <div className="space-y-4">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            Oil Change
                                        </span>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            12 days ago &middot; 84,000 mi
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">$74.50</span>
                                </div>
                                <div className="mt-4 border-t border-gray-50 pt-4 dark:border-gray-700/50">
                                    <p className="text-xs text-gray-500">Oil: <span className="text-gray-700 dark:text-gray-300 font-medium">Castrol Edge 10W-30 High Mileage</span></p>
                                    <p className="mt-1 text-xs text-gray-500">Filter: <span className="text-gray-700 dark:text-gray-300 font-medium">OEM Toyota</span></p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            Brake Pads
                                        </span>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            3 months ago &middot; 82,500 mi
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">$145.00</span>
                                </div>
                                <div className="mt-4 border-t border-gray-50 pt-4 dark:border-gray-700/50">
                                    <p className="text-xs text-gray-500">Position: <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">Front</span></p>
                                    <p className="mt-1 text-xs text-gray-500">Pads: <span className="text-gray-700 dark:text-gray-300 font-medium">Akebono Ceramic</span></p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            Tire Replacement
                                        </span>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            6 months ago &middot; 80,200 mi
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">$880.00</span>
                                </div>
                                <div className="mt-4 border-t border-gray-50 pt-4 dark:border-gray-700/50">
                                    <p className="text-xs text-gray-500">Brand: <span className="text-gray-700 dark:text-gray-300 font-medium">Michelin Pilot Sport 4S</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
