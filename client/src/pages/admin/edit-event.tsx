import { useState, useEffect } from "react";
import { useLocation, Link, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calendar, MapPin, Clock, Users, DollarSign, Trophy, Image } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EVENT_CATEGORIES } from "@/lib/constants";

const editEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please enter a time"),
  location: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")).refine((val) => {
    if (!val || val === "") return true;
    // Accept various URL formats including base64 data URLs
    try {
      // Check if it's a base64 data URL
      if (val.startsWith('data:image/')) {
        return true;
      }
      
      // For regular URLs, just check if they're valid URLs
      const url = new URL(val);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, "Please enter a valid image URL (http://, https://, or data:image/)"),
  mapUrl: z.string().url().optional().or(z.literal("")).refine((val) => {
    if (!val || val === "") return true;
    // Validate Google Maps URLs - accept more formats
    try {
      const url = new URL(val);
      return (
        url.hostname === 'www.google.com' && url.pathname.includes('/maps/') ||
        url.hostname === 'maps.app.goo.gl' ||
        url.hostname === 'share.google' ||
        (url.hostname.includes('google') && url.pathname.includes('maps'))
      );
    } catch {
      return false;
    }
  }, "Please enter a valid Google Maps URL (google.com/maps, maps.app.goo.gl, or share.google)"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  isPaid: z.boolean().optional(),
  price: z.number().min(0).optional(),
  isSportsEvent: z.boolean().optional(),
  isTeamEvent: z.boolean().optional(),
  maxTeams: z.number().optional(),
  maxTeamMembers: z.number().optional(),
}).refine((data) => {
  // Only validate genderFixed if it's not a sports event
  if (!data.isSportsEvent) {
    return true; // genderFixed is optional for non-sports events
  }
  return true; // genderFixed is not used for sports events
}, {
  message: "Gender category is not applicable for sports tournaments",
  path: ["genderFixed"]
});

type EditEventForm = z.infer<typeof editEventSchema>;

export default function EditEventPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = useParams();
  const eventId = params.id;

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["/api/events", eventId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/events/${eventId}`);
      return response;
    },
    enabled: !!eventId,
  });

  const form = useForm<EditEventForm>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      date: "",
      time: "",
      location: "",
      imageUrl: "",
      mapUrl: "",
      capacity: 100,
      isPaid: false,
      price: 0,
      isSportsEvent: false,
      isTeamEvent: false,
      maxTeams: undefined,
    },
  });

  // Populate form when event data is loaded
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description,
        category: event.category,
        date: new Date(event.date).toISOString().split('T')[0],
        time: event.time,
        location: event.location,
        imageUrl: event.imageUrl || "",
        mapUrl: event.mapUrl || "",
        capacity: event.capacity,
        isPaid: event.isPaid,
        price: event.price,
        isSportsEvent: event.isSportsEvent,
        isTeamEvent: event.isTeamEvent || false,
        maxTeams: event.maxTeams,
      });
    }
  }, [event, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditEventForm) => {
      return apiRequest("PATCH", `/api/events/${eventId}`, {
        ...data,
        date: new Date(data.date).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      toast({
        title: "Event Updated",
        description: "Your event has been updated successfully.",
      });
      setLocation("/admin");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
      setLocation("/admin");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditEventForm) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const isPaid = form.watch("isPaid");
  const isSportsEvent = form.watch("isSportsEvent");
  const isTeamEvent = form.watch("isTeamEvent");

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading event...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">Event not found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The event you're trying to edit doesn't exist.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Edit Event
              </CardTitle>
              <CardDescription>
                Update the details of your event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Annual Tech Hackathon 2024" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your event..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EVENT_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => {
                          const today = new Date().toISOString().split('T')[0];
                          
                          return (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  min={today}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Time
                            </FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location (Room/Building)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Room 101, Building A" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter specific room number or building details (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mapUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Map URL (Google Maps)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.google.com/maps/... or https://share.google/..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Paste Google Maps URL (google.com/maps, maps.app.goo.gl, or share.google) for live map display (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Event Image URL (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/image.png or data:image/jpeg;base64,..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Add an image URL - supports regular URLs, Google Images, and base64 data URLs
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Capacity
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 rounded-lg border p-4">
                      <FormField
                        control={form.control}
                        name="isPaid"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Paid Event
                              </FormLabel>
                              <FormDescription>
                                Require payment for registration
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {isPaid && (
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (in cents)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="1000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter amount in cents (e.g., 1000 = $10.00)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                      <FormField
                        control={form.control}
                        name="isTeamEvent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Team Event
                              </FormLabel>
                              <FormDescription>
                                Enable team-based participation and registration
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {isTeamEvent && (
                        <>
                          <FormField
                            control={form.control}
                            name="maxTeams"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximum Teams</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={2}
                                    placeholder="Enter maximum number of teams"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Leave empty for unlimited teams
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="maxTeamMembers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximum Members per Team</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={2}
                                    placeholder="Enter maximum members per team"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Leave empty for unlimited members per team
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                      <FormField
                        control={form.control}
                        name="isSportsEvent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <Trophy className="h-4 w-4" />
                                Sports Tournament
                              </FormLabel>
                              <FormDescription>
                                Enable tournament bracket/tiesheet
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {isSportsEvent && !isTeamEvent && (
                        <div className="text-sm text-muted-foreground p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Trophy className="h-4 w-4 inline mr-2" />
                          This is an individual sports tournament. For team-based tournaments, enable the Team Event option above.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between gap-4">
                    <div className="flex gap-4">
                      <Button type="button" variant="outline" asChild>
                        <Link href="/admin">Cancel</Link>
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete Event"}
                      </Button>
                    </div>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Updating..." : "Update Event"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
