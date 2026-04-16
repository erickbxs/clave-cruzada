import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-left text-sm text-slate-700">
      {label ? <span className="font-semibold">{label}</span> : null}
      <input
        className={`w-full rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.4)] transition duration-200 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 ${className}`}
        {...props}
      />
    </label>
  );
}
