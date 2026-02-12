import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import {
  Calendar,
  Users,
  Trophy,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const features = [
  {
    icon: Calendar,
    title: "Event Management",
    description: "Create, manage, and track events with ease. From sports tournaments to tech hackathons.",
  },
  {
    icon: Users,
    title: "Easy Registration",
    description: "Quick and simple registration process with real-time participant tracking.",
  },
  {
    icon: Trophy,
    title: "Tournament Brackets",
    description: "Automatic bracket generation for sports events with bye handling and round management.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Comprehensive analytics with sentiment analysis and engagement metrics.",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Event Coordinator",
    content: "EventHub has transformed how we manage campus events. The analytics are incredible!",
    rating: 5,
  },
  {
    name: "Mike Chen",
    role: "Student Body President",
    content: "The best platform for managing sports tournaments. The bracket system is a game-changer.",
    rating: 5,
  },
  {
    name: "Emily Brown",
    role: "Tech Club Lead",
    content: "Super easy to use and the real-time updates keep everyone in the loop.",
    rating: 5,
  },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold">EventHub</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild data-testid="button-landing-login">
              <a href="/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
          
          <div className="relative container mx-auto px-4 py-24 md:py-32 lg:py-48">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white/90">
                <Sparkles className="h-4 w-4" />
                <span>The ultimate event management platform for colleges</span>
              </div>
              
              <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl" data-testid="text-landing-title">
                Where Campus Events{" "}
                <span className="text-primary">Come Alive</span>
              </h1>
              
              <p className="text-lg text-white/80 md:text-xl max-w-2xl mx-auto">
                Discover, create, and manage college events effortlessly. 
                From registration to analytics, we've got everything covered.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button size="lg" className="gap-2" asChild data-testid="button-landing-get-started">
                  <a href="/login">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20" asChild>
                  <Link href="/events" data-testid="button-landing-explore">
                    Explore Events
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4">
                Everything You Need
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Powerful features to help you manage events from start to finish
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="text-center hover-elevate">
                    <CardContent className="pt-6 space-y-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4">
                Why Choose EventHub?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                "Real-time participant tracking",
                "Automated bracket generation",
                "Sentiment analysis on feedback",
                "Multi-role access control",
                "Payment integration ready",
                "PDF certificate generation",
                "Email notifications",
                "Mobile-responsive design",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4">
                What People Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">"{testimonial.content}"</p>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of students and organizers who trust EventHub for their campus events.
            </p>
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <a href="/login" data-testid="button-landing-cta">
                Create Your Account
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
