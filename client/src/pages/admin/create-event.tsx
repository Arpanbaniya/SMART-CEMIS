import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
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
import { ArrowLeft, Calendar, MapPin, Clock, Users, DollarSign, Trophy, Image, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { AIDescriptionModal } from "@/components/AIDescriptionModal";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(EVENT_CATEGORIES, { message: "Please select a valid category" }),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please enter a time"),
  endDate: z.string().min(1, "Please select an end date"),
  endTime: z.string().min(1, "Please enter event end time"),
  location: z.string().min(1, "Location is required"),
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
  isPaid: z.boolean().default(false),
  price: z.number().min(0).default(0),
  isSportsEvent: z.boolean().default(false),
  isTeamEvent: z.boolean().default(false),
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

export default function CreateEventPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      date: "",
      time: "",
      endDate: "",
      endTime: "",
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/events", {
        ...data,
        date: new Date(`${data.date}T${data.time}`).toISOString(),
        endDate: new Date(`${data.endDate}T${data.endTime}`).toISOString(),
        createdById: user?.id,
        status: "upcoming",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event Created",
        description: "Your event has been created successfully.",
      });
      setLocation("/admin");
    },
    onError: (error: any) => {
      console.error("Event creation error:", error);
      
      // Handle specific error codes from backend
      let errorMessage = "Failed to create event. Please try again.";
      
      if (error.error) {
        switch (error.error) {
          case 'INSUFFICIENT_PERMISSIONS':
            errorMessage = error.message || "You don't have permission to create events.";
            break;
          case 'EVENT_CREATION_LIMIT_EXCEEDED':
            errorMessage = error.message || "You've reached your event creation limit.";
            break;
          case 'DUPLICATE_EVENT':
            errorMessage = error.message || "This event already exists. Please change at least one field.";
            break;
          case 'Validation failed':
            errorMessage = "Please check all required fields and try again.";
            break;
          default:
            errorMessage = error.message || "Failed to create event. Please try again.";
        }
      }
      
      toast({
        title: "Event Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Validate that date and time are not in the past
    const selectedDate = new Date(data.date);
    const selectedEndDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "You cannot select a past date.",
        variant: "destructive",
      });
      return;
    }

    // Validate that endDate is same as or after start date
    if (selectedEndDate < selectedDate) {
      toast({
        title: "Invalid End Date",
        description: "End date must be the same as or after the start date.",
        variant: "destructive",
      });
      return;
    }

    // If dates are the same, endTime must be after startTime
    if (selectedDate.getTime() === selectedEndDate.getTime()) {
      const [startHours, startMinutes] = data.time.split(':').map(Number);
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      const startTimeMinutes = startHours * 60 + startMinutes;
      const endTimeMinutes = endHours * 60 + endMinutes;
      
      if (endTimeMinutes <= startTimeMinutes) {
        toast({
          title: "Invalid End Time",
          description: "End time must be after the start time for same-day events.",
          variant: "destructive",
        });
        return;
      }
    }

    // If date is today, validate time
    if (selectedDate.getTime() === today.getTime()) {
      const [hours, minutes] = data.time.split(':').map(Number);
      const selectedDateTime = new Date();
      selectedDateTime.setHours(hours, minutes, 0, 0);
      const now = new Date();
      
      if (selectedDateTime < now) {
        toast({
          title: "Invalid Time",
          description: "You cannot select a time that has already passed for today.",
          variant: "destructive",
        });
        return;
      }
    }

    createMutation.mutate(data);
  };

  const isPaid = form.watch("isPaid");
  const isSportsEvent = form.watch("isSportsEvent");
  const isTeamEvent = form.watch("isTeamEvent");

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </Link>

          <Card className="glass-card border-0 shadow-2xl animate-fadeIn">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4 float-animation">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="gradient-text text-2xl font-bold">
                Create New Event
              </CardTitle>
              <CardDescription className="text-lg">
                Bring your vision to life with stunning event details
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              Event Title
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Annual Tech Hackathon 2024" 
                                {...field} 
                                data-testid="input-event-title"
                                className="input-3d h-12 text-base"
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-base font-semibold">Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="input-3d h-12 text-base" data-testid="select-event-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="glass-card border-0 shadow-xl">
                                {EVENT_CATEGORIES.map((category) => (
                                  <SelectItem 
                                    key={category} 
                                    value={category}
                                    className="hover-elevate rounded-md p-3 transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 gradient-primary rounded-full"></div>
                                      {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-base font-semibold">Event Description</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsAIModalOpen(true)}
                              className="hover-elevate"
                            >
                              <Wand2 className="h-4 w-4 mr-2" />
                              ✨ AI Assist
                            </Button>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your event in detail..."
                              className="min-h-[120px] input-3d text-base resize-none"
                              {...field}
                              data-testid="textarea-event-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => {
                          const today = new Date().toISOString().split('T')[0];
                          
                          return (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-base font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Date
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  min={today}
                                  data-testid="input-event-date"
                                  className="input-3d h-12 text-base"
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              Time
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                data-testid="input-event-time"
                                className="input-3d h-12 text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              End Time
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                data-testid="input-event-end-time"
                                className="input-3d h-12 text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => {
                          const today = new Date().toISOString().split('T')[0];
                          
                          return (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-base font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                End Date
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  min={today}
                                  data-testid="input-event-end-date"
                                  className="input-3d h-12 text-base"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Location (Room/Building)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Room 101, Building A" 
                              {...field} 
                              data-testid="input-event-location"
                              className="input-3d h-12 text-base"
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
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
                        <FormItem className="space-y-2">
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Map URL
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.google.com/maps/... or https://share.google/..." 
                              {...field} 
                              data-testid="input-event-map-url"
                              className="input-3d h-12 text-base"
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            Paste Google Maps URL (google.com/maps, maps.app.goo.gl, or share.google) for live map display (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                              <Image className="h-4 w-4 text-primary" />
                              Event Image URL
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/image.png or data:image/jpeg;base64,..." 
                                {...field} 
                                data-testid="input-event-image"
                                className="input-3d h-12 text-base"
                              />
                            </FormControl>
                            <FormDescription className="text-sm">
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              Capacity
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-event-capacity"
                                className="input-3d h-12 text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-6 rounded-2xl border border-border/50 p-6 glass-card">
                      <FormField
                        control={form.control}
                        name="isPaid"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-xl hover-elevate transition-all duration-200">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-semibold flex items-center gap-2 cursor-pointer">
                                <DollarSign className="h-5 w-5 text-primary" />
                                Paid Event
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Require payment for registration
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-event-paid"
                                className="scale-110"
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
                            <FormItem className="space-y-2 animate-slideInFromLeft">
                              <FormLabel className="text-base font-semibold">Price (in cents)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="1000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-event-price"
                                  className="input-3d h-12 text-base"
                                />
                              </FormControl>
                              <FormDescription className="text-sm">
                                Enter amount in cents (e.g., 1000 = $10.00)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="space-y-6 rounded-2xl border border-border/50 p-6 glass-card">
                      <FormField
                        control={form.control}
                        name="isTeamEvent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-xl hover-elevate transition-all duration-200">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-semibold flex items-center gap-2 cursor-pointer">
                                <Users className="h-5 w-5 text-primary" />
                                Team Event
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Enable team-based participation and registration
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="scale-110"
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
                              <FormItem className="space-y-2 animate-slideInFromLeft">
                                <FormLabel className="text-base font-semibold">Maximum Teams</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={2}
                                    placeholder="Enter maximum number of teams"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                    className="input-3d h-12 text-base"
                                  />
                                </FormControl>
                                <FormDescription className="text-sm">
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
                              <FormItem className="space-y-2 animate-slideInFromLeft">
                                <FormLabel className="text-base font-semibold">Maximum Members per Team</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={2}
                                    placeholder="Enter maximum members per team"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                    className="input-3d h-12 text-base"
                                  />
                                </FormControl>
                                <FormDescription className="text-sm">
                                  Leave empty for unlimited members per team
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>

                    <div className="space-y-6 rounded-2xl border border-border/50 p-6 glass-card">
                      <FormField
                        control={form.control}
                        name="isSportsEvent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 rounded-xl hover-elevate transition-all duration-200">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-semibold flex items-center gap-2 cursor-pointer">
                                <Trophy className="h-5 w-5 text-primary" />
                                Sports Tournament
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Enable tournament bracket and competition features
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-event-sports"
                                className="scale-110"
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

                    <div className="flex justify-between items-center pt-8">
                      <Button 
                        type="button" 
                        variant="outline" 
                        asChild
                        className="btn-3d h-12 px-8"
                      >
                        <Link href="/admin">Cancel</Link>
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending} 
                        data-testid="button-submit-event"
                        className="btn-3d gradient-primary text-white border-0 h-12 px-8 text-base font-semibold"
                      >
                        {createMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Create Event
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
              <AIDescriptionModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                title={form.watch("title")}
                currentDescription={form.watch("description")}
                onApply={(text) => form.setValue("description", text)}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
