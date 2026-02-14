import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Download, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getAllTags, createTag, updateTag, deleteTag } from "@/lib/api";
import { exportToCSV, exportToJSON, prepareTagsForExport, flattenForCSV } from "@/lib/export";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#a47764" });
  const [saving, setSaving] = useState(false);

  const fetchTags = async () => {
    console.log('[TagsPage] Fetching tags...');
    setLoading(true);
    try {
      const res = await getAllTags();
      console.log('[TagsPage] Tags fetched successfully:', res);
      // Handle different response structures
      const tagsData = res.data || res;
      setTags(Array.isArray(tagsData) ? tagsData : []);
      console.log('[TagsPage] Tags set:', Array.isArray(tagsData) ? tagsData.length : 0, 'tags');
    } catch (error: any) {
      console.error('[TagsPage] Failed to load tags:', error);
      toast.error("Failed to load tags: " + (error.message || 'Unknown error'));
    }
    setLoading(false);
  };

  useEffect(() => { 
    console.log('[TagsPage] Component mounted, fetching tags...');
    fetchTags(); 
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", color: "#a47764" });
    setDialogOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditing(tag);
    setForm({ name: tag.name, description: tag.description || "", color: tag.color || "#a47764" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      if (editing) {
        await updateTag(editing.id, form);
        toast.success("Tag updated");
      } else {
        await createTag(form);
        toast.success("Tag created");
      }
      setDialogOpen(false);
      fetchTags();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    try {
      await deleteTag(id);
      toast.success("Tag deleted");
      fetchTags();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleExportCSV = () => {
    const data = prepareTagsForExport(tags);
    exportToCSV(flattenForCSV(data), 'tags');
    toast.success("Tags exported to CSV");
  };

  const handleExportJSON = () => {
    exportToJSON(tags, 'tags');
    toast.success("Tags exported to JSON");
  };

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Tags</h1>
          <p className="page-subtitle">Organize problems with tags</p>
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
              <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create Tag</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Tag" : "Create Tag"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Dynamic Programming" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="flex-1" />
                  </div>
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
              <th className="text-left p-4 font-medium">Color</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Slug</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : tags.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No tags found. Create one to get started.</td></tr>
            ) : (
              tags.map(tag => (
                <tr key={tag.id} className="table-row-hover border-b border-border/50">
                  <td className="p-4">
                    <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: tag.color || "#a47764" }} />
                  </td>
                  <td className="p-4 font-medium text-foreground">{tag.name}</td>
                  <td className="p-4 text-muted-foreground">{tag.slug}</td>
                  <td className="p-4">
                    <Badge variant={tag.isActive ? "default" : "secondary"} className="text-xs">
                      {tag.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(tag)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)} className="hover:text-destructive">
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
    </div>
  );
}
