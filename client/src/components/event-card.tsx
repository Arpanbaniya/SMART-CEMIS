import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Star, Edit, Trash2, Clock, Trophy, UserPlus, CheckCircle } from "lucide-react";
import { formatDate, getCategoryColor, getStatusColor, cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRegistrationStatus } from "@/hooks/use-registration-status";
import { queryClient } from "@/lib/queryClient";
import { EventRegistrationModal } from "./event-registration-modal";
import type { Event } from "@/lib/types";

// Helper function to extract clean location name from Google Maps URL
function extractLocationName(location: string): string {
  try {
    // Handle various Google Maps URL formats
    if (location.includes('google.com/maps') || location.includes('maps.app.goo.gl')) {
      // For shortened URLs, we can't extract the name, so return a generic label
      if (location.includes('maps.app.goo.gl')) {
        return 'View Location on Maps';
      }
      
      // Extract location name from Google Maps URL
      const searchMatch = location.match(/\/search\/([^\/]+)/);
      if (searchMatch) {
        return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
      }
      
      // Try to extract from place parameter
      const placeMatch = location.match(/[?&]place=([^&]+)/);
      if (placeMatch) {
        return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }
      
      // Try to extract from query parameters
      const queryMatch = location.match(/[?&]q=([^&]+)/);
      if (queryMatch) {
        return decodeURIComponent(queryMatch[1].replace(/\+/g, ' '));
      }
      
      // If no search match, try to extract from the URL path
      const pathMatch = location.match(/\/@([^\/]+)/);
      if (pathMatch) {
        return 'View on Google Maps';
      }
      
      return 'View Location on Maps';
    }
    
    // Handle other map services
    if (location.includes('maps') || location.includes('map')) {
      try {
        const url = new URL(location);
        const domain = url.hostname.replace('www.', '');
        return `View on ${domain}`;
      } catch {
        return 'View Location';
      }
    }
    
    // For other URLs, try to get the domain
    try {
      const url = new URL(location);
      return url.hostname.replace('www.', '');
    } catch {
      return 'View Location';
    }
  } catch {
    return 'View Location';
  }
}

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const { user } = useAuth();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { data: registrationStatus, isLoading: isCheckingRegistration } = useRegistrationStatus(event.id);

  // Check if current user can edit this event
  const canEditEvent = user && (
    user.role === 'super_admin' || 
    (user.role === 'student_admin' && event.createdById === user.id)
  ) && !['completed', 'archived', 'cancelled'].includes(event.status || '');

  const isRegistered = registrationStatus?.isRegistered || false;

  return (
    <Card className="group overflow-hidden card-3d glass-card h-full animate-fadeIn" data-testid={`card-event-${event.id}`}>
      <div className="relative aspect-video overflow-hidden">
        <Link href={`/events/${event.id}`}>
          <div className="relative h-full w-full">
            <img
              src={event.imageUrl ? event.imageUrl.replace(/=s\d+(-c)?/, '=s1920') : `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=90&auto=format&fit=crop`}
              alt={event.title}
              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110 cursor-pointer"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=90&auto=format&fit=crop`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </Link>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Badge 
            className={cn("glass-card border-0 shadow-lg", getStatusColor(event.status || "upcoming"))}
            variant="secondary"
          >
            {event.status || "upcoming"}
          </Badge>
          {event.isPaid && (
            <Badge className="glass-card border-0 shadow-lg gradient-warning text-white">
              Paid
            </Badge>
          )}
        </div>
        {event.isSportsEvent && (
          <div className="absolute top-3 left-3">
            <div className="glass-card border-0 shadow-lg p-2 rounded-lg">
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("glass-card border-0 text-xs", getCategoryColor(event.category))}>
              {event.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
          <Link href={`/events/${event.id}`}>
            <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-all duration-300 group-hover:scale-105 cursor-pointer" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </h3>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 hover-elevate rounded-md p-2 transition-all duration-200 group">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            {event.location.startsWith('http') ? (
              <a 
                href={event.location} 
                target="_blank" 
                rel="noopener noreferrer"
                className="line-clamp-1 truncate text-primary hover:underline"
                title={event.location}
                onClick={(e) => e.stopPropagation()}
              >
                {extractLocationName(event.location)}
              </a>
            ) : (
              <span className="line-clamp-1 truncate" title={event.location}>{event.location}</span>
            )}
          </div>
          <div className="flex items-center gap-2 hover-elevate rounded-md p-2 transition-all duration-200">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>{event.time}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 hover-elevate rounded-md p-2 transition-all duration-200">
            <Users className="h-4 w-4 text-primary" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground" data-testid={`text-participant-count-${event.id}`}>
                {event.participantCount}
              </span>
              <span className="text-xs text-muted-foreground">
                / {event.capacity} spots
              </span>
            </div>
          </div>
        </div>

        {canEditEvent && (
          <div className="flex gap-2 pt-3 border-t border-border/50">
            <Link href={`/admin/edit-event/${event.id}`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full btn-3d hover-elevate">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="sm"
              className="btn-3d hover-elevate"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                  window.location.href = `/admin/delete-event/${event.id}`;
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Register Now button for authenticated users */}
        {user && !canEditEvent && !['completed', 'archived', 'cancelled'].includes(event.status || '') && (
          <div className="pt-3 border-t border-border/50">
            {isRegistered ? (
              <Button disabled className="w-full btn-3d bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                You are already registered
              </Button>
            ) : (
              <EventRegistrationModal 
                eventId={event.id} 
                eventTitle={event.title}
                event={event}
                isOpen={showRegistrationModal}
                onClose={() => setShowRegistrationModal(false)}
                onRegistrationSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/events", event.id, "check-registration"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/events", event.id] });
                }}
              >
                <Button className="w-full btn-3d hover-elevate">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isCheckingRegistration ? "Checking..." : "Register Now"}
                </Button>
              </EventRegistrationModal>
            )}
          </div>
        )}

        {/* Show login prompt for unauthenticated users */}
        {!user && (
          <div className="pt-3 border-t border-border/50">
            <Button asChild className="w-full btn-3d hover-elevate">
              <Link href="/login">
                <UserPlus className="h-4 w-4 mr-2" />
                Login to Register
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
