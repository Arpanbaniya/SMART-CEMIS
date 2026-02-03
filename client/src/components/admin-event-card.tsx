import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Star, Edit, Trash2 } from "lucide-react";
import { formatDate, getCategoryColor, getStatusColor, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { Event } from "@/lib/types";

interface AdminEventCardProps {
  event: Event;
}

export function AdminEventCard({ event }: AdminEventCardProps) {
  const { user } = useAuth();
  const averageRating = 4.5;
  const reviewCount = 12;

  // Check if current user can edit this event
  const canEditEvent = user && (
    user.role === 'super_admin' || 
    (user.role === 'student_admin' && event.createdById === user.id)
  );

  return (
    <Card className="group overflow-hidden hover-elevate h-full">
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
          <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
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
            <span className="font-medium">
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

        <div className="flex gap-2 pt-2">
          <Link href={`/events/${event.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          
          {canEditEvent && (
            <>
              <Link href={`/admin/edit-event/${event.id}`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                    // This will be handled by the delete functionality
                    window.location.href = `/admin/delete-event/${event.id}`;
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
