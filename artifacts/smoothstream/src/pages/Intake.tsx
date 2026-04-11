import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateEvent, useListOrganizations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Radio } from "lucide-react";

const EVENT_TYPES = ["Webinar", "Conference", "Product Launch", "Town Hall", "Training", "Panel Discussion", "Workshop"];
const PLATFORMS = ["Zoom", "Teams", "StreamYard", "vMix", "YouTube Live", "LinkedIn Live", "Vimeo", "Custom RTMP"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney"
];

export default function Intake() {
  const [, setLocation] = useLocation();
  const createEvent = useCreateEvent();

  const [form, setForm] = useState({
    organizerName: "",
    organizationName: "",
    organizerEmail: "",
    organizerPhone: "",
    title: "",
    eventType: "",
    eventStart: "",
    eventEnd: "",
    timezone: "America/New_York",
    platform: "",
    speakerCount: 1,
    speakerDetails: "",
    assetsNeeded: "",
    captionsRequired: false,
    translationRequired: false,
    engagementFeatures: "",
    specialRequirements: "",
    finalAssetsDueDate: "",
    priority: "medium",
    wantsFullSetup: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.organizerName.trim()) e.organizerName = "Required";
    if (!form.organizationName.trim()) e.organizationName = "Required";
    if (!form.organizerEmail.trim() || !form.organizerEmail.includes("@")) e.organizerEmail = "Valid email required";
    if (!form.title.trim()) e.title = "Required";
    if (!form.eventType) e.eventType = "Required";
    if (!form.eventStart) e.eventStart = "Required";
    if (!form.eventEnd) e.eventEnd = "Required";
    if (!form.timezone) e.timezone = "Required";
    if (!form.platform) e.platform = "Required";
    if (form.speakerCount < 1) e.speakerCount = "Must be at least 1";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      await createEvent.mutateAsync({
        data: {
          organizerName: form.organizerName.trim(),
          organizationName: form.organizationName.trim(),
          organizerEmail: form.organizerEmail.trim(),
          organizerPhone: form.organizerPhone.trim() || null,
          title: form.title.trim(),
          eventType: form.eventType,
          eventStart: new Date(form.eventStart),
          eventEnd: new Date(form.eventEnd),
          timezone: form.timezone,
          platform: form.platform,
          speakerCount: form.speakerCount,
          speakerDetails: form.speakerDetails.trim() || null,
          assetsNeeded: form.assetsNeeded.trim() || null,
          captionsRequired: form.captionsRequired,
          translationRequired: form.translationRequired,
          engagementFeatures: form.engagementFeatures.trim() || null,
          specialRequirements: form.specialRequirements.trim() || null,
          finalAssetsDueDate: form.finalAssetsDueDate ? new Date(form.finalAssetsDueDate) : null,
          priority: form.priority,
          wantsFullSetup: form.wantsFullSetup,
        },
      });
      setLocation("/intake/confirmation");
    } catch (err) {
      setErrors({ submit: "Something went wrong. Please try again." });
    }
  }

  function field(key: keyof typeof form, label: string, type = "text", placeholder = "") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
        <Input
          id={key}
          type={type}
          placeholder={placeholder}
          value={form[key] as string}
          onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
          className={errors[key] ? "border-destructive" : ""}
        />
        {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary tracking-wide text-sm uppercase">SmoothStream</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Event Intake Form</h1>
          <p className="mt-2 text-muted-foreground">
            Submit your event details and our team will be in touch to confirm and begin production setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organizer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organizer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("organizerName", "Your Name *")}
              {field("organizationName", "Company / Organization *")}
              {field("organizerEmail", "Email Address *", "email", "you@company.com")}
              {field("organizerPhone", "Phone Number", "tel", "+1 (555) 000-0000")}
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {field("title", "Event Title *", "text", "e.g. Q2 Company All-Hands")}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Event Type *</Label>
                  <Select value={form.eventType} onValueChange={v => setForm(f => ({ ...f, eventType: v }))}>
                    <SelectTrigger className={errors.eventType ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.eventType && <p className="text-xs text-destructive">{errors.eventType}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Streaming Platform *</Label>
                  <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                    <SelectTrigger className={errors.platform ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select platform..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.platform && <p className="text-xs text-destructive">{errors.platform}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Event Start *</Label>
                  <Input
                    type="datetime-local"
                    value={form.eventStart}
                    onChange={e => setForm(f => ({ ...f, eventStart: e.target.value }))}
                    className={errors.eventStart ? "border-destructive" : ""}
                  />
                  {errors.eventStart && <p className="text-xs text-destructive">{errors.eventStart}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Event End *</Label>
                  <Input
                    type="datetime-local"
                    value={form.eventEnd}
                    onChange={e => setForm(f => ({ ...f, eventEnd: e.target.value }))}
                    className={errors.eventEnd ? "border-destructive" : ""}
                  />
                  {errors.eventEnd && <p className="text-xs text-destructive">{errors.eventEnd}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Time Zone</Label>
                <Select value={form.timezone} onValueChange={v => setForm(f => ({ ...f, timezone: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Speakers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Speakers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Number of Speakers *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.speakerCount}
                  onChange={e => setForm(f => ({ ...f, speakerCount: Number(e.target.value) }))}
                  className={`w-24 ${errors.speakerCount ? "border-destructive" : ""}`}
                />
                {errors.speakerCount && <p className="text-xs text-destructive">{errors.speakerCount}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Speaker Names and Roles</Label>
                <Textarea
                  placeholder="e.g. Jane Smith (CEO), John Doe (Product Lead)"
                  value={form.speakerDetails}
                  onChange={e => setForm(f => ({ ...f, speakerDetails: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assets & Technical */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assets and Technical Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Assets Needed</Label>
                <Textarea
                  placeholder="e.g. logo, presentation slides, speaker bios, event banner"
                  value={form.assetsNeeded}
                  onChange={e => setForm(f => ({ ...f, assetsNeeded: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Final Assets Due Date</Label>
                <Input
                  type="date"
                  value={form.finalAssetsDueDate}
                  onChange={e => setForm(f => ({ ...f, finalAssetsDueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Engagement Features</Label>
                <Input
                  placeholder="e.g. polls, Q&A, chat, breakout rooms"
                  value={form.engagementFeatures}
                  onChange={e => setForm(f => ({ ...f, engagementFeatures: e.target.value }))}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.captionsRequired}
                    onCheckedChange={v => setForm(f => ({ ...f, captionsRequired: v }))}
                  />
                  <Label className="text-sm">Captions Required</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.translationRequired}
                    onCheckedChange={v => setForm(f => ({ ...f, translationRequired: v }))}
                  />
                  <Label className="text-sm">Translation Required</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.wantsFullSetup}
                    onCheckedChange={v => setForm(f => ({ ...f, wantsFullSetup: v }))}
                  />
                  <Label className="text-sm">Full Production Setup</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Requirements & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Special Requirements</Label>
                <Textarea
                  placeholder="Any specific requests or things we should know..."
                  value={form.specialRequirements}
                  onChange={e => setForm(f => ({ ...f, specialRequirements: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Priority</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors capitalize ${
                        form.priority === p
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-accent"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending} className="min-w-[140px]">
              {createEvent.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
