"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { EdgeCornerFrame } from "@/components/ui/edge-corner-frame";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials provided.");
      }

      router.push(nextUrl);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("demo@arcfield.dev");
    setPassword("Password123!");
  };

  return (
    <EdgeCornerFrame className="p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign In to Your Ledger
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Arcfield Application Architecture — Multi-Tenant Standard
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@arcfield.dev"
              required
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 border border-zinc-900 dark:border-zinc-200 active:scale-[0.98] disabled:opacity-50 transition-all duration-150 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying Credentials...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Demo User Fast-Fill Pill */}
      <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="text-zinc-400">Testing evaluation?</span>
        <button
          type="button"
          onClick={handleFillDemo}
          className="inline-flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-100 hover:underline active:scale-95 transition-all cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Fill Demo Account
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
        >
          Create Account
        </Link>
      </p>
    </EdgeCornerFrame>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-[#09090b]">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-bold text-sm border border-zinc-800 dark:border-zinc-200">
            ET
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            Arcfield Expense Tracker
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Login Card inside Suspense */}
      <div className="w-full max-w-md pt-12 sm:pt-0">
        <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
