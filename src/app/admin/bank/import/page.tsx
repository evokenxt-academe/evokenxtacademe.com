import { BankImportWorkflow } from "@/components/quiz/bank/BankImportWorkflow";

export default function BankImportPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Bulk Import</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload unstructured documents and let Gemini AI extract, categorize, and map questions automatically.</p>
      </div>

      <BankImportWorkflow />
    </div>
  );
}
