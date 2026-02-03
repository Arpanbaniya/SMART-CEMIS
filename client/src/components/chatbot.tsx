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
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
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
      {/* Chatbot Toggle Button - Fixed to viewport bottom right */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-2 border-white dark:border-gray-800 z-[9999] transition-all duration-300 hover:scale-110"
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-chatbot-toggle"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Chatbot Window - Fixed to viewport, not page */}
      {isOpen && (
        <Card 
          className="fixed bottom-24 right-6 w-80 md:w-96 shadow-2xl z-[9999] border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm animate-slideUp"
          style={{ 
            position: 'fixed',
            bottom: '6rem',
            right: '1.5rem',
            zIndex: 9999,
            height: '500px',
            maxHeight: '70vh'
          }}
          data-testid="card-chatbot"
        >
          {/* Header with gradient */}
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              EventHub Assistant
              <div className="ml-auto">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col" style={{ height: 'calc(100% - 80px)' }}>
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 chatbot-messages"
              ref={scrollRef}
            >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 animate-fadeIn",
                      !message.isBot && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={cn(
                        "text-white font-semibold",
                        message.isBot 
                          ? "bg-gradient-to-r from-blue-600 to-purple-600" 
                          : "bg-gradient-to-r from-gray-600 to-gray-700"
                      )}>
                        {message.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm max-w-[80%] shadow-sm break-words",
                        message.isBot
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
            </div>
            
            {/* Input area with enhanced styling */}
            <div className="border-t bg-gray-50 dark:bg-gray-800 p-4" style={{ flexShrink: 0 }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  data-testid="input-chatbot-message"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  data-testid="button-chatbot-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              
              {/* Quick action buttons */}
              <div className="mt-3 flex flex-wrap gap-1">
                {["register", "events", "help", "payment"].map((action) => (
                  <button
                    key={action}
                    onClick={() => setInput(`Tell me about ${action}`)}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
