import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
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

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
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
