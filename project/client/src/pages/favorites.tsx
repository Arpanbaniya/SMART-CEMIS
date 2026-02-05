import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { EventGrid } from "@/components/event-grid";
import { CategoryFilter } from "@/components/category-filter";
import { Chatbot } from "@/components/chatbot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEventSearch } from "@/hooks/useEventSearch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Search, SlidersHorizontal, ArrowLeft } from "lucide-react";
import type { Event } from "@/lib/types";

export default function FavoritesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user, isAuthenticated } = useAuth();

  const { data: events = [], isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error(`Failed to fetch favorite events: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Use efficient search hook
  const searchedEvents = useEventSearch(events, searchQuery);

  const filteredEvents = searchedEvents
    .filter((event) => {
      const matchesCategory =
        selectedCategory === "all" || event.category === selectedCategory;
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      return matchesCategory && matchesStatus;
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

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="bg-gradient-to-b from-muted/50 to-background py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-8 w-8 text-primary" />
                <h1 className="font-display text-4xl font-bold">Favorite Events</h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Please sign in to view your favorite events.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/login">
                    Sign In to View Favorites
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <Chatbot />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="bg-gradient-to-b from-muted/50 to-background py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="font-display text-4xl font-bold">Favorite Events</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              View and manage your favorite events. These are the events you've saved for quick access.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search favorite events..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-favorites-search"
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
            Showing {filteredEvents.length} favorite event{filteredEvents.length !== 1 ? "s" : ""}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading favorite events...</span>
            </div>
          )}

          {!isLoading && !error && events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No favorite events yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start exploring events and save your favorites to see them here!
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/events">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Browse Events
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Heart className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading favorite events
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <EventGrid
            events={filteredEvents}
            isLoading={isLoading}
            emptyMessage="No favorite events match your search criteria"
          />
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}
