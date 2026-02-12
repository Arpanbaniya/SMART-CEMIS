import React, { useState, useEffect } from 'react';
import { useRealTimeEvents } from '../hooks/useRealTimeEvents';
import { X, Bell, Users, Calendar, CheckCircle, XCircle, UserPlus, CreditCard, Shield } from 'lucide-react';

interface RealTimeNotificationsProps {
  userId: string | null;
}

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ userId }) => {
  const { latestUpdate, clearUpdates } = useRealTimeEvents(userId);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);

  useEffect(() => {
    if (latestUpdate) {
      setNotificationHistory(prev => [latestUpdate, ...prev.slice(0, 49)]); // Keep last 50
    }
  }, [latestUpdate]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'eventCreated':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'eventUpdated':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'eventDeleted':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'registration':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'unregistration':
        return <Users className="w-5 h-5 text-orange-500" />;
      case 'adminRequest':
        return <Shield className="w-5 h-5 text-yellow-500" />;
      case 'adminRequestApproved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'adminRequestRejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'adminRequestUsed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'paymentReceived':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'userRegistered':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'roleUpdated':
        return <Shield className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationMessage = (update: any) => {
    switch (update.type) {
      case 'eventCreated':
        return `New event "${update.event?.title || update.eventTitle || 'Unknown'}" created`;
      case 'eventUpdated':
        return `Event "${update.event?.title || update.eventTitle || 'Unknown'}" updated`;
      case 'eventDeleted':
        return `Event "${update.event?.title || update.eventTitle || 'Unknown'}" deleted`;
      case 'registration':
        return `New registration for "${update.event?.title || update.eventTitle || 'Unknown'}"`;
      case 'unregistration':
        return `Registration cancelled for "${update.event?.title || update.eventTitle || 'Unknown'}"`;
      case 'adminRequest':
        return update.message || 'New admin request submitted';
      case 'adminRequestApproved':
        return `Admin request approved for ${update.userName || 'User'}`;
      case 'adminRequestRejected':
        return update.rejectionReason 
          ? `Admin request rejected. Reason: ${update.rejectionReason}`
          : `Admin request rejected for ${update.userName || 'User'}`;
      case 'adminRequestUsed':
        return `Your approved admin request has been used to create event "${update.eventTitle || 'Event'}"`;
      case 'paymentReceived':
        return `Payment received for "${update.eventTitle || 'Event'}"`;
      case 'userRegistered':
        return `New user registered: ${update.userName || 'Unknown'}`;
      case 'roleUpdated':
        return 'Your admin request was approved! You can now create events.';
      default:
        return update.message || 'System update';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'eventCreated':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'eventUpdated':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'eventDeleted':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'registration':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'unregistration':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'adminRequest':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'adminRequestApproved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'adminRequestRejected':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'adminRequestUsed':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'paymentReceived':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'userRegistered':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'roleUpdated':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const removeNotification = (index: number) => {
    setNotificationHistory(prev => {
      // Remove the notification at the specific index
      const newHistory = [...prev];
      if (index < newHistory.length) {
        newHistory.splice(index, 1);
      }
      return newHistory;
    });
  };

  const handleClearAll = () => {
    setNotificationHistory([]);
    clearUpdates();
  };

  if (!notificationHistory.length) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] max-w-sm">
      {/* Clear button at top */}
      {notificationHistory.length > 0 && (
        <button
          onClick={handleClearAll}

          className="mb-4 w-full flex items-center justify-center gap-2.5 text-xs text-slate-600 hover:text-slate-800 transition-all duration-300 ease-out bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/60 hover:border-slate-300 hover:shadow-2xl p-3 group shadow-2xl ring-1 ring-slate-200/50"
        >
          <div className="flex items-center gap-2">
            <svg 
              className="w-4 h-4 transition-all duration-300 group-hover:rotate-180 group-hover:scale-110" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 7l-.867 12.142A2 2 0 01-2.828 0l-12.344 12.344a2 2 0 01-2.828 0L7 14a2 2 0 01-2.828 0l4.586 4.586a2 2 0 004 4v-6a2 2 0 01-2.828 0l4.586 4.586a2 2 0 004 4v-6a2 2 0 00-4-4z" />
            </svg>
            <span className="font-semibold text-slate-700 tracking-wide">Clear All</span>
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 text-xs font-bold text-slate-500 bg-slate-100 rounded-full border border-slate-200">
              {notificationHistory.length}
            </span>
          </div>
        </button>
      )}

      {/* Notification container with scroll */}
      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
        {notificationHistory.map((notification, index) => (
          <div
            key={index}
            className={`
              rounded-2xl border p-3.5 shadow-xl backdrop-blur-xl
              ${getNotificationColor(notification.type)}
              transition-all duration-300 ease-out
              ${index === 0 ? 'shadow-2xl ring-1 ring-slate-200/50' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <p className={`leading-tight tracking-wide ${index === 0 ? 'font-semibold text-sm' : 'font-semibold text-xs'}`}>
                    {getNotificationMessage(notification)}
                  </p>
                  {notification.participantCount !== undefined && (
                    <p className="text-xs mt-1 opacity-75">
                      Participants: {notification.participantCount}
                    </p>
                  )}
                  <p className="text-xs mt-1.5 opacity-60 font-medium">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeNotification(index)}
                className="ml-3 text-slate-400 hover:text-red-500 hover:bg-red-50/90 transition-all duration-300 rounded-full p-1.5 group shadow-md hover:shadow-lg"
              >
                <X className="w-3.5 h-3.5 transition-all duration-300 group-hover:rotate-90 group-hover:scale-125" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};