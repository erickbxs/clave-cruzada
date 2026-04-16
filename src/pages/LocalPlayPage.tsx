import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { generateRoundTheme } from "@/services/ai/aiService";
import type { LocalPlayer } from "@/features/game/types";

const MIN_PLAYERS = 3;

export default function LocalPlayPage() {
  const navigate = useNavigate();
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const [players, setPlayers] = useState<LocalPlayer[]>([]);
  const [roundTopic, setRoundTopic] = useState("");
  const [roundMode, setRoundMode] = useState("");
  const [stage, setStage] = useState<"setup" | "play" | "result">("setup");

  const canStart = useMemo(
    () => names.filter((item) => item.trim()).length >= MIN_PLAYERS,
    [names]
  );

  function updateName(index: number, value: string) {
    setNames((current) => current.map((item, idx) => (idx === index ? value : item)));
  }

  async function handleStartLocal() {
    const validNames = names.filter((item) => item.trim()).map((item) => item.trim());
    if (validNames.length < MIN_PLAYERS) {
      alert("Informe pelo menos 3 nomes.");
      return;
    }

    const theme = await generateRoundTheme();
    const infiltratorIndex = Math.floor(Math.random() * validNames.length);
    const initialPlayers = validNames.map((name, index) => ({
      id: `${index}-${name}`,
      name,
      role: index === infiltratorIndex ? ("infiltrator" as const) : ("agent" as const),
      assignedWord:
        index === infiltratorIndex
          ? theme.mode === "none"
            ? "Palavra secreta diferente"
            : theme.decoy
          : theme.word,
    }));

    setPlayers(initialPlayers);
    setRoundTopic(theme.topic);
    setRoundMode(theme.mode);
    setStage("play");
  }

  function handleReveal() {
    setStage("result");
  }

  function handleBack() {
    navigate("/");
  }

  return (
    <main className="min-h-screen px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="glass-card rounded-[36px] border border-white/70 p-8 shadow-[0_28px_90px_-40px_rgba(124,58,237,0.6)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="hero-badge">Modo local</span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Jogo rápido no mesmo dispositivo
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Crie um teste local com seus amigos e veja como a dinâmica de papéis funciona antes de jogar online.
              </p>
            </div>
            <Button variant="secondary" onClick={handleBack}>Voltar para o início</Button>
          </div>
        </div>

        {stage === "setup" && (
          <section className="glass-card rounded-[32px] border border-white/70 p-8">
            <div className="mb-6 space-y-3">
              <h2 className="text-2xl font-semibold text-slate-950">Comece sua partida local</h2>
              <p className="text-slate-600">Informe nomes de 3 a 6 jogadores e inicie uma partida com papéis secretos.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {names.map((name, index) => (
                <Input
                  key={index}
                  label={`Jogador ${index + 1}`}
                  value={name}
                  onChange={(event) => updateName(index, event.target.value)}
                  placeholder="Nome"
                />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button onClick={handleStartLocal} disabled={!canStart}>
                {canStart ? "Iniciar partida local" : "Adicione mais jogadores"}
              </Button>
              <Button variant="ghost" onClick={() => setNames(["", "", ""])}>
                Limpar nomes
              </Button>
            </div>
          </section>
        )}

        {stage === "play" && (
          <section className="glass-card rounded-[32px] border border-white/70 p-8">
            <div className="mb-6 space-y-4 rounded-[28px] border border-violet-100 bg-gradient-to-r from-white via-violet-50 to-fuchsia-50 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-violet-600">Tema selecionado</p>
              <h2 className="text-3xl font-semibold text-slate-950">{roundTopic}</h2>
              <p className="text-sm text-slate-600">Modo: {roundMode}</p>
            </div>

            <div className="grid gap-4">
              {players.map((player) => (
                <div key={player.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)]">
                  <p className="text-xl font-semibold text-slate-950">{player.name}</p>
                  <p className="mt-2 text-sm text-slate-600">{player.role === "infiltrator" ? "Infiltrado" : "Agente"}</p>
                  <p className="mt-4 rounded-3xl bg-violet-50 px-4 py-3 text-sm text-slate-700">Palavra: {player.assignedWord}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button onClick={handleReveal}>Ver resultado</Button>
              <Button variant="secondary" onClick={() => setStage("setup")}>Reiniciar</Button>
            </div>
          </section>
        )}

        {stage === "result" && (
          <section className="glass-card rounded-[32px] border border-white/70 p-8">
            <div className="mb-6 rounded-[28px] border border-violet-100 bg-violet-50/70 p-6">
              <h2 className="text-2xl font-semibold text-slate-950">Resultado local</h2>
              <p className="mt-3 text-slate-600">Veja os papéis revelados e compare as palavras de cada participante.</p>
            </div>

            <div className="grid gap-4">
              {players.map((player) => (
                <div key={player.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)]">
                  <p className="text-xl font-semibold text-slate-950">{player.name}</p>
                  <p className="mt-2 text-sm text-slate-600">{player.role === "infiltrator" ? "Infiltrado" : "Agente"}</p>
                  <p className="mt-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">Palavra: {player.assignedWord}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button onClick={() => setStage("setup")}>Voltar ao início</Button>
              <Button variant="ghost" onClick={handleBack}>Página inicial</Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
