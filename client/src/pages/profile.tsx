import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PageLoader } from "@/components/loading-spinner";
import { Chatbot } from "@/components/chatbot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Settings,
  Calendar,
  Award,
  Edit2,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials, formatDate, getCategoryColor } from "@/lib/utils";
import { isUnauthorizedError } from "@/lib/auth-utils";

import type { UserProfile, Registration, Event, UserPreference } from "@shared/schema";

export default function ProfilePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    phone: string;
    bio: string;
    preference: UserPreference;
  }>({
    phone: "",
    bio: "",
    preference: "both",
  });



  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile", user?.id],
    enabled: !!user?.id,
  });

  const { data: registrations = [] } = useQuery<(Registration & { event?: Event })[]>({
    queryKey: ["/api/users", user?.id, "registrations"],
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      return apiRequest("PATCH", `/api/profile/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", user?.id] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <PageLoader />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  const getUserName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "User";
  };

  const pastEvents = registrations.filter(
    (r) => r.event && r.event.status === "completed"
  );
  const upcomingRegistrations = registrations.filter(
    (r) => r.event && r.event.status !== "completed"
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="bg-gradient-to-b from-primary/10 to-transparent py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={getUserName()} />
                <AvatarFallback className="text-2xl">{getInitials(getUserName())}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold" data-testid="text-profile-name">
                  {getUserName()}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {profile?.role || "user"}
                  </Badge>
                  <Badge variant="outline">
                    {registrations.length} events attended
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" data-testid="tab-overview">
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="registrations" data-testid="tab-registrations">
                <Calendar className="h-4 w-4 mr-2" />
                My Events
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-bold text-primary">{registrations.length}</div>
                      <div className="text-sm text-muted-foreground">Events Registered</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-bold text-primary">{pastEvents.length}</div>
                      <div className="text-sm text-muted-foreground">Events Attended</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-4xl font-bold text-primary">{upcomingRegistrations.length}</div>
                      <div className="text-sm text-muted-foreground">Upcoming Events</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your personal details and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {getUserName()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {user?.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {profile?.phone || "Not provided"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Preference</Label>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Award className="h-4 w-4" />
                        {profile?.preference === "physical"
                          ? "Physical Activities"
                          : profile?.preference === "innovative"
                          ? "Innovative/Tech"
                          : "Both"}
                      </div>
                    </div>
                  </div>
                  {profile?.bio && (
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <p className="text-muted-foreground">{profile.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Events you're registered for</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingRegistrations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No upcoming events</p>
                      <Button className="mt-4" variant="outline" asChild>
                        <a href="/events">Browse Events</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingRegistrations.map((reg) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
                        >
                          <div className="space-y-1">
                            <h4 className="font-medium">{reg.event?.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {reg.event && formatDate(reg.event.date)}
                            </p>
                          </div>
                          <Badge className={getCategoryColor(reg.event?.category || "other")}>
                            {reg.event?.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Past Events</CardTitle>
                  <CardDescription>Events you've attended</CardDescription>
                </CardHeader>
                <CardContent>
                  {pastEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No past events yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastEvents.map((reg) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div className="space-y-1">
                            <h4 className="font-medium">{reg.event?.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {reg.event && formatDate(reg.event.date)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Award className="h-4 w-4 mr-2" />
                            Certificate
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Edit Profile</CardTitle>
                      <CardDescription>Update your profile information</CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      onClick={() => {
                        if (isEditing) {
                          updateProfileMutation.mutate(editForm);
                        } else {
                          setEditForm({
                            phone: profile?.phone || "",
                            bio: profile?.bio || "",
                             preference: (profile?.preference ?? "both") as UserPreference,
                          });
                          setIsEditing(true);
                        }
                      }}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-edit-profile"
                    >
                      {isEditing ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      ) : (
                        <>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      placeholder="Enter your phone number"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      disabled={!isEditing}
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Preference</Label>
                    <Select
                      value={editForm.preference}
                      onValueChange={(value: UserPreference) => setEditForm({ ...editForm, preference: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger data-testid="select-preference">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Physical Activities (Sports, etc.)</SelectItem>
                        <SelectItem value="innovative">Innovative/Tech (Hackathons, etc.)</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      disabled={!isEditing}
                      data-testid="textarea-bio"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}
