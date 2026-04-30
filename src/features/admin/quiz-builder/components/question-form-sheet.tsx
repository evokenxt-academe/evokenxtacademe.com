"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { QuestionBankItem } from "../types";
import { ManualQuestionForm } from "./manual-question-form";
import { PasteImportPanel } from "./paste-import-panel";
import { PdfUploadPanel } from "./pdf-upload-panel";

interface QuestionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuestion?: QuestionBankItem | null;
}

export function QuestionFormSheet({
  open,
  onOpenChange,
  editingQuestion,
}: QuestionFormSheetProps) {
  const [tab, setTab] = React.useState("manual");

  React.useEffect(() => {
    if (open) {
      setTab("manual");
    }
  }, [open, editingQuestion?.id]);

  const isEditing = !!editingQuestion;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
      >
        <SheetHeader className="border-b px-6 py-6 shadow-sm sticky top-0 bg-background z-10">
          <SheetTitle className="text-xl">
            {isEditing ? "Edit Question" : "Create New Question"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the selected question and save the changes back to the question bank."
              : "Create a single question, paste a bulk import, or extract a question set from PDF."}
          </SheetDescription>
        </SheetHeader>

        <div className="bg-muted/10 flex-1 flex flex-col">
          {isEditing ? (
            <div className="p-6">
              <ManualQuestionForm
                editingQuestion={editingQuestion}
                onSaved={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
              />
            </div>
          ) : (
            <Tabs
              value={tab}
              onValueChange={setTab}
              className="flex flex-col"
            >
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="paste">Paste Import</TabsTrigger>
                  <TabsTrigger value="pdf">PDF Import</TabsTrigger>
                </TabsList>
              </div>

              <div className="px-6 py-4">
                <TabsContent
                  value="manual"
                  className="mt-0"
                >
                  <ManualQuestionForm
                    onSaved={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                  />
                </TabsContent>

                <TabsContent value="paste" className="mt-0">
                  <PasteImportPanel onImported={() => onOpenChange(false)} />
                </TabsContent>

                <TabsContent value="pdf" className="mt-0">
                  <PdfUploadPanel onImported={() => onOpenChange(false)} />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
