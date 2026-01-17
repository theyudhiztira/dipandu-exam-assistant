import React, { useEffect, useState, useCallback } from 'react';
import { DraggableCard } from './../components/DraggableCard';
import { SelectionOverlay } from './../components/SelectionOverlay';
import { QuestionType, QUETION_TYPE_LABELS, AnalyzePayload, TokenUsage } from '../types';

const App: React.FC = () => {
    const [isEnabled, setIsEnabled] = useState(true);
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [hasKey, setHasKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);

    // New State for confirmation step
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
    const [additionalPrompt, setAdditionalPrompt] = useState('');

    useEffect(() => {
        const checkSettings = (items: any) => {
            setIsEnabled(items.isEnabled !== false);
            setHasKey(!!items.apiKey);

            const domains = items.whitelistedDomains || [];
            const hostname = window.location.hostname;
            const isAllowed = domains.some((d: string) => hostname === d || hostname.endsWith('.' + d));
            setIsWhitelisted(isAllowed);
        };

        chrome.storage.sync.get(['isEnabled', 'apiKey', 'whitelistedDomains'], checkSettings);

        const handleStorageChange = (_changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'sync') {
                chrome.storage.sync.get(['isEnabled', 'apiKey', 'whitelistedDomains'], checkSettings);
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    const startCapture = () => {
        if (!hasKey) return;
        setError(null);
        setResult(null);
        setTokenUsage(undefined);
        setCapturedImage(null);
        setIsSelecting(true);
    };

    const handleRegionSelect = useCallback(async (region: { x: number; y: number; width: number; height: number }) => {
        setIsSelecting(false);
        setIsLoading(true);

        try {
            const response = await chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' });

            if (!response.success) {
                setError(response.error || 'Failed to capture screen');
                setIsLoading(false);
                return;
            }

            // Crop the image to the selected region
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    setError('Failed to create canvas context');
                    setIsLoading(false);
                    return;
                }

                // Account for device pixel ratio
                const dpr = window.devicePixelRatio || 1;
                canvas.width = region.width * dpr;
                canvas.height = region.height * dpr;

                ctx.drawImage(
                    img,
                    region.x * dpr,
                    region.y * dpr,
                    region.width * dpr,
                    region.height * dpr,
                    0,
                    0,
                    region.width * dpr,
                    region.height * dpr
                );

                const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(croppedDataUrl);
                setIsLoading(false);
            };

            img.onerror = () => {
                setError('Failed to load captured image');
                setIsLoading(false);
            };

            img.src = response.data;
        } catch (err: any) {
            setError(err.message || 'Communication error');
            setIsLoading(false);
        }
    }, []);

    const handleCancelSelection = useCallback(() => {
        setIsSelecting(false);
    }, []);

    const handleAnalyze = async () => {
        if (!capturedImage) return;

        setIsLoading(true);
        setError(null);
        setTokenUsage(undefined);

        try {
            const payload: AnalyzePayload = {
                imageData: capturedImage,
                questionType,
                additionalPrompt: additionalPrompt.trim()
            };

            const response = await chrome.runtime.sendMessage({
                action: 'ANALYZE_IMAGE',
                payload
            });

            if (response.success) {
                setResult(response.data.result);
                setTokenUsage(response.data.usage);
            } else {
                setError(response.error || 'Unknown error');
            }
        } catch (err: any) {
            setError(err.message || 'Communication error');
        } finally {
            setIsLoading(false);
        }
    };

    const resetState = () => {
        setCapturedImage(null);
        setResult(null);
        setError(null);
        setTokenUsage(undefined);
        setAdditionalPrompt('');
    };

    const startNewAnalysis = () => {
        resetState();
        setIsSelecting(true);
    };

    const openSettings = () => {
        chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS' });
    };

    const [copied, setCopied] = useState(false);

    const copyResult = async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (isSelecting) {
        return <SelectionOverlay onSelect={handleRegionSelect} onCancel={handleCancelSelection} />;
    }

    if (!isEnabled || !isWhitelisted) {
        return null;
    }

    if (isMinimized) {
        return (
            <DraggableCard>
                <div
                    onClick={() => setIsMinimized(false)}
                    style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: '#2563eb',
                        borderRadius: '50%',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    title="Expand AI Assistant"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                </div>
            </DraggableCard>
        );
    }

    return (
        <DraggableCard>
            <div className="app-container" style={{ width: '320px' }}>
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>AI Assistant</h1>
                        <div className={`status-dot ${isLoading ? 'animate-pulse' : ''}`} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLoading ? '#fbbf24' : (hasKey ? '#22c55e' : '#ef4444') }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={openSettings}
                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#9ca3af' }}
                            title="Settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                        <button
                            onClick={() => setIsMinimized(true)}
                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#9ca3af' }}
                            title="Minimize"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="content">
                    {!hasKey && (
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '6px', color: '#fca5a5', fontSize: '0.875rem' }}>
                            <strong>Setup Required:</strong> Please open the extension popup (icon in browser toolbar) and add your OpenRouter API Key.
                        </div>
                    )}

                    {error && (
                        <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '8px' }}>
                            Error: {error}
                        </div>
                    )}

                    {/* Result View */}
                    {result && (
                        <>
                            <div
                                data-selectable="true"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    fontSize: '0.9rem',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    marginBottom: '12px',
                                    userSelect: 'text',
                                    cursor: 'text'
                                }}>
                                {result}
                            </div>

                            {tokenUsage && (
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '12px', display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                                    <span>Prompt: {tokenUsage.prompt_tokens}</span>
                                    <span>Comp: {tokenUsage.completion_tokens}</span>
                                    <span>Total: {tokenUsage.total_tokens}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={copyResult}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        backgroundColor: copied ? '#22c55e' : '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {copied ? '✓ Copied!' : 'Copy Result'}
                                </button>
                                <button
                                    onClick={startNewAnalysis}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        backgroundColor: '#374151',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    New Analysis
                                </button>
                            </div>
                        </>
                    )}

                    {/* Preview & Configure View */}
                    {!result && capturedImage && (
                        <div className="preview-container">
                            <div style={{ position: 'relative', marginBottom: '12px' }}>
                                <img src={capturedImage} alt="Captured" style={{ width: '100%', borderRadius: '4px', border: '1px solid #374151' }} />
                                <button
                                    onClick={() => setCapturedImage(null)}
                                    style={{ position: 'absolute', top: '4px', right: '4px', padding: '4px 8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Question Type</label>
                                <select
                                    value={questionType}
                                    onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                                    style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#374151', border: '1px solid #4b5563', color: 'white' }}
                                >
                                    {Object.entries(QUETION_TYPE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Additional Prompt (Optional)</label>
                                <textarea
                                    value={additionalPrompt}
                                    onChange={(e) => setAdditionalPrompt(e.target.value)}
                                    placeholder="e.g. Focus on the second paragraph..."
                                    style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#374151', border: '1px solid #4b5563', color: 'white', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setCapturedImage(null)}
                                    style={{ flex: 1, padding: '8px', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isLoading}
                                    style={{ flex: 2, padding: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
                                >
                                    {isLoading ? 'Analyzing...' : 'Analyze'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Initial Capture View */}
                    {!result && !capturedImage && (
                        <>
                            {!hasKey && (
                                <p className="description" style={{ marginBottom: '10px' }}>
                                    Capture text or questions from your screen and let AI analyze them for you.
                                </p>
                            )}

                            {hasKey && (
                                <p className="description" style={{ marginBottom: '10px' }}>
                                    Click the button below, then drag to select the area you want to capture.
                                </p>
                            )}

                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={startCapture}
                                disabled={isLoading || !hasKey}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontWeight: '500',
                                    opacity: (isLoading || !hasKey) ? 0.7 : 1,
                                    cursor: (isLoading || !hasKey) ? 'not-allowed' : 'pointer',
                                    backgroundColor: !hasKey ? '#4b5563' : '#2563eb',
                                    color: 'white'
                                }}
                            >
                                {isLoading ? 'Processing...' : (hasKey ? 'Select Area to Capture' : 'API Key Missing')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </DraggableCard>
    );
};

export default App;
