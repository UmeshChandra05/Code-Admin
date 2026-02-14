import { useState } from "react";
import { Plus, Trash2, Pencil, Loader2, Upload, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addTestCase, bulkAddTestCases, updateTestCase, deleteTestCase } from "@/lib/api";
import { toast } from "sonner";

interface TestCase {
  id: string;
  input: string;
  output: string;
  isHidden: boolean;
  isSample: boolean;
  order: number;
  weight: number;
}

interface Props {
  problemId: string;
  testCases: TestCase[];
  onRefresh: () => void;
}

const emptyTC = { input: "", output: "", isHidden: false, isSample: false, order: 0, weight: 1 };

export default function TestCasesTab({ problemId, testCases, onRefresh }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TestCase | null>(null);
  const [form, setForm] = useState(emptyTC);
  const [bulkJson, setBulkJson] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyTC, order: testCases.length });
    setDialogOpen(true);
  };

  const openEdit = (tc: TestCase) => {
    setEditing(tc);
    setForm({ input: tc.input, output: tc.output, isHidden: tc.isHidden, isSample: tc.isSample, order: tc.order, weight: tc.weight });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.input.trim() || !form.output.trim()) return toast.error("Input and output are required");
    setSaving(true);
    try {
      if (editing) {
        await updateTestCase(editing.id, form);
        toast.success("Test case updated");
      } else {
        await addTestCase(problemId, form);
        toast.success("Test case added");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
    setSaving(false);
  };

  const handleDelete = async (tcId: string) => {
    if (!confirm("Delete this test case?")) return;
    try { await deleteTestCase(tcId); toast.success("Deleted"); onRefresh(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleBulkAdd = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(bulkJson);
      const cases = Array.isArray(parsed) ? parsed : parsed.testCases;
      if (!Array.isArray(cases) || cases.length === 0) throw new Error("Invalid format");
      await bulkAddTestCases(problemId, cases);
      toast.success(`${cases.length} test cases added`);
      setBulkDialogOpen(false);
      setBulkJson("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Invalid JSON format");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Test Cases ({testCases.length})</h3>
          <p className="text-sm text-muted-foreground">Manage inputs and expected outputs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />Bulk Add
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />Add Test Case
          </Button>
        </div>
      </div>

      {/* Test cases list */}
      {testCases.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No test cases yet. Add your first test case.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {testCases
            .sort((a, b) => a.order - b.order)
            .map((tc, i) => (
              <div key={tc.id} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">#{tc.order + 1}</Badge>
                      {tc.isSample && <Badge className="text-xs bg-primary/20 text-primary">Sample</Badge>}
                      {tc.isHidden ? (
                        <Badge variant="secondary" className="text-xs gap-1"><EyeOff className="w-3 h-3" />Hidden</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1 text-success border-success/30"><Eye className="w-3 h-3" />Visible</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">Weight: {tc.weight}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Input</p>
                        <pre className="bg-muted/50 p-3 rounded-md text-xs font-mono overflow-x-auto max-h-32 whitespace-pre-wrap">{tc.input}</pre>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Expected Output</p>
                        <pre className="bg-muted/50 p-3 rounded-md text-xs font-mono overflow-x-auto max-h-32 whitespace-pre-wrap">{tc.output}</pre>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(tc)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(tc.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Single test case dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Test Case" : "Add Test Case"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Input</Label>
                <Textarea value={form.input} onChange={e => setForm(f => ({ ...f, input: e.target.value }))} rows={6} className="font-mono text-xs" placeholder="4&#10;2 7 11 15&#10;9" />
              </div>
              <div className="space-y-2">
                <Label>Expected Output</Label>
                <Textarea value={form.output} onChange={e => setForm(f => ({ ...f, output: e.target.value }))} rows={6} className="font-mono text-xs" placeholder="0 1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order</Label>
                <Input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} min={0} />
              </div>
              <div className="space-y-2">
                <Label>Weight</Label>
                <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: parseInt(e.target.value) || 1 }))} min={1} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.isHidden} onCheckedChange={v => setForm(f => ({ ...f, isHidden: v }))} />
                <Label>Hidden</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isSample} onCheckedChange={v => setForm(f => ({ ...f, isSample: v }))} />
                <Label>Sample</Label>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? "Update" : "Add"} Test Case
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk add dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bulk Add Test Cases</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Paste a JSON array of test cases. Each object should have: <code className="text-xs bg-muted px-1 py-0.5 rounded">input</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">output</code>, and optional <code className="text-xs bg-muted px-1 py-0.5 rounded">isHidden</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">isSample</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">order</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">weight</code>.</p>
            <Textarea
              value={bulkJson}
              onChange={e => setBulkJson(e.target.value)}
              rows={12}
              className="font-mono text-xs"
              placeholder={`[\n  {\n    "input": "4\\n2 7 11 15\\n9",\n    "output": "0 1",\n    "isHidden": true,\n    "order": 0,\n    "weight": 1\n  }\n]`}
            />
            <Button onClick={handleBulkAdd} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add Test Cases
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}