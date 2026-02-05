import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function InteractiveRating({ 
  rating, 
  onRatingChange, 
  size = "md", 
  disabled = false,
  className 
}: InteractiveRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  const handleStarClick = (starRating: number) => {
    if (!disabled) {
      onRatingChange(starRating);
    }
  };

  const handleMouseEnter = (starRating: number) => {
    if (!disabled) {
      setHoveredRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoveredRating(0);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <div 
      className={cn("flex gap-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={cn(
            "transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          )}
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          aria-label={`Rate ${star} stars`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              displayRating >= star 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-transparent text-gray-300 hover:text-yellow-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}
