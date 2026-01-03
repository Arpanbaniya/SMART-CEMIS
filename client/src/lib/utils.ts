import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(time: string): string {
  return time;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    sports: "bg-green-500/10 text-green-600 dark:text-green-400",
    technology: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    cultural: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    academic: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    music: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    art: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    workshop: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    competition: "bg-red-500/10 text-red-600 dark:text-red-400",
    social: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    other: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  };
  return colors[category] || colors.other;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    upcoming: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ongoing: "bg-green-500/10 text-green-600 dark:text-green-400",
    completed: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
    draft: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  };
  return colors[status] || colors.upcoming;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
