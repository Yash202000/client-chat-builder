import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft, Plus, MoreHorizontal, Play, CheckCheck, ChevronDown, ChevronRight,
  Grip, Calendar,
} from "lucide-react";
import { format } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
  none: "bg-gray-100 text-gray-600",
};

const SPRINT_STATUS_COLORS: Record<string, string> = {
  future: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
};

interface Sprint {
  id: number;
  name: string;
  goal?: string;
  status: "future" | "active" | "completed";
  start_date?: string;
  end_date?: string;
  completed_at?: string;
  ticket_count?: number;
  completed_count?: number;
}

interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  priority: string;
  status?: { name: string; color: string };
  issue_type?: { name: string; icon?: string };
  assignee?: { full_name?: string };
}

function SprintDialog({
  open, onClose, sprint, projectId,
}: {
  open: boolean;
  onClose: () => void;
  sprint?: Sprint;
  projectId: number;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [name, setName] = useState(sprint?.name ?? "");
  const [goal, setGoal] = useState(sprint?.goal ?? "");
  const [startDate, setStartDate] = useState(sprint?.start_date?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(sprint?.end_date?.slice(0, 10) ?? "");

  const mutation = useMutation({
    mutationFn: (data: any) =>
      sprint
        ? axios.patch(`/api/v1/tickets/sprints/${sprint.id}`, data, { headers: authHeaders() }).then(r => r.data)
        : axios.post(`/api/v1/tickets/projects/${projectId}/sprints`, data, { headers: authHeaders() }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sprints"] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sprint ? t("tickets.sprint.edit") : t("tickets.sprint.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder={t("tickets.sprint.namePlaceholder")} value={name} onChange={e => setName(e.target.value)} />
          <Textarea placeholder={t("tickets.sprint.goalPlaceholder")} value={goal}
            onChange={e => setGoal(e.target.value)} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Start Date</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">End Date</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!name.trim() || mutation.isPending}
            onClick={() => mutation.mutate({
              name, goal: goal || undefined,
              start_date: startDate || undefined,
              end_date: endDate || undefined,
            })}
          >
            {mutation.isPending ? t("tickets.sprint.saving") : t("tickets.sprint.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SprintSection({
  sprint, tickets, projectKey, onEdit,
}: {
  sprint: Sprint;
  tickets: Ticket[];
  projectKey: string;
  onEdit: (s: Sprint) => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(sprint.status === "active");

  const transitionMutation = useMutation({
    mutationFn: (status: string) =>
      axios.patch(`/api/v1/tickets/sprints/${sprint.id}`, { status }, { headers: authHeaders() }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sprints"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => axios.delete(`/api/v1/tickets/sprints/${sprint.id}`, { headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sprints"] }),
  });

  return (
    <Card className={sprint.status === "active" ? "border-green-300 bg-green-50/30" : ""}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CardTitle className="text-base flex-1 flex items-center gap-2">
              {sprint.name}
              <Badge variant="outline" className={`text-xs ${SPRINT_STATUS_COLORS[sprint.status]}`}>
                {sprint.status}
              </Badge>
              <span className="text-xs text-muted-foreground font-normal">
                {tickets.length} issue{tickets.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>

            {sprint.start_date && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(sprint.start_date), "MMM d")}
                {sprint.end_date && ` – ${format(new Date(sprint.end_date), "MMM d")}`}
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sprint.status === "future" && (
                  <DropdownMenuItem onClick={() => transitionMutation.mutate("active")}>
                    <Play className="h-4 w-4 mr-2 text-green-600" /> Start Sprint
                  </DropdownMenuItem>
                )}
                {sprint.status === "active" && (
                  <DropdownMenuItem onClick={() => transitionMutation.mutate("completed")}>
                    <CheckCheck className="h-4 w-4 mr-2 text-blue-600" /> Complete Sprint
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(sprint)}>Edit</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => deleteMutation.mutate()}
                >
                  Delete Sprint
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {sprint.goal && (
            <p className="text-xs text-muted-foreground pl-8 mt-1">{sprint.goal}</p>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="py-0 pb-3">
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tickets in this sprint. Drag tickets from the backlog below.
              </p>
            ) : (
              <div className="space-y-1">
                {tickets.map(t => (
                  <TicketRow key={t.id} ticket={t} projectKey={projectKey} />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function TicketRow({ ticket, projectKey }: { ticket: Ticket; projectKey: string }) {
  return (
    <Link to={`/dashboard/tickets/${projectKey}/${ticket.ticket_number}`}>
      <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm group">
        <Grip className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
        <span className="text-xs text-muted-foreground w-20 shrink-0">{ticket.ticket_number}</span>
        <span className="flex-1 truncate">{ticket.title}</span>
        {ticket.issue_type && (
          <span className="text-xs text-muted-foreground">{ticket.issue_type.name}</span>
        )}
        <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[ticket.priority] ?? ""}`}>
          {ticket.priority}
        </Badge>
        {ticket.status && (
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: ticket.status.color }}
            title={ticket.status.name}
          />
        )}
      </div>
    </Link>
  );
}

export default function TicketBacklogPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const qc = useQueryClient();
  const [sprintDialog, setSprintDialog] = useState<{ open: boolean; sprint?: Sprint }>({ open: false });

  const { data: projects } = useQuery({
    queryKey: ["ticket-projects"],
    queryFn: () => axios.get("/api/v1/tickets/projects", { headers: authHeaders() }).then(r => r.data),
  });

  const project = projects?.find((p: any) => p.key === projectKey);

  const { data: sprints = [] } = useQuery<Sprint[]>({
    queryKey: ["sprints", project?.id],
    queryFn: () =>
      axios.get(`/api/v1/tickets/projects/${project.id}/sprints`, { headers: authHeaders() }).then(r => r.data),
    enabled: !!project?.id,
  });

  const { data: allTickets = [] } = useQuery<Ticket[]>({
    queryKey: ["tickets-all", project?.id],
    queryFn: () =>
      axios.get(`/api/v1/tickets?project_id=${project.id}&limit=500`, { headers: authHeaders() }).then(r => r.data),
    enabled: !!project?.id,
  });

  const { data: backlogTickets = [] } = useQuery<Ticket[]>({
    queryKey: ["tickets-backlog", project?.id],
    queryFn: () =>
      axios.get(`/api/v1/tickets?project_id=${project.id}&no_sprint=true&limit=500`, { headers: authHeaders() }).then(r => r.data),
    enabled: !!project?.id,
  });

  const addToSprintMutation = useMutation({
    mutationFn: ({ sprintId, ticketIds }: { sprintId: number; ticketIds: number[] }) =>
      axios.post(`/api/v1/tickets/sprints/${sprintId}/tickets`, ticketIds, { headers: authHeaders() }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets-backlog", project?.id] });
      qc.invalidateQueries({ queryKey: ["tickets-all", project?.id] });
    },
  });

  const ticketsBySprint = (sprintId: number) =>
    allTickets.filter((t: any) => t.sprint_id === sprintId);

  const activeSprint = sprints.find(s => s.status === "active");

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/dashboard/tickets/${projectKey}/board`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Backlog — {projectKey}</h1>
            <p className="text-sm text-muted-foreground">{project?.name}</p>
          </div>
        </div>
        <Button onClick={() => setSprintDialog({ open: true })}>
          <Plus className="h-4 w-4 mr-1" /> Create Sprint
        </Button>
      </div>

      {/* Sprint sections */}
      {sprints.filter(s => s.status !== "completed").map(sprint => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          tickets={ticketsBySprint(sprint.id)}
          projectKey={projectKey!}
          onEdit={s => setSprintDialog({ open: true, sprint: s })}
        />
      ))}

      {/* Backlog */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            Backlog
            <span className="text-xs text-muted-foreground font-normal">
              {backlogTickets.length} issue{backlogTickets.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-3">
          {backlogTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              All tickets are in sprints.
            </p>
          ) : (
            <div className="space-y-1">
              {backlogTickets.map(t => (
                <div key={t.id} className="flex items-center gap-2 group">
                  <div className="flex-1 min-w-0">
                    <TicketRow ticket={t} projectKey={projectKey!} />
                  </div>
                  {activeSprint && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={() => addToSprintMutation.mutate({
                        sprintId: activeSprint.id,
                        ticketIds: [t.id],
                      })}
                    >
                      → Sprint
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed sprints (collapsed) */}
      {sprints.filter(s => s.status === "completed").map(sprint => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          tickets={ticketsBySprint(sprint.id)}
          projectKey={projectKey!}
          onEdit={s => setSprintDialog({ open: true, sprint: s })}
        />
      ))}

      <SprintDialog
        open={sprintDialog.open}
        onClose={() => setSprintDialog({ open: false })}
        sprint={sprintDialog.sprint}
        projectId={project?.id}
      />
    </div>
  );
}
