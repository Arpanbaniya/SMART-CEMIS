import OpenAI from 'openai';
import { Feedback } from '../models/Feedback';

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
    }
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openai;
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  score: number; // 1-5 scale
  flagged: boolean;
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  averageRating: number;
  totalFeedback: number;
}

// Check if content is flagged using OpenAI Moderation API
async function checkModeration(text: string): Promise<boolean> {
  try {
    const client = getOpenAIClient();
    const moderation = await client.moderations.create({
      input: text,
    });
    
    return moderation.results[0].flagged;
  } catch (error: any) {
    console.error('Moderation check error:', error);
    
    // Handle specific OpenAI errors gracefully
    if (error.status === 429) {
      console.log('OpenAI rate limit exceeded, skipping moderation check');
    } else if (error.code === 'insufficient_quota') {
      console.log('OpenAI quota exceeded, disabling moderation checks');
    }
    
    // If OpenAI is not available, don't flag content
    return false;
  }
}

export async function analyzeSentiment(feedback: any): Promise<SentimentResult> {
  try {
    const text = feedback.comment || '';
    const rating = feedback.rating || 0;
    
    // Step 1: Check moderation if there's a comment
    let flagged = false;
    if (text.trim()) {
      flagged = await checkModeration(text);
      
      // If flagged, override to negative immediately
      if (flagged) {
        return {
          sentiment: 'negative',
          confidence: 1.0,
          score: 1,
          flagged: true
        };
      }
    }
    
    // Step 2: Star-Comment Fusion Analysis
    if (text && rating > 0) {
      try {
        const client = getOpenAIClient();
        // Use GPT-4o-mini for combined analysis with conflict resolution
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Classify this event feedback as 'positive', 'neutral', or 'negative'. Consider both star rating and comment with conflict resolution:

CONFLICT RESOLUTION RULES:
- If stars ≥ 4 but comment is toxic/negative → classify as Negative (prioritize text)
- If stars ≤ 2 but comment is positive → classify as Positive (e.g., "Only 2 stars because venue was small, but event was amazing!")
- Ignore sarcasm unless clearly negative
- Consider the overall sentiment and intent

Rating scale: 5 stars = excellent, 4 stars = good, 3 stars = neutral, 2 stars = poor, 1 star = terrible

Return ONLY the sentiment classification: positive, neutral, or negative`
            },
            {
              role: 'user',
              content: `Rating: ${rating}/5 stars. Comment: "${text}"`
            }
          ],
          max_tokens: 10,
          temperature: 0,
        });

        const sentiment = response.choices[0]?.message?.content?.toLowerCase().trim();
        const validSentiments = ['positive', 'neutral', 'negative'];
        const finalSentiment = validSentiments.includes(sentiment || '') ? sentiment as 'positive' | 'neutral' | 'negative' : 'neutral';
        
        return {
          sentiment: finalSentiment,
          confidence: 0.85,
          score: rating,
          flagged: false
        };
      } catch (openaiError: any) {
        console.error('OpenAI API error, falling back to rating-based analysis:', openaiError);
        
        // Handle specific OpenAI errors
        if (openaiError.status === 429) {
          console.log('OpenAI rate limit exceeded, using rating-based analysis');
        } else if (openaiError.code === 'insufficient_quota') {
          console.log('OpenAI quota exceeded, switching to rating-based analysis only');
        }
        
        // Fallback to rating-based analysis if OpenAI fails
        let sentiment: 'positive' | 'neutral' | 'negative';
        if (rating >= 4) sentiment = 'positive';
        else if (rating >= 3) sentiment = 'neutral';
        else sentiment = 'negative';
        
        return {
          sentiment,
          confidence: 0.6,
          score: rating,
          flagged: false
        };
      }
    }
    
    // Step 3: Rating-only analysis
    if (rating > 0) {
      let sentiment: 'positive' | 'neutral' | 'negative';
      if (rating >= 4) sentiment = 'positive';
      else if (rating >= 3) sentiment = 'neutral';
      else sentiment = 'negative';
      
      return {
        sentiment,
        confidence: 0.9,
        score: rating,
        flagged: false
      };
    }
    
    // Step 4: Comment-only analysis
    if (text) {
      try {
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Analyze the sentiment of this event feedback comment. Return only "positive", "neutral", or "negative". Look for keywords indicating satisfaction, dissatisfaction, or neutral experience. Consider context and tone.'
            },
            {
              role: 'user',
              content: `Comment: "${text}"`
            }
          ],
          max_tokens: 10,
          temperature: 0,
        });

        const sentiment = response.choices[0]?.message?.content?.toLowerCase().trim();
        const validSentiments = ['positive', 'neutral', 'negative'];
        const finalSentiment = validSentiments.includes(sentiment || '') ? sentiment as 'positive' | 'neutral' | 'negative' : 'neutral';
        
        return {
          sentiment: finalSentiment,
          confidence: 0.75,
          score: finalSentiment === 'positive' ? 4 : finalSentiment === 'negative' ? 2 : 3,
          flagged: false
        };
      } catch (openaiError: any) {
        console.error('OpenAI API error for comment analysis, defaulting to neutral:', openaiError);
        
        // Handle specific OpenAI errors
        if (openaiError.status === 429) {
          console.log('OpenAI rate limit exceeded for comment analysis, defaulting to neutral');
        } else if (openaiError.code === 'insufficient_quota') {
          console.log('OpenAI quota exceeded for comment analysis, defaulting to neutral');
        }
        
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          score: 3,
          flagged: false
        };
      }
    }
    
    // Step 5: Default neutral (no rating, no comment)
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      score: 3,
      flagged: false
    };
    
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    
    // Fallback to rating-based analysis
    const rating = feedback.rating || 0;
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (rating >= 4) sentiment = 'positive';
    else if (rating >= 3) sentiment = 'neutral';
    else sentiment = 'negative';
    
    return {
      sentiment,
      confidence: 0.6,
      score: rating || 3,
      flagged: false
    };
  }
}

export async function getSentimentAnalysis(eventId?: string): Promise<SentimentAnalysis> {
  try {
    const Feedback = (await import('../models/Feedback')).Feedback;
    
    const query: any = {};
    if (eventId) {
      query.eventId = eventId;
    }
    
    const feedback = await Feedback.find(query).lean();
    
    if (feedback.length === 0) {
      return {
        positive: 0,
        neutral: 0,
        negative: 0,
        averageRating: 0,
        totalFeedback: 0
      };
    }
    
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    let totalRating = 0;
    let ratingCount = 0;
    
    for (const item of feedback) {
      const analysis = await analyzeSentiment(item);
      
      if (analysis.sentiment === 'positive') positive++;
      else if (analysis.sentiment === 'neutral') neutral++;
      else negative++;
      
      if (analysis.score > 0) {
        totalRating += analysis.score;
        ratingCount++;
      }
    }
    
    return {
      positive,
      neutral,
      negative,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      totalFeedback: feedback.length
    };
    
  } catch (error) {
    console.error('Get sentiment analysis error:', error);
    return {
      positive: 0,
      neutral: 0,
      negative: 0,
      averageRating: 0,
      totalFeedback: 0
    };
  }
}

export async function getSentimentTrend(days: number = 30): Promise<Array<{date: string, score: number, positive: number, neutral: number, negative: number}>> {
  try {
    const Feedback = (await import('../models/Feedback')).Feedback;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const feedback = await Feedback.find({
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 }).lean();
    
    // Group by day
    const dailyData: Map<string, Array<any>> = new Map();
    
    feedback.forEach(item => {
      const dateKey = item.createdAt.toISOString().split('T')[0];
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey)!.push(item);
    });
    
    const trend = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split('T')[0];
      
      const dayFeedback = dailyData.get(dateKey) || [];
      
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      let totalScore = 0;
      let scoreCount = 0;
      
      for (const item of dayFeedback) {
        const analysis = await analyzeSentiment(item);
        
        if (analysis.sentiment === 'positive') positive++;
        else if (analysis.sentiment === 'neutral') neutral++;
        else negative++;
        
        if (analysis.score > 0) {
          totalScore += analysis.score;
          scoreCount++;
        }
      }
      
      trend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: scoreCount > 0 ? Number((totalScore / scoreCount).toFixed(1)) : 0,
        positive,
        neutral,
        negative
      });
    }
    
    return trend;
    
  } catch (error) {
    console.error('Get sentiment trend error:', error);
    return [];
  }
}
