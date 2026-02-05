import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Trophy, 
  Cpu, 
  Music, 
  Palette, 
  BookOpen, 
  Wrench,
  Award,
  Users,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { value: "all", label: "All Events", icon: Layers },
  { value: "sports", label: "Sports", icon: Trophy },
  { value: "technology", label: "Technology", icon: Cpu },
  { value: "cultural", label: "Cultural", icon: Music },
  { value: "academic", label: "Academic", icon: BookOpen },
  { value: "music", label: "Music", icon: Music },
  { value: "art", label: "Art", icon: Palette },
  { value: "workshop", label: "Workshop", icon: Wrench },
  { value: "competition", label: "Competition", icon: Award },
  { value: "social", label: "Social", icon: Users },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selected === category.value;
          return (
            <Button
              key={category.value}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex items-center gap-2 shrink-0",
                isSelected && "shadow-sm"
              )}
              onClick={() => onSelect(category.value)}
              data-testid={`button-category-${category.value}`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
