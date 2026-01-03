import { Link } from "wouter";
import { Calendar, Github, Twitter, Mail, Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold">EventHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your go-to platform for discovering and managing college events. 
              Connect, participate, and make memories.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-home">
                Home
              </Link>
              <Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-events">
                All Events
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-profile">
                My Profile
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Categories</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/?category=sports" className="text-muted-foreground hover:text-foreground transition-colors">
                Sports
              </Link>
              <Link href="/?category=technology" className="text-muted-foreground hover:text-foreground transition-colors">
                Technology
              </Link>
              <Link href="/?category=cultural" className="text-muted-foreground hover:text-foreground transition-colors">
                Cultural
              </Link>
              <Link href="/?category=academic" className="text-muted-foreground hover:text-foreground transition-colors">
                Academic
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <div className="flex flex-col gap-2 text-sm">
              <a href="mailto:support@eventhub.edu" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                support@eventhub.edu
              </a>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p className="flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-red-500" /> for college communities
          </p>
          <p>2024 EventHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
