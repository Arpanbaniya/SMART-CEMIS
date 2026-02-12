// client/src/hooks/use-auth.ts
import { useQuery } from '@tanstack/react-query';
import type { User } from '@/lib/types';
import { apiRequest } from "@/lib/queryClient";

// ✅ Define fetcher function properly
async function fetchUser(): Promise<User | null> {
  try {
    const data = await apiRequest('GET', '/api/auth/user');
    
    if (!data) {
      return null;
    }
    
    // Optional: if your backend returns `_id` (MongoDB), map to `id`
    if (data._id && !data.id) {
      return { ...data, id: data._id };
    }
    
    return data;
  } catch (error: any) {
    // Don't throw errors for 401 responses - they're expected for unauthenticated users
    if (error?.message?.includes('401') || error?.message?.includes('Unauthorized') || error?.status === 401 || error?.message?.includes('No valid session found')) {
      return null;
    }
    console.error('Auth fetch error:', error);
    throw error;
  }
}

// ✅ Correct useQuery call
export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth/user'],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60, // 1 minute - reduced to ensure fresh data after login
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Don't show 401 errors as they're expected for unauthenticated users
    throwOnError: (error) => {
      // Only throw errors that aren't 401 (unauthorized)
      if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('No valid session found')) {
        return false;
      }
      return true;
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error: (error?.message.includes('401') || error?.message.includes('Unauthorized') || error?.message.includes('No valid session found')) ? null : error,
  };
}