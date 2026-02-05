// client/src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (replaces cacheTime)
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// ✅ FOR SESSION COOKIES - No Authorization header needed!
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown,
): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url}`;
  const response = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // 👈 This sends cookies automatically
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Request Failed:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
      url: fullUrl
    });
    
    // Create error object that preserves the error code for specific handling
    const error = new Error(errorData.message || errorData.error || `HTTP ${response.status}`) as any;
    error.error = errorData.error;
    error.message = errorData.message || errorData.error || `HTTP ${response.status}`;
    error.details = errorData.details;
    throw error;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  
  return response.text() as unknown as T;
}