// backend/src/routes/tournamentRoutes.ts
// Fixed TypeScript compilation issues
import express from 'express';
import { Tournament, ITournament, IMatch, ITournamentRound } from '../models/Tournament';
import type { Document } from 'mongoose';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { Team } from '../models/Team';
import { requireAuth, requireAdmin } from '../middleware/requireAuth';

const router = express.Router();

// GET /:eventId/tournament - fetch tournament state
router.get('/:eventId/tournament', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find or create tournament
    let tournament: any = await Tournament.findOne({ eventId });
    
    if (!tournament) {
      // Initialize tournament with first round
      const registrations = await Registration.find({ eventId, status: 'registered' });
      const participants = await getParticipants(registrations, event.isTeamEvent);
      
      if (participants.length === 0) {
        // Return empty tournament structure for no participants
        return res.json({
          _id: null,
          eventId,
          currentRound: 1,
          isComplete: false,
          rounds: [{
            roundNumber: 1,
            matches: []
          }],
          message: 'No participants registered yet'
        });
      }

      // Create tournament even with 1 participant
      tournament = await createInitialTournament(eventId, participants, event.genderFixed, registrations, event.isTeamEvent);
    }

    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /:eventId/tournament/rounds - update tournament rounds
router.post('/:eventId/tournament/rounds', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { roundNumber, matches } = req.body;

    const tournament = await Tournament.findOne({ eventId });
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Update or add round
    const roundIndex = tournament.rounds.findIndex(r => r.roundNumber === roundNumber);
    if (roundIndex >= 0) {
      tournament.rounds[roundIndex].matches = matches;
    } else {
      tournament.rounds.push({ roundNumber, matches });
    }

    await tournament.save();
    
    // Emit real-time update
    try {
      if (typeof (global as any).broadcastEventUpdate !== 'undefined') {
        (global as any).broadcastEventUpdate(eventId, {
          type: 'tournamentRoundUpdated',
          tournament: tournament.toJSON(),
          roundNumber,
          message: `Tournament round ${roundNumber} has been updated`
        });
      }
    } catch (broadcastError) {
      console.error('Error broadcasting tournament update:', broadcastError);
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Error updating tournament rounds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /:eventId/tournament/matches - create/update matches
router.post('/:eventId/tournament/matches', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { roundNumber, matches } = req.body;

    const tournament = await Tournament.findOne({ eventId });
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Update matches in specific round
    const round = tournament.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    round.matches = matches;
    await tournament.save();
    
    // Emit real-time update
    try {
      if (typeof (global as any).broadcastEventUpdate !== 'undefined') {
        (global as any).broadcastEventUpdate(eventId, {
          type: 'tournamentMatchUpdated',
          tournament: tournament.toJSON(),
          roundNumber,
          message: `Tournament matches for round ${roundNumber} have been updated`
        });
      }
    } catch (broadcastError) {
      console.error('Error broadcasting tournament update:', broadcastError);
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Error updating matches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /:eventId/tournament/next-round - advance to next round
router.post('/:eventId/tournament/next-round', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const tournament = await Tournament.findOne({ eventId });
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if current round is complete
    const currentRound = tournament.rounds.find(r => r.roundNumber === tournament.currentRound);
    if (!currentRound) {
      return res.status(400).json({ message: 'Current round not found' });
    }

    // Verify all matches have winners
    const incompleteMatches = currentRound.matches.filter(m => !m.winner && !m.isBye);
    if (incompleteMatches.length > 0) {
      return res.status(400).json({ message: 'All matches must have winners before advancing to next round' });
    }

    // Generate next round
    const winners = currentRound.matches
      .filter(m => m.winner)
      .map(m => m.winner!);

    if (winners.length <= 1) {
      // Tournament complete
      tournament.isComplete = true;
      await tournament.save();
      
      // Emit real-time update
      try {
        if (typeof (global as any).broadcastEventUpdate !== 'undefined') {
          (global as any).broadcastEventUpdate(eventId, {
            type: 'tournamentCompleted',
            tournament: tournament.toJSON(),
            message: 'Tournament has been completed!'
          });
        }
      } catch (broadcastError) {
        console.error('Error broadcasting tournament update:', broadcastError);
      }
      
      return res.json({ message: 'Tournament completed', tournament });
    }

    const nextRoundNumber = tournament.currentRound + 1;
    const nextRoundMatches = generateMatches(winners);

    tournament.rounds.push({
      roundNumber: nextRoundNumber,
      matches: nextRoundMatches
    });
    tournament.currentRound = nextRoundNumber;

    await tournament.save();
    
    // Emit real-time update
    try {
      if (typeof (global as any).broadcastEventUpdate !== 'undefined') {
        (global as any).broadcastEventUpdate(eventId, {
          type: 'tournamentNextRound',
          tournament: tournament.toJSON(),
          nextRoundNumber,
          message: `Tournament advanced to round ${nextRoundNumber}`
        });
      }
    } catch (broadcastError) {
      console.error('Error broadcasting tournament update:', broadcastError);
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Error advancing to next round:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /:eventId/tournament/complete - mark tournament complete
router.post('/:eventId/tournament/complete', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const tournament = await Tournament.findOne({ eventId });
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    tournament.isComplete = true;
    await tournament.save();
    
    // Emit real-time update
    req.app.get('io').emit('tournamentUpdate', { eventId, tournament });
    
    res.json({ message: 'Tournament marked as complete', tournament });
  } catch (error) {
    console.error('Error completing tournament:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /:eventId/tournament/winner/:matchId - set winner for a match
router.post('/:eventId/tournament/winner/:matchId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { eventId, matchId } = req.params;
    const { winner } = req.body;

    const tournament = await Tournament.findOne({ eventId });
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Find and update the match
    let matchUpdated = false;
    for (const round of tournament.rounds) {
      const match = round.matches.find((m: any) => 
        (m._id && m._id.toString() === matchId) || 
        (m.id && m.id.toString() === matchId) ||
        (m.id === matchId)
      );
      if (match) {
        match.winner = winner;
        matchUpdated = true;
        break;
      }
    }

    if (!matchUpdated) {
      console.error('Match not found with ID:', matchId);
      console.error('Available matches:', tournament.rounds.flatMap(r => r.matches.map(m => ({ id: m._id, participant1: m.participant1, participant2: m.participant2 }))));
      return res.status(404).json({ message: 'Match not found' });
    }

    await tournament.save();
    
    // Emit real-time update
    try {
      if (typeof (global as any).broadcastEventUpdate !== 'undefined') {
        (global as any).broadcastEventUpdate(eventId, {
          type: 'tournamentMatchUpdated',
          tournament: tournament.toJSON(),
          matchId,
          winner,
          message: `Match winner has been updated: ${winner}`
        });
      }
    } catch (broadcastError) {
      console.error('Error broadcasting tournament update:', broadcastError);
    }
    
    res.json(tournament);
  } catch (error) {
    console.error('Error setting match winner:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper functions
async function getParticipants(registrations: any[], isTeamEvent?: boolean): Promise<string[]> {
  console.log('🔍 DEBUG: Getting participants from registrations:', registrations);
  console.log('🔍 DEBUG: Is team event:', isTeamEvent);
  
  if (isTeamEvent) {
    // For team events, return unique team names
    const teamNames = [...new Set(registrations.map(r => r.teamName).filter(Boolean))];
    console.log('🔍 DEBUG: Team names extracted:', teamNames);
    return teamNames;
  } else {
    // For individual events, return user IDs
    const userIds = registrations.map(r => r.userId);
    console.log('🔍 DEBUG: User IDs extracted:', userIds);
    return userIds;
  }
}

async function createInitialTournament(eventId: string, participants: string[], genderFixed?: string | null, registrations?: any[], isTeamEvent?: boolean): Promise<any> {
  let initialParticipants = participants;
  
  // Create a mapping from participant ID to display name
  const participantNameMap = new Map<string, string>();
  
  if (registrations && isTeamEvent) {
    // For team events, map team names to display names
    registrations.forEach(reg => {
      const teamName = reg.teamName || 'Individual';
      participantNameMap.set(teamName, teamName);
    });
  } else if (registrations) {
    // For individual events, map user IDs to student names
    registrations.forEach(reg => {
      const userId = typeof reg.userId === 'object' ? reg.userId._id || reg.userId.id : reg.userId;
      const displayName = reg.studentName || `User ${userId}`;
      participantNameMap.set(userId, displayName);
    });
  }
  
  // Handle gender-based separation if not fixed
  if (!genderFixed) {
    // For mixed gender events, we could separate by gender if needed
    // For now, treat all participants together
  }

  const initialMatches = generateMatches(initialParticipants, participantNameMap);
  
  const tournament = new Tournament({
    eventId,
    currentRound: 1,
    isComplete: false,
    rounds: [{
      roundNumber: 1,
      matches: initialMatches
    }]
  });

  return await tournament.save();
}

function generateMatches(participants: string[], participantNameMap?: Map<string, string>): IMatch[] {
  const matches: IMatch[] = [];
  
  console.log('🔍 DEBUG: Generating matches for participants:', participants);
  console.log('🔍 DEBUG: Participant name map:', Array.from(participantNameMap || []));
  
  // For odd number of participants, the last registered gets BYE
  // Don't shuffle - keep registration order for BYE assignment
  const orderedParticipants = participants;
  
  for (let i = 0; i < orderedParticipants.length; i += 2) {
    if (i + 1 < orderedParticipants.length) {
      const participant1 = orderedParticipants[i];
      const participant2 = orderedParticipants[i + 1];
      
      const displayName1 = participantNameMap?.get(participant1) || participant1;
      const displayName2 = participantNameMap?.get(participant2) || participant2;
      
      console.log('🔍 DEBUG: Creating match between:', displayName1, 'and', displayName2);
      
      matches.push({
        participant1: displayName1,
        participant2: displayName2,
        winner: null,
        isBye: false
      });
    } else {
      // Odd number of participants - last one gets BYE
      const participant = orderedParticipants[i];
      const displayName = participantNameMap?.get(participant) || participant;
      
      console.log('🔍 DEBUG: Creating BYE match for:', displayName);
      
      matches.push({
        participant1: displayName,
        participant2: null,
        winner: displayName,
        isBye: true
      });
    }
  }
  
  console.log('🔍 DEBUG: Generated matches:', matches);
  return matches;
}

// DELETE /:eventId/tournament/reset - Reset tournament (temporary for debugging)
router.delete('/:eventId/tournament/reset', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Delete existing tournament
    await Tournament.deleteOne({ eventId });
    
    res.json({ message: 'Tournament reset successfully' });
  } catch (error) {
    console.error('Error resetting tournament:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
