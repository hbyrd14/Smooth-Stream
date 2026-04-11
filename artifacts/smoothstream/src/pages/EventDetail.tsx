import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetEvent,
  useListProfiles,
  useUpdateEvent,
  useUpdateEventTask,
  useCreateEventNote,
  useCreateEventAsset,
  useUpdateEventAsset,
  useGenerateRunOfShow,
  useGenerateClientReminder,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, Circle, Clock, AlertTriangle, ArrowLeft,
  User, Calendar, Mic, Package, Settings, FileText, Activity, Wand2, Mail
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

const STATUSES = ["new", "in_progress", "awaiting_assets", "ready_for_tech_check", "ready_for_live", "completed", "cancelled"];
const PRIORITIES = ["low", "medium", "high", "critical"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
    awaiting_assets: "bg-orange-100 text-orange-800 border-orange-200",
    ready_for_tech_check: "bg-purple-100 text-purple-800 border-purple-200",
    ready_for_live: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-gray-100 text-gray-800 border-gray-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[priority] ?? ""}`}>
      {priority}
    </span>
  );
}

function TaskStatusIcon({ status }: { status: string }) {
  if (status === "complete") return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  if (status === "in_progress") return <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
  if (status === "blocked") return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  return <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useGetEvent(eventId);
  const { data: profiles = [] } = useListProfiles();

  const updateEvent = useUpdateEvent();
  const updateTask = useUpdateEventTask();
  const createNote = useCreateEventNote();
  const createAsset = useCreateEventAsset();
  const updateAsset = useUpdateEventAsset();
  const generateRunOfShow = useGenerateRunOfShow();
  const generateClientReminder = useGenerateClientReminder();

  const [noteContent, setNoteContent] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [runOfShowDraft, setRunOfShowDraft] = useState("");
  const [clientReminderDraft, setClientReminderDraft] = useState("");
  const [showRunOfShow, setShowRunOfShow] = useState(false);
  const [showClientReminder, setShowClientReminder] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["getEvent", eventId] });
  }

  async function handleStatusChange(status: string) {
    await updateEvent.mutateAsync({ id: eventId, data: { status } });
    invalidate();
  }

  async function handleOwnerChange(ownerId: string) {
    await updateEvent.mutateAsync({ id: eventId, data: { ownerId: ownerId ? Number(ownerId) : null } });
    invalidate();
  }

  async function handleTaskToggle(taskId: number, currentStatus: string) {
    const nextStatus = currentStatus === "complete" ? "pending" : "complete";
    await updateTask.mutateAsync({ id: eventId, taskId, data: { status: nextStatus } });
    invalidate();
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim() || !noteAuthor.trim()) return;
    await createNote.mutateAsync({ id: eventId, data: { content: noteContent, authorName: noteAuthor } });
    setNoteContent("");
    invalidate();
  }

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!assetName.trim() || !assetType.trim()) return;
    await createAsset.mutateAsync({ id: eventId, data: { name: assetName, assetType, url: assetUrl || undefined } });
    setAssetName(""); setAssetType(""); setAssetUrl("");
    invalidate();
  }

  async function handleAssetStatusChange(assetId: number, status: string) {
    await updateAsset.mutateAsync({ id: eventId, assetId, data: { status } });
    invalidate();
  }

  async function handleGenerateRunOfShow() {
    const result = await generateRunOfShow.mutateAsync({ id: eventId });
    setRunOfShowDraft(result.draft);
    setShowRunOfShow(true);
  }

  async function handleGenerateClientReminder() {
    const result = await generateClientReminder.mutateAsync({ id: eventId });
    setClientReminderDraft(result.draft);
    setShowClientReminder(true);
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading event...</div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Event not found.</div>
      </AppLayout>
    );
  }

  const completedTasks = event.tasks?.filter(t => t.status === "complete").length ?? 0;
  const totalTasks = event.tasks?.length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={event.status} />
                <PriorityBadge priority={event.priority} />
                <span className="text-sm text-muted-foreground">{event.organizationName}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={event.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={event.ownerId?.toString() ?? "none"}
                onValueChange={v => handleOwnerChange(v === "none" ? "" : v)}
              >
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue placeholder="Assign owner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {profiles.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AI Helpers */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">AI Drafting Tools</p>
                <p className="text-xs text-muted-foreground">Generate draft documents from this event's data</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateRunOfShow}
                  disabled={generateRunOfShow.isPending}
                  className="gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {generateRunOfShow.isPending ? "Generating..." : "Run of Show Draft"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateClientReminder}
                  disabled={generateClientReminder.isPending}
                  className="gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {generateClientReminder.isPending ? "Generating..." : "Client Reminder Email"}
                </Button>
              </div>
            </div>
            {showRunOfShow && (
              <div className="mt-4 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Run of Show Draft</Label>
                <Textarea
                  value={runOfShowDraft}
                  onChange={e => setRunOfShowDraft(e.target.value)}
                  rows={12}
                  className="font-mono text-xs"
                />
              </div>
            )}
            {showClientReminder && (
              <div className="mt-4 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client Reminder Email Draft</Label>
                <Textarea
                  value={clientReminderDraft}
                  onChange={e => setClientReminderDraft(e.target.value)}
                  rows={14}
                  className="font-mono text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="checklist" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />Checklist
              <span className="ml-1 text-xs opacity-70">{completedTasks}/{totalTasks}</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-1.5"><Package className="w-3.5 h-3.5" />Assets</TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Notes</TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5"><Activity className="w-3.5 h-3.5" />Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" />Organizer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> {event.organizerName}</div>
                  <div><span className="text-muted-foreground">Email:</span> {event.organizerEmail}</div>
                  {event.organizerPhone && <div><span className="text-muted-foreground">Phone:</span> {event.organizerPhone}</div>}
                  <div><span className="text-muted-foreground">Company:</span> {event.organizationName}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" />Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Start:</span> {format(new Date(event.eventStart), "PPP p")}</div>
                  <div><span className="text-muted-foreground">End:</span> {format(new Date(event.eventEnd), "PPP p")}</div>
                  <div><span className="text-muted-foreground">Timezone:</span> {event.timezone}</div>
                  {event.finalAssetsDueDate && (
                    <div><span className="text-muted-foreground">Assets Due:</span> {format(new Date(event.finalAssetsDueDate), "PPP")}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Mic className="w-4 h-4" />Speakers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Count:</span> {event.speakerCount}</div>
                  {event.speakerDetails && <div className="text-muted-foreground mt-1 whitespace-pre-wrap">{event.speakerDetails}</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Settings className="w-4 h-4" />Technical</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Platform:</span> {event.platform}</div>
                  <div><span className="text-muted-foreground">Type:</span> {event.eventType}</div>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {event.captionsRequired && <Badge variant="outline">Captions</Badge>}
                    {event.translationRequired && <Badge variant="outline">Translation</Badge>}
                    {event.wantsFullSetup && <Badge variant="outline">Full Setup</Badge>}
                  </div>
                  {event.engagementFeatures && <div className="mt-1"><span className="text-muted-foreground">Engagement:</span> {event.engagementFeatures}</div>}
                  {event.specialRequirements && <div className="mt-1"><span className="text-muted-foreground">Special:</span> {event.specialRequirements}</div>}
                  {event.assetsNeeded && <div className="mt-1"><span className="text-muted-foreground">Assets needed:</span> {event.assetsNeeded}</div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Production Checklist</CardTitle>
                  <span className="text-xs text-muted-foreground">{completedTasks} of {totalTasks} complete</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {event.tasks?.map(task => (
                  <div key={task.id} className="flex items-center gap-3 py-3">
                    <button
                      onClick={() => handleTaskToggle(task.id, task.status)}
                      className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      <TaskStatusIcon status={task.status} />
                    </button>
                    <span className={`flex-1 text-sm ${task.status === "complete" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </span>
                    {task.assignedUserName && (
                      <span className="text-xs text-muted-foreground">{task.assignedUserName}</span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">{format(new Date(task.dueDate), "MMM d")}</span>
                    )}
                    <Select
                      value={task.status}
                      onValueChange={status => updateTask.mutateAsync({ id: eventId, taskId: task.id, data: { status } }).then(invalidate)}
                    >
                      <SelectTrigger className="w-28 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["pending", "in_progress", "complete", "blocked"].map(s => (
                          <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Event Assets</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {event.assets?.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">No assets yet.</p>
                )}
                {event.assets?.map(asset => (
                  <div key={asset.id} className="py-3 flex items-start gap-3">
                    <div className="flex-1 space-y-0.5">
                      <div className="font-medium text-sm">{asset.name}</div>
                      <div className="text-xs text-muted-foreground">{asset.assetType}</div>
                      {asset.url && (
                        <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-xs">
                          {asset.url}
                        </a>
                      )}
                    </div>
                    <Select
                      value={asset.status}
                      onValueChange={status => handleAssetStatusChange(asset.id, status)}
                    >
                      <SelectTrigger className="w-28 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["requested", "received", "approved", "rejected"].map(s => (
                          <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Add Asset</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAsset} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input placeholder="Asset name *" value={assetName} onChange={e => setAssetName(e.target.value)} required />
                  <Input placeholder="Type (e.g. Slide Deck) *" value={assetType} onChange={e => setAssetType(e.target.value)} required />
                  <Input placeholder="URL (optional)" value={assetUrl} onChange={e => setAssetUrl(e.target.value)} />
                  <Button type="submit" size="sm" disabled={createAsset.isPending} className="sm:col-span-3">
                    {createAsset.isPending ? "Adding..." : "Add Asset"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {event.notes?.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">No notes yet.</p>
                )}
                {event.notes?.map(note => (
                  <div key={note.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{note.authorName}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Add Note</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddNote} className="space-y-3">
                  <Input
                    placeholder="Your name *"
                    value={noteAuthor}
                    onChange={e => setNoteAuthor(e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Add an internal note..."
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    rows={3}
                    required
                  />
                  <Button type="submit" size="sm" disabled={createNote.isPending}>
                    {createNote.isPending ? "Saving..." : "Add Note"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Activity Log</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {event.activityLog?.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
                )}
                {event.activityLog?.map(entry => (
                  <div key={entry.id} className="py-3 flex gap-3">
                    <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm">{entry.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {entry.actorName && <span>{entry.actorName}</span>}
                        <span>{format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
