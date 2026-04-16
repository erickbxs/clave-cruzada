import type { ReactNode } from "react";

interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
}

export function Label({ htmlFor, children }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="mb-2 inline-block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}
