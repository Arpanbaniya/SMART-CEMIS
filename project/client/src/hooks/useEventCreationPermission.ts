import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface EventCreationPermission {
  canCreateEvent: boolean;
  remainingEvents: number;
  approvedRequests: number;
  existingEvents: number;
  isLoading: boolean;
  isAdmin: boolean;
  isStudentAdmin: boolean;
}

export function useEventCreationPermission(): EventCreationPermission {
  const { data, isLoading, error } = useQuery({
    queryKey: ['event-creation-permission'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/event-creation-permission');
        return response;
      } catch (error) {
        console.error('Failed to check event creation permission:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (error) {
    console.error('Event creation permission check error:', error);
    return {
      canCreateEvent: false,
      remainingEvents: 0,
      approvedRequests: 0,
      existingEvents: 0,
      isLoading: false,
      isAdmin: false,
      isStudentAdmin: false
    };
  }

  return {
    canCreateEvent: data?.canCreateEvent || false,
    remainingEvents: data?.remainingEvents || 0,
    approvedRequests: data?.approvedRequests || 0,
    existingEvents: data?.existingEvents || 0,
    isLoading: isLoading || false,
    isAdmin: data?.isAdmin || false,
    isStudentAdmin: data?.isStudentAdmin || false
  };
}
