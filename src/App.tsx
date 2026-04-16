import { useEffect, useState } from "react";
import AppRouter from "@/app/router";
import { initAuth } from "@/services/firebase/auth";
import { Spinner } from "@/shared/components/ui/Spinner";

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initAuth()
      .then(() => setReady(true))
      .catch((error: unknown) => {
        console.error("Falha ao inicializar auth:", error);
        setError(
          error instanceof Error ? error.message : String(error)
        );
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-8 bg-slate-50 text-slate-900">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-rose-900">Erro de autenticação</h1>
          <p className="mt-4 text-sm text-rose-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-8">
        <Spinner label="Inicializando Firebase..." />
      </div>
    );
  }

  return <AppRouter />;
}
