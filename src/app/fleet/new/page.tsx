"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFleet } from "@/components/fleet/FleetProvider";
import { useToast } from "@/components/ui/Toast";
import { createFleet } from "@/lib/firebase/fleet";

const inputClass =
  "mt-1 w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-stone-300";

export default function NewFleetPage() {
  const { user } = useAuth();
  const { setActiveFleet } = useFleet();
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [sites, setSites] = useState("");
  const [saving, setSaving] = useState(false);

  const siteNames = sites.split("\n").map((s) => s.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      const fleetId = await createFleet(user, name, siteNames);
      setActiveFleet(fleetId);
      router.push("/fleet");
    } catch (error) {
      console.error("Failed to create fleet:", error);
      showToast("Couldn't create the fleet. Please try again.", "error");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white">Set up a fleet</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">
        You&apos;ll be the owner. You can add vans and invite your team next.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <label className="block text-sm font-medium text-stone-900 dark:text-white">
          Company name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder="Demo Delivery Co."
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-medium text-stone-900 dark:text-white">
          Sites <span className="font-normal text-stone-500">— one per line, optional</span>
          <textarea
            value={sites}
            onChange={(e) => setSites(e.target.value)}
            rows={3}
            placeholder={"Bozeman\nBillings"}
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
        >
          {saving ? "Creating…" : "Create fleet"}
        </button>
      </form>
    </div>
  );
}
