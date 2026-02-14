import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Download, FileJson, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getAllModules, createModule, updateModule, deleteModule, reorderModules } from "@/lib/api";
import { exportToCSV, exportToJSON, prepareModulesForExport, flattenForCSV } from "@/lib/export";
import { toast } from "sonner";

interface Module {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [form, setForm] = useState({ name: "", description: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchModules = async () => {
    console.log('[ModulesPage] Fetching modules...');
    setLoading(true);
    try {
      const res = await getAllModules();
      console.log('[ModulesPage] Modules fetched:', res);
      const modulesData = res.data || res;
      setModules(Array.isArray(modulesData) ? modulesData : []);
      console.log('[ModulesPage] Modules set:', Array.isArray(modulesData) ? modulesData.length : 0);
    } catch (error: any) { 
      console.error('[ModulesPage] Failed to load modules:', error);
      toast.error("Failed to load modules: " + (error.message || 'Unknown error')); 
    }
    setLoading(false);
  };

  useEffect(() => { 
    console.log('[ModulesPage] Component mounted, fetching modules...');
    fetchModules(); 
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (m: Module) => {
    setEditing(m);
    setForm({ name: m.name, description: m.description || "", isActive: m.isActive });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const data = { name: form.name, description: form.description, isActive: form.isActive };
      if (editing) {
        await updateModule(editing.id, data);
        toast.success("Module updated");
      } else {
        await createModule({ ...data, order: modules.length + 1 });
        toast.success("Module created");
      }
      setDialogOpen(false);
      fetchModules();
    } catch (err: any) { toast.error(err.message || "Failed to save"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this module?")) return;
    try {
      await deleteModule(id);
      toast.success("Module deleted");
      fetchModules();
    } catch (err: any) { toast.error(err.message || "Failed to delete"); }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...modules];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    setModules(items);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    const moduleOrders = modules.map((m, idx) => ({
      moduleId: m.id,
      order: idx + 1,
    }));

    try {
      await reorderModules(moduleOrders);
      toast.success("Modules reordered");
      fetchModules();
    } catch (err: any) {
      toast.error(err.message || "Failed to reorder");
      fetchModules(); // Revert
    }
    setDraggedIndex(null);
  };

  const handleExportCSV = () => {
    const data = prepareModulesForExport(modules);
    exportToCSV(flattenForCSV(data), 'modules');
    toast.success("Modules exported to CSV");
  };

  const handleExportJSON = () => {
    exportToJSON(modules, 'modules');
    toast.success("Modules exported to JSON");
  };

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Modules</h1>
          <p className="page-subtitle">Group problems into learning modules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <FileJson className="w-4 h-4 mr-2" />JSON
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create Module</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Module" : "Create Module"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Arrays & Strings" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <div className="space-y-0.5">
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">Make this module visible to students</p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm(f => ({ ...f, isActive: checked }))}
                  />
                </div>
                <Button onClick={handleSave} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editing ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left p-4 font-medium w-12"></th>
              <th className="text-left p-4 font-medium">Order</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Description</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : modules.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No modules yet. Create one to get started.</td></tr>
            ) : (
              modules.map((m, index) => (
                <tr 
                  key={m.id} 
                  className="table-row-hover border-b border-border/50 cursor-move"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <td className="p-4">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </td>
                  <td className="p-4 text-muted-foreground">#{m.order}</td>
                  <td className="p-4 font-medium text-foreground">{m.name}</td>
                  <td className="p-4 text-muted-foreground max-w-xs truncate">{m.description || "—"}</td>
                  <td className="p-4">
                    <Badge variant={m.isActive ? "default" : "secondary"} className="text-xs">
                      {m.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
