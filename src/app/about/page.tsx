"use client";

import { AppShell } from "@/components/layout/AppShell";

export default function AboutPage() {
    return (
        <AppShell>
            <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="space-y-12">
                    {/* Legend section */}
                    <section>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            About Wrenchtron
                        </h1>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                            Wrenchtron was built on the principle of the "Serverless Triad":
                            Hosting, Functions, and Storage. This architecture ensures the
                            app stays fast, secure, and—most importantly—costs $0.00 to run.
                        </p>
                    </section>

                    {/* PWA Guide */}
                    <section className="rounded-2xl bg-blue-50 p-8 dark:bg-blue-900/20">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Use it on your phone
                        </h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Wrenchtron is a Progressive Web App (PWA). You can install it on
                            your home screen and use it just like a native app.
                        </p>
                        <div className="mt-6 grid gap-8 sm:grid-cols-2">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    iOS (iPhone)
                                </h3>
                                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li>Open Safari and go to wrenchtron.com</li>
                                    <li>Tap the "Share" icon (square with arrow)</li>
                                    <li>Scroll down and tap "Add to Home Screen"</li>
                                </ol>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Android
                                </h3>
                                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li>Open Chrome and go to wrenchtron.com</li>
                                    <li>Tap the three dots (menu)</li>
                                    <li>Tap "Add to Home Screen" or "Install App"</li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Get in touch
                        </h2>
                        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Created by
                                </p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Joseph Swanson
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Email
                                </p>
                                <a
                                    href="mailto:joe@swantron.com"
                                    className="text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    joe@swantron.com
                                </a>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Websites
                                </p>
                                <div className="flex gap-4">
                                    <a
                                        href="https://swantron.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        swantron.com
                                    </a>
                                    <a
                                        href="https://tronswan.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        tronswan.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AppShell>
    );
}
