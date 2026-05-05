"use client";

import { useState } from "react";
import { useBankQuestions } from "@/hooks/useBankQuestions";
import { useAddFromBank } from "@/hooks/useQuestions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Database, Plus, RefreshCw } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function QuestionBankSelector({ quizId, subjectId }: { quizId: string; subjectId?: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const addFromBank = useAddFromBank(quizId);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useBankQuestions({ search, subject_id: subjectId });
  const { ref, inView } = useInView();

  useEffect(() => { if (inView && hasNextPage) fetchNextPage(); }, [inView, hasNextPage, fetchNextPage]);

  const questions = data?.pages.flatMap((p) => p.data) ?? [];

  const handleAdd = () => {
    addFromBank.mutate(Array.from(selected), {
      onSuccess: () => setSelected(new Set())
    });
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="p-3 border-b bg-muted/30 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search question bank..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background" />
        </div>
        <Button onClick={handleAdd} disabled={selected.size === 0 || addFromBank.isPending}>
          <Database className="mr-2 h-4 w-4" />
          Add Selected ({selected.size})
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">
          {status === "pending" ? (
            <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No questions found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search.</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              <div className="flex items-center gap-3 p-2 border-b mb-2">
                <Checkbox checked={selected.size === questions.length && questions.length > 0} onCheckedChange={(c) => setSelected(c ? new Set(questions.map(q => q.id)) : new Set())} />
                <span className="text-xs font-medium text-muted-foreground uppercase">Select All</span>
              </div>
              
              {questions.map((q) => (
                <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-colors">
                  <Checkbox className="mt-1" checked={selected.has(q.id)} onCheckedChange={(c) => { const next = new Set(selected); if (c) next.add(q.id); else next.delete(q.id); setSelected(next); }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{q.question_text}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">{q.type.replace("_", " ")}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{q.difficulty}</Badge>
                      <span className="text-[10px] text-muted-foreground">{q.marks} mark{q.marks !== 1 && "s"}</span>
                      {q.is_verified && <Badge className="bg-green-500/10 text-green-700 text-[10px] border-green-500/20 px-1 py-0"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>}
                    </div>
                  </div>
                </div>
              ))}
              
              <div ref={ref} className="py-4 text-center">
                {isFetchingNextPage ? <RefreshCw className="h-4 w-4 animate-spin mx-auto text-muted-foreground" /> : hasNextPage ? "Scroll for more" : "End of results"}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
