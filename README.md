# Roda do Sussurro

Projeto multiplayer leve de dedução social para navegador, com modo online e modo local. A arquitetura prioriza limpeza de código, separação de responsabilidades e sincronização rápida com Firebase.

## Visão geral

- Jogo social inspirado em dedução, com um jogador infiltrado e uma palavra secreta.
- Partidas online com sala por código.
- Modo local para testes no mesmo dispositivo.
- Frontend React + Vite + TypeScript + Tailwind.
- Multiplayer via Firebase Firestore e Firebase Authentication anônima.
- Arquitetura modular por features e serviços.

## Estrutura do projeto

- `src/App.tsx`: inicializa autenticação e monta o roteador.
- `src/app/router/index.tsx`: rotas principais e navegação.
- `src/pages/`: telas principais do app.
- `src/features/room/`: serviços e tipos de sala.
- `src/features/game/`: tipos de jogo local e lógica leve.
- `src/services/firebase/`: inicialização do Firebase e Firestore.
- `src/services/ai/`: camada de IA com fallback local.
- `src/shared/components/ui/`: componentes de interface reutilizáveis.

## Configuração do Firebase

1. Crie um projeto no Firebase.
2. Ative Authentication com `Anonymous` sign-in.
3. Configure Firestore em modo teste ou com regras.
4. Preencha `.env` com as variáveis abaixo:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Opcionalmente, adicione `VITE_OPENAI_API_KEY` para temas gerados dinamicamente.

## Regras de segurança Firebase

Veja `firestore.rules` para as regras iniciais que:

- Permitem autenticação anônima.
- Protegem atualizações de sala apenas para o host.
- Mantêm informações secretas de papel e voto isoladas em `playerSecrets`.
- Evitam exposições indevidas de dados entre jogadores.

## Como rodar localmente

```bash
npm install
npm run dev
```

## Padrões e recomendações

- Código organizado por feature e serviço.
- Tipos claros em `src/features/room/types.ts`.
- Hooks e páginas pequenas.
- Componente de UI reutilizáveis (`Button`, `Input`, `Spinner`).
- Evite código duplicado: use serviços para integração com Firebase.

## Próximos passos

1. Ajustar regras do Firestore em produção.
2. Adicionar testes unitários para serviços de sala e IA.
3. Criar pacotes de deploy para Capacitor.
4. Melhorar UX de votação e animações leves.

## Observações

O jogo foi projetado para ser leve no navegador, com foco em usabilidade e partidas rápidas de 3 a 5 minutos. A camada de IA é opcional e robusta por meio de fallback local.
