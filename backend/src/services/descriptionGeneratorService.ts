import OpenAI from 'openai';

interface DescriptionGenerationRequest {
  title: string;
  currentDescription?: string;
  action: 'generate' | 'improve' | 'shorten' | 'expand' | 'professional' | 'engaging';
}

interface DescriptionGenerationResponse {
  generatedText: string;
  action: string;
  tokensUsed?: number;
}

class DescriptionGeneratorService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  private getPromptForAction(
    title: string,
    currentDescription: string | undefined,
    action: string
  ): { system: string; user: string } {
    const baseContext = `You are an expert event description writer for college events. Write compelling, clear, and engaging descriptions that encourage participation. Keep descriptions between 50-200 words unless specified otherwise.

Event Title: "${title}"`;

    const actions: Record<string, { system: string; user: string }> = {
      generate: {
        system:
          baseContext +
          `\n\nCreate an engaging event description from scratch. Focus on what makes this event unique and why students should attend.`,
        user: `Generate a compelling description for a college event titled "${title}". Make it exciting and informative.`,
      },
      improve: {
        system:
          baseContext +
          `\n\nImprove the given event description by making it more engaging, professional, and compelling. Keep the core information but enhance the language and appeal.`,
        user: `Improve this event description: "${currentDescription}"\n\nMake it more engaging and professional while keeping the main details.`,
      },
      shorten: {
        system:
          baseContext +
          `\n\nCondense the event description to 50-75 words while keeping the most important information. Make it punchy and clear.`,
        user: `Shorten this description to 50-75 words: "${currentDescription}"\n\nKeep it clear and impactful.`,
      },
      expand: {
        system:
          baseContext +
          `\n\nExpand the event description to 150-200 words. Add more details about what to expect, benefits, and why students should attend.`,
        user: `Expand this description to 150-200 words: "${currentDescription}"\n\nAdd more details and benefits.`,
      },
      professional: {
        system:
          baseContext +
          `\n\nRewrite the event description in a professional, formal tone suitable for official announcements and formal communications.`,
        user: `Rewrite this in professional tone: "${currentDescription}"\n\nMake it formal and official-sounding.`,
      },
      engaging: {
        system:
          baseContext +
          `\n\nRewrite the event description to be more casual, fun, and engaging for college students. Use friendly language and enthusiasm.`,
        user: `Rewrite this to be more engaging and fun: "${currentDescription}"\n\nMake it casual and exciting for students.`,
      },
    };

    return actions[action] || actions.generate;
  }

  async generateDescription(
    request: DescriptionGenerationRequest
  ): Promise<DescriptionGenerationResponse> {
    if (!this.openai) {
      throw new Error(
        'OpenAI service not initialized. Please configure OPENAI_API_KEY.'
      );
    }

    const { system, user } = this.getPromptForAction(
      request.title,
      request.currentDescription,
      request.action
    );

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: system,
          },
          {
            role: 'user',
            content: user,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const generatedText =
        response.choices[0]?.message?.content?.trim() || '';

      if (!generatedText) {
        throw new Error('No description generated');
      }

      return {
        generatedText,
        action: request.action,
        tokensUsed: response.usage?.total_tokens,
      };
    } catch (error: any) {
      console.error('Description generation error:', error);

      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw new Error(
          'Too many requests. Please try again in a moment.'
        );
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please try again later.');
      } else if (error.message?.includes('401')) {
        throw new Error('OpenAI API key is invalid.');
      }

      throw new Error(
        'Failed to generate description. Please try again or write manually.'
      );
    }
  }
}

export const descriptionGeneratorService = new DescriptionGeneratorService();
