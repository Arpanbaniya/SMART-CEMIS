import { EventCard } from "./event-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@shared/schema";

interface EventGridProps {
  events: Event[];
  isLoading?: boolean;
  title?: string;
  emptyMessage?: string;
}

export function EventGrid({ events, isLoading, title, emptyMessage = "No events found" }: EventGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {title && (
          <h2 className="font-display text-2xl font-bold">{title}</h2>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        {title && (
          <h2 className="font-display text-2xl font-bold">{title}</h2>
        )}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <svg
              className="h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium">{emptyMessage}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Check back later for new events!
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6" data-testid={`section-${title?.toLowerCase().replace(/\s+/g, '-') || 'events'}`}>
      {title && (
        <h2 className="font-display text-2xl font-bold" data-testid={`text-section-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</h2>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-events">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
