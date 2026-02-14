import { Badge } from "@/components/ui/badge";
import MonacoEditor from "@monaco-editor/react";
import type { ProblemFormData } from "@/pages/ProblemEditorPage";

const diffColor: Record<string, string> = {
  EASY: "bg-success/10 text-success border-success/30",
  MEDIUM: "bg-warning/10 text-warning border-warning/30",
  HARD: "bg-destructive/10 text-destructive border-destructive/30",
};

interface Props {
  form: ProblemFormData;
  testCases: any[];
  modules: any[];
  tags: any[];
}

export default function ProblemPreviewTab({ form, testCases, modules, tags }: Props) {
  const module = modules.find(m => m.id === form.moduleId);
  const selectedTags = tags.filter(t => form.tagIds.includes(t.id));
  const sampleCases = testCases.filter(tc => tc.isSample);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold border ${diffColor[form.difficulty] || ""}`}>
            {form.difficulty}
          </span>
          {module && <Badge variant="outline">{module.name}</Badge>}
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
            <span>⏱ {form.timeLimit}ms</span>
            <span>💾 {form.memoryLimit}MB</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{form.title || "Untitled Problem"}</h1>
        {selectedTags.length > 0 && (
          <div className="flex gap-2 mt-3">
            {selectedTags.map(t => (
              <Badge key={t.id} variant="outline" className="text-xs" style={{ borderColor: t.color, color: t.color }}>
                {t.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {form.description && (
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
          <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{form.description}</div>
        </div>
      )}

      {/* I/O Format */}
      {(form.inputFormat || form.outputFormat) && (
        <div className="glass-card p-8 space-y-4">
          {form.inputFormat && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Input Format</h3>
              <div className="text-sm text-foreground/80 whitespace-pre-wrap">{form.inputFormat}</div>
            </div>
          )}
          {form.outputFormat && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Output Format</h3>
              <div className="text-sm text-foreground/80 whitespace-pre-wrap">{form.outputFormat}</div>
            </div>
          )}
        </div>
      )}

      {/* Constraints */}
      {form.constraints && (
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Constraints</h2>
          <pre className="text-sm bg-muted/50 p-4 rounded-lg font-mono whitespace-pre-wrap">{form.constraints}</pre>
        </div>
      )}

      {/* Sample I/O */}
      {(form.sampleInput || form.sampleOutput) && (
        <div className="glass-card p-8 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Sample</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.sampleInput && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Input</p>
                <pre className="bg-muted/50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">{form.sampleInput}</pre>
              </div>
            )}
            {form.sampleOutput && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Output</p>
                <pre className="bg-muted/50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">{form.sampleOutput}</pre>
              </div>
            )}
          </div>
          {form.explanation && (
            <div className="mt-4 p-4 rounded-lg border border-border bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground mb-1">Explanation</p>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{form.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Sample test cases from backend */}
      {sampleCases.length > 0 && (
        <div className="glass-card p-8 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Sample Test Cases</h2>
          {sampleCases.map((tc, i) => (
            <div key={tc.id} className="border border-border rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Sample #{i + 1}</p>
              <div className="grid grid-cols-2 gap-4">
                <pre className="bg-muted/50 p-3 rounded-md text-xs font-mono">{tc.input}</pre>
                <pre className="bg-muted/50 p-3 rounded-md text-xs font-mono">{tc.output}</pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Starter Code */}
      {form.starterCode && (
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Starter Code</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <MonacoEditor
              height="200px"
              language="javascript"
              theme="vs-dark"
              value={form.starterCode}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, padding: { top: 8 } }}
            />
          </div>
        </div>
      )}

      {/* Hints */}
      {form.hints.length > 0 && (
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Hints</h2>
          <div className="space-y-2">
            {form.hints.map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 text-sm">
                <span className="text-primary font-bold">💡</span>
                <span className="text-foreground/90">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}