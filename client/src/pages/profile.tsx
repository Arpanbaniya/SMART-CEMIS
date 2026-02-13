import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/header";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Settings,
  Calendar,
  Award,
  Edit2,
  Save,
  Send,
  Loader,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials, formatDate, getCategoryColor } from "@/lib/utils";

import type { UserProfile, Registration, Event, UserPreference } from "@/lib/types";

export default function ProfilePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showChangeEmailDialog, setShowChangeEmailDialog] = useState(false);
  const [emailChangeForm, setEmailChangeForm] = useState({
    newEmail: '',
    password: ''
  });
  const [editForm, setEditForm] = useState<{
    phone: string;
    bio: string;
    preference: UserPreference;
  }>({
    phone: "",
    bio: "",
    preference: "physical",
  });

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await fetch(`/api/profile`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !!isAuthenticated,
  });

  const { data: registrations = [] } = useQuery<(Registration & { event?: Event })[]>({
    queryKey: ["/api/users", user?.id, "registrations"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/registrations`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch registrations");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      return apiRequest("PATCH", `/api/profile`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const emailChangeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/email-change/request`, {
        newEmail: emailChangeForm.newEmail,
        password: emailChangeForm.password
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Verification Email Sent",
        description: `A verification link has been sent to ${emailChangeForm.newEmail}. Check your inbox to confirm the change.`,
      });
      setShowChangeEmailDialog(false);
      setEmailChangeForm({ newEmail: '', password: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request email change. Please try again.",
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
                {profile?.role !== 'super_admin' && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {profile?.role || "user"}
                    </Badge>
                    <Badge variant="outline">
                      {registrations.length} events attended
                    </Badge>
                  </div>
                )}
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
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {profile?.role !== 'super_admin' && (
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
              )}

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
                    {profile?.role !== 'super_admin' && (
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
                    )}
                  </div>
                  {profile?.role !== 'super_admin' && profile?.bio && (
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <p className="text-muted-foreground">{profile.bio}</p>
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
                             preference: (profile?.preference ?? "physical") as UserPreference,
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
                    <Label>Email</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Your email"
                        value={profile?.email || ""}
                        disabled={true}
                        data-testid="input-email"
                        className="flex-1"
                      />
                      {profile?.role !== 'super_admin' && (
                        <Button
                          variant="outline"
                          onClick={() => setShowChangeEmailDialog(true)}
                          className="whitespace-nowrap"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Change Email
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      placeholder="Enter your phone number"
                      type="tel"
                      maxLength={10}
                      pattern="[0-9]*"
                      value={editForm.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        setEditForm({ ...editForm, phone: value });
                      }}
                      disabled={!isEditing}
                      data-testid="input-phone"
                    />
                    <p className="text-xs text-muted-foreground">10 digits maximum</p>
                  </div>
                  {profile?.role !== 'super_admin' && (
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
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {profile?.role !== 'super_admin' && (
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Email Change Dialog */}
      <AlertDialog open={showChangeEmailDialog} onOpenChange={setShowChangeEmailDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Email Address</AlertDialogTitle>
            <AlertDialogDescription>
              We'll send a verification link to your new email address. You must verify it to complete the change.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="Enter your new email"
                value={emailChangeForm.newEmail}
                onChange={(e) =>
                  setEmailChangeForm({
                    ...emailChangeForm,
                    newEmail: e.target.value,
                  })
                }
                disabled={emailChangeMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Your Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Enter your password to confirm"
                value={emailChangeForm.password}
                onChange={(e) =>
                  setEmailChangeForm({
                    ...emailChangeForm,
                    password: e.target.value,
                  })
                }
                disabled={emailChangeMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                We need your password to confirm this change for security.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> A verification email will be sent to your new address. You'll have 30 minutes to verify the change.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <AlertDialogCancel disabled={emailChangeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => emailChangeMutation.mutate()}
              disabled={
                emailChangeMutation.isPending ||
                !emailChangeForm.newEmail ||
                !emailChangeForm.password
              }
              className="bg-primary"
            >
              {emailChangeMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Verification Email
                </>
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <Chatbot />
    </div>
  );
}
