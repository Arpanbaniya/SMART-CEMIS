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
declare class DescriptionGeneratorService {
    private openai;
    constructor();
    private getPromptForAction;
    generateDescription(request: DescriptionGenerationRequest): Promise<DescriptionGenerationResponse>;
}
export declare const descriptionGeneratorService: DescriptionGeneratorService;
export {};
