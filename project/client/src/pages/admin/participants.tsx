import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Search, 
  Trash2, 
  UserX, 
  Download,
  ChevronLeft,
  Calendar,
  MapPin,
  Shield
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getInitials } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface Participant {
  id: string;
  userId: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  };
  eventId: {
    id: string;
    title: string;
    date: string;
    location: string;
    category: string;
    createdById: string;
  };
  registeredAt: string;
  studentName: string;
  semester: number;
  rollNo: string;
  programme: string;
  gender: string;
  teamName?: string;
}

export default function ParticipantsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterEvent, setFilterEvent] = useState("");

  const { data: participants = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/participants", search, filterEvent],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterEvent) params.append("eventId", filterEvent);
      
      const response = await apiRequest("GET", `/api/admin/participants?${params.toString()}`);
      return response;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/events");
      return response;
    },
  });

  const removeParticipantsMutation = useMutation({
    mutationFn: async (participantIds: string[]) => {
      return apiRequest("DELETE", "/api/admin/participants", { participantIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/participants"] });
      setSelectedParticipants([]);
      toast({
        title: "Participants Removed",
        description: `${data.removedCount} participant(s) removed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Removal Failed",
        description: error?.message || "Failed to remove participants.",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(participants.map((p: Participant) => p.id));
    }
  };

  const handleSelectParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleRemoveSelected = () => {
    if (selectedParticipants.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select participants to remove.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${selectedParticipants.length} participant(s)? This action cannot be undone.`)) {
      removeParticipantsMutation.mutate(selectedParticipants);
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (window.confirm("Are you sure you want to remove this participant? This action cannot be undone.")) {
      removeParticipantsMutation.mutate([participantId]);
    }
  };

  const filteredParticipants = participants.filter((participant: Participant) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      participant.studentName.toLowerCase().includes(searchLower) ||
      participant.userId.email.toLowerCase().includes(searchLower) ||
      participant.rollNo.toLowerCase().includes(searchLower) ||
      participant.programme.toLowerCase().includes(searchLower) ||
      participant.eventId.title.toLowerCase().includes(searchLower);

    const matchesEvent = !filterEvent || participant.eventId.id === filterEvent;

    return matchesSearch && matchesEvent;
  });

  const canManageParticipant = (participant: Participant) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.role === 'student_admin') return participant.eventId.createdById === user.id;
    return false;
  };

  if (user?.role !== 'super_admin' && user?.role !== 'student_admin') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have permission to access participant management.
              </p>
              <Link href="/">
                <Button className="mt-4">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Participant Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.role === 'super_admin' ? 'Manage all event participants' : 'Manage participants for your events'}
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, roll no, programme, or event..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {user?.role === 'super_admin' && (
                <select
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">All Events</option>
                  {events.map((event: any) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {selectedParticipants.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-800">
                    {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''} selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedParticipants([])}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveSelected}
                    disabled={removeParticipantsMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participants List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Participants ({filteredParticipants.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedParticipants.length === filteredParticipants.length && filteredParticipants.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading participants...</span>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No participants found</h3>
                <p className="text-muted-foreground">
                  {search || filterEvent ? 'Try adjusting your search or filters' : 'No participants have registered yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Participant</th>
                      <th className="text-left p-4 font-medium">Event</th>
                      <th className="text-left p-4 font-medium">Details</th>
                      <th className="text-left p-4 font-medium">Registered</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((participant: Participant) => (
                      <tr key={participant.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedParticipants.includes(participant.id)}
                              onCheckedChange={() => handleSelectParticipant(participant.id)}
                              disabled={!canManageParticipant(participant)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {getInitials(participant.studentName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{participant.studentName}</div>
                              <div className="text-sm text-muted-foreground">{participant.userId.email}</div>
                              {participant.userId.role === 'super_admin' && (
                                <Badge variant="secondary" className="mt-1">Super Admin</Badge>
                              )}
                              {participant.userId.role === 'student_admin' && (
                                <Badge variant="secondary" className="mt-1">Student Admin</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{participant.eventId.title}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(participant.eventId.date)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {participant.eventId.location}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div><strong>Roll No:</strong> {participant.rollNo}</div>
                            <div><strong>Semester:</strong> {participant.semester}</div>
                            <div><strong>Programme:</strong> {participant.programme}</div>
                            <div><strong>Gender:</strong> {participant.gender}</div>
                            {participant.teamName && (
                              <div><strong>Team:</strong> {participant.teamName}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground">
                            {formatDate(participant.registeredAt)}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {canManageParticipant(participant) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveParticipant(participant.id)}
                              disabled={removeParticipantsMutation.isPending}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
