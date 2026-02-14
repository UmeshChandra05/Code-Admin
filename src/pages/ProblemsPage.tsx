import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Loader2, Eye, ToggleLeft, ToggleRight, Save, X, Download, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { getAllProblems, deleteProblem, toggleProblemActive, getProblem, updateTestCase, deleteTestCase } from "@/lib/api";
import { exportToCSV, exportToJSON, prepareProblemsForExport, flattenForCSV } from "@/lib/export";
import { toast } from "sonner";

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  isActive: boolean;
  module?: { name: string };
  tags?: { id: string; name: string; color: string }[];
  createdAt: string;
}

const diffColor: Record<string, string> = {
  EASY: "bg-success/10 text-success",
  MEDIUM: "bg-warning/10 text-warning",
  HARD: "bg-destructive/10 text-destructive",
};

export default function ProblemsPage() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("all");
  const [detailProblem, setDetailProblem] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<any>(null);
  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testCaseForm, setTestCaseForm] = useState({
    input: "", output: "", explanation: "", isHidden: false, isSample: false, weight: "1"
  });

  const fetchData = async () => {
    console.log('[ProblemsPage] Fetching data with filters:', { search, diffFilter });
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (diffFilter !== "all") params.difficulty = diffFilter;
      
      const pRes = await getAllProblems(Object.keys(params).length > 0 ? params : undefined);
      
      console.log('[ProblemsPage] Raw response:', pRes);
      
      const problemsData = pRes.data?.problems || pRes.data || [];
      
      setProblems(Array.isArray(problemsData) ? problemsData : []);
      
      console.log('[ProblemsPage] Data set successfully:', {
        problems: problemsData.length
      });
    } catch (error: any) { 
      console.error('[ProblemsPage] Failed to load problems:', error);
      toast.error("Failed to load problems: " + (error.message || 'Unknown error')); 
    }
    setLoading(false);
  };

  useEffect(() => { 
    console.log('[ProblemsPage] Component mounted or filter changed');
    fetchData(); 
  }, [diffFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchData(); };

  const openCreate = () => {
    navigate("/admin/problems/new");
  };

  const openEdit = (problemId: string) => {
    navigate(`/admin/problems/${problemId}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this problem?")) return;
    try { await deleteProblem(id); toast.success("Deleted"); fetchData(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (id: string) => {
    try { await toggleProblemActive(id); toast.success("Toggled"); fetchData(); }
    catch (err: any) { toast.error(err.message); }
  };

  const viewDetail = async (id: string) => {
    try {
      const res = await getProblem(id);
      setDetailProblem(res.data);
      setSheetOpen(true);
    } catch { 
      toast.error("Failed to load problem"); 
    }
  };

  const openEditTestCase = (testCase: any) => {
    setEditingTestCase(testCase);
    setTestCaseForm({
      input: testCase.input || "",
      output: testCase.output || "",
      explanation: testCase.explanation || "",
      isHidden: testCase.isHidden || false,
      isSample: testCase.isSample || false,
      weight: String(testCase.weight || 1),
    });
    setTestCaseDialogOpen(true);
  };

  const handleSaveTestCase = async () => {
    if (!editingTestCase) return;
    setSaving(true);
    try {
      await updateTestCase(editingTestCase.id, {
        ...testCaseForm,
        weight: parseInt(testCaseForm.weight),
      });
      toast.success("Test case updated");
      setTestCaseDialogOpen(false);
      // Refresh problem detail
      if (detailProblem) {
        const res = await getProblem(detailProblem.id);
        setDetailProblem(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update test case");
    }
    setSaving(false);
  };

  const handleDeleteTestCase = async (testCaseId: string) => {
    if (!confirm("Delete this test case?")) return;
    try {
      await deleteTestCase(testCaseId);
      toast.success("Test case deleted");
      // Refresh problem detail
      if (detailProblem) {
        const res = await getProblem(detailProblem.id);
        setDetailProblem(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete test case");
    }
  };

  const handleExportCSV = () => {
    const data = prepareProblemsForExport(problems);
    exportToCSV(flattenForCSV(data), 'problems');
    toast.success("Problems exported to CSV");
  };

  const handleExportJSON = () => {
    exportToJSON(problems, 'problems');
    toast.success("Problems exported to JSON");
  };

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Problems</h1>
          <p className="page-subtitle">Manage coding challenges</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create Problem</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search problems..." />
        </form>
        <Select value={diffFilter} onValueChange={setDiffFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportJSON}>
          <FileJson className="w-4 h-4 mr-2" />JSON
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left p-4 font-medium">Title</th>
              <th className="text-left p-4 font-medium">Difficulty</th>
              <th className="text-left p-4 font-medium">Module</th>
              <th className="text-left p-4 font-medium">Tags</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : problems.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No problems found.</td></tr>
            ) : (
              problems.map(p => (
                <tr key={p.id} className="table-row-hover border-b border-border/50">
                  <td className="p-4 font-medium text-foreground">{p.title}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${diffColor[p.difficulty] || ""}`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{p.module?.name || "—"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {p.tags?.map(t => (
                        <Badge key={t.id} variant="outline" className="text-xs" style={{ borderColor: t.color, color: t.color }}>
                          {t.name}
                        </Badge>
                      )) || "—"}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={p.isActive ? "default" : "secondary"} className="text-xs">
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => viewDetail(p.id)} title="View Details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p.id)} title="Edit Problem">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(p.id)} title="Toggle Active">
                        {p.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="hover:text-destructive" title="Delete Problem">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto w-[600px] sm:max-w-xl">
          <SheetHeader><SheetTitle>{detailProblem?.title || "Problem"}</SheetTitle></SheetHeader>
          {detailProblem && (
            <div className="space-y-4 mt-4 text-sm">
              <div>
                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${diffColor[detailProblem.difficulty] || ""}`}>
                  {detailProblem.difficulty}
                </span>
              </div>
              <div><Label className="text-muted-foreground">Description</Label><p className="mt-1 text-foreground whitespace-pre-wrap">{detailProblem.description}</p></div>
              {detailProblem.constraints && <div><Label className="text-muted-foreground">Constraints</Label><pre className="mt-1 text-xs bg-muted p-3 rounded-md">{detailProblem.constraints}</pre></div>}
              {detailProblem.sampleInput && <div><Label className="text-muted-foreground">Sample Input</Label><pre className="mt-1 text-xs bg-muted p-3 rounded-md font-mono">{detailProblem.sampleInput}</pre></div>}
              {detailProblem.sampleOutput && <div><Label className="text-muted-foreground">Sample Output</Label><pre className="mt-1 text-xs bg-muted p-3 rounded-md font-mono">{detailProblem.sampleOutput}</pre></div>}
              {detailProblem.testCases?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Test Cases ({detailProblem.testCases.length})</Label>
                  <div className="space-y-2 mt-2">
                    {detailProblem.testCases.map((tc: any, i: number) => (
                      <div key={tc.id || i} className="bg-muted p-3 rounded-md text-xs relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                            {tc.isHidden && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
                            {tc.isSample && <Badge className="text-xs">Sample</Badge>}
                            {tc.weight && <Badge variant="outline" className="text-xs">Weight: {tc.weight}</Badge>}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditTestCase(tc)} title="Edit Test Case">
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-destructive" onClick={() => handleDeleteTestCase(tc.id)} title="Delete Test Case">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-mono text-[10px] break-all"><strong>Input:</strong> {tc.input?.substring(0, 100)}{tc.input?.length > 100 ? '...' : ''}</p>
                          <p className="font-mono text-[10px] break-all"><strong>Output:</strong> {tc.output?.substring(0, 100)}{tc.output?.length > 100 ? '...' : ''}</p>
                          {tc.explanation && <p className="text-[10px] text-muted-foreground"><strong>Explanation:</strong> {tc.explanation}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Test Case Edit Dialog */}
      <Dialog open={testCaseDialogOpen} onOpenChange={setTestCaseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Test Case</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Input</Label>
              <Textarea 
                value={testCaseForm.input} 
                onChange={e => setTestCaseForm(f => ({ ...f, input: e.target.value }))} 
                rows={4} 
                className="font-mono text-xs"
                placeholder="Test case input..."
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Output</Label>
              <Textarea 
                value={testCaseForm.output} 
                onChange={e => setTestCaseForm(f => ({ ...f, output: e.target.value }))} 
                rows={3} 
                className="font-mono text-xs"
                placeholder="Expected output..."
              />
            </div>
            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Textarea 
                value={testCaseForm.explanation} 
                onChange={e => setTestCaseForm(f => ({ ...f, explanation: e.target.value }))} 
                rows={2}
                placeholder="Explain the test case..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={testCaseForm.isHidden} 
                  onCheckedChange={v => setTestCaseForm(f => ({ ...f, isHidden: v }))} 
                />
                <Label>Hidden (not shown to students)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch 
                  checked={testCaseForm.isSample} 
                  onCheckedChange={v => setTestCaseForm(f => ({ ...f, isSample: v }))} 
                />
                <Label>Sample Test Case</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Weight</Label>
              <Input 
                type="number" 
                value={testCaseForm.weight} 
                onChange={e => setTestCaseForm(f => ({ ...f, weight: e.target.value }))}
                min="1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveTestCase} disabled={saving} className="flex-1">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <Save className="w-4 h-4 mr-2" />Save Changes
              </Button>
              <Button variant="outline" onClick={() => setTestCaseDialogOpen(false)} disabled={saving}>
                <X className="w-4 h-4 mr-2" />Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
