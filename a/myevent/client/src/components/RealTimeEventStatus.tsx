import React from 'react';
import { useRealTimeRegistrations } from '../hooks/useRealTimeRegistrations';
import { Users, Activity } from 'lucide-react';

interface RealTimeEventStatusProps {
  userId: string | null;
  eventId: string;
  initialParticipantCount?: number;
  capacity?: number;
}

export const RealTimeEventStatus: React.FC<RealTimeEventStatusProps> = ({
  userId,
  eventId,
  initialParticipantCount = 0,
  capacity = 100
}) => {
  const { participantCount, isConnected } = useRealTimeRegistrations(userId, eventId);
  
  const currentCount = participantCount ?? initialParticipantCount;
  const percentage = (currentCount / capacity) * 100;
  const isAlmostFull = percentage >= 80;
  const isFull = currentCount >= capacity;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Live Status</span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-gray-400'}`} />
          <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Participants</span>
          <span className={`font-medium ${isFull ? 'text-red-600' : isAlmostFull ? 'text-orange-600' : 'text-gray-900'}`}>
            {currentCount} / {capacity}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isFull ? 'bg-red-500' : isAlmostFull ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="text-xs text-gray-500">
          {isFull ? (
            <span className="text-red-600 font-medium">Event is full</span>
          ) : isAlmostFull ? (
            <span className="text-orange-600">Almost full - {capacity - currentCount} spots left</span>
          ) : (
            <span>{capacity - currentCount} spots available</span>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="text-xs text-green-600 flex items-center space-x-1">
          <Activity className="w-3 h-3 animate-pulse" />
          <span>Real-time updates active</span>
        </div>
      )}
    </div>
  );
};
