import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";

interface RegistrationStatusResponse {
  isRegistered: boolean;
}

export function useRegistrationStatus(eventId: string) {
  const { user } = useAuth();

  return useQuery<RegistrationStatusResponse>({
    queryKey: ["/api/events", eventId, "check-registration"],
    queryFn: async () => {
      if (!user) return { isRegistered: false };
      
      try {
        const response = await apiRequest("GET", `/api/events/${eventId}/check-registration`);
        return response;
      } catch (error: any) {
        // If user is not authenticated, return false
        if (error?.status === 401) {
          return { isRegistered: false };
        }
        throw error;
      }
    },
    enabled: !!user && !!eventId,
    retry: false,
  });
}
