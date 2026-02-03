import { useMemo } from 'react';
import type { Event } from '@/lib/types';

export function useEventSearch(events: Event[], query: string) {
  return useMemo(() => {
    if (!query.trim()) return events;

    const normalizedQuery = query.toLowerCase().trim();
    
    // Create a searchable index for faster lookups
    const indexedEvents = events.map(event => ({
      event,
      searchText: [
        event.title.toLowerCase(),
        event.description.toLowerCase(),
        event.location.toLowerCase(),
        event.category.toLowerCase()
      ].join(' '),
      relevanceScore: 0
    }));

    // Filter and rank events based on relevance
    const filteredEvents = indexedEvents
      .filter(({ searchText }) => searchText.includes(normalizedQuery))
      .map(({ event, searchText }) => {
        let score = 0;
        
        // Exact title match gets highest score
        if (event.title.toLowerCase() === normalizedQuery) score += 100;
        // Title starts with query gets high score
        else if (event.title.toLowerCase().startsWith(normalizedQuery)) score += 80;
        // Title contains query gets medium score
        else if (event.title.toLowerCase().includes(normalizedQuery)) score += 60;
        
        // Category match gets bonus
        if (event.category.toLowerCase() === normalizedQuery) score += 40;
        else if (event.category.toLowerCase().includes(normalizedQuery)) score += 20;
        
        // Location match gets bonus
        if (event.location.toLowerCase().includes(normalizedQuery)) score += 15;
        
        // Description match gets lower score
        if (event.description.toLowerCase().includes(normalizedQuery)) score += 10;
        
        // Word-by-word matching for better relevance
        const queryWords = normalizedQuery.split(' ');
        queryWords.forEach(word => {
          if (word.length > 2) { // Only consider words longer than 2 characters
            if (event.title.toLowerCase().includes(word)) score += 5;
            if (event.description.toLowerCase().includes(word)) score += 2;
          }
        });
        
        return { event, relevanceScore: score };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ event }) => event);

    return filteredEvents;
  }, [events, query]);
}
