"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/tournamentRoutes.ts
// Fixed TypeScript compilation issues
const express_1 = __importDefault(require("express"));
const Tournament_1 = require("../models/Tournament");
const Event_1 = require("../models/Event");
const Registration_1 = require("../models/Registration");
const requireAuth_1 = require("../middleware/requireAuth");
const emailNotificationService_1 = require("../services/emailNotificationService");
const router = express_1.default.Router();
// GET /:eventId/tournament - fetch tournament state
router.get('/:eventId/tournament', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        // Check if event exists
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        // Find or create tournament
        let tournament = await Tournament_1.Tournament.findOne({ eventId });
        if (!tournament) {
            // Initialize tournament with first round
            const registrations = await Registration_1.Registration.find({ eventId, status: 'registered' });
            console.log(`📋 Tournament initialization - Found ${registrations.length} registrations`);
            registrations.forEach((reg, idx) => {
                console.log(`   [${idx}] ${reg.studentName}: userId=${reg.userId}`);
            });
            const participants = await getParticipants(registrations, event.isTeamEvent);
            console.log(`📋 Extracted participants for tournament:`, participants);
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
    }
    catch (error) {
        console.error('Error fetching tournament:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// POST /:eventId/tournament/rounds - update tournament rounds
router.post('/:eventId/tournament/rounds', requireAuth_1.requireAuth, requireAuth_1.requireAdmin, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { roundNumber, matches } = req.body;
        const tournament = await Tournament_1.Tournament.findOne({ eventId });
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        // Update or add round
        const roundIndex = tournament.rounds.findIndex(r => r.roundNumber === roundNumber);
        if (roundIndex >= 0) {
            tournament.rounds[roundIndex].matches = matches;
        }
        else {
            tournament.rounds.push({ roundNumber, matches });
        }
        await tournament.save();
        // Emit real-time update
        try {
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(eventId, {
                    type: 'tournamentRoundUpdated',
                    tournament: tournament.toJSON(),
                    roundNumber,
                    message: `Tournament round ${roundNumber} has been updated`
                });
            }
        }
        catch (broadcastError) {
            console.error('Error broadcasting tournament update:', broadcastError);
        }
        res.json(tournament);
    }
    catch (error) {
        console.error('Error updating tournament rounds:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// POST /:eventId/tournament/matches - create/update matches
router.post('/:eventId/tournament/matches', requireAuth_1.requireAuth, requireAuth_1.requireAdmin, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { roundNumber, matches } = req.body;
        const tournament = await Tournament_1.Tournament.findOne({ eventId });
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
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(eventId, {
                    type: 'tournamentMatchUpdated',
                    tournament: tournament.toJSON(),
                    roundNumber,
                    message: `Tournament matches for round ${roundNumber} have been updated`
                });
            }
        }
        catch (broadcastError) {
            console.error('Error broadcasting tournament update:', broadcastError);
        }
        res.json(tournament);
    }
    catch (error) {
        console.error('Error updating matches:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// POST /:eventId/tournament/next-round - advance to next round
router.post('/:eventId/tournament/next-round', requireAuth_1.requireAuth, requireAuth_1.requireAdmin, async (req, res) => {
    console.log(`\n🚀 ========== NEXT ROUND ENDPOINT CALLED ==========`);
    console.log(`   Event ID: ${req.params.eventId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    try {
        const { eventId } = req.params;
        const tournament = await Tournament_1.Tournament.findOne({ eventId });
        console.log(`   Tournament found: ${tournament ? 'YES' : 'NO'}`);
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        // Check if current round is complete
        const currentRound = tournament.rounds.find(r => r.roundNumber === tournament.currentRound);
        console.log(`   Current round: ${tournament.currentRound}, Page found: ${currentRound ? 'YES' : 'NO'}`);
        if (!currentRound) {
            return res.status(400).json({ message: 'Current round not found' });
        }
        // Verify all matches have winners
        const incompleteMatches = currentRound.matches.filter(m => !m.winner && !m.isBye);
        console.log(`   Total matches in current round: ${currentRound.matches.length}`);
        console.log(`   Incomplete matches: ${incompleteMatches.length}`);
        if (incompleteMatches.length > 0) {
            return res.status(400).json({ message: 'All matches must have winners before advancing to next round' });
        }
        // Generate next round
        const winners = currentRound.matches
            .filter(m => m.winner)
            .map(m => m.winner);
        console.log(`📊 TOURNAMENT STATE:`);
        console.log(`   Winners from current round: ${winners.length}`);
        console.log(`   Winner IDs: ${winners.join(', ')}`);
        // Check if advancing to finals (2 teams/participants left)
        if (winners.length === 2) {
            try {
                // Send finals advancement notification to both teams/participants
                if (tournament.isTeamEvent || (await Event_1.Event.findById(eventId))?.isTeamEvent) {
                    // For team events, send to each team
                    for (const teamId of winners) {
                        await (0, emailNotificationService_1.sendFinalRoundNotificationEmail)(teamId, eventId);
                    }
                }
                else {
                    // For individual events, send to each participant
                    for (const participantId of winners) {
                        await (0, emailNotificationService_1.sendFinalRoundNotificationEmail)(participantId, eventId);
                    }
                }
            }
            catch (emailError) {
                console.error('Failed to send finals advancement emails:', emailError);
                // Don't fail the tournament progression if email fails
            }
        }
        if (winners.length <= 1) {
            // Tournament complete
            console.log(`🏁 Tournament completion triggered. Winners count: ${winners.length}`);
            tournament.isComplete = true;
            await tournament.save();
            // Send winner certificate email
            if (winners.length === 1) {
                const winnerId = winners[0];
                const isTeamEvent = tournament.isTeamEvent || (await Event_1.Event.findById(eventId))?.isTeamEvent;
                console.log(`📊 Tournament winner details:`);
                console.log(`   Winner ID: ${winnerId}`);
                console.log(`   Is Team Event: ${isTeamEvent}`);
                console.log(`   Event ID: ${eventId}`);
                try {
                    if (isTeamEvent) {
                        // For team events: winnerId is the team name
                        console.log(`🏆 Team tournament - Winner team name: ${winnerId}`);
                        // Find all registrations for this team
                        const teamRegistrations = await Registration_1.Registration.find({
                            eventId,
                            teamName: winnerId,
                            status: 'registered'
                        });
                        console.log(`   Found ${teamRegistrations.length} team members for: ${winnerId}`);
                        if (teamRegistrations.length > 0) {
                            // Send certificate email to first team member (or all if needed)
                            const firstMember = teamRegistrations[0];
                            console.log(`📧 Sending team tournament certificate to: ${firstMember.studentName} (${firstMember.email})`);
                            await (0, emailNotificationService_1.sendWinnerCertificateEmail)(firstMember.userId, eventId, winnerId);
                            console.log(`✅ Team certificate email sent successfully to: ${firstMember.email}`);
                        }
                        else {
                            console.error('❌ No team members found for winning team:', winnerId);
                        }
                    }
                    else {
                        // For individual events: winnerId is the user ID directly
                        console.log(`🏆 Individual tournament - Winner user ID: ${winnerId}`);
                        // Verify user exists
                        const { User } = await Promise.resolve().then(() => __importStar(require('../models/User')));
                        const winner = await User.findById(winnerId);
                        if (winner) {
                            console.log(`   Found winner user: ${winner.firstName} ${winner.lastName} (${winner.email})`);
                        }
                        else {
                            console.log(`   User NOT found with ID: ${winnerId}`);
                        }
                        console.log(`📧 Sending individual tournament certificate email to user: ${winnerId}`);
                        await (0, emailNotificationService_1.sendWinnerCertificateEmail)(winnerId, eventId);
                        console.log(`✅ Individual certificate email sent successfully`);
                    }
                }
                catch (emailError) {
                    console.error('❌ Failed to send winner certificate email:');
                    console.error('   Error message:', emailError?.message);
                    console.error('   Full error:', emailError);
                    // Don't fail tournament completion if email fails
                }
            }
            // Emit real-time update
            try {
                if (typeof global.broadcastEventUpdate !== 'undefined') {
                    global.broadcastEventUpdate(eventId, {
                        type: 'tournamentCompleted',
                        tournament: tournament.toJSON(),
                        message: 'Tournament has been completed!'
                    });
                }
            }
            catch (broadcastError) {
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
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(eventId, {
                    type: 'tournamentNextRound',
                    tournament: tournament.toJSON(),
                    nextRoundNumber,
                    message: `Tournament advanced to round ${nextRoundNumber}`
                });
            }
        }
        catch (broadcastError) {
            console.error('Error broadcasting tournament update:', broadcastError);
        }
        console.log(`✅ Sending response with tournament.isComplete: ${tournament.isComplete}`);
        console.log(`🟢 ========== NEXT ROUND ENDPOINT COMPLETED ==========\n`);
        res.json(tournament);
    }
    catch (error) {
        console.error(`\n❌ ERROR in next-round endpoint:`);
        console.error(`   Message: ${error?.message}`);
        console.error(`   Stack: ${error?.stack}`);
        console.log(`🔴 ========== NEXT ROUND ENDPOINT FAILED ==========\n`);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// POST /:eventId/tournament/complete - mark tournament complete
router.post('/:eventId/tournament/complete', requireAuth_1.requireAuth, requireAuth_1.requireAdmin, async (req, res) => {
    try {
        const { eventId } = req.params;
        console.log(`🔧 Tournament complete endpoint called for event: ${eventId}`);
        const tournament = await Tournament_1.Tournament.findOne({ eventId });
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        // Get event details
        const event = await Event_1.Event.findById(eventId);
        tournament.isComplete = true;
        await tournament.save();
        // Determine tournament winner (last match in last round)
        console.log(`📊 Tournament has ${tournament.rounds.length} rounds`);
        if (tournament.rounds.length > 0) {
            const lastRound = tournament.rounds[tournament.rounds.length - 1];
            console.log(`   Last round (${lastRound.roundNumber}) has ${lastRound.matches.length} matches`);
            if (lastRound.matches.length > 0) {
                const finalMatch = lastRound.matches[0];
                console.log(`   Final match winner: ${finalMatch.winner}`);
                if (finalMatch.winner) {
                    const isTeamEvent = event?.isTeamEvent || tournament.isTeamEvent;
                    console.log(`   Is team event: ${isTeamEvent}`);
                    try {
                        if (isTeamEvent) {
                            // For team events: winner is the team name
                            console.log(`🏆 Team tournament - Winner team name: ${finalMatch.winner}`);
                            // Find all registrations for this team
                            const teamRegistrations = await Registration_1.Registration.find({
                                eventId,
                                teamName: finalMatch.winner,
                                status: 'registered'
                            });
                            console.log(`   Found ${teamRegistrations.length} team members for: ${finalMatch.winner}`);
                            if (teamRegistrations.length > 0) {
                                // Send certificate email to first team member
                                const firstMember = teamRegistrations[0];
                                console.log(`📧 Sending team tournament certificate to: ${firstMember.studentName} (${firstMember.email})`);
                                await (0, emailNotificationService_1.sendWinnerCertificateEmail)(firstMember.userId, eventId, finalMatch.winner);
                                console.log(`✅ Team certificate email sent successfully to: ${firstMember.email}`);
                            }
                            else {
                                console.error('❌ No team members found for winning team:', finalMatch.winner);
                            }
                        }
                        else {
                            // For individual events: winner is the user ID directly
                            console.log(`🏆 Individual tournament - Winner user ID: ${finalMatch.winner}`);
                            // Verify user exists
                            const { User } = await Promise.resolve().then(() => __importStar(require('../models/User')));
                            const winner = await User.findById(finalMatch.winner);
                            if (winner) {
                                console.log(`   Found winner user: ${winner.firstName} ${winner.lastName} (${winner.email})`);
                            }
                            else {
                                console.log(`   User NOT found with ID: ${finalMatch.winner}`);
                            }
                            console.log(`📧 Sending individual tournament certificate email to user: ${finalMatch.winner}`);
                            await (0, emailNotificationService_1.sendWinnerCertificateEmail)(finalMatch.winner, eventId);
                            console.log(`✅ Individual certificate email sent successfully`);
                        }
                    }
                    catch (emailError) {
                        console.error('❌ Failed to send winner certificate email:');
                        console.error('   Error message:', emailError?.message);
                        console.error('   Full error:', emailError);
                        // Don't fail tournament completion if email fails
                    }
                }
            }
        }
        // Emit real-time update
        req.app.get('io').emit('tournamentUpdate', { eventId, tournament });
        res.json({ message: 'Tournament marked as complete', tournament });
    }
    catch (error) {
        console.error('Error completing tournament:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// POST /:eventId/tournament/winner/:matchId - set winner for a match
router.post('/:eventId/tournament/winner/:matchId', requireAuth_1.requireAuth, requireAuth_1.requireAdmin, async (req, res) => {
    try {
        const { eventId, matchId } = req.params;
        const { winner } = req.body;
        const tournament = await Tournament_1.Tournament.findOne({ eventId });
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        // Find and update the match
        let matchUpdated = false;
        for (const round of tournament.rounds) {
            const match = round.matches.find((m) => (m._id && m._id.toString() === matchId) ||
                (m.id && m.id.toString() === matchId) ||
                (m.id === matchId));
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
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(eventId, {
                    type: 'tournamentMatchUpdated',
                    tournament: tournament.toJSON(),
                    matchId,
                    winner,
                    message: `Match winner has been updated: ${winner}`
                });
            }
        }
        catch (broadcastError) {
            console.error('Error broadcasting tournament update:', broadcastError);
        }
        res.json(tournament);
    }
    catch (error) {
        console.error('Error setting match winner:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Helper functions
async function getParticipants(registrations, isTeamEvent) {
    console.log('🔍 DEBUG: Getting participants from registrations');
    console.log('🔍 DEBUG: Is team event:', isTeamEvent);
    console.log('🔍 DEBUG: Sample registration:', registrations[0]);
    if (isTeamEvent) {
        // For team events, return unique team identifiers
        // First try teamId, then fall back to teamName
        const teamIdentifiers = new Set();
        registrations.forEach(reg => {
            // Try teamId first (if Team documents exist with IDs), then teamName
            const teamId = reg.teamId || reg.teamName;
            if (teamId) {
                teamIdentifiers.add(teamId);
                console.log(`   Team registration: ${reg.studentName} → Team: ${reg.teamName} (ID: ${teamId})`);
            }
        });
        const teamList = Array.from(teamIdentifiers);
        console.log('🔍 DEBUG: Team identifiers extracted:', teamList);
        return teamList;
    }
    else {
        // For individual events, return user IDs (never student names)
        const userIds = registrations.map(r => {
            // Try different possible field names for user ID
            const userId = r.userId || r.participantId || r._id || r.id;
            console.log(`   Registration: ${r.studentName || 'Unknown'} → ID: ${userId}`);
            return userId;
        });
        // Filter out any non-valid IDs (like short names)
        const validUserIds = userIds.filter(id => id && typeof id === 'string' && id.length >= 20 // MongoDB ObjectId is 24 chars
        );
        if (validUserIds.length !== userIds.length) {
            console.warn(`⚠️  WARNING: ${userIds.length - validUserIds.length} registrations have invalid user IDs`);
            console.warn('   Invalid IDs:', userIds.filter(id => !id || id.length < 20));
        }
        console.log('🔍 DEBUG: User IDs extracted:', validUserIds);
        return validUserIds;
    }
}
async function createInitialTournament(eventId, participants, genderFixed, registrations, isTeamEvent) {
    let initialParticipants = participants;
    // Create a mapping from participant ID to display name
    const participantNameMap = new Map();
    if (registrations && isTeamEvent) {
        // For team events, map team names to display names
        registrations.forEach(reg => {
            const teamName = reg.teamName || 'Individual';
            participantNameMap.set(teamName, teamName);
        });
    }
    else if (registrations) {
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
    const tournament = new Tournament_1.Tournament({
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
function generateMatches(participants, participantNameMap) {
    const matches = [];
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
            console.log(`🔍 DEBUG: Creating match between:`);
            console.log(`   ID1: ${participant1} → Display: ${displayName1}`);
            console.log(`   ID2: ${participant2} → Display: ${displayName2}`);
            matches.push({
                participant1: participant1, // Store the actual ID, not display name
                participant2: participant2, // Store the actual ID, not display name
                winner: null,
                isBye: false
            });
        }
        else {
            // Odd number of participants - last one gets BYE
            const participant = orderedParticipants[i];
            const displayName = participantNameMap?.get(participant) || participant;
            console.log('🔍 DEBUG: Creating BYE match for:', displayName);
            matches.push({
                participant1: participant, // Store the actual ID
                participant2: null,
                winner: participant, // Store the actual ID
                isBye: true
            });
        }
    }
    console.log('🔍 DEBUG: Generated matches:', matches);
    return matches;
}
// DELETE /:eventId/tournament/reset - Reset tournament (temporary for debugging)
router.delete('/:eventId/tournament/reset', requireAuth_1.requireAuth, requireAuth_1.requireAdmin, async (req, res) => {
    try {
        const { eventId } = req.params;
        // Delete existing tournament
        await Tournament_1.Tournament.deleteOne({ eventId });
        res.json({ message: 'Tournament reset successfully' });
    }
    catch (error) {
        console.error('Error resetting tournament:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=tournamentRoutes.js.map