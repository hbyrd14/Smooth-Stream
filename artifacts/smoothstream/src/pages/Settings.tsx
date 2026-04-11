import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  useGetSettings,
  useUpdateSettings,
  useListProfiles,
  useCreateProfile,
  useDeleteProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, X, Save, Users, Settings2, Bell } from "lucide-react";

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading: settingsLoading } = useGetSettings();
  const { data: profiles = [] } = useListProfiles();
  const updateSettings = useUpdateSettings();
  const createProfile = useCreateProfile();
  const deleteProfile = useDeleteProfile();

  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [notificationEmail, setNotificationEmail] = useState("");

  const [newEventType, setNewEventType] = useState("");
  const [newPlatform, setNewPlatform] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileEmail, setNewProfileEmail] = useState("");
  const [newProfileRole, setNewProfileRole] = useState("team_member");

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setEventTypes(settings.eventTypes ?? []);
      setPlatforms(settings.platformOptions ?? []);
      setChecklist(settings.defaultChecklistTemplate ?? []);
      setNotificationEmail(settings.notificationEmail ?? "");
    }
  }, [settings]);

  async function handleSaveSettings() {
    await updateSettings.mutateAsync({
      data: {
        eventTypes,
        platformOptions: platforms,
        defaultChecklistTemplate: checklist,
        notificationEmail: notificationEmail || null,
      }
    });
    queryClient.invalidateQueries({ queryKey: ["getSettings"] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAddProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!newProfileName || !newProfileEmail) return;
    await createProfile.mutateAsync({ data: { name: newProfileName, email: newProfileEmail, role: newProfileRole } });
    setNewProfileName(""); setNewProfileEmail(""); setNewProfileRole("team_member");
    queryClient.invalidateQueries({ queryKey: ["listProfiles"] });
  }

  async function handleDeleteProfile(id: number) {
    await deleteProfile.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: ["listProfiles"] });
  }

  function addItem(list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setValue("");
    }
  }

  function removeItem(list: string[], setList: (v: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  function moveItem(list: string[], setList: (v: string[]) => void, idx: number, dir: -1 | 1) {
    const newList = [...list];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= newList.length) return;
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    setList(newList);
  }

  if (settingsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading settings...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure event types, platforms, checklist templates, and team members.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Event Types
            </CardTitle>
            <CardDescription className="text-xs">Available event type options shown in the intake form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((t, i) => (
                <div key={i} className="flex items-center gap-1 bg-muted rounded-md px-2.5 py-1 text-sm">
                  {t}
                  <button onClick={() => removeItem(eventTypes, setEventTypes, i)} className="ml-1 text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add event type..."
                value={newEventType}
                onChange={e => setNewEventType(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addItem(eventTypes, setEventTypes, newEventType, setNewEventType))}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => addItem(eventTypes, setEventTypes, newEventType, setNewEventType)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Streaming Platforms
            </CardTitle>
            <CardDescription className="text-xs">Available platform options in the intake form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {platforms.map((p, i) => (
                <div key={i} className="flex items-center gap-1 bg-muted rounded-md px-2.5 py-1 text-sm">
                  {p}
                  <button onClick={() => removeItem(platforms, setPlatforms, i)} className="ml-1 text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add platform..."
                value={newPlatform}
                onChange={e => setNewPlatform(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addItem(platforms, setPlatforms, newPlatform, setNewPlatform))}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => addItem(platforms, setPlatforms, newPlatform, setNewPlatform)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Default Checklist Template
            </CardTitle>
            <CardDescription className="text-xs">Tasks automatically created for every new event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border rounded-md border overflow-hidden">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-background text-sm">
                  <span className="text-xs text-muted-foreground w-5 flex-shrink-0 text-right">{i + 1}.</span>
                  <span className="flex-1">{item}</span>
                  <div className="flex gap-1">
                    <button onClick={() => moveItem(checklist, setChecklist, i, -1)} className="text-muted-foreground hover:text-foreground text-xs px-1" disabled={i === 0}>↑</button>
                    <button onClick={() => moveItem(checklist, setChecklist, i, 1)} className="text-muted-foreground hover:text-foreground text-xs px-1" disabled={i === checklist.length - 1}>↓</button>
                    <button onClick={() => removeItem(checklist, setChecklist, i)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add checklist task..."
                value={newChecklistItem}
                onChange={e => setNewChecklistItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addItem(checklist, setChecklist, newChecklistItem, setNewChecklistItem))}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => addItem(checklist, setChecklist, newChecklistItem, setNewChecklistItem)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notification Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="email"
              placeholder="ops@yourcompany.com"
              value={notificationEmail}
              onChange={e => setNotificationEmail(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={updateSettings.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {saved ? "Saved!" : updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <Separator />

        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Team Members
          </h2>
          <Card className="mb-4">
            <CardContent className="pt-4 divide-y divide-border">
              {profiles.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">No team members yet.</p>
              )}
              {profiles.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs">{p.role.replace("_", " ")}</Badge>
                    <button onClick={() => handleDeleteProfile(p.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add Team Member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input placeholder="Full name *" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} required />
                <Input type="email" placeholder="Email *" value={newProfileEmail} onChange={e => setNewProfileEmail(e.target.value)} required />
                <Select value={newProfileRole} onValueChange={setNewProfileRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" disabled={createProfile.isPending} className="sm:col-span-3">
                  {createProfile.isPending ? "Adding..." : "Add Member"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
