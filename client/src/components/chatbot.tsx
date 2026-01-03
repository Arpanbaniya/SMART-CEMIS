import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

const FAQ_RESPONSES: Record<string, string> = {
  "register": "To register for an event, simply click on the event card, then click the 'Register' button on the event detail page. If the event requires payment, you'll be prompted to complete the payment process.",
  "payment": "We accept various payment methods. For paid events, you'll see the payment option during registration. All payments are processed securely.",
  "cancel": "To cancel your registration, go to your Profile page and find the event under 'My Registrations'. Click on the event and select 'Cancel Registration'.",
  "certificate": "Certificates are automatically generated after event completion. You can download your certificates from your Profile page under 'Past Events'.",
  "sports": "We have various sports events including tournaments, leagues, and friendly matches. Check the Sports category to find events that interest you!",
  "tech": "Our technology events include hackathons, workshops, seminars, and coding competitions. Browse the Technology category for upcoming events.",
  "help": "I can help you with: registration, payments, cancellations, certificates, finding events, and general questions. Just ask!",
  "contact": "You can reach our support team at support@eventhub.edu. We typically respond within 24 hours.",
};

function getBotResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  
  if (lowerMessage.includes("hi") || lowerMessage.includes("hello") || lowerMessage.includes("hey")) {
    return "Hello! Welcome to EventHub. How can I help you today? You can ask me about event registration, payments, certificates, or finding specific events.";
  }
  
  if (lowerMessage.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  
  return "I'm not sure I understand. Could you try rephrasing? You can ask me about: registration, payments, cancellations, certificates, or finding events.";
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! I'm EventHub Assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(input),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-chatbot-toggle"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 md:w-96 shadow-xl z-50 flex flex-col max-h-[500px]" data-testid="card-chatbot">
          <CardHeader className="border-b py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" />
              EventHub Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      !message.isBot && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={cn(
                        message.isBot ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {message.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                        message.isBot
                          ? "bg-muted"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  data-testid="input-chatbot-message"
                />
                <Button type="submit" size="icon" data-testid="button-chatbot-send">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
