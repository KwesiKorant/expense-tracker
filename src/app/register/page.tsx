import React, { Suspense } from "react";
import { AuthCard } from "@/components/domain/auth-card";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-[#09090b]" />}>
      <AuthCard initialMode="register" />
    </Suspense>
  );
}

