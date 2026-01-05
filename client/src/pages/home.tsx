import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
<<<<<<< HEAD
import { Header } from "@/components/header";
=======
import Header from "@/components/header";
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { EventGrid } from "@/components/event-grid";
import { CategoryFilter } from "@/components/category-filter";
import { Chatbot } from "@/components/chatbot";
import { useWebSocket } from "@/hooks/use-websocket";
<<<<<<< HEAD
=======
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
import type { Event } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  useWebSocket();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
<<<<<<< HEAD
=======
    queryFn: async () => {
      const response = await fetch("/api/events", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
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

<<<<<<< HEAD
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
=======
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="trending" className="border rounded-lg px-6">
              <AccordionTrigger className="text-2xl font-display font-bold hover:no-underline py-6">
                Trending Now
              </AccordionTrigger>
              <AccordionContent>
                <EventGrid
                  events={trendingEvents}
                  isLoading={isLoading}
                  emptyMessage="No trending events yet"
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="upcoming" className="border rounded-lg px-6">
              <AccordionTrigger className="text-2xl font-display font-bold hover:no-underline py-6">
                Upcoming Events
              </AccordionTrigger>
              <AccordionContent>
                <EventGrid
                  events={upcomingEvents}
                  isLoading={isLoading}
                  emptyMessage="No upcoming events"
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="all" className="border rounded-lg px-6">
              <AccordionTrigger className="text-2xl font-display font-bold hover:no-underline py-6">
                {searchQuery || selectedCategory !== "all" 
                  ? `${selectedCategory === "all" ? "All" : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Events`
                  : "All Events"}
              </AccordionTrigger>
              <AccordionContent>
                {searchQuery || selectedCategory !== "all" ? (
                  <EventGrid
                    events={filteredEvents}
                    isLoading={isLoading}
                    emptyMessage="No events match your criteria"
                  />
                ) : (
                  <EventGrid
                    events={events}
                    isLoading={isLoading}
                    emptyMessage="No events available"
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}
