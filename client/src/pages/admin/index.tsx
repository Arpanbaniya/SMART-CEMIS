// client/src/pages/admin/index.tsx
<<<<<<< HEAD
import { useState } from "react";
=======
import { useState, useEffect } from "react";
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
=======
import { Textarea } from "@/components/ui/textarea";
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";
import { PageLoader } from "@/components/loading-spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Users,
  BarChart3,
  Settings,
  Home,
  FileText,
  DollarSign,
  TrendingUp,
  Check,
  X,
  Eye,
  Search,
  LogOut,
  Plus,
<<<<<<< HEAD
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
=======
  Trash2,
  UserX,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
import { getInitials, formatDate, formatCurrency } from "@/lib/utils";
import type { Event, AdminRequest, Payment } from "@shared/schema";

// Add near imports
type CategoryStat = { name: string; value: number };
const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

<<<<<<< HEAD
const sidebarItems = [
  { title: "Dashboard", url: "/admin", icon: Home },
  { title: "Events", url: "/admin/events", icon: Calendar },
  { title: "Requests", url: "/admin/requests", icon: FileText },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Payments", url: "/admin/payments", icon: DollarSign },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];
=======
const getSidebarItems = (userRole?: string) => {
  const baseItems = [
    { title: "Dashboard", url: "/admin", icon: Home },
    { title: "Events", url: "/admin/events", icon: Calendar },
    { title: "Requests", url: "/admin/requests", icon: FileText },
  ];

  const superAdminItems = [
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Payments", url: "/admin/payments", icon: DollarSign },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  return userRole === 'super_admin' 
    ? [...baseItems, ...superAdminItems]
    : baseItems;
};
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
<<<<<<< HEAD
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewingPaymentId, setPreviewingPaymentId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
=======
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewingPaymentId, setPreviewingPaymentId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [hasEventCreationPermission, setHasEventCreationPermission] = useState(false);
  const { toast } = useToast();

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/events", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  });

  const { data: requests = [] } = useQuery<AdminRequest[]>({
    queryKey: ["/api/admin/requests"],
<<<<<<< HEAD
  });

=======
    queryFn: async () => {
      const response = await fetch("/api/admin/requests", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const { data: studentAdminStatus } = useQuery({
    queryKey: ["/api/student-admin/status"],
    queryFn: async () => {
      if (!user || user.role !== 'student_admin') return null;
      const response = await fetch("/api/student-admin/status", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch student admin status");
      }
      return response.json();
    },
    enabled: !!user && user.role === 'student_admin',
  });

  useEffect(() => {
    if (studentAdminStatus) {
      setHasEventCreationPermission(studentAdminStatus.hasEventCreationPermission || false);
      console.log("Student admin status updated:", studentAdminStatus);
      console.log("Has event creation permission:", studentAdminStatus.hasEventCreationPermission);
    } else if (user?.role === 'student_admin') {
      // Fallback: Check if user has any approved requests
      const userApprovedRequests = requests.filter(r => 
        r.userId === user.id && 
        r.status === 'approved'
      );
      const hasPermission = userApprovedRequests.length > 0;
      setHasEventCreationPermission(hasPermission);
      console.log("Fallback check - approved requests:", userApprovedRequests.length);
      console.log("Fallback - has permission:", hasPermission);
      
      // Temporary override for testing - remove this in production
      if (userApprovedRequests.length > 0) {
        console.log("✅ Student admin has approved requests, should show Create Event button");
      }
    }
  }, [studentAdminStatus, requests, user]);

  useEffect(() => {
    console.log("User role:", user?.role);
    console.log("Has event creation permission:", hasEventCreationPermission);
    const shouldShow = user?.role === 'student_admin' && hasEventCreationPermission;
    console.log("Should show create button for student admin:", shouldShow);
  }, [user?.role, hasEventCreationPermission]);

>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const resendMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return apiRequest("POST", `/api/admin/payments/${paymentId}/resend`);
    },
    onSuccess: () => {
      toast({ title: "Email Sent", description: "Payment email resent to user." });
    },
    onError: () => {
      toast({ title: "Send Failed", description: "Could not resend email.", variant: "destructive" });
    },
  });

<<<<<<< HEAD
=======
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/admin/requests/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student-admin/status"] });
      toast({ title: "Request Approved", description: "User has been granted event creation permission." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.error || "Failed to approve request.", 
        variant: "destructive" 
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/admin/requests/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      toast({ title: "Request Rejected", description: "Request has been rejected." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.error || "Failed to reject request.", 
        variant: "destructive" 
      });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { message: string; eventDescription?: string }) => {
      console.log("Submitting request with data:", data);
      try {
        const result = await apiRequest("POST", "/api/admin/requests", data);
        console.log("Request submission successful:", result);
        return result;
      } catch (error) {
        console.error("Request submission failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      toast({ title: "Request Submitted", description: "Your request has been submitted for review." });
      // Reset form
      setRequestMessage("");
      setEventDescription("");
      // Reset permission state - will be updated when request is approved
      setHasEventCreationPermission(false);
    },
    onError: (error: any) => {
      console.error("Request submission error:", error);
      toast({ 
        title: "Error", 
        description: error?.message || error?.error || "Failed to submit request. Please try again.", 
        variant: "destructive" 
      });
    },
  });

  // Student Admin Log Section Component
  function StudentAdminLogSection() {
    const { data: studentAdmins = [], isLoading: studentAdminsLoading } = useQuery<any[]>({
      queryKey: ["/api/admin/student-admins"],
      queryFn: async () => {
        const response = await fetch("/api/admin/student-admins", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch student admins");
        }
        return response.json();
      },
      enabled: user?.role === 'super_admin',
    });

    const revokeMutation = useMutation({
      mutationFn: async (userId: string) => {
        return apiRequest("PATCH", `/api/admin/student-admins/${userId}/revoke`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/student-admins"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
        toast({ title: "Privileges Revoked", description: "Student admin privileges have been revoked." });
      },
      onError: (error: any) => {
        toast({ 
          title: "Error", 
          description: error?.error || "Failed to revoke privileges.", 
          variant: "destructive" 
        });
      },
    });

    const deleteEventMutation = useMutation({
      mutationFn: async ({ userId, eventId }: { userId: string; eventId: string }) => {
        return apiRequest("DELETE", `/api/admin/student-admins/${userId}/events/${eventId}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/student-admins"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
        toast({ title: "Event Deleted", description: "Event has been deleted successfully." });
      },
      onError: (error: any) => {
        toast({ 
          title: "Error", 
          description: error?.error || "Failed to delete event.", 
          variant: "destructive" 
        });
      },
    });

    if (studentAdminsLoading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Admin Log</CardTitle>
          <CardDescription>History of approved student admins and their created events</CardDescription>
        </CardHeader>
        <CardContent>
          {studentAdmins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No student admin history</p>
            </div>
          ) : (
            <div className="space-y-6">
              {studentAdmins.map((admin: any) => (
                <div key={admin.requestId} className="p-4 rounded-lg border space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{admin.userName}</p>
                        <Badge variant={admin.currentRole === 'student_admin' ? 'default' : 'secondary'}>
                          {admin.currentRole === 'student_admin' ? 'Active' : 'Revoked'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{admin.userEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        Approved: {formatDate(admin.approvedAt)}
                      </p>
                    </div>
                    {admin.currentRole === 'student_admin' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => revokeMutation.mutate(admin.userId)}
                        disabled={revokeMutation.isPending}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Revoke Privileges
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Request Message:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {admin.requestMessage}
                    </p>
                    {admin.eventDescription && (
                      <>
                        <p className="text-sm font-medium">Event Description:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                          {admin.eventDescription}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Created Events ({admin.events.length}):
                    </p>
                    {admin.events.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No events created</p>
                    ) : (
                      <div className="space-y-2">
                        {admin.events.map((event: Event) => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between p-3 bg-muted rounded"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(event.date)} • {event.category}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => deleteEventMutation.mutate({ userId: admin.userId, eventId: event.id })}
                              disabled={deleteEventMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  async function handlePreview(paymentId: string) {
    try {
      setPreviewHtml(null);
      setPreviewingPaymentId(paymentId);
      const response = await apiRequest("GET", `/api/admin/payments/${paymentId}/preview`);
      setPreviewHtml(response);
      setIsPreviewOpen(true);
    } catch (error: any) {
      toast({ title: "Preview failed", description: error.message || "Failed to load preview" });
    }
  }

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      window.location.href = "/";
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

<<<<<<< HEAD
=======
  // Check if user has admin privileges
  if (user?.role !== 'super_admin' && user?.role !== 'student_admin') {
    window.location.href = "/";
    return null;
  }

>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  const getUserName = () => {
    if (!user) return "Admin";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "Admin";
  };

  const totalParticipants = events.reduce((sum, e) => sum + (e.participantCount || 0), 0);
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingRequests = requests.filter((r) => r.status === "pending").length;

  const sentimentData = [
    { name: "Event A", positive: 65, neutral: 20, negative: 15 },
    { name: "Event B", positive: 80, neutral: 15, negative: 5 },
    { name: "Event C", positive: 45, neutral: 35, negative: 20 },
    { name: "Event D", positive: 70, neutral: 22, negative: 8 },
  ];

  const trendData = [
    { month: "Jan", score: 3.5 },
    { month: "Feb", score: 3.8 },
    { month: "Mar", score: 4.0 },
    { month: "Apr", score: 3.9 },
    { month: "May", score: 4.2 },
    { month: "Jun", score: 4.5 },
  ];

  const categoryData = events.reduce((acc, event) => {
    const existing = acc.find((item: { name: string; value: number }) => item.name === event.category);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: event.category, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold">EventHub</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
<<<<<<< HEAD
                  {sidebarItems.map((item) => (
=======
                  {getSidebarItems(user?.role).map((item) => (
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-admin-${item.title.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback>{getInitials(getUserName())}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{getUserName()}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-admin-sidebar-toggle" />
              <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-admin-search"
                />
              </div>
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 space-y-6">
<<<<<<< HEAD
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Events"
                value={events.length}
                icon={Calendar}
                change={12}
                changeLabel="from last month"
              />
              <StatCard
                title="Total Participants"
                value={totalParticipants}
                icon={Users}
                change={8}
                changeLabel="from last month"
              />
              <StatCard
                title="Revenue"
                value={formatCurrency(totalRevenue)}
                icon={DollarSign}
                change={23}
                changeLabel="from last month"
              />
              <StatCard
                title="Pending Requests"
                value={pendingRequests}
                icon={FileText}
              />
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview" data-testid="tab-admin-overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-admin-analytics">Analytics</TabsTrigger>
                <TabsTrigger value="events" data-testid="tab-admin-events">Events</TabsTrigger>
                <TabsTrigger value="payments" data-testid="tab-admin-payments">Payments</TabsTrigger>
                <TabsTrigger value="requests" data-testid="tab-admin-requests">Requests</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
=======
            {user?.role === 'super_admin' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Events"
                  value={events.length}
                  icon={Calendar}
                  change={12}
                  changeLabel="from last month"
                />
                <StatCard
                  title="Total Participants"
                  value={totalParticipants}
                  icon={Users}
                  change={8}
                  changeLabel="from last month"
                />
                <StatCard
                  title="Revenue"
                  value={formatCurrency(totalRevenue)}
                  icon={DollarSign}
                  change={23}
                  changeLabel="from last month"
                />
                <StatCard
                  title="Pending Requests"
                  value={pendingRequests}
                  icon={FileText}
                />
              </div>
            )}

            <Tabs defaultValue={user?.role === 'student_admin' ? "events" : "overview"} className="space-y-6">
              <TabsList>
                {user?.role === 'super_admin' && (
                  <>
                    <TabsTrigger value="overview" data-testid="tab-admin-overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics" data-testid="tab-admin-analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="payments" data-testid="tab-admin-payments">Payments</TabsTrigger>
                    <TabsTrigger value="requests" data-testid="tab-admin-requests">Requests</TabsTrigger>
                    <TabsTrigger value="student-admins" data-testid="tab-admin-student-admins">Student Admin Log</TabsTrigger>
                  </>
                )}
                <TabsTrigger value="events" data-testid="tab-admin-events">
                  {user?.role === 'student_admin' ? 'My Events' : 'Events'}
                </TabsTrigger>
                {user?.role === 'student_admin' && (
                  <TabsTrigger value="requests" data-testid="tab-admin-requests">Request Admin Access</TabsTrigger>
                )}
              </TabsList>

              {user?.role === 'super_admin' && (
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment Analysis</CardTitle>
                      <CardDescription>Feedback sentiment per event</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sentimentData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="positive" fill="hsl(var(--chart-2))" name="Positive" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="neutral" fill="hsl(var(--chart-4))" name="Neutral" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="negative" fill="hsl(var(--chart-5))" name="Negative" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment Trend</CardTitle>
                      <CardDescription>Average rating over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" className="text-xs" />
                          <YAxis domain={[0, 5]} className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--chart-1))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Events by Category</CardTitle>
                    <CardDescription>Distribution of events across categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((_, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
<<<<<<< HEAD
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
=======
                </TabsContent>
              )}

              {user?.role === 'super_admin' && (
                <TabsContent value="analytics" className="space-y-6">
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Engagement Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Average Registration Rate</span>
                          <span className="font-bold">78%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Average Attendance Rate</span>
                          <span className="font-bold">92%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Feedback Response Rate</span>
                          <span className="font-bold">45%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Repeat Participant Rate</span>
                          <span className="font-bold">34%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Popular Events</CardTitle>
                      <CardDescription>Top performing events by registration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {events
                          .sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0))
                          .slice(0, 5)
                          .map((event, index) => (
                            <div key={event.id} className="flex items-center gap-4">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{event.title}</p>
                                <p className="text-sm text-muted-foreground">{event.participantCount} participants</p>
                              </div>
                              <Badge variant="secondary">{event.category}</Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
<<<<<<< HEAD

              <TabsContent value="events" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">All Events</h2>
                  <Button asChild data-testid="button-create-event">
                    <Link href="/admin/events/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Link>
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Event</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Participants</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((event) => (
                            <tr key={event.id} className="border-b last:border-0">
                              <td className="px-6 py-4">
                                <p className="font-medium">{event.title}</p>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="secondary">{event.category}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                {formatDate(event.date)}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline">{event.status}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {event.participantCount} / {event.capacity}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
=======
              )}
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)

              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payments</CardTitle>
                    <CardDescription>Recent payment transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No payments yet</div>
                    ) : (
                      <div className="overflow-hidden rounded-md border">
                        <table className="w-full text-left">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-6 py-3 text-sm">User</th>
                              <th className="px-6 py-3 text-sm">Event</th>
                              <th className="px-6 py-3 text-sm">Amount</th>
                              <th className="px-6 py-3 text-sm">Status</th>
                              <th className="px-6 py-3 text-sm">Txn</th>
                              <th className="px-6 py-3 text-sm" />
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((p) => (
                              <tr key={p.id} className="border-t">
                                <td className="px-6 py-4 text-sm">{p.userId}</td>
                                <td className="px-6 py-4 text-sm">{p.eventId}</td>
                                <td className="px-6 py-4 text-sm">{formatCurrency(p.amount || 0)}</td>
                                <td className="px-6 py-4 text-sm">{p.status}</td>
                                <td className="px-6 py-4 text-sm">{p.transactionId}</td>
                                <td className="px-6 py-4 text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mr-2"
                                    onClick={() => handlePreview(p.id)}
                                  >
                                    Preview
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resendMutation.mutate(p.id)}
                                  >
                                    Resend Email
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests" className="space-y-6">
<<<<<<< HEAD
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Requests</CardTitle>
                    <CardDescription>Pending requests for admin privileges</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {requests.filter((r) => r.status === "pending").length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>No pending requests</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {requests
                          .filter((r) => r.status === "pending")
                          .map((request) => (
                            <div
                              key={request.id}
                              className="flex items-center justify-between p-4 rounded-lg border"
                            >
                              <div className="space-y-1">
                                <p className="font-medium">User: {request.userId}</p>
                                <p className="text-sm text-muted-foreground">{request.message}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-green-600">
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600">
=======
                {user?.role === 'student_admin' ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Request Event Creation Permission</CardTitle>
                      <CardDescription>Submit a request to create a new event</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Event Details *</label>
                          <Textarea
                            placeholder="Describe the event you want to create (title, description, category, date, etc.)..."
                            value={eventDescription}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEventDescription(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Additional Message</label>
                          <Textarea
                            placeholder="Any additional information for the super admin..."
                            value={requestMessage}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestMessage(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button 
                          onClick={() => createRequestMutation.mutate({ 
                            message: requestMessage || "Requesting permission to create event", 
                            eventDescription: eventDescription 
                          })}
                          disabled={!eventDescription.trim() || createRequestMutation.isPending}
                          className="w-full"
                        >
                          {createRequestMutation.isPending ? "Submitting..." : "Request Event Creation"}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Each approval allows you to create one event only.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Admin Requests</CardTitle>
                      <CardDescription>Pending requests for admin privileges</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {requests.filter((r) => r.status === "pending").length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>No pending requests</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {requests
                            .filter((r) => r.status === "pending")
                            .reduce((uniqueRequests, request) => {
                              // Check if this user already has a request in the list
                              const existingRequest = uniqueRequests.find(r => r.userId === request.userId);
                              if (!existingRequest) {
                                uniqueRequests.push(request);
                              }
                              return uniqueRequests;
                            }, [] as AdminRequest[])
                            .map((request) => (
                            <div
                              key={request.id}
                              className="p-4 rounded-lg border space-y-3"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">User ID: {request.userId}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {request.status}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">Request Message:</p>
                                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                    {request.message}
                                  </p>
                                </div>
                                {request.eventDescription && (
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Event Description:</p>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                      {request.eventDescription}
                                    </p>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Submitted: {formatDate(request.createdAt)}
                                </p>
                              </div>
                              <div className="flex gap-2 pt-2 border-t">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => approveRequestMutation.mutate(request.id)}
                                  disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => rejectRequestMutation.mutate(request.id)}
                                  disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                                >
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
<<<<<<< HEAD
=======
                )}
              </TabsContent>

              {user?.role === 'super_admin' && (
                <TabsContent value="student-admins" className="space-y-6">
                  <StudentAdminLogSection />
                </TabsContent>
              )}

              <TabsContent value="events" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {user?.role === 'student_admin' ? 'My Events' : 'All Events'}
                  </h2>
                  {(user?.role === 'super_admin' || (user?.role === 'student_admin' && hasEventCreationPermission) || (user?.role === 'student_admin')) && (
                    <Button asChild data-testid="button-create-event">
                      <Link href="/admin/events/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                      </Link>
                    </Button>
                  )}
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Event</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Participants</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(user?.role === 'student_admin' 
                            ? events.filter(e => e.createdById === user?.id)
                            : events
                          ).map((event) => (
                            <tr key={event.id} className="border-b last:border-0">
                              <td className="px-6 py-4">
                                <p className="font-medium">{event.title}</p>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="secondary">{event.category}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                {formatDate(event.date)}
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline">{event.status}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {event.participantCount} / {event.capacity}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/events/${event.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsPreviewOpen(false)} />
          <div className="relative bg-white rounded shadow-lg w-11/12 max-w-4xl max-h-[80vh] overflow-auto p-4 dark:bg-slate-950">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <h3 className="text-lg font-medium">Email Preview</h3>
              <div>
                <button
                  className="mr-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => {
                    if (previewingPaymentId) {
                      resendMutation.mutate(previewingPaymentId);
                      setIsPreviewOpen(false);
                    }
                  }}
                >
                  Send
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </button>
              </div>
            </div>
            <div className="border rounded p-4 bg-white dark:bg-slate-900">
              {previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <div className="text-center text-gray-500">Loading preview…</div>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}