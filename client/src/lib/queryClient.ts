import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      console.log('🔍 API DEBUG: Server error response:', errorData);
      console.log('🔍 API DEBUG: Response status:', res.status);
      console.log('🔍 API DEBUG: Response status text:', res.statusText);
      
      // Extract the most helpful error message
      const errorMessage = errorData.error || errorData.message || errorData.details;
      if (errorMessage) {
        throw new Error(errorMessage);
      }
      
      // Fallback to status-specific messages
      if (res.status === 401) {
        throw new Error('Authentication failed. Please check your credentials.');
      } else if (res.status === 400) {
        throw new Error('Invalid request. Please check your input.');
      } else if (res.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error(`Request failed with status ${res.status}`);
    } catch (jsonError) {
      // If JSON parsing fails, try to get text response
      try {
        const text = await res.text();
        if (text && text.trim()) {
          throw new Error(text);
        }
      } catch (textError) {
        // Ultimate fallback
        console.error('Error parsing response:', jsonError);
      }
      
      // Status-specific fallbacks when we can't parse the response
      if (res.status === 401) {
        throw new Error('Authentication failed. Please check your email and password.');
      } else if (res.status === 400) {
        throw new Error('Invalid request. Please check your input and try again.');
      } else if (res.status === 500) {
        throw new Error('Server error. Please try again in a moment.');
      }
      
      throw new Error(`Request failed with status ${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
