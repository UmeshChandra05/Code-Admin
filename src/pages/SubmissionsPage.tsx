import { useEffect, useState } from "react";
import { Trash2, Eye, RefreshCw, BarChart3, Download, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAllSubmissions, getSubmission, getSubmissionStats, deleteSubmission } from "@/lib/api";
import { exportToCSV, exportToJSON, prepareSubmissionsForExport, flattenForCSV } from "@/lib/export";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  ACCEPTED: "bg-success/10 text-success",
  WRONG_ANSWER: "bg-destructive/10 text-destructive",
  TIME_LIMIT_EXCEEDED: "bg-warning/10 text-warning",
  RUNTIME_ERROR: "bg-destructive/10 text-destructive",
  COMPILATION_ERROR: "bg-muted text-muted-foreground",
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = async () => {
    console.log('[SubmissionsPage] Fetching submissions with filter:', statusFilter);
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (statusFilter !== "all") params.status = statusFilter;
      
      const [sRes, stRes] = await Promise.allSettled([
        getAllSubmissions(Object.keys(params).length > 0 ? params : undefined),
        getSubmissionStats(),
      ]);
      
      console.log('[SubmissionsPage] Raw responses:', { sRes, stRes });
      
      const submissionsData = sRes.status === "fulfilled" 
        ? (sRes.value.data?.submissions || sRes.value.data || []) 
        : [];
      const statsData = stRes.status === "fulfilled" ? stRes.value.data : null;
      
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setStats(statsData);
      
      console.log('[SubmissionsPage] Data set:', { 
        submissions: submissionsData.length, 
        stats: statsData 
      });
    } catch (error: any) { 
      console.error('[SubmissionsPage] Failed to load submissions:', error);
      toast.error("Failed to load submissions: " + (error.message || 'Unknown error')); 
    }
    setLoading(false);
  };

  useEffect(() => { 
    console.log('[SubmissionsPage] Component mounted or filter changed');
    fetchData(); 
  }, [statusFilter]);

  const viewDetail = async (id: string) => {
    try {
      const res = await getSubmission(id);
      setDetail(res.data);
      setSheetOpen(true);
    } catch { toast.error("Failed to load submission"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    try { await deleteSubmission(id); toast.success("Deleted"); fetchData(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleExportCSV = () => {
    const data = prepareSubmissionsForExport(submissions);
    exportToCSV(flattenForCSV(data), 'submissions');
    toast.success("Submissions exported to CSV");
  };

  const handleExportJSON = () => {
    exportToJSON(submissions, 'submissions');
    toast.success("Submissions exported to JSON");
  };

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Submissions</h1>
          <p className="page-subtitle">Review all code submissions</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: stats.total || 0 },
            { label: "Accepted", value: stats.accepted || 0 },
            { label: "Acceptance Rate", value: `${stats.acceptanceRate || 0}%` },
            { label: "Avg Score", value: stats.averageScore || "—" },
          ].map((s, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="WRONG_ANSWER">Wrong Answer</SelectItem>
            <SelectItem value="TIME_LIMIT_EXCEEDED">TLE</SelectItem>
            <SelectItem value="RUNTIME_ERROR">Runtime Error</SelectItem>
            <SelectItem value="COMPILATION_ERROR">Compilation Error</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
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
              <th className="text-left p-4 font-medium">Problem</th>
              <th className="text-left p-4 font-medium">Student</th>
              <th className="text-left p-4 font-medium">Language</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Score</th>
              <th className="text-left p-4 font-medium">Time</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : submissions.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No submissions found.</td></tr>
            ) : (
              submissions.map(s => (
                <tr key={s.id} className="table-row-hover border-b border-border/50">
                  <td className="p-4 font-medium text-foreground">{s.problem?.title || "—"}</td>
                  <td className="p-4 text-muted-foreground">{s.student ? `${s.student.firstName || ''} ${s.student.lastName || ''}`.trim() || s.student.email || "—" : "—"}</td>
                  <td className="p-4"><Badge variant="outline" className="text-xs">{s.language}</Badge></td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${statusColor[s.status] || "bg-muted text-muted-foreground"}`}>
                      {s.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-foreground">{s.score ?? "—"}</td>
                  <td className="p-4 text-muted-foreground text-xs">{s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => viewDetail(s.id)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto w-[600px] sm:max-w-xl">
          <SheetHeader><SheetTitle>Submission Detail</SheetTitle></SheetHeader>
          {detail && (
            <div className="space-y-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${statusColor[detail.status] || ""}`}>
                  {detail.status?.replace(/_/g, " ")}
                </span>
                <Badge variant="outline">{detail.language}</Badge>
                {detail.score !== undefined && <Badge>Score: {detail.score}</Badge>}
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Problem: <span className="text-foreground font-medium">{detail.problem?.title || "—"}</span></p>
                <p className="text-muted-foreground">Student: <span className="text-foreground">{detail.student ? `${detail.student.firstName || ''} ${detail.student.lastName || ''}`.trim() || detail.student.email || "—" : "—"}</span></p>
              </div>
              {detail.code && (
                <div>
                  <p className="text-muted-foreground mb-1">Code</p>
                  <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto max-h-96">{detail.code}</pre>
                </div>
              )}
              {detail.executionTime && <p className="text-muted-foreground">Execution Time: <span className="text-foreground">{detail.executionTime}ms</span></p>}
              {detail.memoryUsed && <p className="text-muted-foreground">Memory: <span className="text-foreground">{detail.memoryUsed}MB</span></p>}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
