// client/src/hooks/use-auth.ts
import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema'; // ←
import { apiRequest } from "@/lib/queryClient";

// ✅ Define the fetcher function properly
async function fetchUser(): Promise<User | null> {
  const response = await fetch('/api/auth/user', {
    credentials: 'include', // needed for cookies/sessions
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Optional: if your backend returns `_id` (MongoDB), map to `id`
  if (data._id && !data.id) {
    return { ...data, id: data._id };
  }

  return data;
}

// ✅ Correct useQuery call
export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth/user'],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
<<<<<<< HEAD
=======
    // Don't show 401 errors as they're expected for unauthenticated users
    throwOnError: (error) => {
      // Only throw errors that aren't 401 (unauthorized)
      if (error.message.includes('401')) {
        return false;
      }
      return true;
    },
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
<<<<<<< HEAD
    error,
=======
    error: error?.message.includes('401') ? null : error,
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  };
}