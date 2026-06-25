"use client";

import { LoginButton } from "@/components/auth/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/vehicles");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-6 dark:bg-gray-950">
      <div className="relative mb-12 flex flex-col items-center text-center">
        <div className="absolute -inset-4 rounded-full bg-blue-500/10 blur-2xl" />
        <Link href="/" className="relative text-5xl font-black tracking-tight text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition-colors sm:text-7xl">
          Wrenchtron
        </Link>
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
          Secure Machine Access
        </p>
      </div>

      <div className="w-full max-w-sm rounded-[2rem] border border-gray-100 bg-white p-10 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-8 text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">Sign In</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Access your fleet diagnostics</p>
        </div>
        <div className="flex justify-center">
          <LoginButton />
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Free &middot; Private &middot; No subscription
        </p>
      </div>
    </div>
  );
}
