"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/teamRoutes.ts
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const Team_1 = require("../models/Team");
const Event_1 = require("../models/Event");
const Registration_1 = require("../models/Registration");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// GET /:eventId/teams - Get all teams for an event
router.get('/:eventId/teams', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        // Check if event exists
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Get all teams for this event
        const teams = await Team_1.Team.find({ eventId }).sort({ name: 1 });
        // Get member details for each team
        const teamsWithMembers = await Promise.all(teams.map(async (team) => {
            const registrations = await Registration_1.Registration.find({
                eventId,
                teamName: team.name,
                status: 'registered'
            }).populate('userId', 'firstName lastName email');
            return {
                ...team.toJSON(),
                members: registrations.map(reg => ({
                    ...reg.toJSON(),
                    userId: reg.userId
                })),
                memberCount: registrations.length
            };
        }));
        res.json(teamsWithMembers);
    }
    catch (error) {
        console.error('Fetch teams error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});
// GET /:eventId/teams/:teamName - Get specific team details
router.get('/:eventId/teams/:teamName', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { eventId, teamName } = req.params;
        // Check if event exists
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Get team
        const team = await Team_1.Team.findOne({ eventId, name: decodeURIComponent(teamName) });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        // Get team members
        const registrations = await Registration_1.Registration.find({
            eventId,
            teamName: team.name,
            status: 'registered'
        }).populate('userId', 'firstName lastName email');
        const teamWithMembers = {
            ...team.toJSON(),
            members: registrations.map(reg => ({
                ...reg.toJSON(),
                userId: reg.userId
            })),
            memberCount: registrations.length
        };
        res.json(teamWithMembers);
    }
    catch (error) {
        console.error('Fetch team error:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});
// POST /:eventId/teams - Create a new team
router.post('/:eventId/teams', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { teamName } = req.body;
        const userId = req.session.userId;
        if (!teamName || !teamName.trim()) {
            return res.status(400).json({ error: 'Team name is required' });
        }
        // Check if event exists and is a team event
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (!event.isTeamEvent) {
            return res.status(400).json({ error: 'This event does not support teams' });
        }
        // Check if max teams limit is reached
        if (event.maxTeams) {
            const currentTeamCount = await Team_1.Team.countDocuments({ eventId });
            if (currentTeamCount >= event.maxTeams) {
                return res.status(400).json({
                    error: `Maximum number of teams (${event.maxTeams}) has been reached for this event. No more teams can be created.`
                });
            }
        }
        // Check if team already exists (case insensitive)
        const existingTeam = await Team_1.Team.findOne({
            eventId,
            name: { $regex: new RegExp(`^${teamName.trim()}$`, 'i') }
        });
        if (existingTeam) {
            return res.status(409).json({ error: 'Team with this name already exists (case insensitive)' });
        }
        // Check if user is already in a team for this event
        const userExistingTeam = await Team_1.Team.findOne({ eventId, members: userId });
        if (userExistingTeam) {
            return res.status(400).json({ error: 'You are already a member of another team for this event' });
        }
        // Create team
        const team = new Team_1.Team({
            name: teamName.trim(),
            eventId,
            members: [userId]
        });
        await team.save();
        // Emit real-time update
        try {
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(eventId, {
                    type: 'teamCreated',
                    team: team.toJSON(),
                    message: `New team "${team.name}" has been created`
                });
            }
        }
        catch (broadcastError) {
            console.error('Error broadcasting team update:', broadcastError);
        }
        res.status(201).json(team.toJSON());
    }
    catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});
// PUT /:eventId/teams/:teamName/join - Join a team
router.put('/:eventId/teams/:teamName/join', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { eventId, teamName } = req.params;
        const userId = req.session.userId;
        // Check if event exists and is a team event
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (!event.isTeamEvent) {
            return res.status(400).json({ error: 'This event does not support teams' });
        }
        // Check if team exists
        const team = await Team_1.Team.findOne({ eventId, name: decodeURIComponent(teamName) });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        // Check if user is already in team
        if (team.members.includes(userId)) {
            return res.status(400).json({ error: 'Already a member of this team' });
        }
        // Check team capacity before joining
        const currentRegistrations = await Registration_1.Registration.countDocuments({
            eventId,
            teamName: team.name,
            status: 'registered'
        });
        if (event.maxTeamMembers && currentRegistrations >= event.maxTeamMembers) {
            return res.status(400).json({
                error: `Team "${team.name}" is full. Maximum ${event.maxTeamMembers} members allowed per team.`
            });
        }
        // Check if user is already in a different team for this event
        const userExistingTeam = await Registration_1.Registration.findOne({
            userId,
            eventId,
            teamName: { $ne: team.name, $exists: true },
            status: 'registered'
        });
        if (userExistingTeam) {
            return res.status(400).json({
                error: `You are already a member of team "${userExistingTeam.teamName}". You cannot join multiple teams for the same event.`
            });
        }
        // Add user to team
        team.members.push(userId);
        await team.save();
        res.json(team.toJSON());
    }
    catch (error) {
        console.error('Join team error:', error);
        res.status(500).json({ error: 'Failed to join team' });
    }
});
// DELETE /:eventId/teams/:teamName/leave - Leave a team
router.delete('/:eventId/teams/:teamName/leave', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { eventId, teamName } = req.params;
        const userId = req.session.userId;
        // Check if event exists
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Check if team exists
        const team = await Team_1.Team.findOne({ eventId, name: decodeURIComponent(teamName) });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        // Check if user is in team
        if (!team.members.includes(userId)) {
            return res.status(400).json({ error: 'Not a member of this team' });
        }
        // Remove user from team
        team.members = team.members.filter(member => member !== userId);
        await team.save();
        // Delete team if no members left
        if (team.members.length === 0) {
            await Team_1.Team.findByIdAndDelete(team._id);
        }
        res.json({ message: 'Left team successfully' });
    }
    catch (error) {
        console.error('Leave team error:', error);
        res.status(500).json({ error: 'Failed to leave team' });
    }
});
// DELETE /:eventId/teams/:teamName - Delete a team (admin only)
router.delete('/:eventId/teams/:teamName', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { eventId, teamName } = req.params;
        const userId = req.session.userId;
        // Check if event exists
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Check if user is admin or event creator
        const user = await User_1.User.findById(userId);
        const isAdmin = user?.role === 'super_admin' || user?.role === 'student_admin';
        const isEventCreator = event.createdById === userId;
        if (!isAdmin && !isEventCreator) {
            return res.status(403).json({ error: 'Only admins can delete teams' });
        }
        // Check if team exists
        const team = await Team_1.Team.findOne({ eventId, name: decodeURIComponent(teamName) });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        // Remove all registrations for this team
        await Registration_1.Registration.deleteMany({ eventId, teamName: team.name });
        // Delete the team
        await Team_1.Team.deleteOne({ _id: team._id });
        // Emit real-time update
        try {
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(eventId, {
                    type: 'teamDeleted',
                    teamName: team.name,
                    message: `Team "${team.name}" has been deleted`
                });
            }
        }
        catch (broadcastError) {
            console.error('Error broadcasting team update:', broadcastError);
        }
        res.json({ message: 'Team deleted successfully' });
    }
    catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});
// DELETE /:eventId/teams/:teamName/members/:userId - Remove member from team (admin only)
router.delete('/:eventId/teams/:teamName/members/:userId', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { eventId, teamName, userId: memberUserId } = req.params;
        const adminUserId = req.session.userId;
        // Check if event exists
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Check if user is admin or event creator
        const user = await User_1.User.findById(adminUserId);
        const isAdmin = user?.role === 'super_admin' || user?.role === 'student_admin';
        const isEventCreator = event.createdById === adminUserId;
        if (!isAdmin && !isEventCreator) {
            return res.status(403).json({ error: 'Only admins can remove team members' });
        }
        // Check if team exists
        const team = await Team_1.Team.findOne({ eventId, name: decodeURIComponent(teamName) });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        // Remove member from team
        team.members = team.members.filter(id => id !== memberUserId);
        await team.save();
        // Remove registration for this member
        await Registration_1.Registration.deleteOne({ eventId, teamName: team.name, userId: memberUserId });
        // Emit real-time update
        try {
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(eventId, {
                    type: 'teamMemberRemoved',
                    teamName: team.name,
                    memberId: memberUserId,
                    message: `Member removed from team "${team.name}"`
                });
            }
        }
        catch (broadcastError) {
            console.error('Error broadcasting team update:', broadcastError);
        }
        res.json({ message: 'Member removed successfully' });
    }
    catch (error) {
        console.error('Remove team member error:', error);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
});
// GET /:eventId/team-standings - Get team standings
router.get('/:eventId/team-standings', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        // Check if event exists
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Get all teams with their registration counts
        const teams = await Team_1.Team.find({ eventId }).sort({ name: 1 });
        const teamStandings = await Promise.all(teams.map(async (team) => {
            const registrationCount = await Registration_1.Registration.countDocuments({
                eventId,
                teamName: team.name,
                status: 'registered'
            });
            return {
                ...team.toJSON(),
                registeredMembers: registrationCount,
                registrationStatus: registrationCount > 0 ? 'active' : 'empty'
            };
        }));
        // Sort by active members first, then by name
        teamStandings.sort((a, b) => {
            if (a.registrationStatus === 'active' && b.registrationStatus !== 'active')
                return -1;
            if (a.registrationStatus !== 'active' && b.registrationStatus === 'active')
                return 1;
            return a.name.localeCompare(b.name);
        });
        res.json(teamStandings);
    }
    catch (error) {
        console.error('Fetch team standings error:', error);
        res.status(500).json({ error: 'Failed to fetch team standings' });
    }
});
exports.default = router;
//# sourceMappingURL=teamRoutes.js.map