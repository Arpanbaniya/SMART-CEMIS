import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
<<<<<<< HEAD
import { Header } from "@/components/header";
=======
import { Link } from "wouter";
import Header from "@/components/header";
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
import { Footer } from "@/components/footer";
import { EventGrid } from "@/components/event-grid";
import { CategoryFilter } from "@/components/category-filter";
import { Chatbot } from "@/components/chatbot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Search, SlidersHorizontal } from "lucide-react";
import type { Event } from "@shared/schema";

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [statusFilter, setStatusFilter] = useState("all");

<<<<<<< HEAD
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
=======
  const { data: events = [], isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      console.log("🔍 Events page - Fetching events...");
      try {
        const response = await fetch("/api/events", {
          credentials: "include",
        });
        console.log("🔍 Events page - Response status:", response.status);
        console.log("🔍 Events page - Response headers:", response.headers);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log("🔍 Events page - Error response:", errorText);
          
          // If API fails for unauthenticated users, return mock data for testing
          if (response.status === 401) {
            console.log("🔍 Events page - Returning mock events for unauthenticated users");
            return [
              {
                id: 1,
                title: "Sample Event 1",
                description: "This is a sample event for testing",
                category: "technology",
                date: new Date().toISOString(),
                location: "Campus Auditorium",
                maxParticipants: 100,
                participantCount: 45,
                status: "upcoming",
                imageUrl: null
              },
              {
                id: 2,
                title: "Sample Event 2",
                description: "Another sample event for testing",
                category: "cultural",
                date: new Date(Date.now() + 86400000).toISOString(),
                location: "Student Center",
                maxParticipants: 50,
                participantCount: 30,
                status: "upcoming",
                imageUrl: null
              }
            ];
          }
          
          throw new Error(`Failed to fetch events: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log("🔍 Events page - Events data:", data);
        console.log("🔍 Events page - Events count:", data?.length || 0);
        return data;
      } catch (err) {
        console.log("🔍 Events page - Fetch error:", err);
        throw err;
      }
    },
    retry: 1, // Allow one retry for network issues
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
  });

  const filteredEvents = events
    .filter((event) => {
      const matchesCategory =
        selectedCategory === "all" || event.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      return matchesCategory && matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "popularity":
          return (b.participantCount || 0) - (a.participantCount || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  return (
    <div className="flex min-h-screen flex-col">
      <Header onSearch={setSearchQuery} />

      <main className="flex-1">
        <div className="bg-gradient-to-b from-muted/50 to-background py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="font-display text-4xl font-bold">All Events</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover all the amazing events happening on campus. Filter by category, 
              search by name, or sort to find exactly what you're looking for.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-events-search"
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]" data-testid="select-sort-by">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />

          <div className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          </div>

<<<<<<< HEAD
=======
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading events...</span>
            </div>
          )}

          {!isLoading && !error && events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No events found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No events are currently available. Check back later or sign in to see more events!
              </p>
              <Button className="mt-4" asChild>
                <Link href="/login">Sign In to See More</Link>
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading events
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
          <EventGrid
            events={filteredEvents}
            isLoading={isLoading}
            emptyMessage="No events match your search criteria"
          />
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}
