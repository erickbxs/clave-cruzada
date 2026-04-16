interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = "Carregando..." }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 px-8 py-10 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.15)]">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
    </div>
  );
}
