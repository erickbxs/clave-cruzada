import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { createRoom, joinRoom } from "@/features/room/services/roomService";

export default function HomePage() {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleCreateRoom() {
    const trimmedName = nickname.trim();
    if (!trimmedName) {
      alert("Informe um nome para começar a sala.");
      return;
    }

    try {
      setLoading(true);
      const { code } = await createRoom(trimmedName);
      setCreatedCode(code);
      setRoomCode(code);
      navigate(`/room/${code}`);
    } catch (error) {
      console.error(error);
      alert("Não foi possível criar a sala. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinRoom() {
    const trimmedName = nickname.trim();
    const trimmedCode = roomCode.trim().toUpperCase();

    if (!trimmedName) {
      alert("Informe um nome antes de entrar na sala.");
      return;
    }

    if (!trimmedCode) {
      alert("Informe o código da sala para entrar.");
      return;
    }

    try {
      setLoading(true);
      await joinRoom(trimmedCode, trimmedName);
      navigate(`/room/${trimmedCode}`);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar na sala. Verifique o código."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="glass-card overflow-hidden rounded-[36px] border border-white/70 p-8 shadow-[0_20px_80px_-42px_rgba(124,58,237,0.75)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-6">
              <span className="hero-badge">Jogo de dedução</span>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Roda do Sussurro
              </h1>
              <p className="text-lg leading-8 text-slate-700">
                Participe de uma partida rápida e divertida com amigos. Crie sala, compartilhe o código e
                descubra o infiltrado antes que o tempo acabe.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleCreateRoom} disabled={loading}>
                  {loading ? "Preparando sala..." : "Criar sala agora"}
                </Button>
                <Button variant="secondary" onClick={() => navigate("/local")}>Testar modo local</Button>
              </div>
            </div>
            <div className="rounded-[32px] border border-violet-200 bg-gradient-to-br from-white to-violet-50 p-6 shadow-[0_24px_80px_-40px_rgba(124,58,237,0.5)]">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-violet-600">Acerte o ritmo</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950">3–5 minutos por partida</h2>
              <p className="mt-3 text-slate-600">Rápido, leve e ideal para jogar de desktop. Sem cadastro obrigatório.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card rounded-[32px] border border-white/70 p-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-950">Entrar em sala</h2>
              <p className="text-slate-600">Use o código compartilhado pelo host e confirme seu nome.</p>
            </div>
            <div className="mt-8 space-y-5">
              <Input
                label="Seu nome"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Ex: Laura"
                disabled={loading}
              />
              <Input
                label="Código da sala"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value)}
                placeholder="AB123"
                disabled={loading}
                className="uppercase tracking-[0.2em]"
              />
              <Button variant="secondary" onClick={handleJoinRoom} disabled={loading}>
                {loading ? "Entrando..." : "Entrar na sala"}
              </Button>
            </div>
          </div>

          <div className="glass-card rounded-[32px] border border-white/70 p-8 bg-gradient-to-br from-violet-50 to-rose-50">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-950">Modo local</h2>
              <p className="text-slate-600">Simule uma partida com amigos no mesmo dispositivo sem depender de rede.</p>
            </div>
            <div className="mt-8 space-y-5">
              <Button variant="primary" onClick={() => navigate("/local")}>
                Jogar local agora
              </Button>
              <div className="rounded-[28px] border border-violet-100 bg-white/90 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Dica</p>
                <p>Perfeito para testar ideias e aprender o jogo antes de convidar amigos.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-[32px] border border-white/70 p-8 bg-white/95">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-950">Privacidade leve</h2>
            <p className="text-slate-600">
              O jogo usa apenas autenticação anônima e coleta o mínimo de dados para sincronizar partidas.
              Sem cadastro obrigatório, sem informações pessoais sensíveis.
            </p>
          </div>
          {createdCode ? (
            <div className="mt-6 rounded-[28px] bg-violet-600/10 p-4 text-slate-900">
              <p className="text-sm text-violet-800">Sala criada com sucesso!</p>
              <p className="mt-2 text-xl font-semibold tracking-[0.2em] text-violet-950">{createdCode}</p>
              <p className="mt-2 text-sm text-slate-600">Compartilhe esse código com os amigos para eles entrarem.</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
