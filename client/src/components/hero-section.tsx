import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      
      <div className="relative container mx-auto px-4 py-24 md:py-32 lg:py-40">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white/90">
            <Sparkles className="h-4 w-4" />
            <span>Discover amazing events happening on campus</span>
          </div>
          
          <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl" data-testid="text-hero-title">
            Connect, Participate,{" "}
            <span className="text-primary">Make Memories</span>
          </h1>
          
          <p className="text-lg text-white/80 md:text-xl max-w-2xl">
            From sports tournaments to tech hackathons, cultural fests to academic seminars. 
            Find events that match your interests and never miss out on campus life.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" className="gap-2" asChild data-testid="button-explore-events">
              <Link href="/events">
                Explore Events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20" asChild data-testid="button-get-started">
                <a href="/api/login">
                  Get Started
                </a>
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-8 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-white/70">Events Hosted</div>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10k+</div>
              <div className="text-sm text-white/70">Active Users</div>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-sm text-white/70">Organizations</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
