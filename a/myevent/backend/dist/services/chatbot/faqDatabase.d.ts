/**
 * FAQ Database Service
 * Contains all prewritten responses for common questions
 */
export interface FAQItem {
    keywords: string[];
    response: string;
    category: string;
}
export declare class FAQDatabase {
    private faqs;
    findResponse(userMessage: string): {
        response: string;
        category: string;
    } | null;
    getAllKeywords(): string[];
    getByCategory(category: string): FAQItem[];
}
export declare const faqDatabase: FAQDatabase;
