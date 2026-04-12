# PRD — XLSX Encoding Lab

## 1. Overview

**Product Name:** XLSX Encoding Lab  
**Type:** Local-first web application  

XLSX Encoding Lab is a tool for encoding spreadsheets into a compact, LLM-friendly format while preserving enough information for deterministic reconstruction.

It allows users to:
- upload `.xlsx` files
- convert them into a compact DSL (`XLSXDSL1`)
- compare token usage across formats
- reconstruct the original spreadsheet
- verify round-trip correctness

---

## 2. Problem Statement

### Core Problem
Spreadsheet files (`.xlsx`) are:
- highly verbose (XML-based)
- inefficient for LLM token usage
- difficult for LLMs to reason over

### Consequences
- increased API costs when used with LLMs
- poor reasoning performance
- inconsistent transformations when converting formats

### Opportunity
Create a deterministic, compact, and reversible representation of spreadsheets that:
- minimizes token usage
- preserves structure and meaning
- is easier for LLMs to process

---

## 3. Goals

### Primary Goals
- Encode spreadsheets into a compact DSL (`XLSXDSL1`)
- Achieve significant token reduction compared to:
  - raw XLSX (XML)
  - CSV
  - JSON
- Ensure lossless (or near-lossless) reconstruction
- Provide visibility into encoding efficiency

### Secondary Goals
- Enable experimentation with encoding strategies
- Provide insights into LLM-friendly data representations

---

## 4. Non-Goals (v1)

- Spreadsheet editing capabilities
- Google Sheets integration
- Full Excel feature support (charts, macros, styling)
- Real-time collaboration
- Handling very large files (>50MB)

---

## 5. Target Users

### Primary Users
- AI engineers
- LLM application developers
- researchers working with structured data + LLMs

### Secondary Users
- data engineers
- founders optimizing LLM API costs

---

## 6. Core Features

### 6.1 File Upload
- Upload `.xlsx` files
- Support multi-sheet workbooks

---

### 6.2 Spreadsheet Parsing
- Extract workbook structure
- Extract sheets and cell data
- Normalize values into a consistent structure

---

### 6.3 DSL Encoding (`XLSXDSL1`)
- Convert spreadsheet into a compact DSL format
- Maintain readability for LLMs
- Ensure deterministic output

---

### 6.4 Token Analytics
- Compute token usage for:
  - XLSX (approximate XML extraction)
  - CSV
  - JSON
  - DSL
- Provide:
  - total token count
  - percentage reduction
  - per-format comparison

---

### 6.5 Visualization
- Display parsed spreadsheet structure
- Display encoded DSL
- Allow side-by-side comparison

---

### 6.6 Reconstruction
- Convert DSL back into spreadsheet structure
- Export reconstructed `.xlsx` file

---

### 6.7 Verification
- Compare original and reconstructed data
- Validate:
  - sheet structure
  - cell values
- Output:
  - success/failure
  - detailed differences if mismatch occurs

---

## 7. Functional Requirements

### Encoding
- deterministic output for identical input
- reversible encoding
- stable ordering of data

### Parsing
- support multiple sheets
- support basic data types:
  - string
  - number
  - boolean
  - empty/null

### Token Analysis
- consistent token estimation method
- support multiple formats

### Verification
- deep equality comparison
- clear diff reporting

---

## 8. Non-Functional Requirements

- **Local-first** (runs entirely in browser)
- **Fast execution** (<2–5 seconds for typical files)
- **Deterministic behavior**
- **Extensible encoding system**
- **Type-safe implementation (TypeScript)**

---

## 9. Success Metrics

### Technical Metrics
- ≥50% token reduction vs CSV (target)
- 100% successful reconstruction for supported features

### Product Metrics
- full pipeline completes in <5 seconds
- users can clearly understand encoding differences

---

## 10. Risks & Unknowns

### Technical Risks
- designing an optimal DSL format
- balancing compactness vs readability
- token estimation inaccuracies

### Product Risks
- unclear best encoding strategy
- users may prefer simpler formats (e.g. JSON)

---

## 11. Future Extensions

- multiple DSL versions (`XLSXDSL2`, etc.)
- pluggable encoding strategies
- LLM interaction layer (“query the spreadsheet”)
- support for larger datasets
- optional backend/API mode

---

## 12. Key Principle

> Compression must not destroy meaning.

The system prioritizes:
- deterministic structure
- LLM interpretability
- reliable reconstruction