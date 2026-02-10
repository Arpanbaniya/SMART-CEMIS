import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserPlus, Loader2, Users, Plus, ArrowLeft } from "lucide-react";
import { Event } from "../../../shared/schema";
import { TeamSelection } from "./team-selection";

interface EventRegistrationModalProps {
  eventId: string;
  eventTitle?: string;
  event: Event;
  children?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onRegistrationSuccess?: () => void;
  onSuccess?: () => void;
  preselectedTeam?: string | null;
}

export function EventRegistrationModal({ 
  eventId, 
  eventTitle, 
  event,
  children, 
  isOpen,
  onClose,
  onRegistrationSuccess,
  onSuccess,
  preselectedTeam
}: EventRegistrationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [programme, setProgramme] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");

  // Team registration state
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [existingTeams, setExistingTeams] = useState<any[]>([]);
  const [showTeamSelection, setShowTeamSelection] = useState(true);
  const [registrationStep, setRegistrationStep] = useState<'team-selection' | 'user-details'>('user-details');
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState("");
  const [rollNoError, setRollNoError] = useState("");
  
  // Payment method: only eSewa
  const paymentMethod = 'esewa';

  // Team selection handler
  const handleTeamSelected = (teamName: string, creating: boolean) => {
    setSelectedTeam(teamName);
    setIsCreatingTeam(creating);
    setRegistrationStep('user-details');
  };

  // Create new team handler
  const handleCreateNewTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive"
      });
      return;
    }

    // Check if team already exists
    const existingTeam = existingTeams.find(t => t.name.toLowerCase() === newTeamName.toLowerCase());
    if (existingTeam) {
      toast({
        title: "Error", 
        description: "Team with this name already exists",
        variant: "destructive"
      });
      return;
    }

    // Create team via API
    try {
      const response = await fetch(`/api/events/${eventId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ teamName: newTeamName.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create team');
      }

      const createdTeam = await response.json();
      
      // Refresh teams list
      await fetchTeams();
      
      // Select the newly created team
      handleTeamSelected(createdTeam.name, true);
      setNewTeamName("");
      setShowCreateTeamForm(false);
      
      toast({
        title: "Team Created",
        description: `Team "${createdTeam.name}" has been created successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive"
      });
    }
  };

  // Go back to team selection
  const handleBackToTeamSelection = () => {
    setSelectedTeam("");
    setIsCreatingTeam(false);
    setNewTeamName("");
    setShowCreateTeamForm(false);
    setRegistrationStep('team-selection');
  };

  // Fetch existing teams for team events
  const fetchTeams = async () => {
    if (!event?.isTeamEvent) return;
    
    try {
      const response = await fetch(`/api/events/${eventId}/teams`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Failed to fetch teams:', response.status);
        return;
      }
      
      const teams = await response.json();
      setExistingTeams(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  // Check if user can create a new team
  const canCreateNewTeam = () => {
    if (!event?.isTeamEvent || !event.maxTeams) return true;
    
    const currentTeamCount = existingTeams.length;
    return currentTeamCount < event.maxTeams;
  };

  // Check if user is already in a team
  const isUserInAnyTeam = () => {
    if (!user?.id) return false;
    return existingTeams.some(team => 
      team.members.some((member: any) => member.userId === user.id)
    );
  };

  // Get user's current team
  const getUserTeam = () => {
    if (!user?.id) return null;
    return existingTeams.find(team => 
      team.members.some((member: any) => member.userId === user.id)
    );
  };

  useEffect(() => {
    if (isOpen && event?.isTeamEvent) {
      fetchTeams();
    }
    
    // Set correct registration step based on event type and preselected team
    if (event?.isTeamEvent) {
      if (preselectedTeam) {
        // If team is preselected, skip team selection and go to user details
        setSelectedTeam(preselectedTeam);
        setIsCreatingTeam(false);
        setRegistrationStep('user-details');
      } else {
        // Show team selection first
        setRegistrationStep('team-selection');
      }
    } else {
      setRegistrationStep('user-details');
    }
    
    // Auto-set gender for fixed gender events
    if (event?.genderFixed) {
      const fixedGender = event.genderFixed.toLowerCase();
      if (fixedGender === 'male' || fixedGender === 'female' || fixedGender === 'other') {
        setGender(fixedGender);
      }
    }
  }, [isOpen, eventId, event?.isTeamEvent, event?.isSportsEvent, event?.genderFixed, preselectedTeam]);

  // Real-time validation functions
  const validateName = (value: string) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (value && !nameRegex.test(value.trim())) {
      setNameError("Name can only contain alphabetic characters (A-Z, a-z) and spaces");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateRollNo = (value: string) => {
    const rollNoRegex = /^[0-9]+$/;
    if (value && !rollNoRegex.test(value.trim())) {
      setRollNoError("Roll number can only contain numeric characters (0-9)");
      return false;
    }
    setRollNoError("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    validateName(value);
  };

  const handleRollNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRollNo(value);
    validateRollNo(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate gender for fixed gender events
    if (event.genderFixed && gender !== event.genderFixed.toLowerCase()) {
      toast({
        title: "Gender Restriction",
        description: `This event is only for ${event.genderFixed} participants.`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate all fields
    const isNameValid = validateName(name);
    const isRollNoValid = validateRollNo(rollNo);
    
    if (!name || !semester || !rollNo || !programme || !email || gender === "") {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (event.isTeamEvent && !selectedTeam) {
      toast({
        title: "Validation Error",
        description: "Please select a team first.",
        variant: "destructive",
      });
      return;
    }

    if (!isNameValid || !isRollNoValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const registrationData: any = {
        studentName: name,
        semester: parseInt(semester),
        rollNo,
        programme,
        email,
        gender,
      };

      // Add team information for team events
      if (event.isTeamEvent) {
        registrationData.teamName = selectedTeam;
      }

      // If event is paid, go through payment flow
      if (event.isPaid && event.price && event.price > 0) {
        try {
          // === eSEWA PAYMENT FLOW ===
          console.log("🚀 Initiating eSewa payment...");
          
          const esewaResponse = await apiRequest("POST", "/api/payment/esewa/initiate", { 
            eventId,
            registrationData
          });

          console.log("✅ eSewa form data received:", esewaResponse);

          // Create a hidden form and submit it to eSewa
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = esewaResponse.formUrl;
          
          Object.entries(esewaResponse.formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          });

          document.body.appendChild(form);
          console.log("📤 Submitting eSewa form to:", esewaResponse.formUrl);
          form.submit();
          
          // Form submission redirects to eSewa, so we return here
          setIsLoading(false);
          return;
        } catch (paymentError: any) {
          console.error("❌ Error during payment initiation:", paymentError);
          console.error("❌ Error message:", paymentError?.message);
          console.error("❌ Error name:", paymentError?.name);
          console.error("❌ Error details:", JSON.stringify(paymentError, null, 2));
          console.error("❌ Error full object:", paymentError);
          
          let errorMsg = "Could not start the payment process. ";
          if (paymentError?.message) {
            errorMsg += paymentError.message;
          } else {
            errorMsg += "Please try again.";
          }
          
          toast({
            title: "Payment Initialization Failed",
            description: errorMsg,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Free events or zero-price events: direct registration (existing behavior)
      const result = await apiRequest("POST", `/api/events/${eventId}/register`, registrationData);

      console.log('Registration successful:', result);

      // Wait a moment for backend to process, then invalidate caches
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
        queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "check-registration"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "registrations"] });
      }, 100);

      onRegistrationSuccess?.();
      onSuccess?.();
      toast({
        title: "Registration Successful!",
        description: `You have been registered for this event${
          event.isTeamEvent ? ` as part of team ${selectedTeam}` : ""
        }.`,
      });
      setIsLoading(false);
      onClose();
      
      // Reset form
      setName("");
      setSemester("");
      setRollNo("");
      setProgramme("");
      setGender("");
      setSelectedTeam("");
      setIsCreatingTeam(false);
      setNewTeamName("");
      setShowCreateTeamForm(false);
      // Reset to team selection only for team events
      setRegistrationStep(event.isTeamEvent ? 'team-selection' : 'user-details');
    } catch (error: any) {
      console.error('Registration error details:', error);
      
      // Check if this is actually a success (201 status but treated as error)
      if (error.message && error.message.includes('Already registered')) {
        // User is actually registered, treat as success
        console.log('User already registered, treating as success');
        
        // Invalidate caches to update UI
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "check-registration"] });
          queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
          queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "registrations"] });
        }, 100);
        
        toast({
          title: "Registration Successful!",
          description: "You have been registered for this event.",
        });
        setIsLoading(false);
        onClose();
        
        // Reset form
        setName("");
        setSemester("");
        setRollNo("");
        setProgramme("");
        setGender("");
        setSelectedTeam("");
        setIsCreatingTeam(false);
        setNewTeamName("");
        setShowCreateTeamForm(false);
        setRegistrationStep('team-selection');
      } else {
        // Check if the error might be a success with wrong status code
        const isLikelySuccess = error.message && (
          error.message.includes('Failed to register for event') ||
          error.message.includes('HTTP 500')
        );
        
        if (isLikelySuccess) {
          console.log('Likely a success with wrong status, checking registration status...');
          
          // Check actual registration status after a delay
          setTimeout(async () => {
            try {
              const response = await fetch(`/api/events/${eventId}/check-registration`, {
                credentials: "include",
              });
              if (response.ok) {
                const data = await response.json();
                if (data.isRegistered) {
                  console.log('Confirmed: User is actually registered');
                  queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "check-registration"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
                  queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "registrations"] });
                  
                  toast({
                    title: "Registration Successful!",
                    description: "You have been registered for this event.",
                  });
                  setIsLoading(false);
                  onClose();
                  
                  // Reset form
                  setName("");
                  setSemester("");
                  setRollNo("");
                  setProgramme("");
                  setGender("");
                  setSelectedTeam("");
                  setIsCreatingTeam(false);
                  setNewTeamName("");
                  setShowCreateTeamForm(false);
                  // Reset to team selection only for team events
                  setRegistrationStep(event.isTeamEvent ? 'team-selection' : 'user-details');
                  return;
                }
              }
            } catch (checkError) {
              console.error('Error checking registration status:', checkError);
            }
            
            // If not actually registered, show error
            toast({
              title: "Registration Failed",
              description: error?.error || error?.message || "Failed to register for the event. Please try again.",
              variant: "destructive",
            });
          }, 500);
        } else {
          toast({
            title: "Registration Failed",
            description: error?.error || error?.message || "Failed to register for the event. Please try again.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Register for Event
          </DialogTitle>
          <DialogDescription>
            {event?.isTeamEvent 
              ? "Join a team or create a new team for this event"
              : "Fill in your details to register for this event"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Selection Step - For any Team Event */}
            {event.isTeamEvent && registrationStep === 'team-selection' && (
              <TeamSelection
                event={event}
                onTeamSelected={handleTeamSelected}
                existingTeams={existingTeams}
                canCreateNewTeam={canCreateNewTeam()}
              />
            )}

          {/* User Details Step */}
            {(!event.isTeamEvent || registrationStep === 'user-details') && (
              <>
                {/* Back button for team events */}
                {event.isTeamEvent && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToTeamSelection}
                    className="mb-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Team Selection
                  </Button>
                )}

              {/* Team info display for team events */}
              {event.isTeamEvent && event.isSportsEvent && selectedTeam && (
                <div className="p-4 border rounded-lg bg-blue-50 mb-6">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">
                      Registering for team: <strong>{selectedTeam}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Standard team selection for non-sports team events */}
              {event.isTeamEvent && !event.isSportsEvent && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Selection *
                    </Label>
                    <Select value={selectedTeam} onValueChange={(value) => setSelectedTeam(value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team or create new" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingTeams.map((team) => (
                          <SelectItem key={team.name} value={team.name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{team.name}</span>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="h-3 w-3" />
                                {team.memberCount}
                                {event.maxTeamMembers && `/${event.maxTeamMembers}`}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="create_new">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create New Team
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* New Team Name Input for non-sports team events */}
                  {selectedTeam === "create_new" && (
                    <div className="space-y-2">
                      <Label htmlFor="teamName">New Team Name *</Label>
                      <Input
                        id="teamName"
                        type="text"
                        placeholder="Enter team name"
                        value={selectedTeam === "create_new" ? "" : selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={handleNameChange}
                  required
                  className={nameError ? "border-red-500" : ""}
                />
                {nameError && (
                  <p className="text-sm text-red-500">{nameError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Select value={semester} onValueChange={setSemester} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollNo">Roll Number *</Label>
                  <Input
                    id="rollNo"
                    type="text"
                    placeholder="e.g., 211200"
                    value={rollNo}
                    onChange={handleRollNoChange}
                    required
                    className={rollNoError ? "border-red-500" : ""}
                  />
                  {rollNoError && (
                    <p className="text-sm text-red-500">{rollNoError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="programme">Programme *</Label>
                <Select value={programme} onValueChange={setProgramme} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your programme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bachelor of Computer Engineering">
                      Bachelor of Computer Engineering
                    </SelectItem>
                    <SelectItem value="Bachelor of Software Engineering">
                      Bachelor of Software Engineering
                    </SelectItem>
                    <SelectItem value="Bachelor of Civil Engineering">
                      Bachelor of Civil Engineering
                    </SelectItem>
                    <SelectItem value="Bachelor of Electrical Engineering">
                      Bachelor of Electrical Engineering
                    </SelectItem>
                    <SelectItem value="Bachelor of Mechanical Engineering">
                      Bachelor of Mechanical Engineering
                    </SelectItem>
                    <SelectItem value="Bachelor of Chemical Engineering">
                      Bachelor of Chemical Engineering
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!!user?.email}
                  />
                  {user?.email && (
                    <p className="text-xs text-muted-foreground">
                      Email is pre-filled from your account
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  {event.genderFixed ? (
                    <div className="p-2 border rounded-md bg-gray-50">
                      <p className="text-sm font-medium capitalize">
                        {event.genderFixed} Only Event
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This event is restricted to {event.genderFixed} participants only
                      </p>
                    </div>
                  ) : (
                    <Select value={gender} onValueChange={(value) => setGender(value as "male" | "female" | "other")} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {event.isPaid && event.price && event.price > 0 && (
                <div className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
                  <Label>Payment Method</Label>
                  <div>📱 eSewa</div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              {(!event.isTeamEvent || !event.isSportsEvent || registrationStep === 'user-details') && (
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register Now"
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
