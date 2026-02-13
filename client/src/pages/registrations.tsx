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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useEventSearch } from "@/hooks/useEventSearch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, SlidersHorizontal, ArrowLeft, Calendar, MapPin, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import type { Event, Registration } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface RegistrationWithEvent extends Omit<Registration, 'eventId'> {
  eventId: Event;
}

export default function RegistrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user, isAuthenticated } = useAuth();

  const { data: registrations = [], isLoading, error, refetch } = useQuery<RegistrationWithEvent[]>({
    queryKey: ["/api/users", user?.id, "registrations"],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/registrations`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error(`Failed to fetch registrations: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
    enabled: isAuthenticated && !!user?.id,
    retry: 1,
    refetchOnWindowFocus: true, // Refresh when user focuses on window
    refetchOnReconnect: true, // Refresh when reconnecting
  });

  // Extract events from registrations for search and filtering
  const events = registrations.map(reg => reg.eventId).filter(Boolean);

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
                <Users className="h-8 w-8 text-primary" />
                <h1 className="font-display text-4xl font-bold">Registered Events</h1>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Please sign in to view your registered events.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/login">
                    Sign In to View Registrations
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
              <Users className="h-8 w-8 text-primary" />
              <h1 className="font-display text-4xl font-bold">Registered Events</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              View all events you've registered for. Manage your registrations and stay updated on event details.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search registered events..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-registrations-search"
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
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
            Showing {filteredEvents.length} registered event{filteredEvents.length !== 1 ? "s" : ""}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading registered events...</span>
            </div>
          )}

          {!isLoading && !error && events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No registered events yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start exploring events and register for ones that interest you!
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
                  <Users className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading registered events
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show events in a detailed list view with registration status */}
          {!isLoading && !error && filteredEvents.length > 0 && (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const registration = registrations.find(reg => reg.eventId && reg.eventId.id === event.id);
                return (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            <Link href={`/events/${event.id}`} className="hover:text-primary transition-colors">
                              {event.title}
                            </Link>
                          </CardTitle>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="secondary">{event.category}</Badge>
                            <Badge variant={event.status === 'completed' ? 'destructive' : 'default'}>
                              {event.status}
                            </Badge>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Registered
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Registered on: {registration ? formatDate(registration.createdAt) : 'N/A'}
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/events/${event.id}`}>
                            View Event
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}
