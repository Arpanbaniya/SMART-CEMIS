import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, X, Send, Bot, User, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatbotService } from "@/services/chatbotService";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  source?: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! I'm EventHub Assistant. How can I help you today? You can ask me about registration, events, payments, certificates, or anything else!",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(input);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.reply,
        isBot: true,
        timestamp: new Date(),
        source: response.source,
      };
      
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Chatbot error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I couldn't process that request. Please try again or contact support@eventhub.edu",
        isBot: true,
        timestamp: new Date(),
        source: 'error',
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
                    <div className="flex flex-col gap-1">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm max-w-[80%] shadow-sm break-words whitespace-pre-wrap",
                          message.isBot
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        )}
                      >
                        {message.content}
                      </div>
                      {message.source && message.isBot && (
                        <span className="text-xs text-gray-400 px-2">via {message.source}</span>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 px-4 py-3 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Processing...</span>
                      <Loader className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
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
                  disabled={isLoading}
                  className="flex-1 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  data-testid="input-chatbot-message"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !input.trim()}
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
                    disabled={isLoading}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
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
