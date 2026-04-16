import { Button } from "@/shared/components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold">Página não encontrada</h1>
        <p className="mt-4 text-slate-600">
          O caminho da sala não foi reconhecido. Volte para a página inicial e tente novamente.
        </p>
        <Button className="mt-6" onClick={() => navigate("/")}>Ir para início</Button>
      </div>
    </main>
  );
}
