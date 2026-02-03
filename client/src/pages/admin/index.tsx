// client/src/pages/admin/index.tsx
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { StatCard } from "@/components/stat-card";
import { PageLoader } from "@/components/loading-spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminRequestStatus } from "@/components/AdminRequestStatus";
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
  FileText,
  DollarSign,
  TrendingUp,
  Check,
  X,
  Eye,
  Search,
  LogOut,
  Plus,
  Trash2,
  User,
  UserX,
  Heart,
  Shield,
  Home,
  Edit,
  History,
  Clock,
  Filter,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials, formatDate, formatCurrency } from "@/lib/utils";
import type { Event, AdminRequest, Payment } from "@shared/schema";

// Add near imports
type CategoryStat = { name: string; value: number };
const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewingPaymentId, setPreviewingPaymentId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [hasEventCreationPermission, setHasEventCreationPermission] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();
  const { joinAdmin, onAdminUpdate } = useSocket(user?.id || null);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      joinAdmin();
    }
  }, [user?.role, joinAdmin]);

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
  });

  const { data: requests = [] } = useQuery<AdminRequest[]>({
    queryKey: ["/api/admin/requests"],
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
    queryKey: ["/api/admin/student-admin/status"],
    queryFn: async () => {
      if (!user || user.role !== 'student_admin') return null;
      const response = await fetch("/api/admin/student-admin/status", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch student admin status");
      }
      return response.json();
    },
    enabled: !!user && user.role === 'student_admin',
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (studentAdminStatus) {
      setHasEventCreationPermission(studentAdminStatus.canCreateEvent || false);
    } else if (user?.role === 'student_admin') {
      // Fallback: Student admins should be able to create events if they have UNUSED approved requests
      // Check if user has any unused approved requests
      const userApprovedRequests = requests.filter(r => 
        r.userId === user.id && r.status === 'approved' && !r.usedForEventCreation
      );
      
      setHasEventCreationPermission(userApprovedRequests.length > 0);
    }
  }, [studentAdminStatus, requests, user]);

  useEffect(() => {
    // Super admins always have event creation permission
    const superAdminPermission = user?.role === 'super_admin';
    // Student admins need specific permission
    const studentAdminPermission = user?.role === 'student_admin' && hasEventCreationPermission;
    
    // This effect can be used for future debugging if needed
  }, [user?.role, hasEventCreationPermission]);

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    queryFn: async () => {
      const response = await fetch("/api/admin/payments", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      return response.json();
    },
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

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event Deleted", description: "The event has been deleted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/admin/requests/${requestId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-admin/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      return apiRequest("PATCH", `/api/admin/requests/${requestId}/reject`, { reason });
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

  // Admin Log History Component
  function AdminLogHistory() {
    const [timeframe, setTimeframe] = useState<string>('all');
    const [entityType, setEntityType] = useState<string>('all');
    const [action, setAction] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
    const queryClient = useQueryClient();

    // Debounce search input with proper focus management
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setSearchDebounced(search);
      }, 300); // 300ms debounce

      return () => clearTimeout(timer);
    }, [search]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);
    };

    const { data: logsData, isLoading: logsLoading } = useQuery({
      queryKey: ["/api/admin/logs", timeframe, entityType, action, searchDebounced],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (timeframe && timeframe !== 'all') params.append('timeframe', timeframe);
        if (entityType && entityType !== 'all') params.append('entityType', entityType);
        if (action && action !== 'all') params.append('action', action);
        if (searchDebounced) params.append('search', searchDebounced);

        const response = await fetch(`/api/admin/logs?${params.toString()}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch admin logs");
        }
        return response.json();
      },
      enabled: user?.role === 'super_admin',
      refetchOnWindowFocus: false,
      staleTime: 5000, // 5 seconds
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    });

    useEffect(() => {
      const unsubscribe = onAdminUpdate(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }, [onAdminUpdate, queryClient]);

    const deleteLogsMutation = useMutation({
      mutationFn: async (deleteOptions: { timeframe?: string; entityType?: string; action?: string; specificIds?: string[] }) => {
        return apiRequest("DELETE", "/api/admin/logs", deleteOptions);
      },
      onSuccess: (data: any) => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
        toast({ 
          title: "Logs Deleted", 
          description: `Successfully deleted ${data.deletedCount} log entries.` 
        });
        setSelectedLogs([]);
      },
      onError: (error: any) => {
        toast({ 
          title: "Error", 
          description: error?.error || "Failed to delete logs.", 
          variant: "destructive" 
        });
      },
    });

    const handleDeleteSelected = () => {
      if (selectedLogs.length === 0) return;
      
      if (!window.confirm(`Are you sure you want to delete ${selectedLogs.length} log entries? This action cannot be undone.`)) {
        return;
      }

      deleteLogsMutation.mutate({ specificIds: selectedLogs });
    };

    const handleDeleteByTimeframe = (selectedTimeframe: string) => {
      if (!window.confirm(`Are you sure you want to delete all logs from the past ${selectedTimeframe}? This action cannot be undone.`)) {
        return;
      }

      deleteLogsMutation.mutate({ timeframe: selectedTimeframe });
    };

    const toggleLogSelection = (logId: string) => {
      setSelectedLogs(prev => 
        prev.includes(logId) 
          ? prev.filter(id => id !== logId)
          : [...prev, logId]
      );
    };

    const selectAllLogs = () => {
      if (logsData?.logs) {
        setSelectedLogs(logsData.logs.map((log: any) => log.id));
      }
    };

    const clearSelection = () => {
      setSelectedLogs([]);
    };

    if (logsLoading) {
      return <div className="text-center py-8">Loading...</div>;
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Admin Log History
              </CardTitle>
              <CardDescription>View and manage admin activity logs</CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedLogs.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={deleteLogsMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected ({selectedLogs.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="1h">Past Hour</SelectItem>
                <SelectItem value="24h">Past 24 Hours</SelectItem>
                <SelectItem value="7d">Past 7 Days</SelectItem>
                <SelectItem value="30d">Past 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                <SelectItem value="admin_request">Admin Requests</SelectItem>
                <SelectItem value="user_role">User Roles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
                <SelectItem value="revoke">Revoke</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative h-10">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
              <Input
                ref={inputRef}
                key="search-input"
                placeholder="Search logs... (type to search)"
                value={search}
                onChange={handleSearchChange}
                className="w-80 h-10 pl-10 pr-8 border-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                autoComplete="off"
              />
              {/* Loading spinner - shows when debouncing */}
              {search !== searchDebounced && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                </div>
              )}
            </div>

            <div className="flex gap-2 ml-auto">
              {logsData?.logs?.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAllLogs}
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    disabled={selectedLogs.length === 0}
                  >
                    Clear Selection
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Delete Actions */}
          <div className="flex flex-wrap gap-2 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-800 dark:text-orange-200">
              <Clock className="h-4 w-4" />
              Quick Delete:
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteByTimeframe('1h')}
              disabled={deleteLogsMutation.isPending}
            >
              Past Hour
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteByTimeframe('24h')}
              disabled={deleteLogsMutation.isPending}
            >
              Past 24 Hours
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteByTimeframe('7d')}
              disabled={deleteLogsMutation.isPending}
            >
              Past 7 Days
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteByTimeframe('30d')}
              disabled={deleteLogsMutation.isPending}
            >
              Past 30 Days
            </Button>
          </div>

          {/* Logs Table */}
          {logsData?.logs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No logs found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logsData?.logs?.map((log: any) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedLogs.includes(log.id) 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggleLogSelection(log.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedLogs.includes(log.id)}
                      onChange={() => toggleLogSelection(log.id)}
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs font-medium ${
                            log.action === 'create' ? 'border-green-200 text-green-700 bg-green-50' :
                            log.action === 'update' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                            log.action === 'delete' ? 'border-red-200 text-red-700 bg-red-50' :
                            log.action === 'approve' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                            log.action === 'reject' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                            'border-purple-200 text-purple-700 bg-purple-50'
                          }`}>
                            {log.action.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className={`text-xs font-medium ${
                            log.entityType === 'event' ? 'border-indigo-200 text-indigo-700 bg-indigo-50' :
                            log.entityType === 'admin_request' ? 'border-cyan-200 text-cyan-700 bg-cyan-50' :
                            'border-pink-200 text-pink-700 bg-pink-50'
                          }`}>
                            {log.entityType.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            {log.userId?.firstName && log.userId?.lastName 
                              ? `${log.userId.firstName} ${log.userId.lastName}`
                              : log.userId?.email || 'Unknown User'
                            }
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {log.createdAt && !Number.isNaN(new Date(log.createdAt).getTime())
                              ? new Date(log.createdAt).toLocaleDateString()
                              : '—'}
                          </div>
                          <div className="text-xs font-medium text-primary">
                            {log.createdAt && !Number.isNaN(new Date(log.createdAt).getTime())
                              ? new Date(log.createdAt).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit', 
                                  second: '2-digit',
                                  hour12: false 
                                })
                              : '—'}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {log.details}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        {log.ipAddress && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            IP: {log.ipAddress}
                          </span>
                        )}
                        {log.userAgent && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            {log.userAgent.includes('Chrome') ? 'Chrome' :
                             log.userAgent.includes('Firefox') ? 'Firefox' :
                             log.userAgent.includes('Safari') ? 'Safari' :
                             log.userAgent.includes('Edge') ? 'Edge' : 'Other'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {logsData?.pagination && logsData.pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {logsData.pagination.page} of {logsData.pagination.pages} pages
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logsData.pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logsData.pagination.page >= logsData.pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

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

  // Check if user has admin privileges
  if (user?.role !== 'super_admin' && user?.role !== 'student_admin') {
    window.location.href = "/";
    return null;
  }

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

  // Fetch real analytics data
  const { data: analyticsOverview } = useQuery({
    queryKey: ["/api/analytics/overview"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/overview", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch analytics overview");
      }
      return response.json();
    },
    refetchInterval: 30000,
    enabled: user?.role === 'super_admin'
  });

  const { data: sentimentData } = useQuery({
    queryKey: ["/api/analytics/sentiment"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/sentiment", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sentiment data");
      }
      return response.json();
    },
    refetchInterval: 30000,
    enabled: user?.role === 'super_admin'
  });

  const { data: sentimentTrend } = useQuery({
    queryKey: ["/api/analytics/sentiment-trend"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/sentiment-trend", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sentiment trend");
      }
      return response.json();
    },
    refetchInterval: 30000,
    enabled: user?.role === 'super_admin'
  });

  const { data: eventSentiments } = useQuery({
    queryKey: ["/api/analytics/sentiment-events"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/sentiment-events", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch event sentiments");
      }
      return response.json();
    },
    refetchInterval: 30000,
    enabled: user?.role === 'super_admin'
  });

  const { data: categoryData } = useQuery({
    queryKey: ["/api/analytics/categories"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/categories", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch category data");
      }
      return response.json();
    },
    refetchInterval: 30000,
    enabled: user?.role === 'super_admin'
  });

  const { data: engagementData } = useQuery({
    queryKey: ["/api/analytics/engagement"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/engagement", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch engagement data");
      }
      return response.json();
    },
    refetchInterval: 30000,
    enabled: user?.role === 'super_admin'
  });

  // Format sentiment data for charts
  const sentimentChartData = sentimentData ? [
    { name: "Positive", value: sentimentData.positive, fill: "hsl(var(--chart-2))" },
    { name: "Neutral", value: sentimentData.neutral, fill: "hsl(var(--chart-4))" },
    { name: "Negative", value: sentimentData.negative, fill: "hsl(var(--chart-5))" }
  ] : [];

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b px-8 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Calendar className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold">EventHub</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserName()} />
                  <AvatarFallback className="dark:bg-white dark:text-black bg-black text-white font-bold">
                    {getInitials(getUserName())}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{getUserName()}</p>
                  {user?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/favorites" className="cursor-pointer">
                  <Heart className="mr-2 h-4 w-4" />
                  My Favorite Events
                </Link>
              </DropdownMenuItem>
              {user?.role === 'student_admin' && (
                <DropdownMenuItem asChild>
                  <Link href="/registrations" className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    Registered Events
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Events
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-8 py-8 space-y-8">
          {user?.role === 'super_admin' && analyticsOverview && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Events"
                value={analyticsOverview.totalEvents}
                icon={Calendar}
                change={analyticsOverview.eventsChange}
                changeLabel="from last month"
              />
              <StatCard
                title="Total Participants"
                value={analyticsOverview.totalParticipants}
                icon={Users}
                change={analyticsOverview.participantsChange}
                changeLabel="from last month"
              />
              <StatCard
                title="Revenue (NPR)"
                value={formatCurrency(analyticsOverview.totalRevenue)}
                icon={DollarSign}
                change={analyticsOverview.revenueChange}
                changeLabel="from last month"
              />
              <StatCard
                title="Pending Requests"
                value={analyticsOverview.pendingRequests}
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
                    <TabsTrigger value="admin-logs" data-testid="tab-admin-logs">Log History</TabsTrigger>
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
                  <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Analysis</CardTitle>
                    <CardDescription>Real-time feedback sentiment analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sentimentChartData}>
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
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Trend</CardTitle>
                    <CardDescription>Average rating over time (last 30 days)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={sentimentTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
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
                          data={categoryData || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(categoryData || []).map((entry: any, index: number) => (
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

                {engagementData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement Metrics</CardTitle>
                      <CardDescription>User engagement and participation statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Users</span>
                          <span className="font-bold">{engagementData.totalUsers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active Users (30d)</span>
                          <span className="font-bold">{engagementData.activeUsers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Feedback</span>
                          <span className="font-bold">{engagementData.totalFeedback}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Feedback Response Rate</span>
                          <span className="font-bold">{engagementData.feedbackResponseRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Registrations</span>
                          <span className="font-bold">{engagementData.totalRegistrations}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Avg Registrations/Event</span>
                          <span className="font-bold">{engagementData.avgRegistrationsPerEvent}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Event-wise Sentiment Analysis */}
                {eventSentiments && eventSentiments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Sentiment Analysis</CardTitle>
                      <CardDescription>Sentiment breakdown per event with flagged feedback count</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {eventSentiments.map((event: any) => (
                          <div key={event.eventId} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm">{event.eventName}</h4>
                              <Badge variant={event.flagged > 0 ? "destructive" : "secondary"}>
                                {event.flagged > 0 ? `${event.flagged} Flagged` : "Clean"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-bold text-green-600">{event.positive}</div>
                                <div className="text-muted-foreground">Positive</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-gray-600">{event.neutral}</div>
                                <div className="text-muted-foreground">Neutral</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-red-600">{event.negative}</div>
                                <div className="text-muted-foreground">Negative</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold">{event.totalFeedback}</div>
                                <div className="text-muted-foreground">Total</div>
                              </div>
                            </div>
                            {event.avgConfidence && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Avg Confidence: {(event.avgConfidence * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Flagged Feedback Summary */}
                {sentimentData && sentimentData.flaggedCount > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-red-700">⚠️ Flagged Content Alert</CardTitle>
                      <CardDescription>Feedback requiring admin attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Flagged Feedback</span>
                        <Badge variant="destructive">{sentimentData.flaggedCount}</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Content was automatically flagged by OpenAI Moderation API for potentially harmful content
                      </div>
                    </CardContent>
                  </Card>
                )}
                </TabsContent>
              )}

              {user?.role === 'super_admin' && (
                <TabsContent value="analytics" className="space-y-6">
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
              )}

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
                {user?.role === 'student_admin' ? (
                  <>
                    <AdminRequestStatus />
                    
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
                  </>
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
                                  onClick={() => {
                                    setRejectingRequestId(request.id);
                                    setRejectDialogOpen(true);
                                  }}
                                  disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                                >
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
                )}
              </TabsContent>

              {user?.role === 'super_admin' && (
                <TabsContent value="student-admins" className="space-y-6">
                  <StudentAdminLogSection />
                </TabsContent>
              )}

              {user?.role === 'super_admin' && (
                <TabsContent value="admin-logs" className="space-y-6">
                  <AdminLogHistory />
                </TabsContent>
              )}

              <TabsContent value="events" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {user?.role === 'student_admin' ? 'My Events' : 'All Events'}
                  </h2>
                  {(user?.role === 'super_admin' || (user?.role === 'student_admin' && hasEventCreationPermission)) && (
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
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/events/${event.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  {(user?.role === 'super_admin' || (user?.role === 'student_admin' && event.createdById === user?.id)) && (
                                    <>
                                      <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/admin/edit-event/${event.id}`}>
                                          <Edit className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                          if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                                            deleteMutation.mutate(event.id);
                                          }
                                        }}
                                        disabled={deleteMutation.isPending}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
        </Tabs>

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

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Admin Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for rejection</label>
              <Textarea
                placeholder="Please provide a reason for rejecting this request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
                setRejectingRequestId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (rejectingRequestId && rejectionReason.trim()) {
                  rejectRequestMutation.mutate({ 
                    requestId: rejectingRequestId, 
                    reason: rejectionReason.trim() 
                  });
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                  setRejectingRequestId(null);
                }
              }}
              disabled={!rejectionReason.trim() || rejectRequestMutation.isPending}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </main>
    </div>
  );
}