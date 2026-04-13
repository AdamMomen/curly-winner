# CHECKLIST — XLSX Encoding Lab

## Verification (every step)

Every subsection below ends with **Done criteria**. Treat the first three items in each **Done criteria** block as mandatory **quality gates**: run lint, typecheck, and tests before checking off the functional items.

| Gate | Command / expectation |
|------|------------------------|
| **Lint** | `pnpm lint` — zero errors in touched code (fix or justify). |
| **Types** | `pnpm exec tsc --noEmit` — no TypeScript errors (use `pnpm build` if that is your CI typecheck). |
| **Tests** | Add or update tests for new/changed behavior; run the full suite (`pnpm test` or project script) and ensure green. |

If a step only changes docs or config with no executable code, still run **lint** and **types** when applicable; mark **Tests** N/A in your notes only when no runtime code changed.

### Per subsection (before “Done criteria”)

Every `###` task block must include **two final task bullets** (inserted below for you): **Automated test** and **Manual test**. Complete them for that subsection before checking off **Done criteria**.

### Client data fetching (SWR) and loading UI

For **browser-side HTTP** to this app’s **JSON Route Handlers** (or other HTTP APIs the browser calls), use **SWR** where it fits the flow:

| Concern | Approach |
|---------|----------|
| **Reads** | `useSWR` with a stable **key** per resource/list (e.g. URL of the JSON route). |
| **Writes** | `useSWRMutation` from `swr/mutation` for POST/PUT/PATCH/DELETE that change server state. |
| **Cache coherence** | After a successful mutation, call **`mutate()`** on the relevant list/detail keys (or wire **`onSuccess`** to that `mutate`) so the UI matches the server. |

**Loading UI:** When a query is loading and there is **no data yet** (`isLoading` / equivalent), render **skeleton** placeholders that **mirror the final layout** (same regions, rough shapes)—avoid blank areas or generic spinners unless there is nothing meaningful to skeleton.

- Add **`swr`** in **Phase 0.3** before introducing client fetches to JSON routes.
- For **manual testing**, throttle the network in DevTools and confirm skeleton → real content; after mutations, confirm lists/details update without a full reload.

---

## Manual testing by phase

Use this when filling in the **Manual test** bullet for each subsection. Focus on the rows for the phase you are working in; adapt steps to the specific subsection (e.g. only exercise upload UI if that is what you built).

| Phase | Manual testing focus |
|-------|----------------------|
| **0** | Run `pnpm dev`, load the app in a browser, confirm no runtime errors; resize window; trigger lint/types/test scripts once. When SWR is in use, throttle network and confirm skeletons then content. |
| **1** | Skim types/schemas in the editor; ensure imports resolve; no surprise `any` in new APIs. |
| **2** | Choose a real `.xlsx`, use upload UI, replace/clear file, try an invalid extension; confirm messages and UI state. |
| **3** | Load fixture workbooks, inspect logged or surfaced AST, confirm sheet order and cells match Excel for a known file. |
| **4** | Switch sheets, scroll large grid, verify displayed values match expectations for a known workbook. |
| **5** | Read DSL spec/docs for clarity; sanity-check examples against encoder output later. |
| **6** | Compare encoded DSL to expectations for fixture ASTs; spot-check determinism by re-encoding. |
| **7** | Copy DSL from UI, paste elsewhere, toggle actions; confirm panel updates with pipeline. |
| **8** | Compare token counts across formats for a known input; sanity-check numbers vs rough expectations. |
| **9** | Scan comparison table and highlights; confirm best format is obvious for sample data. |
| **10** | Feed sample DSL into decoder; inspect AST in debugger or UI vs encoder input. |
| **11** | Run verification on matching and intentionally mismatched ASTs; read summary and diffs. |
| **12** | Walk through success and failure flows; expand/collapse diff UI if present. |
| **13** | Download exported XLSX, open in Excel/Numbers, confirm cells and sheets. |
| **14** | Run full pipeline with success and forced failure; confirm errors surface clearly. |
| **15** | After actions (upload, reset), confirm all panels stay in sync with one source of truth. |
| **16** | End-to-end: upload → every section shows coherent data; fix a bad file and recover. |
| **17** | Spot-check that new fixtures cover real spreadsheets you care about. |
| **18** | Full UX pass: labels, empty states, keyboard tab order, light/dark if applicable. |

For UI-heavy subsections, prefer **browser manual testing**; for pure logic, prefer **fixtures + stepping in debugger** plus a quick CLI or script run if you have one.

---


## Phase 0 — Project Setup

> **Layout note:** The app uses **Next.js `src/` + App Router**: `src/app`, `src/components`, `src/lib`, `src/types`, `src/pipeline`, plus `docs/` at the repo root. `components.json` configures shadcn/ui.

### 0.1 Initialize project
- [x] Create a new Next.js app with TypeScript
- [x] Use App Router
- [x] Enable ESLint
- [x] Enable src/ directory or decide to keep root structure
- [x] Start the dev server successfully

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] App runs locally without errors
- [x] TypeScript compiles
- [x] Base homepage renders

---

### 0.2 Install styling stack
- [x] Install Tailwind CSS
- [x] Verify Tailwind is working
- [x] Install shadcn/ui
- [x] Initialize shadcn config
- [x] Add one test UI component to verify setup

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Tailwind utility classes render correctly
- [x] shadcn component imports successfully

---

### 0.3 Install core dependencies
- [x] Install `xlsx`
- [x] Install `zod`
- [x] Install `swr` (before client-side fetches to this app’s JSON routes; see [Client data fetching (SWR) and loading UI](#client-data-fetching-swr-and-loading-ui))
- [x] Install any utility dependencies needed:
  - [x] `clsx`
  - [x] `tailwind-merge`
  - [x] `lucide-react`

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Dependencies installed without version conflicts
- [x] App still builds successfully

---

### 0.4 Create initial folder structure
- [x] Create `/src/components`
- [x] Create `/src/lib`
- [x] Create `/src/types`
- [x] Create `/src/pipeline`
- [x] Create `/src/app/(routes if needed)`
- [x] Create `/docs`

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Folder structure exists
- [x] Project layout is clean and intentional

---

### 0.5 Create base app shell
- [x] Create page header
- [x] Add app title
- [x] Add placeholder sections for:
  - [x] Upload
  - [x] Parsed Spreadsheet
  - [x] Encoded DSL
  - [x] Token Analytics
  - [x] Reconstruction
  - [x] Verification

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] User can see the skeleton of the app
- [x] Layout is ready for progressive implementation

---

## Phase 1 — Core Domain Model

### 1.1 Define base TypeScript types
- [x] Define `CellValue`
- [x] Define `CellType`
- [x] Define `Cell`
- [x] Define `Sheet`
- [x] Define `Workbook`

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Types cover current v1 requirements
- [x] Types are exportable and reusable

---

### 1.2 Define supporting types
- [x] Define `TokenFormat`
- [x] Define `TokenReport`
- [x] Define `VerificationDiff`
- [x] Define `VerificationResult`
- [x] Define `AppState`

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Pipeline outputs have explicit types
- [x] No `any` required for core flow

---

### 1.3 Add runtime validation with Zod
- [x] Create Zod schema for `Cell`
- [x] Create Zod schema for `Sheet`
- [x] Create Zod schema for `Workbook`
- [x] Create Zod schema for verification result

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Parsed/decoded data can be validated at runtime
- [x] Schema errors are understandable

---

### 1.4 Decide AST conventions
- [x] Decide canonical empty cell representation
- [x] Decide sheet ordering rule
- [x] Decide cell key format (`A1`, `B2`, etc.)
- [x] Decide whether unsupported Excel types are dropped or normalized

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Canonical AST rules are documented
- [x] Parser and decoder can target same shape

---

## Phase 2 — File Upload

### 2.1 Build upload UI
- [x] Create upload component
- [x] Add file input
- [x] Restrict accepted type to `.xlsx`
- [x] Add visible instructions for the user

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] User can pick an `.xlsx` file from disk

---

### 2.2 Add upload state handling
- [x] Store selected file in component/app state
- [x] Show selected filename
- [x] Add replace/remove file action

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Selected file is visible in UI
- [x] State updates correctly when file changes

---

### 2.3 Add validation
- [x] Reject unsupported file extensions
- [x] Handle no-file case
- [x] Show friendly error messages

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Invalid upload does not break app
- [x] User sees a clear error state

---

## Phase 3 — Parser (XLSX → AST)

### 3.1 Read workbook from file
- [x] Convert uploaded file to ArrayBuffer
- [x] Read workbook using SheetJS
- [x] Handle parse failures safely

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Workbook can be loaded from a valid `.xlsx`

---

### 3.2 Extract workbook metadata
- [x] Read sheet names
- [x] Preserve workbook sheet order
- [x] Confirm workbook contains at least one sheet

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Workbook-level structure is available

---

### 3.3 Extract cell data from each sheet
- [x] Iterate sheet objects
- [x] Enumerate cell addresses
- [x] Skip internal metadata keys from SheetJS
- [x] Read raw cell values
- [x] Read raw cell types where available

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Raw sheet cell map is extracted successfully

---

### 3.4 Normalize cell values
- [x] Normalize strings
- [x] Normalize numbers
- [x] Normalize booleans
- [x] Normalize empty values to canonical null
- [x] Decide behavior for formulas/dates/errors in v1

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Every parsed cell fits the canonical `Cell` shape

---

### 3.5 Build canonical AST
- [x] Construct `Workbook`
- [x] Construct `Sheet`
- [x] Construct `Cell` map
- [x] Validate resulting AST with Zod

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Parser output matches AST contract exactly

---

### 3.6 Enforce determinism
- [x] Preserve sheet order consistently
- [x] Sort or preserve cell ordering intentionally
- [x] Ensure repeated parses produce same AST shape

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Same file always produces same AST

---

### 3.7 Add parser tests
- [x] Add fixture spreadsheet
- [x] Test simple single-sheet workbook
- [x] Test multi-sheet workbook
- [x] Test sparse workbook
- [x] Test mixed primitive values

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Parser behavior is reproducible and test-backed

---

## Phase 4 — Parsed Spreadsheet UI

### 4.1 Build sheet navigator
- [x] Show workbook sheet list
- [x] Allow selecting active sheet
- [x] Highlight active sheet

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] User can switch between parsed sheets

---

### 4.2 Build basic grid view
- [x] Render visible cells in a table
- [x] Show row/column context
- [x] Render empty cells clearly

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or extend automated tests for new/changed behavior; `pnpm test` passes
- [x] Parsed data is understandable at a glance

---

### 4.3 Handle large sheets safely
- [x] Add row/column limits
- [x] Add truncation messaging
- [x] Avoid rendering huge full grids naively

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Large sheets do not freeze the UI

---

## Phase 5 — DSL Spec (`XLSXDSL1`)

### 5.1 Define DSL goals
- [x] Must be deterministic
- [x] Must be reversible
- [x] Must be compact
- [x] Must remain legible to an LLM

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] DSL goals are written at top of spec

---

### 5.2 Define workbook-level syntax
- [x] Define workbook header/version marker
- [x] Define sheet separator syntax
- [x] Define overall document structure

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] A workbook can be represented as one unambiguous string

---

### 5.3 Define sheet-level syntax
- [x] Define sheet name encoding
- [x] Define cell block boundaries
- [x] Define sparse sheet representation rules

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Any sheet can be represented consistently

---

### 5.4 Define cell-level syntax
- [x] Define address representation
- [x] Define type marker representation
- [x] Define value escaping rules
- [x] Define null/empty handling

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Any supported cell can be encoded unambiguously

---

### 5.5 Define parsing rules
- [x] Define how decoder splits workbook sections
- [x] Define how decoder parses sheets
- [x] Define how decoder parses cells
- [x] Define invalid DSL handling

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Decoder rules are fully implied by the spec

---

### 5.6 Add DSL examples
- [x] Add minimal example
- [x] Add multi-sheet example
- [x] Add sparse-sheet example

- [x] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [x] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [x] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [x] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [x] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [x] Humans can understand the spec from examples

---

## Phase 6 — Encoder (AST → DSL)

### 6.1 Implement encoder entrypoint
- [ ] Create `encodeWorkbookToDsl(workbook)`
- [ ] Validate input before encoding

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Encoder can accept canonical AST safely

---

### 6.2 Encode workbook structure
- [ ] Add version/header
- [ ] Iterate sheets in deterministic order
- [ ] Join sheets using defined separators

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Workbook-level DSL is stable

---

### 6.3 Encode sheets
- [ ] Encode sheet metadata
- [ ] Encode sheet cells
- [ ] Respect sparse representation rules

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Sheet encoding is correct and compact

---

### 6.4 Encode cells
- [ ] Serialize address
- [ ] Serialize type
- [ ] Serialize value
- [ ] Escape reserved characters

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Cell encoding is reversible

---

### 6.5 Add determinism tests
- [ ] Same AST encodes to same DSL string
- [ ] Reordered object keys do not change output unexpectedly

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Encoder output is stable

---

## Phase 7 — DSL Viewer UI

### 7.1 Build DSL panel
- [ ] Render encoded DSL text
- [ ] Make it scrollable
- [ ] Preserve whitespace formatting

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] DSL is readable in-app

---

### 7.2 Add utility actions
- [ ] Add copy button
- [ ] Add character count
- [ ] Add expand/collapse if long

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] User can inspect and reuse DSL easily

---

## Phase 8 — Token Analysis

### 8.1 Decide token counting strategy
- [ ] Define whether counts are approximate or model-specific
- [ ] Document counting assumptions

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Token metrics have clear meaning

---

### 8.2 Build format converters
- [ ] Convert AST to JSON
- [ ] Convert AST to CSV
- [ ] Convert AST to approximate XML text
- [ ] Reuse DSL output directly

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Each format can be generated from the same AST

---

### 8.3 Implement token counter
- [ ] Create counting utility
- [ ] Accept any input string
- [ ] Return token estimate consistently

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Same input always returns same token count

---

### 8.4 Build token report generation
- [ ] Count tokens for JSON
- [ ] Count tokens for CSV
- [ ] Count tokens for XML
- [ ] Count tokens for DSL
- [ ] Compute percentage reductions

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] One function returns a full comparison report

---

## Phase 9 — Token Analytics UI

### 9.1 Build comparison table
- [ ] Show format name
- [ ] Show token count
- [ ] Show percentage delta

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] User can compare formats quickly

---

### 9.2 Highlight outcomes
- [ ] Highlight best-performing format
- [ ] Highlight DSL savings
- [ ] Show summary sentence

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Insights are obvious without manual math

---

## Phase 10 — Decoder (DSL → AST)

### 10.1 Implement decoder entrypoint
- [ ] Create `decodeDslToWorkbook(dsl)`
- [ ] Handle empty or malformed input

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Decoder accepts DSL safely

---

### 10.2 Parse workbook structure
- [ ] Parse header/version
- [ ] Split sheet sections
- [ ] Validate overall structure

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Decoder understands workbook-level format

---

### 10.3 Parse sheets
- [ ] Parse sheet names
- [ ] Parse sheet cell blocks
- [ ] Rebuild sheet objects

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Sheets reconstruct correctly

---

### 10.4 Parse cells
- [ ] Parse address
- [ ] Parse type marker
- [ ] Parse value
- [ ] Unescape reserved characters

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Cells reconstruct to canonical shape

---

### 10.5 Validate reconstructed AST
- [ ] Run Zod validation
- [ ] Return structured decoder errors when invalid

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Decoder never returns unchecked malformed AST

---

### 10.6 Add decoder tests
- [ ] Decode minimal DSL example
- [ ] Decode multi-sheet example
- [ ] Decode sparse example
- [ ] Test malformed DSL cases

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Decoder is test-backed and resilient

---

## Phase 11 — Verification Engine

### 11.1 Define verification rules
- [ ] Compare workbook sheet count
- [ ] Compare sheet names
- [ ] Compare cell presence
- [ ] Compare cell values
- [ ] Compare cell types

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Verification criteria are explicit

---

### 11.2 Implement comparison engine
- [ ] Compare original AST to decoded AST
- [ ] Record mismatches
- [ ] Record missing sheets/cells
- [ ] Record extra sheets/cells

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Verification produces structured diffs

---

### 11.3 Implement success/failure summary
- [ ] Return boolean `success`
- [ ] Return array of diffs
- [ ] Return human-readable summary

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Verification output can power UI directly

---

## Phase 12 — Verification UI

### 12.1 Build verification summary panel
- [ ] Show pass/fail badge
- [ ] Show concise summary
- [ ] Show mismatch counts

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] User understands round-trip status instantly

---

### 12.2 Build diff viewer
- [ ] Show sheet-level diffs
- [ ] Show cell-level diffs
- [ ] Make diffs readable

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Failures are debuggable

---

## Phase 13 — Reconstruction Export

### 13.1 Convert AST back to workbook
- [ ] Rebuild SheetJS workbook object
- [ ] Rebuild sheets from canonical AST
- [ ] Reinsert cell values into correct addresses

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] AST can be transformed into exportable workbook data

---

### 13.2 Generate downloadable XLSX
- [ ] Serialize workbook to file
- [ ] Trigger download in browser
- [ ] Name output file predictably

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] User can download reconstructed `.xlsx`

---

### 13.3 Manual validation
- [ ] Open reconstructed file in spreadsheet app
- [ ] Confirm data integrity visually

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Export works in real spreadsheet software

---

## Phase 14 — Pipeline Orchestrator

### 14.1 Create orchestrator contract
- [ ] Define `runPipeline(file)`
- [ ] Define returned result shape
- [ ] Define error handling strategy

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] All pipeline stages can be run through one entrypoint

---

### 14.2 Connect pipeline stages
- [ ] Parse file
- [ ] Encode AST
- [ ] Analyze tokens
- [ ] Decode DSL
- [ ] Verify round-trip

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Single function can execute full pipeline

---

### 14.3 Handle failure states
- [ ] Parser failures
- [ ] Encoder failures
- [ ] Decoder failures
- [ ] Verification failures

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Pipeline fails safely and visibly

---

## Phase 15 — State Management

### 15.1 Define app state model
- [ ] File state
- [ ] AST state
- [ ] DSL state
- [ ] Token report state
- [ ] Decoded AST state
- [ ] Verification state
- [ ] Error/loading state

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] UI has a single coherent state shape

---

### 15.2 Wire state into app
- [ ] Store pipeline results centrally
- [ ] Feed views from state
- [ ] Reset state on new upload when needed

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] App updates consistently after each upload

---

## Phase 16 — UI Integration

### 16.1 Connect upload to pipeline
- [ ] Trigger pipeline after valid upload
- [ ] Show loading state during processing
- [ ] Show errors when processing fails

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Main user flow works end to end

---

### 16.2 Connect result sections
- [ ] Parsed view reads AST
- [ ] DSL view reads encoded string
- [ ] Token view reads report
- [ ] Verification view reads verification result
- [ ] Reconstruction section reads decoded/export state
- [ ] If any section loads data over HTTP from this app’s JSON routes, use **SWR** and **skeleton** loading UI per [Client data fetching (SWR) and loading UI](#client-data-fetching-swr-and-loading-ui)

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] All sections render real data

---

## Phase 17 — Testing and Validation

### 17.1 Add representative test fixtures
- [ ] small workbook
- [ ] multi-sheet workbook
- [ ] sparse workbook
- [ ] mixed primitive workbook

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Core scenarios are represented in tests

---

### 17.2 Add round-trip tests
- [ ] parse → encode → decode → verify
- [ ] confirm success for supported scenarios

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] End-to-end behavior is protected

---

### 17.3 Add edge-case tests
- [ ] empty workbook-like scenarios
- [ ] blank cells
- [ ] long strings
- [ ] reserved character escaping

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Fragile cases are covered

---

## Phase 18 — Polish

### 18.1 Improve UX clarity
- [ ] Add section descriptions
- [ ] Add empty states
- [ ] Add clearer labels

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] App is understandable without explanation

---

### 18.2 Improve technical quality
- [ ] Refactor duplicated code
- [ ] Improve naming
- [ ] Tighten types
- [ ] Remove dead code

- [ ] **Automated test:** Add or extend automated tests that cover this subsection’s new behavior; run `pnpm test` (unit/integration/e2e as appropriate).
- [ ] **Manual test:** Complete the manual checks for this phase in [Manual testing by phase](#manual-testing-by-phase).

#### Done criteria
- [ ] **Lint:** `pnpm lint` passes (fix issues in files you changed)
- [ ] **Types:** `pnpm exec tsc --noEmit` passes (or `pnpm build` if that is the project typecheck)
- [ ] **Tests:** Add or update automated tests for new/changed behavior; `pnpm test` passes
- [ ] Codebase feels intentional and maintainable