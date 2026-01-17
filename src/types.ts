export interface Settings {
    apiKey: string;
    model: string;
    isEnabled: boolean;
    whitelistedDomains: string[];
}



export const DEFAULT_SETTINGS: Settings = {
    apiKey: '',
    model: 'google/gemini-2.5-flash',
    isEnabled: true,
    whitelistedDomains: []
};

export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    result: string;
    usage?: TokenUsage;
    imageData?: string;
    questionType?: QuestionType;
    additionalPrompt?: string;
}

export interface AnalyzeResponse {
    result: string;
    usage?: TokenUsage;
}


export type QuestionType = 'multiple_choice' | 'essay' | 'translation' | 'other';

export interface AnalyzePayload {
    imageData: string;
    additionalPrompt?: string;
    questionType: QuestionType;
}

export const QUETION_TYPE_LABELS: Record<QuestionType, string> = {
    multiple_choice: 'Multiple Choice',
    essay: 'Essay',
    translation: 'Translation',
    other: 'Other'
};


