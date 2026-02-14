import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical, Trophy, Users, BarChart3, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getContest,
  getAllProblems,
  addProblemToContest,
  removeProblemFromContest,
  reorderContestProblems,
  getContestLeaderboard,
  getContestSubmissions,
} from "@/lib/api";
import { toast } from "sonner";

interface ContestProblem {
  id: string;
  problemId: string;
  order: number;
  points: number;
  label: string;
  problem: {
    id: string;
    title: string;
    difficulty: string;
  };
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-secondary/10 text-secondary",
  LIVE: "bg-success/10 text-success",
  COMPLETED: "bg-primary/10 text-primary",
};

const diffColor: Record<string, string> = {
  EASY: "bg-success/10 text-success",
  MEDIUM: "bg-warning/10 text-warning",
  HARD: "bg-destructive/10 text-destructive",
};

const submissionStatusColor: Record<string, string> = {
  ACCEPTED: "bg-success/10 text-success",
  WRONG_ANSWER: "bg-destructive/10 text-destructive",
  TIME_LIMIT_EXCEEDED: "bg-warning/10 text-warning",
  RUNTIME_ERROR: "bg-destructive/10 text-destructive",
  COMPILATION_ERROR: "bg-muted text-muted-foreground",
};

export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("problems");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ problemId: "", points: "100", label: "A" });
  const [saving, setSaving] = useState(false);
  const [leaderboardFetched, setLeaderboardFetched] = useState(false);
  const [submissionsFetched, setSubmissionsFetched] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchContest = async () => {
    if (!id) return;
    console.log('[ContestDetailPage] Fetching contest:', id);
    setLoading(true);
    try {
      const res = await getContest(id);
      console.log('[ContestDetailPage] Contest fetched:', res);
      setContest(res.data);
    } catch (err: any) {
      console.error('[ContestDetailPage] Failed to load contest:', err);
      toast.error(err.message || "Failed to load contest");
    }
    setLoading(false);
  };

  const fetchLeaderboard = async () => {
    if (!id) return;
    console.log('[ContestDetailPage] Fetching leaderboard for contest:', id);
    try {
      const res = await getContestLeaderboard(id);
      console.log('[ContestDetailPage] Leaderboard fetched:', res);
      const leaderboardData = res.data?.leaderboard || res.data || [];
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
      setLeaderboardFetched(true);
    } catch (err: any) {
      console.error('[ContestDetailPage] Failed to load leaderboard:', err);
      toast.error(err.message || "Failed to load leaderboard");
      setLeaderboardFetched(true);
    }
  };

  const fetchSubmissions = async () => {
    if (!id) return;
    console.log('[ContestDetailPage] Fetching submissions for contest:', id);
    try {
      const res = await getContestSubmissions(id);
      console.log('[ContestDetailPage] Submissions fetched:', res);
      const submissionsData = res.data?.submissions || res.data || [];
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setSubmissionsFetched(true);
    } catch (err: any) {
      console.error('[ContestDetailPage] Failed to load submissions:', err);
      toast.error(err.message || "Failed to load submissions");
      setSubmissionsFetched(true);
    }
  };

  const fetchAllProblems = async () => {
    console.log('[ContestDetailPage] Fetching all problems...');
    try {
      const res = await getAllProblems();
      console.log('[ContestDetailPage] Problems fetched:', res);
      const problemsData = res.data?.problems || res.data || [];
      setAllProblems(Array.isArray(problemsData) ? problemsData : []);
    } catch (err: any) {
      console.error('[ContestDetailPage] Failed to load problems:', err);
      toast.error(err.message || "Failed to load problems");
    }
  };

  useEffect(() => {
    console.log('[ContestDetailPage] Component mounted with id:', id);
    fetchContest();
  }, [id]);

  useEffect(() => {
    console.log('[ContestDetailPage] Tab changed to:', activeTab);
    if (activeTab === "leaderboard" && !leaderboardFetched) fetchLeaderboard();
    if (activeTab === "submissions" && !submissionsFetched) fetchSubmissions();
  }, [activeTab]);

  const openAddProblem = () => {
    fetchAllProblems();
    const nextLabel = String.fromCharCode(65 + (contest?.problems?.length || 0));
    setAddForm({ problemId: "", points: "100", label: nextLabel });
    setAddDialogOpen(true);
  };

  const handleAddProblem = async () => {
    if (!addForm.problemId) return toast.error("Please select a problem");
    if (!id) return;
    setSaving(true);
    try {
      await addProblemToContest(id, {
        problemId: addForm.problemId,
        points: parseInt(addForm.points),
        label: addForm.label,
      });
      toast.success("Problem added to contest");
      setAddDialogOpen(false);
      fetchContest();
    } catch (err: any) {
      toast.error(err.message || "Failed to add problem");
    }
    setSaving(false);
  };

  const handleRemoveProblem = async (problemId: string) => {
    if (!confirm("Remove this problem from the contest?")) return;
    if (!id) return;
    try {
      await removeProblemFromContest(id, problemId);
      toast.success("Problem removed");
      fetchContest();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove problem");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...(contest?.problems || [])];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    setContest({ ...contest, problems: items });
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || !id) return;
    const problemOrders = (contest?.problems || []).map((cp: ContestProblem, idx: number) => ({
      problemId: cp.problemId,
      order: idx + 1,
    }));

    try {
      await reorderContestProblems(id, problemOrders);
      toast.success("Problems reordered");
      fetchContest();
    } catch (err: any) {
      toast.error(err.message || "Failed to reorder");
      fetchContest(); // Revert
    }
    setDraggedIndex(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Contest not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/contests")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Contests
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/contests")} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="page-title">{contest.title}</h1>
              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${statusColor[contest.status] || ""}`}>
                {contest.status}
              </span>
              <Badge variant="outline">{contest.visibility}</Badge>
            </div>
            {contest.description && <p className="page-subtitle">{contest.description}</p>}
            <div className="flex items-center gap-6 text-sm text-muted-foreground mt-3">
              <span>⏱ {contest.duration} min</span>
              <span>📅 {new Date(contest.startTime).toLocaleString()}</span>
              <span>🏁 {new Date(contest.endTime).toLocaleString()}</span>
              {contest._count?.problems !== undefined && <span>📝 {contest._count.problems} problems</span>}
              {contest._count?.registrations !== undefined && <span><Users className="w-4 h-4 inline" /> {contest._count.registrations} registered</span>}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Contest Problems</h2>
            {contest.status === "DRAFT" && (
              <Button onClick={openAddProblem}>
                <Plus className="w-4 h-4 mr-2" />Add Problem
              </Button>
            )}
          </div>

          {!contest.problems || contest.problems.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No problems added yet. Click "Add Problem" to start.
            </div>
          ) : (
            <div className="space-y-3">
              {contest.problems.map((cp: ContestProblem, index: number) => (
                <div
                  key={cp.id}
                  draggable={contest.status === "DRAFT"}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="glass-card p-4 flex items-center gap-4 cursor-move hover:border-primary/50 transition-colors"
                >
                  {contest.status === "DRAFT" && <GripVertical className="w-5 h-5 text-muted-foreground" />}
                  <Badge variant="secondary" className="text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full">
                    {cp.label}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{cp.problem.title}</h3>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${diffColor[cp.problem.difficulty] || ""}`}>
                        {cp.problem.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Trophy className="w-4 h-4 inline mr-1" />{cp.points} pts
                  </div>
                  {contest.status === "DRAFT" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProblem(cp.problemId)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            <Button variant="outline" size="sm" onClick={fetchLeaderboard}>
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </Button>
          </div>

          {leaderboard.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No leaderboard data yet.
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-4 font-medium">Rank</th>
                    <th className="text-left p-4 font-medium">Student</th>
                    <th className="text-right p-4 font-medium">Score</th>
                    <th className="text-right p-4 font-medium">Solved</th>
                    <th className="text-right p-4 font-medium">Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry: any, idx: number) => (
                    <tr key={entry.studentId || idx} className="table-row-hover border-b border-border/50">
                      <td className="p-4 font-bold">#{idx + 1}</td>
                      <td className="p-4 font-medium text-foreground">{entry.student?.name || entry.student?.email || "—"}</td>
                      <td className="p-4 text-right font-semibold">{entry.score || 0}</td>
                      <td className="p-4 text-right">{entry.problemsSolved || 0}</td>
                      <td className="p-4 text-right text-muted-foreground">{entry.penalty || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Contest Submissions</h2>
            <Button variant="outline" size="sm" onClick={fetchSubmissions}>
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </Button>
          </div>

          {submissions.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No submissions yet.
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-4 font-medium">Student</th>
                    <th className="text-left p-4 font-medium">Problem</th>
                    <th className="text-left p-4 font-medium">Language</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub: any) => (
                    <tr key={sub.id} className="table-row-hover border-b border-border/50">
                      <td className="p-4 font-medium text-foreground">{sub.student?.name || sub.student?.email || "—"}</td>
                      <td className="p-4">{sub.problem?.title || "—"}</td>
                      <td className="p-4"><Badge variant="outline" className="text-xs">{sub.language}</Badge></td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${submissionStatusColor[sub.status] || "bg-muted text-muted-foreground"}`}>
                          {sub.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Problem Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Problem to Contest</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Problem</Label>
              <Select value={addForm.problemId} onValueChange={(v) => setAddForm({ ...addForm, problemId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a problem" /></SelectTrigger>
                <SelectContent>
                  {allProblems
                    .filter((p: any) => !contest.problems?.some((cp: ContestProblem) => cp.problemId === p.id))
                    .map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} ({p.difficulty})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label (A, B, C...)</Label>
                <Input value={addForm.label} onChange={(e) => setAddForm({ ...addForm, label: e.target.value })} maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label>Points</Label>
                <Input type="number" value={addForm.points} onChange={(e) => setAddForm({ ...addForm, points: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAddProblem} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Add Problem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
