import { AppLayout } from "@/components/AppLayout";
import { 
  useGetDashboardSummary, 
  useListEvents,
  useHealthCheck
} from "@workspace/api-client-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Video, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Search,
  Filter,
  Plus
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: events = [], isLoading: isEventsLoading } = useListEvents({
    filter: filter !== "all" ? filter : undefined,
    search: search || undefined
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "in_progress": return "secondary";
      case "awaiting_assets": return "outline";
      case "ready_for_tech_check": return "outline";
      case "ready_for_live": return "default"; // should be a nice green/blue ideally
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your event production pipeline.</p>
          </div>
          <Button asChild>
            <Link href="/events/new">
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Link>
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Video className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isSummaryLoading ? "-" : summary?.totalEvents || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isSummaryLoading ? "-" : summary?.eventsThisWeek || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-destructive">High Priority</CardTitle>
              <AlertCircle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isSummaryLoading ? "-" : summary?.highPriorityEvents || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Blocked/Pending</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isSummaryLoading ? "-" : summary?.blockedEvents || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Events Table Section */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <CardTitle>Active Events</CardTitle>
              <div className="flex items-center gap-2 max-w-sm w-full">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search events..." 
                    className="pl-9" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
              <div className="overflow-x-auto pb-2">
                <TabsList className="w-max sm:w-auto h-9">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="this_week">This Week</TabsTrigger>
                  <TabsTrigger value="high_priority">High Priority</TabsTrigger>
                  <TabsTrigger value="awaiting_assets">Awaiting Assets</TabsTrigger>
                  <TabsTrigger value="ready_for_tech_check">Tech Check</TabsTrigger>
                  <TabsTrigger value="ready_for_live">Ready for Live</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={filter} className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isEventsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">Loading events...</TableCell>
                        </TableRow>
                      ) : events.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No events found matching your criteria.</TableCell>
                        </TableRow>
                      ) : (
                        events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>
                              <div className="font-medium text-primary hover:underline">
                                <Link href={`/events/${event.id}`}>
                                  {event.title}
                                </Link>
                              </div>
                              <div className="text-sm text-muted-foreground">{event.organizationName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {event.eventStart ? format(new Date(event.eventStart), "MMM d, yyyy") : "—"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {event.eventStart ? format(new Date(event.eventStart), "h:mm a") : ""}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(event.status)} className="capitalize">
                                {event.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getPriorityBadgeVariant(event.priority)} className="capitalize">
                                {event.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{event.ownerName || "Unassigned"}</div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
