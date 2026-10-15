"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { btn } from "./button";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  className = "w-full",
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: Parameters<typeof btn>[0];
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btn(variant, "md", className)}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-[10px] border px-4 py-3 text-sm animate-fade-up ${
        kind === "error"
          ? "border-rose-500/25 bg-rose-500/10 text-rose-200"
          : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {children}
    </div>
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-[12.5px] text-rose-300">{children}</p>;
}
