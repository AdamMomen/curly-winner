# CHECKLIST — XLSX Encoding Lab

## Phase 0 — Project Setup

### 0.1 Initialize project
- [ ] Create a new Next.js app with TypeScript
- [ ] Use App Router
- [ ] Enable ESLint
- [ ] Enable src/ directory or decide to keep root structure
- [ ] Start the dev server successfully

#### Done criteria
- [ ] App runs locally without errors
- [ ] TypeScript compiles
- [ ] Base homepage renders

---

### 0.2 Install styling stack
- [ ] Install Tailwind CSS
- [ ] Verify Tailwind is working
- [ ] Install shadcn/ui
- [ ] Initialize shadcn config
- [ ] Add one test UI component to verify setup

#### Done criteria
- [ ] Tailwind utility classes render correctly
- [ ] shadcn component imports successfully

---

### 0.3 Install core dependencies
- [ ] Install `xlsx`
- [ ] Install `zod`
- [ ] Install any utility dependencies needed:
  - [ ] `clsx`
  - [ ] `tailwind-merge`
  - [ ] `lucide-react`

#### Done criteria
- [ ] Dependencies installed without version conflicts
- [ ] App still builds successfully

---

### 0.4 Create initial folder structure
- [ ] Create `/src/components`
- [ ] Create `/src/lib`
- [ ] Create `/src/types`
- [ ] Create `/src/pipeline`
- [ ] Create `/src/app/(routes if needed)`
- [ ] Create `/docs`

#### Done criteria
- [ ] Folder structure exists
- [ ] Project layout is clean and intentional

---

### 0.5 Create base app shell
- [ ] Create page header
- [ ] Add app title
- [ ] Add placeholder sections for:
  - [ ] Upload
  - [ ] Parsed Spreadsheet
  - [ ] Encoded DSL
  - [ ] Token Analytics
  - [ ] Reconstruction
  - [ ] Verification

#### Done criteria
- [ ] User can see the skeleton of the app
- [ ] Layout is ready for progressive implementation

---

## Phase 1 — Core Domain Model

### 1.1 Define base TypeScript types
- [ ] Define `CellValue`
- [ ] Define `CellType`
- [ ] Define `Cell`
- [ ] Define `Sheet`
- [ ] Define `Workbook`

#### Done criteria
- [ ] Types cover current v1 requirements
- [ ] Types are exportable and reusable

---

### 1.2 Define supporting types
- [ ] Define `TokenFormat`
- [ ] Define `TokenReport`
- [ ] Define `VerificationDiff`
- [ ] Define `VerificationResult`
- [ ] Define `AppState`

#### Done criteria
- [ ] Pipeline outputs have explicit types
- [ ] No `any` required for core flow

---

### 1.3 Add runtime validation with Zod
- [ ] Create Zod schema for `Cell`
- [ ] Create Zod schema for `Sheet`
- [ ] Create Zod schema for `Workbook`
- [ ] Create Zod schema for verification result

#### Done criteria
- [ ] Parsed/decoded data can be validated at runtime
- [ ] Schema errors are understandable

---

### 1.4 Decide AST conventions
- [ ] Decide canonical empty cell representation
- [ ] Decide sheet ordering rule
- [ ] Decide cell key format (`A1`, `B2`, etc.)
- [ ] Decide whether unsupported Excel types are dropped or normalized

#### Done criteria
- [ ] Canonical AST rules are documented
- [ ] Parser and decoder can target same shape

---

## Phase 2 — File Upload

### 2.1 Build upload UI
- [ ] Create upload component
- [ ] Add file input
- [ ] Restrict accepted type to `.xlsx`
- [ ] Add visible instructions for the user

#### Done criteria
- [ ] User can pick an `.xlsx` file from disk

---

### 2.2 Add upload state handling
- [ ] Store selected file in component/app state
- [ ] Show selected filename
- [ ] Add replace/remove file action

#### Done criteria
- [ ] Selected file is visible in UI
- [ ] State updates correctly when file changes

---

### 2.3 Add validation
- [ ] Reject unsupported file extensions
- [ ] Handle no-file case
- [ ] Show friendly error messages

#### Done criteria
- [ ] Invalid upload does not break app
- [ ] User sees a clear error state

---

## Phase 3 — Parser (XLSX → AST)

### 3.1 Read workbook from file
- [ ] Convert uploaded file to ArrayBuffer
- [ ] Read workbook using SheetJS
- [ ] Handle parse failures safely

#### Done criteria
- [ ] Workbook can be loaded from a valid `.xlsx`

---

### 3.2 Extract workbook metadata
- [ ] Read sheet names
- [ ] Preserve workbook sheet order
- [ ] Confirm workbook contains at least one sheet

#### Done criteria
- [ ] Workbook-level structure is available

---

### 3.3 Extract cell data from each sheet
- [ ] Iterate sheet objects
- [ ] Enumerate cell addresses
- [ ] Skip internal metadata keys from SheetJS
- [ ] Read raw cell values
- [ ] Read raw cell types where available

#### Done criteria
- [ ] Raw sheet cell map is extracted successfully

---

### 3.4 Normalize cell values
- [ ] Normalize strings
- [ ] Normalize numbers
- [ ] Normalize booleans
- [ ] Normalize empty values to canonical null
- [ ] Decide behavior for formulas/dates/errors in v1

#### Done criteria
- [ ] Every parsed cell fits the canonical `Cell` shape

---

### 3.5 Build canonical AST
- [ ] Construct `Workbook`
- [ ] Construct `Sheet`
- [ ] Construct `Cell` map
- [ ] Validate resulting AST with Zod

#### Done criteria
- [ ] Parser output matches AST contract exactly

---

### 3.6 Enforce determinism
- [ ] Preserve sheet order consistently
- [ ] Sort or preserve cell ordering intentionally
- [ ] Ensure repeated parses produce same AST shape

#### Done criteria
- [ ] Same file always produces same AST

---

### 3.7 Add parser tests
- [ ] Add fixture spreadsheet
- [ ] Test simple single-sheet workbook
- [ ] Test multi-sheet workbook
- [ ] Test sparse workbook
- [ ] Test mixed primitive values

#### Done criteria
- [ ] Parser behavior is reproducible and test-backed

---

## Phase 4 — Parsed Spreadsheet UI

### 4.1 Build sheet navigator
- [ ] Show workbook sheet list
- [ ] Allow selecting active sheet
- [ ] Highlight active sheet

#### Done criteria
- [ ] User can switch between parsed sheets

---

### 4.2 Build basic grid view
- [ ] Render visible cells in a table
- [ ] Show row/column context
- [ ] Render empty cells clearly

#### Done criteria
- [ ] Parsed data is understandable at a glance

---

### 4.3 Handle large sheets safely
- [ ] Add row/column limits
- [ ] Add truncation messaging
- [ ] Avoid rendering huge full grids naively

#### Done criteria
- [ ] Large sheets do not freeze the UI

---

## Phase 5 — DSL Spec (`XLSXDSL1`)

### 5.1 Define DSL goals
- [ ] Must be deterministic
- [ ] Must be reversible
- [ ] Must be compact
- [ ] Must remain legible to an LLM

#### Done criteria
- [ ] DSL goals are written at top of spec

---

### 5.2 Define workbook-level syntax
- [ ] Define workbook header/version marker
- [ ] Define sheet separator syntax
- [ ] Define overall document structure

#### Done criteria
- [ ] A workbook can be represented as one unambiguous string

---

### 5.3 Define sheet-level syntax
- [ ] Define sheet name encoding
- [ ] Define cell block boundaries
- [ ] Define sparse sheet representation rules

#### Done criteria
- [ ] Any sheet can be represented consistently

---

### 5.4 Define cell-level syntax
- [ ] Define address representation
- [ ] Define type marker representation
- [ ] Define value escaping rules
- [ ] Define null/empty handling

#### Done criteria
- [ ] Any supported cell can be encoded unambiguously

---

### 5.5 Define parsing rules
- [ ] Define how decoder splits workbook sections
- [ ] Define how decoder parses sheets
- [ ] Define how decoder parses cells
- [ ] Define invalid DSL handling

#### Done criteria
- [ ] Decoder rules are fully implied by the spec

---

### 5.6 Add DSL examples
- [ ] Add minimal example
- [ ] Add multi-sheet example
- [ ] Add sparse-sheet example

#### Done criteria
- [ ] Humans can understand the spec from examples

---

## Phase 6 — Encoder (AST → DSL)

### 6.1 Implement encoder entrypoint
- [ ] Create `encodeWorkbookToDsl(workbook)`
- [ ] Validate input before encoding

#### Done criteria
- [ ] Encoder can accept canonical AST safely

---

### 6.2 Encode workbook structure
- [ ] Add version/header
- [ ] Iterate sheets in deterministic order
- [ ] Join sheets using defined separators

#### Done criteria
- [ ] Workbook-level DSL is stable

---

### 6.3 Encode sheets
- [ ] Encode sheet metadata
- [ ] Encode sheet cells
- [ ] Respect sparse representation rules

#### Done criteria
- [ ] Sheet encoding is correct and compact

---

### 6.4 Encode cells
- [ ] Serialize address
- [ ] Serialize type
- [ ] Serialize value
- [ ] Escape reserved characters

#### Done criteria
- [ ] Cell encoding is reversible

---

### 6.5 Add determinism tests
- [ ] Same AST encodes to same DSL string
- [ ] Reordered object keys do not change output unexpectedly

#### Done criteria
- [ ] Encoder output is stable

---

## Phase 7 — DSL Viewer UI

### 7.1 Build DSL panel
- [ ] Render encoded DSL text
- [ ] Make it scrollable
- [ ] Preserve whitespace formatting

#### Done criteria
- [ ] DSL is readable in-app

---

### 7.2 Add utility actions
- [ ] Add copy button
- [ ] Add character count
- [ ] Add expand/collapse if long

#### Done criteria
- [ ] User can inspect and reuse DSL easily

---

## Phase 8 — Token Analysis

### 8.1 Decide token counting strategy
- [ ] Define whether counts are approximate or model-specific
- [ ] Document counting assumptions

#### Done criteria
- [ ] Token metrics have clear meaning

---

### 8.2 Build format converters
- [ ] Convert AST to JSON
- [ ] Convert AST to CSV
- [ ] Convert AST to approximate XML text
- [ ] Reuse DSL output directly

#### Done criteria
- [ ] Each format can be generated from the same AST

---

### 8.3 Implement token counter
- [ ] Create counting utility
- [ ] Accept any input string
- [ ] Return token estimate consistently

#### Done criteria
- [ ] Same input always returns same token count

---

### 8.4 Build token report generation
- [ ] Count tokens for JSON
- [ ] Count tokens for CSV
- [ ] Count tokens for XML
- [ ] Count tokens for DSL
- [ ] Compute percentage reductions

#### Done criteria
- [ ] One function returns a full comparison report

---

## Phase 9 — Token Analytics UI

### 9.1 Build comparison table
- [ ] Show format name
- [ ] Show token count
- [ ] Show percentage delta

#### Done criteria
- [ ] User can compare formats quickly

---

### 9.2 Highlight outcomes
- [ ] Highlight best-performing format
- [ ] Highlight DSL savings
- [ ] Show summary sentence

#### Done criteria
- [ ] Insights are obvious without manual math

---

## Phase 10 — Decoder (DSL → AST)

### 10.1 Implement decoder entrypoint
- [ ] Create `decodeDslToWorkbook(dsl)`
- [ ] Handle empty or malformed input

#### Done criteria
- [ ] Decoder accepts DSL safely

---

### 10.2 Parse workbook structure
- [ ] Parse header/version
- [ ] Split sheet sections
- [ ] Validate overall structure

#### Done criteria
- [ ] Decoder understands workbook-level format

---

### 10.3 Parse sheets
- [ ] Parse sheet names
- [ ] Parse sheet cell blocks
- [ ] Rebuild sheet objects

#### Done criteria
- [ ] Sheets reconstruct correctly

---

### 10.4 Parse cells
- [ ] Parse address
- [ ] Parse type marker
- [ ] Parse value
- [ ] Unescape reserved characters

#### Done criteria
- [ ] Cells reconstruct to canonical shape

---

### 10.5 Validate reconstructed AST
- [ ] Run Zod validation
- [ ] Return structured decoder errors when invalid

#### Done criteria
- [ ] Decoder never returns unchecked malformed AST

---

### 10.6 Add decoder tests
- [ ] Decode minimal DSL example
- [ ] Decode multi-sheet example
- [ ] Decode sparse example
- [ ] Test malformed DSL cases

#### Done criteria
- [ ] Decoder is test-backed and resilient

---

## Phase 11 — Verification Engine

### 11.1 Define verification rules
- [ ] Compare workbook sheet count
- [ ] Compare sheet names
- [ ] Compare cell presence
- [ ] Compare cell values
- [ ] Compare cell types

#### Done criteria
- [ ] Verification criteria are explicit

---

### 11.2 Implement comparison engine
- [ ] Compare original AST to decoded AST
- [ ] Record mismatches
- [ ] Record missing sheets/cells
- [ ] Record extra sheets/cells

#### Done criteria
- [ ] Verification produces structured diffs

---

### 11.3 Implement success/failure summary
- [ ] Return boolean `success`
- [ ] Return array of diffs
- [ ] Return human-readable summary

#### Done criteria
- [ ] Verification output can power UI directly

---

## Phase 12 — Verification UI

### 12.1 Build verification summary panel
- [ ] Show pass/fail badge
- [ ] Show concise summary
- [ ] Show mismatch counts

#### Done criteria
- [ ] User understands round-trip status instantly

---

### 12.2 Build diff viewer
- [ ] Show sheet-level diffs
- [ ] Show cell-level diffs
- [ ] Make diffs readable

#### Done criteria
- [ ] Failures are debuggable

---

## Phase 13 — Reconstruction Export

### 13.1 Convert AST back to workbook
- [ ] Rebuild SheetJS workbook object
- [ ] Rebuild sheets from canonical AST
- [ ] Reinsert cell values into correct addresses

#### Done criteria
- [ ] AST can be transformed into exportable workbook data

---

### 13.2 Generate downloadable XLSX
- [ ] Serialize workbook to file
- [ ] Trigger download in browser
- [ ] Name output file predictably

#### Done criteria
- [ ] User can download reconstructed `.xlsx`

---

### 13.3 Manual validation
- [ ] Open reconstructed file in spreadsheet app
- [ ] Confirm data integrity visually

#### Done criteria
- [ ] Export works in real spreadsheet software

---

## Phase 14 — Pipeline Orchestrator

### 14.1 Create orchestrator contract
- [ ] Define `runPipeline(file)`
- [ ] Define returned result shape
- [ ] Define error handling strategy

#### Done criteria
- [ ] All pipeline stages can be run through one entrypoint

---

### 14.2 Connect pipeline stages
- [ ] Parse file
- [ ] Encode AST
- [ ] Analyze tokens
- [ ] Decode DSL
- [ ] Verify round-trip

#### Done criteria
- [ ] Single function can execute full pipeline

---

### 14.3 Handle failure states
- [ ] Parser failures
- [ ] Encoder failures
- [ ] Decoder failures
- [ ] Verification failures

#### Done criteria
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

#### Done criteria
- [ ] UI has a single coherent state shape

---

### 15.2 Wire state into app
- [ ] Store pipeline results centrally
- [ ] Feed views from state
- [ ] Reset state on new upload when needed

#### Done criteria
- [ ] App updates consistently after each upload

---

## Phase 16 — UI Integration

### 16.1 Connect upload to pipeline
- [ ] Trigger pipeline after valid upload
- [ ] Show loading state during processing
- [ ] Show errors when processing fails

#### Done criteria
- [ ] Main user flow works end to end

---

### 16.2 Connect result sections
- [ ] Parsed view reads AST
- [ ] DSL view reads encoded string
- [ ] Token view reads report
- [ ] Verification view reads verification result
- [ ] Reconstruction section reads decoded/export state

#### Done criteria
- [ ] All sections render real data

---

## Phase 17 — Testing and Validation

### 17.1 Add representative test fixtures
- [ ] small workbook
- [ ] multi-sheet workbook
- [ ] sparse workbook
- [ ] mixed primitive workbook

#### Done criteria
- [ ] Core scenarios are represented in tests

---

### 17.2 Add round-trip tests
- [ ] parse → encode → decode → verify
- [ ] confirm success for supported scenarios

#### Done criteria
- [ ] End-to-end behavior is protected

---

### 17.3 Add edge-case tests
- [ ] empty workbook-like scenarios
- [ ] blank cells
- [ ] long strings
- [ ] reserved character escaping

#### Done criteria
- [ ] Fragile cases are covered

---

## Phase 18 — Polish

### 18.1 Improve UX clarity
- [ ] Add section descriptions
- [ ] Add empty states
- [ ] Add clearer labels

#### Done criteria
- [ ] App is understandable without explanation

---

### 18.2 Improve technical quality
- [ ] Refactor duplicated code
- [ ] Improve naming
- [ ] Tighten types
- [ ] Remove dead code

#### Done criteria
- [ ] Codebase feels intentional and maintainable