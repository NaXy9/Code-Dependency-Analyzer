# Code Dependency Analyzer

A full-stack monorepo tool for **static analysis of JavaScript/TypeScript codebases**. Upload a project archive and get an interactive dependency graph, cycle detection, and fan-in/fan-out metrics — all without running the code.

---

## Features

- **Dependency graph** — parses ES module `import` statements via Babel AST and builds a directed file-to-file graph
- **Cycle detection** — finds circular dependencies using Tarjan's SCC algorithm
- **Impact analysis** — BFS traversal to determine which files are affected by a change in a given module
- **Fan-in / Fan-out metrics** — quantifies coupling and cohesion per file
- **Interactive visualization** — force-directed d3 graph in the browser with zoom, pan, and node selection
- **ZIP upload** — drop in a `.zip` of your project and get results instantly

---

## Architecture

```
code-dependency-analyzer/
├── packages/
│   ├── core/       # Static analysis engine (framework-agnostic)
│   ├── api/        # Express REST API (file upload, orchestration)
│   └── web/        # React frontend (visualization, UI)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

### `@dep-analyzer/core`

Pure analysis engine with no framework dependencies.

| Module | Description |
|---|---|
| `FileScanner` | Recursively discovers JS/TS files in an extracted project |
| `ImportParser` | Extracts import paths from source files using Babel AST |
| `PathResolver` | Resolves relative and aliased imports to absolute file paths |
| `GraphBuilder` | Constructs the directed dependency graph |
| `CycleDetector` | Detects cycles via Tarjan's Strongly Connected Components |
| `ImpactAnalyzer` | BFS traversal to find all files impacted by a given file |
| `MetricsCalculator` | Computes fan-in (how many files import this) and fan-out (how many this imports) |

**54 unit tests** covering all core modules.

### `@dep-analyzer/api`

Express server that receives a ZIP archive, extracts it with `adm-zip`, runs the core analysis pipeline, and returns structured results.

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Upload a `.zip`, run full analysis |
| `GET` | `/api/graph` | Retrieve the built dependency graph |
| `GET` | `/api/cycles` | List all detected cycles |
| `GET` | `/api/metrics` | Return fan-in/fan-out metrics per file |
| `GET` | `/api/impact/:file` | BFS impact list for a specific file |

### `@dep-analyzer/web`

React 19 SPA with a glassmorphism dark theme.

**Stack:** Vite · TypeScript · Tailwind CSS v3 · shadcn/ui · React Query · Wouter · d3-force · Framer Motion

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Language | TypeScript |
| Monorepo | pnpm workspaces |
| Core | Babel AST, Tarjan SCC, BFS |
| API | Express, Multer, adm-zip |
| Frontend | React 19, Vite, Tailwind CSS v3 |
| UI | shadcn/ui (Nova), d3-force, Framer Motion |
| Data Fetching | React Query |
| Routing | Wouter |

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0

```bash
npm install -g pnpm
```

### Installation

```bash
git clone https://github.com/NaXy9/Code-Dependency-Analyzer.git
cd Code-Dependency-Analyzer
pnpm install
```

### Running in development

Start the API and frontend in separate terminals:

```bash
# Terminal 1 — API server
pnpm dev:api

# Terminal 2 — Web app
pnpm dev:web
```

The web app will be available at `http://localhost:5173` by default.  
The API will be available at `http://localhost:3000` by default.

### Build

```bash
pnpm build
```

Builds `@dep-analyzer/core` and `@dep-analyzer/api` for production.

### Tests

```bash
pnpm test
```

Runs the 54 unit tests in `@dep-analyzer/core`.

---

## Usage

1. Open the web app in your browser
2. Upload a `.zip` archive of a JS/TS project
3. Explore the interactive dependency graph
4. Click any node to see its fan-in/fan-out metrics and impact list
5. Check the **Cycles** tab to review circular dependencies

---

## License

MIT
