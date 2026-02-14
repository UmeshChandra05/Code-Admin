import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Loader2, Send, RefreshCw, Trophy, Users, Eye, Download, FileJson, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getAllContests, createContest, updateContest, deleteContest, publishContest, updateContestStatuses, getContest, getAllModules, getAllProblems } from "@/lib/api";
import { exportToCSV, exportToJSON, prepareContestsForExport, flattenForCSV } from "@/lib/export";
import { toast } from "sonner";

interface Contest {
  id: string;
  title: string;
  description?: string;
  status: string;
  visibility: string;
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
  totalPoints?: number;
  _count?: { registrations?: number; problems?: number };
  problems?: any[];
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-secondary/10 text-secondary",
  LIVE: "bg-success/10 text-success",
  COMPLETED: "bg-primary/10 text-primary",
};

export default function ContestsPage() {
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [problemFilter, setProblemFilter] = useState("all");
  const [modules, setModules] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", rules: "", visibility: "PUBLIC",
    startTime: "", endTime: "", duration: "120", maxAttempts: "10",
    penaltyTime: "20", showLeaderboard: true, freezeTime: "15", accessCode: "",
  });

  const fetchContests = async () => {
    console.log('[ContestsPage] Fetching contests...');
    setLoading(true);
    try {
      const res = await getAllContests();
      console.log('[ContestsPage] Contests fetched:', res);
      const contestsData = res.data?.contests || res.data || res;
      setContests(Array.isArray(contestsData) ? contestsData : []);
      console.log('[ContestsPage] Contests set:', Array.isArray(contestsData) ? contestsData.length : 0);
    } catch (error: any) { 
      console.error('[ContestsPage] Failed to load contests:', error);
      toast.error("Failed to load contests: " + (error.message || 'Unknown error')); 
    }
    setLoading(false);
  };

  useEffect(() => { 
    console.log('[ContestsPage] Component mounted, fetching contests...');
    fetchContests(); 
  }, []);

  useEffect(() => {
    // Fetch modules and problems for filters
    const fetchFilters = async () => {
      try {
        const [modulesRes, problemsRes] = await Promise.allSettled([
          getAllModules(),
          getAllProblems({ limit: "500" }),
        ]);
        
        if (modulesRes.status === "fulfilled") {
          const modulesData = modulesRes.value.data?.modules || modulesRes.value.data || [];
          setModules(Array.isArray(modulesData) ? modulesData : []);
        }
        
        if (problemsRes.status === "fulfilled") {
          const problemsData = problemsRes.value.data?.problems || problemsRes.value.data || [];
          setProblems(Array.isArray(problemsData) ? problemsData : []);
        }
      } catch (error) {
        console.error('[ContestsPage] Failed to load filters:', error);
      }
    };
    fetchFilters();
  }, []);

  const openCreate = () => {
    setEditingContest(null);
    const now = new Date();
    const start = new Date(now.getTime() + 86400000);
    const end = new Date(start.getTime() + 7200000);
    setForm({
      title: "", description: "", rules: "", visibility: "PUBLIC",
      startTime: start.toISOString().slice(0, 16),
      endTime: end.toISOString().slice(0, 16),
      duration: "120", maxAttempts: "10", penaltyTime: "20",
      showLeaderboard: true, freezeTime: "15", accessCode: "",
    });
    setDialogOpen(true);
  };

  const openEdit = async (contest: Contest) => {
    if (contest.status !== "DRAFT") {
      return toast.error("Only DRAFT lab exams can be edited");
    }
    try {
      const res = await getContest(contest.id);
      const c = res.data;
      setEditingContest(c);
      setForm({
        title: c.title || "",
        description: c.description || "",
        rules: c.rules || "",
        visibility: c.visibility || "PUBLIC",
        startTime: new Date(c.startTime).toISOString().slice(0, 16),
        endTime: new Date(c.endTime).toISOString().slice(0, 16),
        duration: String(c.duration || 120),
        maxAttempts: String(c.maxAttempts || 10),
        penaltyTime: String(c.penaltyTime || 20),
        showLeaderboard: c.showLeaderboard !== false,
        freezeTime: String(c.freezeTime || 15),
        accessCode: c.accessCode || "",
      });
      setDialogOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load lab exam");
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const data: any = {
        title: form.title, description: form.description, rules: form.rules,
        visibility: form.visibility,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        duration: parseInt(form.duration),
        maxAttempts: parseInt(form.maxAttempts) || undefined,
        penaltyTime: parseInt(form.penaltyTime) || undefined,
        showLeaderboard: form.showLeaderboard,
        freezeTime: parseInt(form.freezeTime) || undefined,
      };
      if (form.visibility === "PRIVATE" && form.accessCode) data.accessCode = form.accessCode;
      
      if (editingContest) {
        await updateContest(editingContest.id, data);
        toast.success("Lab exam updated");
      } else {
        await createContest(data);
        toast.success("Lab exam created");
      }
      
      setDialogOpen(false);
      fetchContests();
    } catch (err: any) { 
      toast.error(err.message || `Failed to ${editingContest ? 'update' : 'create'}`); 
    }
    setSaving(false);
  };

  const handlePublish = async (id: string) => {
    try { await publishContest(id); toast.success("Published!"); fetchContests(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateStatuses = async () => {
    try { await updateContestStatuses(); toast.success("Statuses updated"); fetchContests(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lab exam?")) return;
    try { await deleteContest(id); toast.success("Deleted"); fetchContests(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleExportCSV = () => {
    const data = prepareContestsForExport(contests);
    exportToCSV(flattenForCSV(data), 'contests');
    toast.success("Lab exams exported to CSV");
  };

  const handleExportJSON = () => {
    exportToJSON(contests, 'contests');
    toast.success("Lab exams exported to JSON");
  };

  // Filter contests based on module and problem filters
  const filteredContests = contests.filter((contest) => {
    // Filter by module
    if (moduleFilter !== "all") {
      const hasModuleProblems = contest.problems?.some((cp: any) => 
        cp.problem?.moduleId === moduleFilter
      );
      if (!hasModuleProblems) return false;
    }
    
    // Filter by problem
    if (problemFilter !== "all") {
      const hasProblem = contest.problems?.some((cp: any) => 
        cp.problem?.id === problemFilter
      );
      if (!hasProblem) return false;
    }
    
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Lab Exams</h1>
          <p className="page-subtitle">Manage timed coding assessments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <FileJson className="w-4 h-4 mr-2" />JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleUpdateStatuses}>
            <RefreshCw className="w-4 h-4 mr-2" />Update Statuses
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create Lab Exam</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingContest ? 'Edit Lab Exam' : 'Create Lab Exam'}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Weekly Challenge #1" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Rules</Label>
                  <Textarea value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <Select value={form.visibility} onValueChange={v => setForm(f => ({ ...f, visibility: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                  </div>
                </div>
                {form.visibility === "PRIVATE" && (
                  <div className="space-y-2">
                    <Label>Access Code</Label>
                    <Input value={form.accessCode} onChange={e => setForm(f => ({ ...f, accessCode: e.target.value }))} placeholder="SECRET2026" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Max Attempts</Label>
                    <Input type="number" value={form.maxAttempts} onChange={e => setForm(f => ({ ...f, maxAttempts: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Penalty Time</Label>
                    <Input type="number" value={form.penaltyTime} onChange={e => setForm(f => ({ ...f, penaltyTime: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Freeze Time</Label>
                    <Input type="number" value={form.freezeTime} onChange={e => setForm(f => ({ ...f, freezeTime: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.showLeaderboard} onCheckedChange={v => setForm(f => ({ ...f, showLeaderboard: v }))} />
                  <Label>Show Leaderboard</Label>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingContest ? 'Update Lab Exam' : 'Create Lab Exam'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Filters */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Filter by Module</Label>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Filter by Problem</Label>
            <Select value={problemFilter} onValueChange={setProblemFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Problems" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Problems</SelectItem>
                {problems.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(moduleFilter !== "all" || problemFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setModuleFilter("all"); setProblemFilter("all"); }}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4">
        {loading ? (
          <div className="glass-card p-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredContests.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            {contests.length === 0 ? "No lab exams yet." : "No lab exams match the selected filters."}
          </div>
        ) : (
          filteredContests.map((c, i) => (
            <div key={c.id} className="glass-card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{c.title}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${statusColor[c.status] || ""}`}>{c.status}</span>
                    <Badge variant="outline" className="text-xs">{c.visibility}</Badge>
                  </div>
                  {c.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <span>⏱ {c.duration} min</span>
                    <span>📅 {new Date(c.startTime).toLocaleDateString()}</span>
                    <span>{new Date(c.startTime).toLocaleTimeString()} – {new Date(c.endTime).toLocaleTimeString()}</span>
                    {c._count?.problems !== undefined && <span>📝 {c._count.problems} problems</span>}
                    {c.totalPoints !== undefined && (
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 inline" /> {c.totalPoints} points
                      </span>
                    )}
                    {c._count?.registrations !== undefined && <span><Users className="w-3 h-3 inline" /> {c._count.registrations}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/contests/${c.id}`)} title="View Details">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Edit Lab Exam">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {(c.status === "LIVE" || c.status === "COMPLETED") && (
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/leaderboard/${c.id}`)} title="View Leaderboard">
                      <Trophy className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/contests/${c.id}?tab=submissions`)} title="View Submissions">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  {c.status === "DRAFT" && (
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePublish(c.id)} title="Publish Lab Exam">
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                  {c.status === "DRAFT" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(c.id)} title="Delete Lab Exam">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
