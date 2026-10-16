"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { CustomDropdown } from "@/components/ui/custom-dropdown";

interface AuthCardProps {
  initialMode?: "login" | "register";
}

/**
 * AuthCard Domain Primitive — Arc-AA Compositor Standard
 * Features kinematic layout morphing, sliding segmented mode toggle,
 * directional masked text reveals, and zero-FOUC theme integration.
 * Strictly compliant with 60/120 FPS Compositor Standards (transforms + opacity).
 */
export function AuthCard({ initialMode = "login" }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [direction, setDirection] = useState<number>(0);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Keep state synchronized with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isReg = window.location.pathname.includes("register");
      setDirection(isReg ? 1 : -1);
      setMode(isReg ? "register" : "login");
      setErrorMsg("");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleModeSwitch = (newMode: "login" | "register") => {
    if (newMode === mode) return;
    setDirection(newMode === "register" ? 1 : -1);
    setMode(newMode);
    setErrorMsg("");

    // Synchronize browser history without page unmount or layout collapse
    const targetUrl =
      newMode === "login"
        ? nextUrl !== "/"
          ? `/login?next=${encodeURIComponent(nextUrl)}`
          : "/login"
        : "/register";
    window.history.pushState(null, "", targetUrl);
  };

  const handleFillDemo = () => {
    if (mode !== "login") {
      handleModeSwitch("login");
    }
    setEmail("demo@arcfield.dev");
    setPassword("Password123!");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      if (mode === "login") {
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
      } else {
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password,
            defaultCurrency,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Registration failed.");
        }

        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-[#09090b]">
      {/* Top Stable Anchor Navbar */}
      <header className="fixed top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between max-w-6xl mx-auto w-full z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-bold text-sm border border-zinc-800 dark:border-zinc-200">
            ET
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            Arcfield Expense Tracker
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Morphing Auth Window Container */}
      <div className="w-full max-w-md pt-12 sm:pt-0">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="relative rounded-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800/90 p-6 sm:p-8 shadow-sm overflow-hidden"
        >
          {/* Segmented Mode Switcher with Kinematic Sliding Layout Pill */}
          <div className="relative flex items-center p-1 mb-6 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => handleModeSwitch("login")}
              className={`btn-tactile relative flex-1 py-1.5 rounded-lg font-medium transition-colors duration-150 cursor-pointer ${
                isLogin
                  ? "text-white dark:text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {isLogin && (
                <motion.div
                  layoutId="auth-mode-pill"
                  className="absolute inset-0 bg-zinc-950 dark:bg-zinc-100 rounded-lg -z-0"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10">Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch("register")}
              className={`btn-tactile relative flex-1 py-1.5 rounded-lg font-medium transition-colors duration-150 cursor-pointer ${
                !isLogin
                  ? "text-white dark:text-zinc-950 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {!isLogin && (
                <motion.div
                  layoutId="auth-mode-pill"
                  className="absolute inset-0 bg-zinc-950 dark:bg-zinc-100 rounded-lg -z-0"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10">Create Account</span>
            </button>
          </div>

          {/* Morphing Title Header with Directional Text Reveal */}
          <div className="text-center mb-6 min-h-[58px] flex flex-col justify-center overflow-hidden">
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.div
                key={mode}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    opacity: 0,
                    y: dir >= 0 ? 12 : -12,
                  }),
                  center: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      y: { type: "spring", stiffness: 400, damping: 30 },
                      opacity: { duration: 0.18, ease: "easeOut" },
                    },
                  },
                  exit: (dir: number) => ({
                    opacity: 0,
                    y: dir >= 0 ? -12 : 12,
                    transition: {
                      y: { type: "spring", stiffness: 400, damping: 30 },
                      opacity: { duration: 0.14, ease: "easeIn" },
                    },
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {isLogin ? "Sign In to Your Ledger" : "Create Your Account"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {isLogin
                    ? "Arcfield Application Architecture — Multi-Tenant Standard"
                    : "Start tracking expenses with 120 FPS compositor telemetry"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Validation Error Alert with Elastic Shake */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2 animate-shake"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field (Register Mode Only) */}
            <AnimatePresence mode="popLayout" initial={false}>
              {!isLogin && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -8 }}
                  transition={{
                    layout: { type: "spring", stiffness: 380, damping: 32 },
                    opacity: { duration: 0.16, ease: "easeOut" },
                    scale: { type: "spring", stiffness: 400, damping: 30 },
                  }}
                  className="w-full"
                >
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Mercer"
                      required={!isLogin}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Address Field (Always Visible) */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="w-full"
            >
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
            </motion.div>

            {/* Password Field (Always Visible) */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="w-full"
            >
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password {isLogin ? "" : "(min 8 chars)"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={isLogin ? undefined : 8}
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="btn-tactile absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Currency Selector (Register Mode Only) */}
            <AnimatePresence mode="popLayout" initial={false}>
              {!isLogin && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -8 }}
                  transition={{
                    layout: { type: "spring", stiffness: 380, damping: 32 },
                    opacity: { duration: 0.16, ease: "easeOut" },
                    scale: { type: "spring", stiffness: 400, damping: 30 },
                  }}
                  className="w-full"
                >
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Currency
                  </label>
                  <CustomDropdown
                    value={defaultCurrency}
                    onChange={(val) => setDefaultCurrency(val)}
                    options={[
                      { value: "USD", label: "USD ($)" },
                      { value: "EUR", label: "EUR (€)" },
                      { value: "GBP", label: "GBP (£)" },
                      { value: "GHS", label: "GHS (₵)" },
                      { value: "CAD", label: "CAD ($)" },
                    ]}
                    size="md"
                    placeholder="Select Currency"
                    ariaLabel="Default Currency"
                    className="w-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Submit Button */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="w-full pt-1"
            >
              <button
                type="submit"
                disabled={isLoading}
                className="btn-tactile w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 border border-zinc-900 dark:border-zinc-200 disabled:opacity-50 cursor-pointer overflow-hidden"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isLogin ? "Verifying Credentials..." : "Creating Account..."}
                  </>
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={mode}
                      initial={{ opacity: 0, y: isLogin ? -6 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: isLogin ? 6 : -6 }}
                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                      className="inline-flex items-center gap-2"
                    >
                      {isLogin ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </AnimatePresence>
                )}
              </button>
            </motion.div>
          </form>

          {/* Demo User Fast-Fill Pill (Login Mode Only) */}
          <AnimatePresence mode="popLayout" initial={false}>
            {isLogin && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{
                  layout: { type: "spring", stiffness: 380, damping: 32 },
                  opacity: { duration: 0.16, ease: "easeOut" },
                }}
                className="w-full"
              >
                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Testing evaluation?</span>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="btn-tactile inline-flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Fill Demo Account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Mode Switcher Link */}
          <motion.p
            layout
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400"
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => handleModeSwitch(isLogin ? "register" : "login")}
              className="btn-tactile font-semibold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer inline-block ml-1"
            >
              {isLogin ? "Create Account" : "Sign In"}
            </button>
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
