import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  UserPlus,
  CheckCircle,
  Trophy,
  Shield,
  AlertCircle
} from "lucide-react";
import { Event } from "../../../shared/schema";

interface TeamSelectionProps {
  event: Event;
  onTeamSelected: (teamName: string, isCreating: boolean) => void;
  existingTeams: any[];
  canCreateNewTeam: boolean;
}

export function TeamSelection({ 
  event, 
  onTeamSelected, 
  existingTeams, 
  canCreateNewTeam 
}: TeamSelectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const toggleTeamExpansion = (teamName: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamName]: !prev[teamName]
    }));
  };

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive"
      });
      return;
    }

    // Check if team already exists
    const existingTeam = existingTeams.find(t => t.name.toLowerCase() === newTeamName.toLowerCase());
    if (existingTeam) {
      toast({
        title: "Error", 
        description: "Team with this name already exists",
        variant: "destructive"
      });
      return;
    }

    onTeamSelected(newTeamName.trim(), true);
    setNewTeamName("");
    setShowCreateForm(false);
  };

  const handleJoinTeam = (teamName: string) => {
    // Check if user is already in this team
    const team = existingTeams.find(t => t.name === teamName);
    const userAlreadyInTeam = team?.members?.some((member: any) => member.userId === user?.id);
    
    if (userAlreadyInTeam) {
      toast({
        title: "Already Registered",
        description: "You are already a member of this team",
        variant: "destructive"
      });
      return;
    }

    // Check team capacity
    if (event.maxTeamMembers && team?.memberCount >= event.maxTeamMembers) {
      toast({
        title: "Team Full",
        description: "This team has reached its maximum capacity",
        variant: "destructive"
      });
      return;
    }

    onTeamSelected(teamName, false);
  };

  const isUserInAnyTeam = () => {
    if (!user?.id) return false;
    return existingTeams.some(team => 
      team.members?.some((member: any) => member.userId === user.id)
    );
  };

  const getUserTeam = () => {
    if (!user?.id) return null;
    return existingTeams.find(team => 
      team.members?.some((member: any) => member.userId === user.id)
    );
  };

  // If user is already in a team, show that status
  if (isUserInAnyTeam()) {
    const userTeam = getUserTeam();
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Already Registered
              </h3>
              <p className="text-green-600">
                You are a member of team: <strong>{userTeam?.name}</strong>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              You cannot register for multiple teams in the same event.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header Info */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Sports Tournament Registration</h3>
                <p className="text-sm text-muted-foreground">Join an existing team or create your own</p>
              </div>
            </div>
            <Shield className="h-8 w-8 text-primary/30" />
          </div>
        </CardContent>
      </Card>

      {/* Team Limits Info */}
      {event.maxTeams && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Tournament Limits</h4>
                  <div className="flex gap-4 mt-1">
                    <p className="text-sm text-blue-700">
                      <strong>Teams:</strong> {existingTeams.length}/{event.maxTeams} created
                    </p>
                    {event.maxTeamMembers && (
                      <p className="text-sm text-blue-700">
                        <strong>Members:</strong> Max {event.maxTeamMembers} per team
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={existingTeams.length >= event.maxTeams ? "destructive" : "default"} className="mb-1">
                  {existingTeams.length >= event.maxTeams ? "Full" : "Open"}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {existingTeams.length >= event.maxTeams ? "All teams created" : `${event.maxTeams - existingTeams.length} slots left`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Team Section */}
      {canCreateNewTeam && (
        <Card className="border-2 border-dashed border-green-300 hover:border-green-400 transition-colors">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Plus className="h-5 w-5" />
              Create New Team
              <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                Recommended
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showCreateForm ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Start your own team and invite others to join
                </p>
                <Button 
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Team
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newTeamName" className="text-base font-medium">Team Name</Label>
                  <Input
                    id="newTeamName"
                    placeholder="Enter team name (e.g., The Champions)"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="h-11"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a unique name for your team (max 50 characters)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    onClick={handleCreateTeam}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!newTeamName.trim()}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create & Join Team
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewTeamName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Teams Section */}
      {existingTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Teams ({existingTeams.length})
              <Badge variant="secondary" className="ml-2">
                Join Existing
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {existingTeams.map((team) => {
              const isUserInTeam = team.members?.some((member: any) => member.userId === user?.id);
              const isTeamFull = event.maxTeamMembers && team.memberCount >= event.maxTeamMembers;
              const availableSlots = event.maxTeamMembers ? event.maxTeamMembers - team.memberCount : null;
              
              return (
                <Card key={team.name} className={`border-2 transition-all duration-200 ${
                  isUserInTeam ? 'border-green-300 bg-green-50/30' : 
                  isTeamFull ? 'border-gray-200 bg-gray-50/30 opacity-60' : 
                  'border-primary/20 hover:border-primary/40 hover:shadow-md'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {team.memberCount || 0}{event.maxTeamMembers ? `/${event.maxTeamMembers}` : ''} members
                            </Badge>
                            {isUserInTeam && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Your Team
                              </Badge>
                            )}
                            {isTeamFull && !isUserInTeam && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Full
                              </Badge>
                            )}
                          </div>
                        </div>
                        {availableSlots !== null && availableSlots > 0 && !isUserInTeam && (
                          <p className="text-sm text-green-600 font-medium">
                            {availableSlots} slot{availableSlots > 1 ? 's' : ''} available
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTeamExpansion(team.name)}
                          className="h-8"
                        >
                          {expandedTeams[team.name] ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              View Members
                            </>
                          )}
                        </Button>
                        
                        {!isUserInTeam && !isTeamFull && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleJoinTeam(team.name)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Join Team
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded team members */}
                    {expandedTeams[team.name] && team.members && team.members.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/200">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Team Members ({team.members.length})
                        </h4>
                        <div className="grid gap-2">
                          {team.members.map((member: any) => (
                            <div key={member.userId} className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">
                                    {member.studentName?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">{member.studentName}</span>
                                  <span className="text-muted-foreground ml-2">({member.rollNo})</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {member.gender}
                                </Badge>
                                {member.userId === user?.id && (
                                  <Badge variant="secondary" className="text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* No Teams Available */}
      {existingTeams.length === 0 && !canCreateNewTeam && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">No Teams Available</h3>
                <p className="text-sm">Maximum number of teams has been reached for this tournament</p>
                <p className="text-xs mt-1">Contact the event administrator if you need assistance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
