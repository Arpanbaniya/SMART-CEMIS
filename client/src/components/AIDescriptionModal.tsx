import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy, Check, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const ACTIONS = [
  { value: "generate", label: "Generate", description: "Create a new description from scratch" },
  { value: "improve", label: "Improve", description: "Enhance existing description" },
  { value: "shorten", label: "Shorten", description: "Make it more concise" },
  { value: "expand", label: "Expand", description: "Add more details" },
  { value: "professional", label: "Professional", description: "Formal tone" },
  { value: "engaging", label: "Engaging", description: "Make it catchy and fun" },
];

interface AIDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentDescription?: string;
  onApply: (description: string) => void;
}

export function AIDescriptionModal({
  isOpen,
  onClose,
  title,
  currentDescription = "",
  onApply,
}: AIDescriptionModalProps) {
  const [action, setAction] = useState("generate");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter an event title first.",
        variant: "destructive",
      });
      return;
    }

    const needsDescription = ["improve", "shorten", "expand", "professional", "engaging"].includes(
      action
    );
    if (needsDescription && !currentDescription.trim()) {
      toast({
        title: "Description Required",
        description: `Please enter a description to ${action} it.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/descriptions/generate", {
        title: title.trim(),
        description: currentDescription.trim(),
        action,
      });

      setGeneratedText(response.generatedText);
      toast({
        title: "Generated Successfully",
        description: `Your description has been ${action}d.`,
      });
    } catch (error: any) {
      console.error("Generation error:", error);
      let errorMsg = "Failed to generate description. Please try again.";
      
      if (error.message?.includes("rate limit")) {
        errorMsg = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message?.includes("quota")) {
        errorMsg = "API quota exceeded. Please try again later.";
      } else if (error.message?.includes("invalid")) {
        errorMsg = "Invalid request. Please check your inputs.";
      }
      
      toast({
        title: "Generation Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Generated text copied to clipboard.",
    });
  };

  const handleApply = () => {
    if (generatedText.trim()) {
      onApply(generatedText);
      setGeneratedText("");
      onClose();
      toast({
        title: "Applied",
        description: "Description updated successfully.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-card border-0">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <DialogTitle>AI Description Generator</DialogTitle>
          </div>
          <DialogDescription>
            Generate or enhance your event description using AI for a more compelling presentation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Action</label>
            <Select value={action} onValueChange={setAction} disabled={loading}>
              <SelectTrigger className="input-3d">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                {ACTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Title Display */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Event Title</label>
            <div className="p-3 bg-muted rounded-md text-sm">
              {title || "No title entered"}
            </div>
          </div>

          {/* Current Description (if needed) */}
          {["improve", "shorten", "expand", "professional", "engaging"].includes(action) && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Current Description</label>
              <Textarea
                value={currentDescription}
                readOnly
                className="resize-none bg-muted/50"
                rows={3}
              />
            </div>
          )}

          {/* Generated Result */}
          {generatedText && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Generated Description</label>
              <Textarea
                value={generatedText}
                readOnly
                className="resize-none bg-primary/5 border border-primary/20"
                rows={4}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy to clipboard
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </Button>
          {!generatedText ? (
            <Button
              onClick={handleGenerate}
              disabled={loading || !title.trim()}
              className="gradient-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleApply}
              disabled={loading}
              className="gradient-btn"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply to Description
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
