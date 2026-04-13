import { LabWorkspace } from "@/components/lab-workspace";

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
        <LabWorkspace />
      </main>
    </div>
  );
}
