import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { EventGrid } from "@/components/event-grid";
import { Chatbot } from "@/components/chatbot";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import type { Event } from "@/lib/types";

interface RecommendationResponse {
  success: boolean;
  data: {
    userId: string;
    recommendations: Array<{
      eventId: string;
      eventTitle: string;
      score: number;
      source: string;
      confidence: number;
    }>;
    timestamp: string;
    source: string;
  };
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  useWebSocket();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
  });

  const { data: trendingEvents = [], isLoading: trendingLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/trending"],
    queryFn: async () => {
      const response = await fetch("/api/events/trending?limit=5", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch trending events");
      }
      return response.json();
    },
  });

  // Trending: Global, based on participation (will be replaced with algorithm)
  const trendingEventsList = [...events]
    .filter(event => !['completed', 'archived', 'cancelled'].includes(event.status))
    .sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0))
    .slice(0, 5);

  // Recommended: Get ML recommendations from backend
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["/api/recommendations", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await fetch(`/api/recommendations/${user.id}?limit=3`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch recommendations");
        return (await response.json()) as RecommendationResponse;
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        return null;
      }
    },
    enabled: !!user?.id, // Only fetch if user is logged in
  });

  // Convert recommendation IDs to event objects
  const recommendedEvents: Event[] = recommendationsData?.data?.recommendations
    ? recommendationsData.data.recommendations
        .map(rec => events.find(e => e.id === rec.eventId))
        .filter((e): e is Event => e !== undefined)
        .slice(0, 3)
    : [];

  // All events: Filtered by search only, and exclude completed/archived
  const filteredEvents = events
    .filter(event => !['completed', 'archived', 'cancelled'].includes(event.status))
    .filter((event) => {
      const matchesSearch =
        !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

  // Display events (default: exclude completed/archived, unless searching)
  const displayEvents = searchQuery 
    ? filteredEvents 
    : events.filter(event => !['completed', 'archived', 'cancelled'].includes(event.status));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        
        <div className="container mx-auto px-4 py-12 space-y-16">
          <section className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Browse Events</h2>
            </div>
            <Button asChild>
              <a href="/events">Explore All Events</a>
            </Button>
          </section>

          {/* Trending Events */}
          <section className="rounded-xl p-8 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-display font-bold mb-6 text-slate-900 dark:text-slate-50">📈 Trending Events</h2>
            <EventGrid
              events={trendingEvents.length > 0 ? trendingEvents : trendingEventsList}
              isLoading={trendingLoading || isLoading}
              emptyMessage="No trending events yet"
            />
          </section>

          {/* Recommended for You (only if logged in) */}
          {user && (
            <section className="rounded-xl p-8 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h2 className="text-2xl font-display font-bold mb-6 text-slate-900 dark:text-slate-50">⭐ Recommended for You</h2>
              <EventGrid
                events={recommendedEvents}
                isLoading={recommendationsLoading || isLoading}
                emptyMessage="No recommendations yet. Complete your profile to get personalized suggestions!"
              />
            </section>
          )}

          {/* All Events */}
          <section className="rounded-xl p-8 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-display font-bold mb-6 text-slate-900 dark:text-slate-50">📋 All Events</h2>
            {searchQuery ? (
              <EventGrid
                events={filteredEvents}
                isLoading={isLoading}
                emptyMessage="No events match your search"
              />
            ) : (
              <EventGrid
                events={displayEvents}
                isLoading={isLoading}
                emptyMessage="No events available"
              />
            )}
          </section>
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}
