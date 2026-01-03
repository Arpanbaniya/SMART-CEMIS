import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/header";
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
import { ArrowLeft, Calendar, MapPin, Clock, Users, DollarSign, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EVENT_CATEGORIES } from "@shared/schema";

// Replace your current schema with this:
const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please enter a time"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  mapUrl: z.string().url().optional().or(z.literal("")),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  isPaid: z.boolean().optional(), // ← changed from .default(false)
  price: z.number().min(0).optional(), // ← changed from .default(0)
  isSportsEvent: z.boolean().optional(), // ← changed from .default(false)
  tournamentType: z.string().optional(),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

export default function CreateEventPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      date: "",
      time: "",
      location: "",
      mapUrl: "",
      capacity: 100,
      isPaid: false,
      price: 0,
      isSportsEvent: false,
      tournamentType: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      return apiRequest("POST", "/api/events", {
        ...data,
        date: new Date(data.date).toISOString(),
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateEventForm) => {
    createMutation.mutate(data);
  };

  const isPaid = form.watch("isPaid");
  const isSportsEvent = form.watch("isSportsEvent");

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
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
                Create New Event
              </CardTitle>
              <CardDescription>
                Fill in the details below to create a new event
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
                            <Input placeholder="Annual Tech Hackathon 2024" {...field} data-testid="input-event-title" />
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
                              data-testid="textarea-event-description"
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
                              <SelectTrigger data-testid="select-event-category">
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Date
                            </FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-event-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
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
                              <Input type="time" {...field} data-testid="input-event-time" />
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
                            Location
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Main Auditorium, Building A" {...field} data-testid="input-event-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mapUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google Maps Embed URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.google.com/maps/embed?..." {...field} data-testid="input-event-map" />
                          </FormControl>
                          <FormDescription>
                            Paste the embed URL from Google Maps
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
                              data-testid="input-event-capacity"
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
                                data-testid="switch-event-paid"
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
                                  data-testid="input-event-price"
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
                                data-testid="switch-event-sports"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {isSportsEvent && (
                        <FormField
                          control={form.control}
                          name="tournamentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tournament Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-tournament-type">
                                    <SelectValue placeholder="Select tournament type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="single_elimination">Single Elimination</SelectItem>
                                  <SelectItem value="double_elimination">Double Elimination</SelectItem>
                                  <SelectItem value="round_robin">Round Robin</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/admin">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-event">
                      {createMutation.isPending ? "Creating..." : "Create Event"}
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
