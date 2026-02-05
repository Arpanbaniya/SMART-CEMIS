import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  UserCheck,
  Users2,
  Crown,
  Shield
} from "lucide-react";
import { Event } from "../../../shared/schema";
import { EventRegistrationModal } from "./event-registration-modal";

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

interface TeamMember {
  userId: string;
  studentName: string;
  rollNo: string;
  gender: string;
  email: string;
}

interface UserTeamViewProps {
  event: Event;
  isRegistered?: boolean;
}

export function UserTeamView({ event, isRegistered }: UserTeamViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

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

  // Check if user is already in a team
  const userTeam = teams.find(team => 
    team.members.some(member => member.userId === user?.id)
  );

  const handleRegisterAsTeam = (teamName: string) => {
    setSelectedTeam(teamName);
    setRegistrationModalOpen(true);
  };

  const canJoinTeam = (team: Team) => {
    if (!user) return false;
    if (isRegistered) return false; // Already registered for the event
    if (userTeam) return false; // Already in a team
    if (team.members.some(member => member.userId === user?.id)) return false; // Already in this team
    if (event.maxTeamMembers && (team.memberCount || 0) >= event.maxTeamMembers) return false; // Team is full
    return true;
  };

  const getTeamStatusColor = (team: Team) => {
    if (!user) return "default";
    if (userTeam && userTeam.name === team.name) return "default";
    if (team.members.some(member => member.userId === user?.id)) return "default";
    if (!canJoinTeam(team)) return "secondary";
    return "default";
  };

  const getTeamStatusText = (team: Team) => {
    if (!user) return "";
    if (userTeam && userTeam.name === team.name) return "Your Team";
    if (team.members.some(member => member.userId === user?.id)) return "Already Member";
    if (isRegistered) return "Already Registered";
    if (!canJoinTeam(team)) return "Team Full";
    return "";
  };

  if (!event.isTeamEvent) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Not a Team Event</h3>
          <p className="text-muted-foreground">This event doesn't support team participation.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* User Status Card */}
      {userTeam && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100 text-lg">
                  You're registered in {userTeam.name}
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  {(userTeam.memberCount || 0)} {event.maxTeamMembers ? `/ ${event.maxTeamMembers}` : ''} members
                </p>
              </div>
              <Badge variant="outline" className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600">
                <Crown className="h-3 w-3 mr-1" />
                Team Member
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registered but not in team status */}
      {isRegistered && !userTeam && event.isTeamEvent && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">
                  You're registered for this event
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  Join a team to complete your registration
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600">
                <Users className="h-3 w-3 mr-1" />
                Registered
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Header */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Team Registration</CardTitle>
                <p className="text-muted-foreground">Join a team or create your own</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                <Users className="h-3 w-3 mr-1" />
                {teams.length} Teams
              </Badge>
              {event.maxTeamMembers && (
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
                  <Shield className="h-3 w-3 mr-1" />
                  {event.maxTeamMembers} Members/Team
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card className="w-full">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Teams Yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to create a team for this event and start building your dream team!
              </p>
              <Button 
                size="lg"
                onClick={() => setRegistrationModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create New Team
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.name} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              {/* Team Status Badge */}
              {getTeamStatusText(team) && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant={getTeamStatusColor(team)} className="text-xs">
                    {getTeamStatusText(team)}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(team.memberCount || 0)} {event.maxTeamMembers ? `/ ${event.maxTeamMembers}` : ''} members
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Team Members Preview */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                  <div className="flex flex-wrap gap-1">
                    {team.members && team.members.length > 0 ? (
                      team.members.slice(0, 6).map((member: TeamMember) => (
                        <div
                          key={member.userId}
                          className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400"
                          title={member.studentName}
                        >
                          {member.studentName?.charAt(0) || 'U'}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No members yet</p>
                    )}
                    {team.members && team.members.length > 6 && (
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium text-muted-foreground">
                        +{team.members.length - 6}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {canJoinTeam(team) && (
                    <Button
                      onClick={() => handleRegisterAsTeam(team.name)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Join This Team
                    </Button>
                  )}

                  {event.maxTeamMembers && (team.memberCount || 0) >= event.maxTeamMembers && (
                    <Button disabled className="w-full" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Team Full
                    </Button>
                  )}

                  {userTeam && userTeam.name === team.name && (
                    <Button disabled className="w-full" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Your Team
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create New Team Section */}
      {!userTeam && !isRegistered && teams.length > 0 && (
        <Card className="w-full border-dashed border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Your Own Team</h3>
              <p className="text-muted-foreground mb-4">
                Don't see a team you like? Create your own and invite others to join!
              </p>
              <Button 
                onClick={() => setRegistrationModalOpen(true)}
                variant="outline"
                className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create New Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Modal */}
      <EventRegistrationModal
        isOpen={registrationModalOpen}
        onClose={() => {
          setRegistrationModalOpen(false);
          setSelectedTeam(null);
        }}
        event={event}
        eventId={event.id}
        preselectedTeam={selectedTeam}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['registrations', event.id] });
        }}
      />
    </div>
  );
}
