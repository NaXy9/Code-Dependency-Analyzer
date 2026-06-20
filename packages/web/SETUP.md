# packages/web — setup notes

## Install dependencies

```bash
cd packages/web
pnpm add d3 @tanstack/react-query react-hook-form @hookform/resolvers zod wouter
pnpm add -D @types/d3
```

framer-motion is listed in the HANDOFF but not used yet — add when you need it:
```bash
pnpm add framer-motion
```

date-fns is also listed but not used yet.

## Tailwind

Replace `tailwind.config.ts` with the one provided (or merge the `extend.fontFamily` block).

## If shadcn/ui is NOT yet initialised

```bash
pnpm dlx shadcn@latest init
```
Pick "Dark" theme, CSS variables. Components referenced in HANDOFF (Card, Button, Badge,
Dialog, Select, Form, Tabs) can be added on demand:
```bash
pnpm dlx shadcn@latest add button badge dialog tabs select
```
None of the generated files depend on shadcn yet — the design is implemented with raw
Tailwind to give you full control.

## Vite proxy

`vite.config.ts` must proxy `/api` → `http://localhost:3001`. Minimal config:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

## File map

```
src/
├── types/index.ts              ← DTO interfaces
├── api/client.ts               ← fetch wrappers
├── lib/
│   ├── nodeType.ts             ← heuristic type detection + colors
│   └── schemas.ts              ← Zod form schema
├── store/AppContext.tsx         ← selectedNode / summary / activeTab
├── hooks/index.ts              ← useGraph / useCycles / useMetrics / useImpact
├── components/
│   ├── graph/GraphCanvas.tsx   ← d3-force + SVG (d3 owns DOM)
│   ├── panels/
│   │   ├── DetailPanel.tsx
│   │   ├── CyclesPanel.tsx
│   │   └── MetricsPanel.tsx
│   └── layout/Header.tsx
├── pages/
│   ├── SetupPage.tsx
│   └── DashboardPage.tsx
├── App.tsx
├── main.tsx
└── index.css
tailwind.config.ts
```
