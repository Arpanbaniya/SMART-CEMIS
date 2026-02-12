export interface SentimentResult {
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    score: number;
    flagged: boolean;
}
export interface SentimentAnalysis {
    positive: number;
    neutral: number;
    negative: number;
    averageRating: number;
    totalFeedback: number;
}
export declare function analyzeSentiment(feedback: any): Promise<SentimentResult>;
export declare function getSentimentAnalysis(eventId?: string): Promise<SentimentAnalysis>;
export declare function getSentimentTrend(days?: number): Promise<Array<{
    date: string;
    score: number;
    positive: number;
    neutral: number;
    negative: number;
}>>;
