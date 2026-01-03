import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Star } from "lucide-react";
import { formatDate, getCategoryColor, getStatusColor, cn } from "@/lib/utils";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const averageRating = 4.5;
  const reviewCount = 12;

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="group overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-event-${event.id}`}>
        <div className="relative aspect-video overflow-hidden">
          <img
            src={event.imageUrl || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80`}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Badge 
            className={cn("absolute top-3 right-3", getStatusColor(event.status || "upcoming"))}
            variant="secondary"
          >
            {event.status || "upcoming"}
          </Badge>
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Badge variant="outline" className={cn("text-xs", getCategoryColor(event.category))}>
              {event.category}
            </Badge>
            <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </h3>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium" data-testid={`text-participant-count-${event.id}`}>
                {event.participantCount}
              </span>
              <span className="text-muted-foreground">
                / {event.capacity}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{averageRating}</span>
              <span className="text-sm text-muted-foreground">({reviewCount})</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
