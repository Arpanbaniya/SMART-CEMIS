// backend/src/models/Tournament.ts
import { Schema, model } from 'mongoose';

export interface IMatch {
  _id?: string;
  participant1: string | null;
  participant2: string | null;
  winner: string | null;
  score1?: number;
  score2?: number;
  isBye: boolean;
}

export interface ITournamentRound {
  roundNumber: number;
  matches: IMatch[];
}

export interface ITournament {
  eventId: string;
  currentRound: number;
  isComplete: boolean;
  rounds: ITournamentRound[];
}

const matchSchema = new Schema<IMatch>({
  participant1: { type: String, default: null },
  participant2: { type: String, default: null },
  winner: { type: String, default: null },
  score1: { type: Number },
  score2: { type: Number },
  isBye: { type: Boolean, default: false },
}, { _id: true });

const tournamentRoundSchema = new Schema<ITournamentRound>({
  roundNumber: { type: Number, required: true },
  matches: [matchSchema],
}, { _id: false });

const tournamentSchema = new Schema<ITournament>({
  eventId: { type: String, required: true, ref: 'Event' },
  currentRound: { type: Number, default: 1 },
  isComplete: { type: Boolean, default: false },
  rounds: [tournamentRoundSchema],
}, { timestamps: true });

// Map _id to id for frontend
tournamentSchema.virtual('id').get(function () {
  return this._id.toString();
});

tournamentSchema.set('toJSON', { virtuals: true });

export const Tournament = model<ITournament>('Tournament', tournamentSchema);
