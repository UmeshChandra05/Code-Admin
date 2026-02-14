import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Loader2, Eye, Pencil, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProblem, createProblem, updateProblem, getAllModules, getAllTags } from "@/lib/api";
import { toast } from "sonner";
import ProblemFormTab from "@/components/problems/ProblemFormTab";
import TestCasesTab from "@/components/problems/TestCasesTab";
import ProblemPreviewTab from "@/components/problems/ProblemPreviewTab";

export interface ProblemFormData {
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  explanation: string;
  difficulty: string;
  timeLimit: number;
  memoryLimit: number;
  starterCode: string;
  solutionCode: string;
  hints: string[];
  moduleId: string;
  tagIds: string[];
}

const emptyForm: ProblemFormData = {
  title: "", description: "", inputFormat: "", outputFormat: "", constraints: "",
  sampleInput: "", sampleOutput: "", explanation: "", difficulty: "EASY",
  timeLimit: 1000, memoryLimit: 256, starterCode: "", solutionCode: "",
  hints: [], moduleId: "", tagIds: [],
};

export default function ProblemEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [form, setForm] = useState<ProblemFormData>(emptyForm);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  const fetchMeta = useCallback(async () => {
    const [mRes, tRes] = await Promise.allSettled([getAllModules(), getAllTags()]);
    setModules(mRes.status === "fulfilled" ? (mRes.value.data || []) : []);
    setTags(tRes.status === "fulfilled" ? (tRes.value.data || []) : []);
  }, []);

  const fetchProblem = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await getProblem(id!);
      const p = res.data;
      setForm({
        title: p.title || "",
        description: p.description || "",
        inputFormat: p.inputFormat || "",
        outputFormat: p.outputFormat || "",
        constraints: p.constraints || "",
        sampleInput: p.sampleInput || "",
        sampleOutput: p.sampleOutput || "",
        explanation: p.explanation || "",
        difficulty: p.difficulty || "EASY",
        timeLimit: p.timeLimit || 1000,
        memoryLimit: p.memoryLimit || 256,
        starterCode: p.starterCode || "",
        solutionCode: p.solutionCode || "",
        hints: p.hints || [],
        moduleId: p.moduleId || "",
        tagIds: p.tags?.map((t: any) => t.id) || [],
      });
      setTestCases(p.testCases || []);
    } catch {
      toast.error("Failed to load problem");
      navigate("/admin/problems");
    }
    setLoading(false);
  }, [id, isNew, navigate]);

  useEffect(() => { fetchMeta(); fetchProblem(); }, [fetchMeta, fetchProblem]);

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.description.trim()) return toast.error("Description is required");
    setSaving(true);
    try {
      const data: any = {
        ...form,
        hints: form.hints.filter(Boolean),
      };
      if (!data.moduleId) delete data.moduleId;
      if (!data.tagIds.length) delete data.tagIds;

      if (isNew) {
        const res = await createProblem(data);
        toast.success("Problem created");
        navigate(`/admin/problems/${res.data?.id || res.data?.problem?.id}`, { replace: true });
      } else {
        await updateProblem(id!, data);
        toast.success("Problem updated");
        fetchProblem();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/problems")}>
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
          <div>
            <h1 className="page-title">{isNew ? "Create Problem" : "Edit Problem"}</h1>
            <p className="page-subtitle">{form.title || "Untitled Problem"}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {isNew ? "Create" : "Save"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="edit" className="gap-2"><Pencil className="w-4 h-4" />Editor</TabsTrigger>
          <TabsTrigger value="testcases" className="gap-2" disabled={isNew}><FlaskConical className="w-4 h-4" />Test Cases</TabsTrigger>
          <TabsTrigger value="preview" className="gap-2"><Eye className="w-4 h-4" />Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <ProblemFormTab form={form} setForm={setForm} modules={modules} tags={tags} />
        </TabsContent>

        <TabsContent value="testcases">
          <TestCasesTab problemId={id!} testCases={testCases} onRefresh={fetchProblem} />
        </TabsContent>

        <TabsContent value="preview">
          <ProblemPreviewTab form={form} testCases={testCases} modules={modules} tags={tags} />
        </TabsContent>
      </Tabs>
    </div>
  );
}