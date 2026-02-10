"use client";

import Link from "next/link";
import NextImage from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceSummary } from "@/components/dashboard/MaintenanceSummary";
import type { MaintenanceType } from "@/types/maintenance";

// Mock data for the Legendary Supra
const MOCK_VEHICLE = {
    id: "demo-f150",
    name: "F-150 Tremor",
    year: 2023,
    make: "Ford",
    model: "F-150 Tremor",
    currentMileage: 12450,
    engine: "3.5L V6 EcoBoost",
    transmission: "10-Speed Automatic",
    drivetrain: "4x4 with Hi-Lock",
    photoUrl: "/images/demo/f150_hero.png",
};

const MOCK_SUMMARY = {
    status: "green" as const,
    lastService: "Oil & Filter",
    lastServiceType: "oil_change" as MaintenanceType,
    lastServiceMileage: 12000,
    daysSinceLastService: 14,
    milesSinceLastService: 450,
};

export default function DemoPage() {
    return (
        <AppShell>
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                                {MOCK_VEHICLE.name}
                            </h1>
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                Demo Mode
                            </span>
                        </div>
                        <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">
                            {MOCK_VEHICLE.year} {MOCK_VEHICLE.make} {MOCK_VEHICLE.model}
                        </p>
                    </div>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:bg-blue-700 hover:shadow-2xl active:scale-95 sm:w-auto"
                    >
                        Start Your Own Fleet
                    </Link>
                </div>

                {/* Hero Banner */}
                <div className="relative aspect-[3/1] w-full overflow-hidden rounded-3xl shadow-2xl">
                    <NextImage
                        src={MOCK_VEHICLE.photoUrl}
                        alt={MOCK_VEHICLE.name}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                <div className="mt-16 grid gap-10 lg:grid-cols-3">
                    {/* Left Column: Summary & Specs */}
                    <div className="space-y-8 lg:col-span-1">
                        <section>
                            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                Service Status
                            </h2>
                            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <MaintenanceSummary summary={MOCK_SUMMARY} />
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                Vehicle Specs
                            </h2>
                            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <dl className="grid grid-cols-1 gap-y-6">
                                    <div className="border-b border-gray-50 pb-4 dark:border-gray-700/50">
                                        <dt className="text-xs font-semibold text-gray-400 uppercase">Mileage</dt>
                                        <dd className="mt-1 text-lg font-bold text-gray-900 dark:text-white">12,450 mi</dd>
                                    </div>
                                    <div className="border-b border-gray-50 pb-4 dark:border-gray-700/50">
                                        <dt className="text-xs font-semibold text-gray-400 uppercase">Engine</dt>
                                        <dd className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{MOCK_VEHICLE.engine}</dd>
                                    </div>
                                    <div className="border-b border-gray-50 pb-4 dark:border-gray-700/50">
                                        <dt className="text-xs font-semibold text-gray-400 uppercase">Transmission</dt>
                                        <dd className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{MOCK_VEHICLE.transmission}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-400 uppercase">Drivetrain</dt>
                                        <dd className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{MOCK_VEHICLE.drivetrain}</dd>
                                    </div>
                                </dl>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: History */}
                    <div className="lg:col-span-2">
                        <h2 className="mb-10 text-3xl font-extrabold text-gray-900 dark:text-white">
                            Maintenance History
                        </h2>

                        <div className="space-y-6">
                            <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                        <span className="inline-flex rounded-lg bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 uppercase dark:bg-blue-900/50 dark:text-blue-300">
                                            Oil Change
                                        </span>
                                        <div>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">Full Synthetic 5W-30 & Filter</p>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                14 days ago &middot; 12,000 mi &middot; Motorcraft Premium Filter
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-gray-900 dark:text-white">$89.95</span>
                                </div>
                            </div>

                            <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                        <span className="inline-flex rounded-lg bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800 uppercase dark:bg-orange-900/50 dark:text-orange-300">
                                            Off-Road Inspection
                                        </span>
                                        <div>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">Suspension & Skid Plate Torque Check</p>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                3 months ago &middot; 8,500 mi &middot; Following trail run
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-gray-900 dark:text-white">$0.00</span>
                                </div>
                            </div>

                            <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                        <span className="inline-flex rounded-lg bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 uppercase dark:bg-blue-900/50 dark:text-blue-300">
                                            Tire Rotation
                                        </span>
                                        <div>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">5-Tire Rotation (including Spare)</p>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                6 months ago &middot; 5,200 mi &middot; General Grabber A/TX
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-gray-900 dark:text-white">$35.00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
