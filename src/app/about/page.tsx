"use client";

import { AppShell } from "@/components/layout/AppShell";

export default function AboutPage() {
    return (
        <AppShell>
            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                <div className="space-y-12">
                    <section>
                        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                            About Wrenchtron
                        </h1>
                        <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                            <p>
                                Wrenchtron keeps the service history for everything you own,
                                and tells you what&apos;s due. One app covers a household garage
                                and a delivery fleet.
                            </p>
                            <p>
                                You sign in with Google. Records, photos, and receipts stay
                                on Google&apos;s infrastructure, encrypted in transit and at rest.
                                A garage is visible only to you. A fleet is visible only to its members.
                            </p>
                        </div>
                    </section>

                    <section className="rounded-2xl bg-blue-50 p-6 dark:bg-blue-900/20 sm:p-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Add it to your home screen
                        </h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Open wrenchtron.com in Safari or Chrome, then add it to your
                            home screen. It opens like an app.
                        </p>
                        <div className="mt-6 grid gap-8 sm:grid-cols-2">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    iOS (iPhone)
                                </h3>
                                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li>Open Safari and go to wrenchtron.com</li>
                                    <li>Tap the &quot;Share&quot; icon (square with arrow)</li>
                                    <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                                </ol>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Android
                                </h3>
                                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li>Open Chrome and go to wrenchtron.com</li>
                                    <li>Tap the three dots (menu)</li>
                                    <li>Tap &quot;Add to Home Screen&quot; or &quot;Install App&quot;</li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Get in touch
                        </h2>
                        <p className="mt-3 text-lg text-gray-900 dark:text-white">
                            Joseph Swanson
                        </p>
                        <p className="mt-1">
                            <a
                                href="mailto:joe@swantron.com"
                                className="inline-flex min-h-11 items-center text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                                joe@swantron.com
                            </a>
                        </p>
                        <p className="mt-1 flex flex-wrap gap-x-4">
                            <a
                                href="https://swantron.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                                swantron.com
                            </a>
                            <a
                                href="https://tronswan.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                                tronswan.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </AppShell>
    );
}
