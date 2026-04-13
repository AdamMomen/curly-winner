import { UploadPanel } from "@/components/upload-panel";

const OTHER_SECTIONS = [
  {
    title: "Parsed spreadsheet",
    description: "Canonical AST preview after parsing.",
  },
  {
    title: "Encoded DSL",
    description: "XLSXDSL1 output from the encoder.",
  },
  {
    title: "Token analytics",
    description: "Token counts across formats.",
  },
  {
    title: "Reconstruction",
    description: "Decode and export back to XLSX.",
  },
  {
    title: "Verification",
    description: "Round-trip comparison results.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight">
            XLSX Encoding Lab
          </h1>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
        <p className="text-sm text-muted-foreground">
          Upload a workbook to begin. Other sections will connect to the pipeline
          in later phases.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <UploadPanel />
          {OTHER_SECTIONS.map((section) => (
            <section
              key={section.title}
              className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <h2 className="text-base font-medium">{section.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {section.description}
              </p>
              <div
                className="mt-4 min-h-[5rem] flex-1 rounded-md border border-dashed border-muted-foreground/25 bg-muted/30"
                aria-hidden
              />
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
