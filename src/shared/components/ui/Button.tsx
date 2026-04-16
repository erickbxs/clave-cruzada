import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white shadow-[0_16px_40px_-24px_rgba(124,58,237,0.75)] hover:opacity-95",
  secondary:
    "bg-white text-slate-900 border border-slate-200 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.2)] hover:bg-slate-100",
  ghost:
    "bg-transparent text-slate-900 hover:bg-slate-100",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-[52px] items-center justify-center rounded-full px-6 py-3 text-base font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-white focus-visible:ring-violet-300 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}
