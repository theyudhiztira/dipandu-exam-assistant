import { HistoryItem, AnalyzePayload, TokenUsage, AnalyzeResponse } from '../types';

console.log('Background service worker started');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';

interface AnalyzeRequest {
    action: 'ANALYZE_IMAGE';
    payload: AnalyzePayload;
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
    usage?: TokenUsage;
    error?: {
        message: string;
    };
}

async function getSettings() {
    const items = await chrome.storage.sync.get(['apiKey', 'model', 'isEnabled']);
    return {
        apiKey: items.apiKey || '',
        model: items.model || DEFAULT_MODEL,
        isEnabled: items.isEnabled !== false // Default to true if undefined
    };
}

async function saveToHistory(result: string, usage?: TokenUsage, payload?: AnalyzePayload) {
    const item: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        result: result,
        usage: usage,
        imageData: payload?.imageData,
        questionType: payload?.questionType,
        additionalPrompt: payload?.additionalPrompt
    };

    const data = await chrome.storage.local.get(['history']);
    const history = (data.history || []) as HistoryItem[];

    // Keep last 50 items
    const newHistory = [...history, item].slice(-50);

    await chrome.storage.local.set({ history: newHistory });
}

async function analyzeImage(payload: AnalyzePayload): Promise<AnalyzeResponse> {
    const { apiKey, model, isEnabled } = await getSettings();
    const { imageData, additionalPrompt, questionType } = payload;

    if (!isEnabled) {
        throw new Error('Extension is disabled');
    }

    if (!apiKey) {
        throw new Error('API Key is missing. Please set it in the extension popup.');
    }

    try {
        let systemPrompt = 'You are an expert exam assistant. Answer directly and concisely based on the image provided. IMPORTANT: Always respond in the same language as the question shown in the image.';

        switch (questionType) {
            case 'multiple_choice':
                systemPrompt += ' For multiple choice questions, provide the correct option letter and its text. If there is an explanation, keep it brief.';
                break;
            case 'essay':
                systemPrompt += ' For essay questions, provide a comprehensive but concise answer covering key points.';
                break;
            case 'translation':
                systemPrompt += ' Provide a high-quality translation.';
                break;
            case 'other':
            default:
                // General assistant behavior
                break;
        }

        const userContent: any[] = [
            {
                type: 'image_url',
                image_url: {
                    url: imageData
                }
            }
        ];

        if (additionalPrompt) {
            userContent.unshift({
                type: 'text',
                text: additionalPrompt
            });
        }

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/your-repo/ai-exam-assistant',
                'X-Title': 'AI Exam Assistant',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userContent
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
        }

        const data: OpenRouterResponse = await response.json();

        if (data.choices && data.choices.length > 0) {
            const content = data.choices[0].message.content;
            const usage = data.usage;
            await saveToHistory(content, usage, payload);
            return { result: content, usage };
        } else {
            throw new Error('No content returned from AI');
        }

    } catch (error) {
        console.error('Error calling OpenRouter:', error);
        throw error;
    }
}




// Message Listener
chrome.runtime.onMessage.addListener((request: any, sender, sendResponse) => {
    if (request.action === 'CAPTURE_VISIBLE_TAB') {
        if (!sender.tab?.windowId) {
            sendResponse({ success: false, error: 'No active window found' });
            return true;
        }
        chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'jpeg', quality: 80 }, (dataUrl) => {
            if (chrome.runtime.lastError || !dataUrl) {
                sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Failed to capture tab' });
                return;
            }
            sendResponse({ success: true, data: dataUrl });
        });
        return true;
    }

    if (request.action === 'ANALYZE_IMAGE') {
        const payload = (request as AnalyzeRequest).payload;

        analyzeImage(payload)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // Indicates async response
    }

    if (request.action === 'OPEN_OPTIONS') {
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
        return true;
    }
});

// Installation listener
chrome.runtime.onInstalled.addListener(() => {
    console.log('AI Exam Assistant installed');
    // Initialize default settings if needed, or rely on defaults in getSettings
});
