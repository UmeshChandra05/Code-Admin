import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import type { ProblemFormData } from "@/pages/ProblemEditorPage";
import MonacoEditor from "@monaco-editor/react";
import { useState } from "react";

interface Props {
  form: ProblemFormData;
  setForm: React.Dispatch<React.SetStateAction<ProblemFormData>>;
  modules: any[];
  tags: any[];
}

export default function ProblemFormTab({ form, setForm, modules, tags }: Props) {
  const [hintInput, setHintInput] = useState("");

  const update = (key: keyof ProblemFormData, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleTag = (tagId: string) => {
    setForm(f => ({
      ...f,
      tagIds: f.tagIds.includes(tagId) ? f.tagIds.filter(t => t !== tagId) : [...f.tagIds, tagId],
    }));
  };

  const addHint = () => {
    if (!hintInput.trim()) return;
    setForm(f => ({ ...f, hints: [...f.hints, hintInput.trim()] }));
    setHintInput("");
  };

  const removeHint = (i: number) => {
    setForm(f => ({ ...f, hints: f.hints.filter((_, idx) => idx !== i) }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content - left 2 cols */}
      <div className="lg:col-span-2 space-y-6">
        {/* Title & Difficulty */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="Two Sum" />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={v => update("difficulty", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Problem Statement</h3>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={6} placeholder="Describe the problem..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Input Format</Label>
              <Textarea value={form.inputFormat} onChange={e => update("inputFormat", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Textarea value={form.outputFormat} onChange={e => update("outputFormat", e.target.value)} rows={3} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Constraints</Label>
            <Textarea value={form.constraints} onChange={e => update("constraints", e.target.value)} rows={3} className="font-mono text-xs" />
          </div>
        </div>

        {/* Sample I/O */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sample I/O</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sample Input</Label>
              <Textarea value={form.sampleInput} onChange={e => update("sampleInput", e.target.value)} rows={4} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Sample Output</Label>
              <Textarea value={form.sampleOutput} onChange={e => update("sampleOutput", e.target.value)} rows={4} className="font-mono text-xs" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Explanation</Label>
            <Textarea value={form.explanation} onChange={e => update("explanation", e.target.value)} rows={3} />
          </div>
        </div>

        {/* Code Editors */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Code</h3>
          <div className="space-y-2">
            <Label>Starter Code</Label>
            <div className="border border-border rounded-lg overflow-hidden">
              <MonacoEditor
                height="200px"
                language="javascript"
                theme="vs-dark"
                value={form.starterCode}
                onChange={v => update("starterCode", v || "")}
                options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: "on", scrollBeyondLastLine: false, padding: { top: 8 } }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Solution Code</Label>
            <div className="border border-border rounded-lg overflow-hidden">
              <MonacoEditor
                height="250px"
                language="javascript"
                theme="vs-dark"
                value={form.solutionCode}
                onChange={v => update("solutionCode", v || "")}
                options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: "on", scrollBeyondLastLine: false, padding: { top: 8 } }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - right col */}
      <div className="space-y-6">
        {/* Limits */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Limits</h3>
          <div className="space-y-2">
            <Label>Time Limit (ms)</Label>
            <Input type="number" value={form.timeLimit} onChange={e => update("timeLimit", parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Memory Limit (MB)</Label>
            <Input type="number" value={form.memoryLimit} onChange={e => update("memoryLimit", parseInt(e.target.value) || 0)} />
          </div>
        </div>

        {/* Module */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Module</h3>
          <Select value={form.moduleId || "none"} onValueChange={v => update("moduleId", v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No module</SelectItem>
              {modules.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((t: any) => (
              <Badge
                key={t.id}
                variant={form.tagIds.includes(t.id) ? "default" : "outline"}
                className="cursor-pointer text-xs transition-colors"
                style={form.tagIds.includes(t.id) ? { backgroundColor: t.color, borderColor: t.color } : { borderColor: t.color, color: t.color }}
                onClick={() => toggleTag(t.id)}
              >
                {t.name}
              </Badge>
            ))}
            {tags.length === 0 && <p className="text-xs text-muted-foreground">No tags available</p>}
          </div>
        </div>

        {/* Hints */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hints</h3>
          <div className="space-y-2">
            {form.hints.map((h, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2 text-sm">
                <span className="flex-1">{h}</span>
                <button onClick={() => removeHint(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={hintInput} onChange={e => setHintInput(e.target.value)} placeholder="Add a hint..."
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addHint())} className="text-sm" />
            <Button variant="outline" size="sm" onClick={addHint}><Plus className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}