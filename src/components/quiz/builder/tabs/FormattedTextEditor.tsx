"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { parseFormattedText } from "@/lib/parsers/formattedTextParser";
import { useBatchInsertQuestions } from "@/hooks/useQuestions";
import type { ParsedQuestion } from "@/types/quiz";
import { Info, AlertTriangle, Check, Trash2 } from "lucide-react";

export function FormattedTextEditor({ quizId }: { quizId: string }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const batchInsert = useBatchInsertQuestions(quizId);

  const handleParse = () => {
    const result = parseFormattedText(text);
    setParsed(result.questions);
    setErrors(result.errors);
    setIsParsed(true);
  };

  const handleImport = () => {
    const selected = parsed.filter((q) => q._selected !== false);
    const mapped = selected.map((q) => ({
      type: q.type, question_text: q.question_text, marks: q.marks,
      negative_marks: 0, is_mandatory: true, explanation: q.explanation,
      assertion_text: q.assertion_text, reason_text: q.reason_text,
      numerical_answer: q.numerical_answer, numerical_tolerance: q.numerical_tolerance,
      model_answer: q.model_answer,
      options: q.options?.map((o, i) => ({ option_text: o.text, is_correct: o.is_correct, position: i })) ?? [],
    }));
    batchInsert.mutate(mapped);
  };

  return (
    <div className="space-y-4 p-1">
      <Alert><Info className="h-4 w-4" /><AlertDescription>Paste questions in structured format. See examples below for each question type.</AlertDescription></Alert>

      <Accordion type="single" collapsible>
        <AccordionItem value="examples">
          <AccordionTrigger className="text-sm">Format examples (all 7 types)</AccordionTrigger>
          <AccordionContent>
            <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{`TYPE: mcq
MARKS: 1
QUESTION: What is the primary objective of financial accounting?
A. Information for internal management
B. Information to external stakeholders *
C. Calculate taxable income
D. Prepare budgets
EXPLANATION: Financial accounting focuses on external reporting.

TYPE: numerical
MARKS: 2
QUESTION: Calculate NPV if PV inflows = 15000, outflow = 12000
ANSWER: 3000
TOLERANCE: 0

TYPE: true_false
MARKS: 1
QUESTION: The going concern assumption means a business will continue indefinitely.
ANSWER: True

TYPE: subjective
MARKS: 5
QUESTION: Explain the concept of materiality in financial reporting.
MODEL_ANSWER: Materiality means information is material if omitting it could influence decisions.`}</pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Textarea value={text} onChange={(e) => { setText(e.target.value); setIsParsed(false); }} placeholder="Paste your formatted questions here..." className="min-h-[300px] font-mono text-sm" />

      <Button onClick={handleParse} disabled={!text.trim()}>Parse & Preview</Button>

      {isParsed && (
        <>
          <Alert variant={errors.length > 0 ? "destructive" : "default"}>
            {errors.length > 0 ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            <AlertDescription>Found {parsed.length} questions · {errors.length} errors</AlertDescription>
          </Alert>

          {parsed.length > 0 && (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Options</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.map((q, i) => (
                      <TableRow key={i} className={q._error ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                        <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{q.type}</Badge></TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm">{q.question_text}</TableCell>
                        <TableCell className="text-center font-mono">{q.marks}</TableCell>
                        <TableCell className="text-center font-mono">{q.options?.length ?? "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setParsed(parsed.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button onClick={handleImport} disabled={batchInsert.isPending}>
                {batchInsert.isPending ? "Importing..." : `Import ${parsed.length} Questions`}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
