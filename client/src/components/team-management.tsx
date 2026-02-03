import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Trash2, 
  UserMinus, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Event } from "../../../shared/schema";

// Define Team interface locally to avoid import issues
interface Team {
  id: string;
  name: string;
  members: any[];
  eventId: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface TeamManagementProps {
  event: Event;
  isAdmin: boolean;
}

interface TeamMember {
  userId: string;
  studentName: string;
  rollNo: string;
  gender: string;
  email: string;
}

export function TeamManagement({ event, isAdmin }: TeamManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  // Fetch teams for this event
  const { data: teams = [], isLoading, refetch } = useQuery({
    queryKey: ['teams', event.id],
    queryFn: async () => {
      const response = await fetch(`/api/events/${event.id}/teams`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      return response.json() as Promise<Team[]>;
    },
    enabled: !!event.id && event.isTeamEvent
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamName: string) => {
      const response = await fetch(`/api/events/${event.id}/teams/${encodeURIComponent(teamName)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete team');
      }
      return response.json();
    },
    onSuccess: (_, teamName) => {
      toast({
        title: 'Team Deleted',
        description: `Team "${teamName}" has been deleted successfully.`
      });
      queryClient.invalidateQueries({ queryKey: ['teams', event.id] });
      queryClient.invalidateQueries({ queryKey: ['participants', event.id] });
      queryClient.invalidateQueries({ queryKey: ['tournament', event.id] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Remove team member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamName, userId }: { teamName: string; userId: string }) => {
      const response = await fetch(`/api/events/${event.id}/teams/${encodeURIComponent(teamName)}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to remove team member');
      }
      return response.json();
    },
    onSuccess: (_, { teamName }) => {
      toast({
        title: 'Member Removed',
        description: `Member has been removed from team "${teamName}".`
      });
      queryClient.invalidateQueries({ queryKey: ['teams', event.id] });
      queryClient.invalidateQueries({ queryKey: ['participants', event.id] });
      queryClient.invalidateQueries({ queryKey: ['tournament', event.id] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const toggleTeamExpansion = (teamName: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamName]: !prev[teamName]
    }));
  };

  const handleDeleteTeam = (teamName: string) => {
    if (window.confirm(`Are you sure you want to delete team "${teamName}"? This will remove all team members and their registrations.`)) {
      deleteTeamMutation.mutate(teamName);
    }
  };

  const handleRemoveMember = (teamName: string, member: TeamMember) => {
    if (window.confirm(`Are you sure you want to remove "${member.studentName}" from team "${teamName}"?`)) {
      removeMemberMutation.mutate({ teamName, userId: member.userId });
    }
  };

  if (!event.isTeamEvent) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>This is not a team event</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>You need admin privileges to manage teams</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {teams.length} {event.maxTeams ? `/ ${event.maxTeams}` : ''} Teams
              </Badge>
              {event.maxTeamMembers && (
                <Badge variant="outline">
                  {event.maxTeamMembers} Members/Team
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No teams have been created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <Card key={team.name} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{team.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {team.memberCount} {event.maxTeamMembers ? `/ ${event.maxTeamMembers}` : ''} members
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTeamExpansion(team.name)}
                        >
                          {expandedTeams[team.name] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Users className="h-4 w-4 mr-2" />
                              View Members
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Team Members: {team.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              {team.members && team.members.length > 0 ? (
                                team.members.map((member: TeamMember) => (
                                  <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800">
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">{member.studentName}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {member.rollNo} • {member.email}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                        {member.gender}
                                      </Badge>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveMember(team.name, member)}
                                        disabled={removeMemberMutation.isPending}
                                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                      >
                                        <UserMinus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-muted-foreground py-4">
                                  No members in this team
                                </p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTeam(team.name)}
                          disabled={deleteTeamMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expanded team members preview */}
                    {expandedTeams[team.name] && team.members && team.members.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Team Members:</h4>
                        <div className="space-y-2">
                          {team.members.slice(0, 3).map((member: TeamMember) => (
                            <div key={member.userId} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{member.studentName}</span>
                                <span className="text-muted-foreground ml-2">({member.rollNo})</span>
                              </div>
                              <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                                {member.gender}
                              </Badge>
                            </div>
                          ))}
                          {team.members.length > 3 && (
                            <p className="text-sm text-muted-foreground text-center">
                              ... and {team.members.length - 3} more members
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
