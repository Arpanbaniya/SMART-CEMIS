import { AdminEventCard } from "./admin-event-card";
import { Calendar } from "lucide-react";
import type { Event } from "@/lib/types";

interface AdminEventGridProps {
  events: Event[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AdminEventGrid({ events, isLoading, emptyMessage = "No events found" }: AdminEventGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading events...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Calendar className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No events found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event) => (
        <AdminEventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
