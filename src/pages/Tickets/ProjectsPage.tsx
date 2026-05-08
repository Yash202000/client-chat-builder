import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus, Ticket, FolderOpen, Users, BarChart3,
  Settings, MoreVertical, Trash2, Edit2, Loader2,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  key: string;
  description?: string;
  color?: string;
  icon?: string;
  ticket_counter: number;
  open_ticket_count?: number;
  created_at: string;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6',
];

function colorDot(color?: string) {
  return (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: color || '#6366f1' }}>
      <Ticket className="w-5 h-5 text-white" />
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', key: '', description: '', color: '#6366f1' });

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/tickets/projects', { headers: headers() });
      setProjects(res.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ name: '', key: '', description: '', color: '#6366f1' });
    setEditProject(null);
    setShowCreate(true);
  };

  const openEdit = (p: Project) => {
    setForm({ name: p.name, key: p.key, description: p.description || '', color: p.color || '#6366f1' });
    setEditProject(p);
    setShowCreate(true);
  };

  const handleNameChange = (name: string) => {
    const key = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setForm(f => ({ ...f, name, key: editProject ? f.key : key }));
  };

  const submit = async () => {
    if (!form.name.trim() || !form.key.trim()) {
      toast.error('Name and key are required');
      return;
    }
    setCreating(true);
    try {
      if (editProject) {
        await axios.put(`/api/v1/tickets/projects/${editProject.id}`, form, { headers: headers() });
        toast.success('Project updated');
      } else {
        await axios.post('/api/v1/tickets/projects', form, { headers: headers() });
        toast.success('Project created');
      }
      setShowCreate(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save project');
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (p: Project) => {
    if (!confirm(`Delete project "${p.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/v1/tickets/projects/${p.id}`, { headers: headers() });
      toast.success('Project deleted');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your ticketing projects</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: 'text-indigo-500' },
          { label: 'Open Tickets', value: projects.reduce((s, p) => s + (p.open_ticket_count || 0), 0), icon: AlertCircle, color: 'text-amber-500' },
          { label: 'Total Tickets', value: projects.reduce((s, p) => s + p.ticket_counter, 0), icon: Ticket, color: 'text-blue-500' },
          { label: 'Active Projects', value: projects.filter(p => p.ticket_counter > 0).length, icon: TrendingUp, color: 'text-green-500' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-lg">No projects yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Create your first project to start tracking tickets</p>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Card key={project.id}
              className="group hover:shadow-md transition-shadow cursor-pointer relative"
              onClick={() => navigate(`/dashboard/tickets/${project.key}/board`)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {colorDot(project.color)}
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs mt-0.5">{project.key}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/dashboard/tickets/${project.key}/board`); }}>
                        <Ticket className="w-4 h-4 mr-2" />Board
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/dashboard/tickets/${project.key}/list`); }}>
                        <BarChart3 className="w-4 h-4 mr-2" />List View
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(project); }}>
                        <Edit2 className="w-4 h-4 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={project.ticket_counter > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-destructive'}
                        onClick={e => { e.stopPropagation(); if (project.ticket_counter === 0) deleteProject(project); }}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {project.ticket_counter > 0 ? `Delete (${project.ticket_counter} tickets exist)` : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {project.description && (
                  <CardDescription className="text-sm line-clamp-2">{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{project.ticket_counter} total</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-600 font-medium">{project.open_ticket_count || 0} open</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                    onClick={e => { e.stopPropagation(); navigate(`/dashboard/tickets/${project.key}/board`); }}>
                    Board
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                    onClick={e => { e.stopPropagation(); navigate(`/dashboard/tickets/${project.key}/list`); }}>
                    List
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editProject ? 'Edit Project' : 'Create Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. Customer Support" value={form.name}
                onChange={e => handleNameChange(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Project Key *</Label>
              <Input placeholder="e.g. CUST" value={form.key}
                onChange={e => setForm(f => ({ ...f, key: e.target.value.toUpperCase().slice(0, 10) }))} />
              <p className="text-xs text-muted-foreground">Tickets will be numbered like {form.key || 'KEY'}-001</p>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="What is this project about?" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} type="button"
                    className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-foreground' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm(f => ({ ...f, color: c }))} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submit} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editProject ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
