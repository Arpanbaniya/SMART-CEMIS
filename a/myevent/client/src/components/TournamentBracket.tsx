// client/src/components/TournamentBracket.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Event, Tournament, Match, TournamentRound, Registration } from '../../../shared/schema';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Trophy, Users, ChevronRight, Play, Download, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRealTimeEvents } from '@/hooks/useRealTimeEvents';
import jsPDF from 'jspdf';

interface TournamentBracketProps {
  event: Event;
  isAdmin: boolean;
}

interface Participant {
  id: string;
  name: string;
  type: 'individual' | 'team';
  gender?: 'male' | 'female' | 'other';
  teamMembers?: string[];
}

interface GenderBracket {
  gender: 'Male' | 'Female' | 'Other';
  participants: Participant[];
}

export default function TournamentBracket({ event, isAdmin }: TournamentBracketProps) {
  const [selectedWinners, setSelectedWinners] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tournament state
  const { data: tournament, isLoading, refetch } = useQuery({
    queryKey: ['tournament', event.id],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${event.id}/tournament`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tournament');
      }
      return response.json() as Promise<Tournament>;
    },
    enabled: !!event.id
  });

  // Fetch participants for winner selection
  const { data: registrations } = useQuery({
    queryKey: ['participants', event.id],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${event.id}/participants`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      return response.json() as Promise<Registration[]>;
    },
    enabled: !!event.id
  });

  // Process participants into structure
  const processParticipants = (registrations: Registration[]): GenderBracket[] => {
    if (!registrations || registrations.length === 0) return [];

    if (event.genderFixed) {
      // Single gender bracket
      const participants: Participant[] = registrations.map(reg => ({
        id: event.isTeamEvent ? reg.teamName || reg.userId : reg.userId,
        name: event.isTeamEvent ? reg.teamName || 'Unknown Team' : reg.studentName || 'Unknown',
        type: event.isTeamEvent ? 'team' : 'individual',
        teamMembers: reg.teamMembers
      }));
      
      return [{ gender: event.genderFixed, participants }];
    } else {
      // Split by gender
      const genderGroups: Record<string, Participant[]> = {
        Male: [],
        Female: [],
        Other: []
      };

      registrations.forEach(reg => {
        const gender = reg.gender === 'male' ? 'Male' : 
                     reg.gender === 'female' ? 'Female' : 'Other';
        
        genderGroups[gender].push({
          id: event.isTeamEvent ? reg.teamName || reg.userId : reg.userId,
          name: event.isTeamEvent ? reg.teamName || 'Unknown Team' : reg.studentName || 'Unknown',
          type: event.isTeamEvent ? 'team' : 'individual',
          gender: reg.gender,
          teamMembers: reg.teamMembers
        });
      });

      return Object.entries(genderGroups)
        .filter(([_, participants]) => participants.length > 0)
        .map(([gender, participants]) => ({ gender: gender as 'Male' | 'Female' | 'Other', participants }));
    }
  };

  const genderBrackets = processParticipants(registrations || []);

  const { user } = useAuth();

  // Real-time updates
  const { latestUpdate } = useRealTimeEvents(user?.id || null);
  
  useEffect(() => {
    if (latestUpdate?.type === 'tournamentUpdate' && latestUpdate.eventId === event.id) {
      queryClient.invalidateQueries({ queryKey: ['tournament', event.id] });
    }
  }, [latestUpdate, event.id, queryClient]);

  // Set winner mutation
  const setWinnerMutation = useMutation({
    mutationFn: async ({ matchId, winner }: { matchId: string; winner: string }) => {
      console.log('🔍 DEBUG: Setting winner for match:', matchId, 'winner:', winner);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${event.id}/tournament/winner/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ winner })
      });
      
      console.log('🔍 DEBUG: Set winner response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 DEBUG: Set winner error response:', errorText);
        throw new Error(`Failed to set winner: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔍 DEBUG: Set winner success:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🔍 DEBUG: Set winner mutation success:', data);
      toast({
        title: 'Winner updated',
        description: 'Match winner has been updated successfully.'
      });
      
      // Invalidate queries first
      queryClient.invalidateQueries({ queryKey: ['tournament', event.id] });
      
      // Then immediately refetch to ensure UI is updated
      setTimeout(() => {
        refetch();
      }, 100);
    },
    onError: (error) => {
      console.error('🔍 DEBUG: Set winner mutation error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Next round mutation
  const nextRoundMutation = useMutation({
    mutationFn: async () => {
      console.log('🔍 DEBUG: Advancing to next round');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${event.id}/tournament/next-round`, {
        method: 'POST',
        credentials: 'include'
      });
      
      console.log('🔍 DEBUG: Next round response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 DEBUG: Next round error response:', errorText);
        throw new Error(`Failed to advance to next round: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔍 DEBUG: Next round success:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🔍 DEBUG: Next round mutation success:', data);
      toast({
        title: 'Next round generated',
        description: 'Tournament has advanced to the next round.'
      });
      
      // Invalidate queries first
      queryClient.invalidateQueries({ queryKey: ['tournament', event.id] });
      
      // Then immediately refetch to ensure UI is updated
      setTimeout(() => {
        refetch();
      }, 100);
    },
    onError: (error) => {
      console.error('🔍 DEBUG: Next round mutation error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Generate certificate mutation
  const generateCertificateMutation = useMutation({
    mutationFn: async (winnerInfo: { winnerName: string; winnerType: 'individual' | 'team'; teamMembers?: string[] }) => {
      // Generate PDF certificate
      const pdf = new jsPDF();
      
      // Set up certificate design
      pdf.setFontSize(32);
      pdf.text('Certificate of Achievement', 105, 50, { align: 'center' });
      
      pdf.setFontSize(20);
      pdf.text('This is to certify that', 105, 80, { align: 'center' });
      
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(winnerInfo.winnerName, 105, 110, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(16);
      pdf.text(`has won the ${event.title} tournament`, 105, 140, { align: 'center' });
      
      pdf.text(`held on ${new Date(event.date).toLocaleDateString()}`, 105, 160, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text('Congratulations on your outstanding performance!', 105, 190, { align: 'center' });
      
      // Convert PDF to blob
      const pdfBlob = pdf.output('blob');
      
      // Send certificate via email
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'certificate.pdf');
      formData.append('winnerName', winnerInfo.winnerName);
      formData.append('eventTitle', event.title);
      formData.append('winnerType', winnerInfo.winnerType);
      if (winnerInfo.teamMembers) {
        formData.append('teamMembers', JSON.stringify(winnerInfo.teamMembers));
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/send-certificate`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send certificate');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Certificate Sent',
        description: 'Certificate has been generated and sent to the winner(s).'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Complete tournament mutation
  const completeTournamentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${event.id}/tournament/complete`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to complete tournament');
      }
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: 'Tournament completed',
        description: 'Tournament has been marked as complete. Certificate email will be sent to the winner.'
      });
      
      queryClient.invalidateQueries({ queryKey: ['tournament', event.id] });
      
      // Then immediately refetch to ensure UI is updated
      setTimeout(() => {
        refetch();
      }, 100);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleWinnerChange = (matchId: string, winner: string) => {
    setSelectedWinners(prev => ({ ...prev, [matchId]: winner }));
  };

  // Reset tournament mutation (temporary for debugging)
  const resetTournamentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${event.id}/tournament/reset`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to reset tournament');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Tournament Reset',
        description: 'Tournament has been reset successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['tournament', event.id] });
      
      // Then immediately refetch to ensure UI is updated
      setTimeout(() => {
        refetch();
      }, 100);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSetWinner = (matchId: string) => {
    const winner = selectedWinners[matchId];
    if (winner) {
      setWinnerMutation.mutate({ matchId, winner });
    }
  };

  const canAdvanceToNextRound = () => {
    if (!tournament || !tournament.rounds.length) return false;
    
    const currentRound = tournament.rounds.find(r => r.roundNumber === tournament.currentRound);
    if (!currentRound) return false;
    
    return currentRound.matches.every(match => match.winner || match.isBye);
  };

  const getRoundName = (roundNumber: number, totalRounds: number) => {
    if (roundNumber === totalRounds) return 'Final';
    if (roundNumber === totalRounds - 1) return 'Semi-Final';
    if (roundNumber === totalRounds - 2) return 'Quarter-Final';
    return `Round ${roundNumber}`;
  };

  // Helper function to resolve participant ID to name
  const getParticipantName = (participantId: string): string => {
    if (!participantId) return 'TBD';
    
    // If the participantId is already a name (not an ID), return it directly
    if (!participantId.match(/^[0-9a-fA-F]{24}$/)) {
      return participantId;
    }
    
    // Check if it's a team event
    if (event.isTeamEvent) {
      // For team events, participantId should be the team name
      const team = registrations?.find(reg => reg.teamName === participantId);
      if (team) return team.teamName || participantId;
      
      // Check if participantId matches any team name in registrations
      const teamRegistration = registrations?.find(reg => reg.teamName === participantId);
      if (teamRegistration) return teamRegistration.teamName || participantId;
    } else {
      // For individual events, participantId is a user ID string
      // We need to match it against the participantId object in registrations
      const registration = registrations?.find((reg: any) => {
        // Check if participantId is an object and has an id property
        if (reg.participantId && typeof reg.participantId === 'object') {
          return reg.participantId.id === participantId || reg.participantId._id === participantId;
        }
        // Fallback to direct string comparison
        return reg.participantId === participantId || reg.id === participantId;
      });
      
      if (registration) {
        // Return the name from registration data
        return (registration as any).name || registration.studentName || participantId;
      }
      
      // Also check by direct ID match in participantId object
      const directMatch = registrations?.find((reg: any) => {
        if (reg.participantId && typeof reg.participantId === 'object') {
          return reg.participantId.id === participantId || reg.participantId._id === participantId;
        }
        return false;
      });
      
      if (directMatch) {
        return (directMatch as any).name || directMatch.studentName || participantId;
      }
    }
    
    // If no match found, return the ID as fallback
    return participantId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tournament Yet</h3>
            <p className="text-muted-foreground mb-4">
              {event.isTeamEvent 
                ? 'Tournament will be created when teams are registered.'
                : 'Tournament will be created when participants are registered.'
              }
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentRoundData = tournament.rounds.find(r => r.roundNumber === tournament.currentRound);
  const isCurrentRoundComplete = currentRoundData?.matches.every(match => match.winner || match.isBye);

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <CardTitle className="text-2xl">Tournament Bracket</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={tournament.isComplete ? "default" : "secondary"}>
                {tournament.isComplete ? 'Completed' : `Round ${tournament.currentRound}`}
              </Badge>
              {event.isTeamEvent && (
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  Team Event
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tournament Rounds */}
      <div className="grid gap-6">
        {tournament.rounds.map((round: TournamentRound) => (
          <Card key={round.roundNumber} className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{getRoundName(round.roundNumber, tournament.rounds.length)}</span>
                {round.roundNumber === tournament.currentRound && (
                  <Badge variant="default">Current</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {round.matches.map((match: Match) => (
                  <Card key={match.id} className="relative bg-card border-border">
                    <CardContent className="p-4">
                      {match.isBye ? (
                        <div className="text-center">
                          <Badge variant="secondary" className="mb-2">BYE</Badge>
                          <p className="font-medium">{getParticipantName(match.participant1 || '')}</p>
                          <p className="text-sm text-muted-foreground">Advances automatically</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className={`p-2 rounded border ${match.winner === match.participant1 ? 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700' : 'bg-muted dark:bg-gray-800 border-border'}`}>
                              <p className="font-medium">{getParticipantName(match.participant1 || '')}</p>
                              {match.winner === match.participant1 && (
                                <Badge variant="default" className="text-xs">Winner</Badge>
                              )}
                            </div>
                            
                            <div className="text-center text-muted-foreground">VS</div>
                            
                            <div className={`p-2 rounded border ${match.winner === match.participant2 ? 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700' : 'bg-muted dark:bg-gray-800 border-border'}`}>
                              <p className="font-medium">{getParticipantName(match.participant2 || '')}</p>
                              {match.winner === match.participant2 && (
                                <Badge variant="default" className="text-xs">Winner</Badge>
                              )}
                            </div>
                          </div>

                          {isAdmin && !match.winner && round.roundNumber === tournament.currentRound && (
                            <div className="space-y-2 pt-2 border-t border-border">
                              <Select
                                value={selectedWinners[match.id || ''] || ''}
                                onValueChange={(value) => handleWinnerChange(match.id || '', value)}
                              >
                                <SelectTrigger className="bg-background border-border">
                                  <SelectValue placeholder="Select winner" />
                                </SelectTrigger>
                                <SelectContent>
                                  {match.participant1 && (
                                    <SelectItem value={match.participant1}>
                                      {getParticipantName(match.participant1)}
                                    </SelectItem>
                                  )}
                                  {match.participant2 && (
                                    <SelectItem value={match.participant2}>
                                      {getParticipantName(match.participant2)}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              
                              <Button
                                size="sm"
                                onClick={() => handleSetWinner(match.id || '')}
                                disabled={!selectedWinners[match.id || ''] || setWinnerMutation.isPending}
                                className="w-full"
                              >
                                {setWinnerMutation.isPending ? 'Setting Winner...' : 'Set Winner'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Controls */}
      {isAdmin && !tournament.isComplete && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Tournament Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* Temporary reset button for debugging */}
              <Button
                onClick={() => resetTournamentMutation.mutate()}
                disabled={resetTournamentMutation.isPending}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <span>🔄 Reset Tournament</span>
              </Button>
              
              <Button
                onClick={() => nextRoundMutation.mutate()}
                disabled={!canAdvanceToNextRound() || nextRoundMutation.isPending}
                variant="default"
              >
                <ChevronRight className="h-4 w-4" />
                <span>{nextRoundMutation.isPending ? 'Advancing...' : 'Next Round'}</span>
              </Button>
              
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
            
            {!canAdvanceToNextRound() && currentRoundData && (
              <p className="text-sm text-gray-600 mt-3">
                All matches in the current round must have winners before advancing to the next round.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tournament Complete */}
      {tournament.isComplete && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Tournament Complete!</h3>
              <p className="text-gray-600">
                Congratulations to all participants and winners!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
