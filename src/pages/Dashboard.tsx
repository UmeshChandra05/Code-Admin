import { useEffect, useState } from "react";
import { Code2, Trophy, FileText, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllProblems, getAllContests, getSubmissionStats, getAllSubmissions } from "@/lib/api";
import { toast } from "sonner";

interface Stats {
  totalProblems: number;
  activeContests: number;
  totalSubmissions: number;
  acceptanceRate: number;
}

interface RecentSubmission {
  id: string;
  problem?: { title: string };
  student?: { name?: string; email?: string };
  language: string;
  status: string;
  createdAt: string;
}

const statusColor: Record<string, string> = {
  ACCEPTED: "bg-success/10 text-success",
  WRONG_ANSWER: "bg-destructive/10 text-destructive",
  TIME_LIMIT_EXCEEDED: "bg-warning/10 text-warning",
  RUNTIME_ERROR: "bg-destructive/10 text-destructive",
  COMPILATION_ERROR: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalProblems: 0, activeContests: 0, totalSubmissions: 0, acceptanceRate: 0 });
  const [recentSubs, setRecentSubs] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    console.log('[Dashboard] Fetching dashboard data...');
    setLoading(true);
    try {
      const [problems, contests, subStats, subs] = await Promise.allSettled([
        getAllProblems(),
        getAllContests(),
        getSubmissionStats(),
        getAllSubmissions({ limit: "8" }),
      ]);

      console.log('[Dashboard] Raw responses:', { problems, contests, subStats, subs });

      const p = problems.status === "fulfilled" ? problems.value : null;
      const c = contests.status === "fulfilled" ? contests.value : null;
      const ss = subStats.status === "fulfilled" ? subStats.value : null;
      const s = subs.status === "fulfilled" ? subs.value : null;

      // Extract data from nested structure
      const problemsData = p?.data?.problems || p?.data || [];
      const contestsData = c?.data?.contests || c?.data || [];
      const submissionsData = s?.data?.submissions || s?.data || [];
      const statsData = ss?.data || ss;

      console.log('[Dashboard] Processed data:', {
        problemsCount: Array.isArray(problemsData) ? problemsData.length : 0,
        contestsCount: Array.isArray(contestsData) ? contestsData.length : 0,
        submissionsCount: Array.isArray(submissionsData) ? submissionsData.length : 0,
        statsData
      });

      setStats({
        totalProblems: Array.isArray(problemsData) ? problemsData.length : (p?.data?.total || 0),
        activeContests: Array.isArray(contestsData) ? contestsData.filter((x: any) => x.status === "LIVE").length : 0,
        totalSubmissions: statsData?.total || submissionsData.length || 0,
        acceptanceRate: Math.round(statsData?.acceptanceRate || 0),
      });
      setRecentSubs(Array.isArray(submissionsData) ? submissionsData : []);
      
      console.log('[Dashboard] Stats set successfully');
    } catch (error: any) {
      console.error('[Dashboard] Failed to load dashboard data:', error);
      toast.error("Failed to load dashboard data: " + (error.message || 'Unknown error'));
    }
    setLoading(false);
  };

  useEffect(() => { 
    console.log('[Dashboard] Component mounted, fetching data...');
    fetchData(); 
  }, []);

  const statCards = [
    { label: "Total Problems", value: stats.totalProblems, icon: Code2, color: "text-primary" },
    { label: "Active Contests", value: stats.activeContests, icon: Trophy, color: "text-secondary" },
    { label: "Submissions", value: stats.totalSubmissions, icon: FileText, color: "text-chart-3" },
    { label: "Acceptance Rate", value: `${stats.acceptanceRate}%`, icon: TrendingUp, color: "text-chart-4" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your coding platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card, i) => (
          <div key={card.label} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-4 font-medium">Problem</th>
                <th className="text-left p-4 font-medium">Student</th>
                <th className="text-left p-4 font-medium">Language</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {loading ? "Loading..." : "No submissions yet. Connect to your backend to see data."}
                  </td>
                </tr>
              ) : (
                recentSubs.slice(0, 8).map((sub) => (
                  <tr key={sub.id} className="table-row-hover border-b border-border/50">
                    <td className="p-4 font-medium text-foreground">{sub.problem?.title || "—"}</td>
                    <td className="p-4 text-muted-foreground">{sub.student?.name || sub.student?.email || "—"}</td>
                    <td className="p-4"><Badge variant="outline" className="text-xs">{sub.language}</Badge></td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusColor[sub.status] || "bg-muted text-muted-foreground"}`}>
                        {sub.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
