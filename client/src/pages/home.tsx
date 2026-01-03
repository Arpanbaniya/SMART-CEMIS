import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { EventGrid } from "@/components/event-grid";
import { CategoryFilter } from "@/components/category-filter";
import { Chatbot } from "@/components/chatbot";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Event } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  useWebSocket();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const trendingEvents = [...events]
    .sort((a, b) => (b.participantCount || 0) - (a.participantCount || 0))
    .slice(0, 6);

  const upcomingEvents = events
    .filter((e) => e.status === "upcoming")
    .slice(0, 6);

  const filteredEvents = events.filter((event) => {
    const matchesCategory =
      selectedCategory === "all" || event.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header onSearch={setSearchQuery} />
      
      <main className="flex-1">
        <HeroSection />
        
        <div className="container mx-auto px-4 py-12 space-y-16">
          <section>
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold mb-2">Browse Events</h2>
              <p className="text-muted-foreground">Filter events by category</p>
            </div>
            <CategoryFilter
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </section>

          <EventGrid
            title="Trending Now"
            events={trendingEvents}
            isLoading={isLoading}
            emptyMessage="No trending events yet"
          />

          <EventGrid
            title="Upcoming Events"
            events={upcomingEvents}
            isLoading={isLoading}
            emptyMessage="No upcoming events"
          />

          {searchQuery || selectedCategory !== "all" ? (
            <EventGrid
              title={`${selectedCategory === "all" ? "All" : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Events`}
              events={filteredEvents}
              isLoading={isLoading}
              emptyMessage="No events match your criteria"
            />
          ) : (
            <EventGrid
              title="All Events"
              events={events}
              isLoading={isLoading}
              emptyMessage="No events available"
            />
          )}
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}
