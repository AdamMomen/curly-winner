# ARCHITECTURE — XLSX Encoding Lab

## 1. System Overview

```mermaid
flowchart TD
  A[Upload XLSX] --> B[Parser]
  B --> C[AST (Canonical Model)]
  C --> D[Encoder (XLSXDSL1)]
  D --> E[DSL Output]

  C --> F[Token Analyzer]
  E --> F

  E --> G[Decoder]
  G --> H[Reconstructed AST]

  C --> I[Verification Engine]
  H --> I

  H --> J[Export XLSX]
````

---

## 2. Core Principle

> The system revolves around a **canonical AST (Abstract Syntax Tree)**

All transformations go through:

```mermaid
flowchart LR
  A[XLSX] --> B[AST]
  B --> C[DSL]
  C --> D[AST']
  D --> E[XLSX]
```

---

## 3. Pipeline Flow

```mermaid
sequenceDiagram
  participant U as User
  participant UI as UI Layer
  participant P as Parser
  participant E as Encoder
  participant T as Token Analyzer
  participant D as Decoder
  participant V as Verification

  U->>UI: Upload file
  UI->>P: Parse XLSX
  P->>UI: Return AST

  UI->>E: Encode AST
  E->>UI: Return DSL

  UI->>T: Analyze tokens
  T->>UI: Token report

  UI->>D: Decode DSL
  D->>UI: Reconstructed AST

  UI->>V: Compare ASTs
  V->>UI: Verification result
```

---

## 4. Parser Architecture

```mermaid
flowchart TD
  A[XLSX File] --> B[SheetJS Parser]
  B --> C[Workbook Extraction]
  C --> D[Sheet Normalization]
  D --> E[Cell Normalization]
  E --> F[AST Output]
```

### Notes

* Removes Excel-specific quirks
* Produces deterministic structure
* Outputs canonical AST

---

## 5. AST Structure (Conceptual)

```mermaid
classDiagram
  class Workbook {
    sheets[]
  }

  class Sheet {
    name
    cells
  }

  class Cell {
    value
    type
  }

  Workbook --> Sheet
  Sheet --> Cell
```

---

## 6. Encoder Flow (DSL Generation)

```mermaid
flowchart TD
  A[AST] --> B[Sheet Iteration]
  B --> C[Row/Column Structuring]
  C --> D[Sparsity Optimization]
  D --> E[Token Compression Rules]
  E --> F[DSL String Output]
```

### Responsibilities

* deterministic ordering
* compact representation
* reversible structure

---

## 7. Decoder Flow

```mermaid
flowchart TD
  A[DSL Input] --> B[Parse DSL]
  B --> C[Reconstruct Sheets]
  C --> D[Reconstruct Cells]
  D --> E[Rebuilt AST]
```

### Requirement

* Must be fully symmetric with encoder

---

## 8. Token Analysis Flow

```mermaid
flowchart TD
  A[AST] --> B1[Convert to JSON]
  A --> B2[Convert to CSV]
  A --> B3[Approx XML]

  B1 --> C[Token Counter]
  B2 --> C
  B3 --> C

  D[DSL] --> C

  C --> E[Token Report]
```

---

## 9. Verification Flow

```mermaid
flowchart TD
  A[Original AST] --> C[Compare Engine]
  B["Decoded AST (from DSL)"] --> C

  C --> D{Match?}
  D -->|Yes| E[Success]
  D -->|No| F[Diff Report]
```

Formula text, values, types, and sheet layout are compared here. **Reconstruction export** (downloading an `.xlsx`) is separate and does not replace this step.

---

## 10. Application State Flow

```mermaid
flowchart TD
  A[Upload File] --> B[Set File State]
  B --> C[Parse → AST]
  C --> D[Encode → DSL]
  D --> E[Analyze Tokens]
  D --> F[Decode → AST']
  C --> G[Verification]
  F --> G

  G --> H[Display Results]
```

---

## 11. UI Architecture

```mermaid
flowchart TD
  A[App State] --> B[Overview Screen]
  A --> C[Parsed View]
  A --> D[DSL View]
  A --> E[Token Dashboard]
  A --> F[Reconstruction View]
  A --> G[Verification Panel]
```

---

## 12. Encoder Abstraction (Extensibility)

```mermaid
flowchart TD
  A[AST] --> B{Select Encoder}
  B --> C[XLSXDSL1]
  B --> D[XLSXDSL2 (future)]
  B --> E[JSON Compact]

  C --> F[DSL Output]
  D --> F
  E --> F
```

---

## 13. Data Flow Summary

```mermaid
flowchart LR
  A[XLSX File]
  B[AST]
  C[DSL]
  D[AST']
  E[Verification]

  A --> B --> C --> D --> E
```

---

## 14. Key Architectural Decisions

* **AST as single source of truth**
* **Pure function pipeline**
* **Deterministic encoding/decoding**
* **Pluggable encoder system**
* **Local-first processing**

---

## 15. Future Architecture Extensions

* streaming parser for large files
* plugin system for encoding strategies
* LLM integration layer
* API/server mode

```