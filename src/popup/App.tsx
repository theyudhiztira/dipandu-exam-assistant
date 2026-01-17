import React, { useEffect, useState } from 'react';
import { Settings, HistoryItem, DEFAULT_SETTINGS, QUETION_TYPE_LABELS } from '../types';

const App: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
    const [currentDomain, setCurrentDomain] = useState<string>('');

    useEffect(() => {
        // Load settings from sync
        chrome.storage.sync.get(['apiKey', 'model', 'isEnabled', 'whitelistedDomains'], (items) => {
            setSettings(prev => ({ ...prev, ...items }));
        });

        // Load history from local
        chrome.storage.local.get(['history'], (items) => {
            if (items.history) {
                setHistory(items.history);
            }
        });

        // Get current tab domain
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url) {
                try {
                    const url = new URL(tabs[0].url);
                    setCurrentDomain(url.hostname);
                } catch (e) {
                    console.error('Invalid URL', e);
                }
            }
        });

        // Listen for history changes from background
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local' && changes.history) {
                setHistory(changes.history.newValue);
            }
        };
        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    const saveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        chrome.storage.sync.set(newSettings, () => {
            console.log('Settings saved');
        });
    };

    const handleInputChange = (field: keyof Settings, value: string | boolean | string[]) => {
        const newSettings = { ...settings, [field]: value };
        saveSettings(newSettings);
    };

    const clearHistory = () => {
        chrome.storage.local.set({ history: [] });
        setHistory([]);
        setSelectedHistoryItem(null);
    };

    const toggleWhitelist = () => {
        if (!currentDomain) return;

        const domains = settings.whitelistedDomains || [];
        let newDomains;

        if (domains.includes(currentDomain)) {
            newDomains = domains.filter(d => d !== currentDomain);
        } else {
            newDomains = [...domains, currentDomain];
        }

        handleInputChange('whitelistedDomains', newDomains);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const isCurrentDomainWhitelisted = (settings.whitelistedDomains || []).includes(currentDomain);

    return (
        <div className="container" style={{ padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {selectedHistoryItem ? (
                // Detail View
                <div className="card">
                    <button
                        onClick={() => setSelectedHistoryItem(null)}
                        style={{ marginBottom: '12px', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                    >
                        ← Back to History
                    </button>

                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{QUETION_TYPE_LABELS[selectedHistoryItem.questionType || 'other'] || 'Scan Details'}</h3>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDate(selectedHistoryItem.timestamp)}</span>
                    </div>

                    {selectedHistoryItem.imageData && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>CAPTURED IMAGE</label>
                            <img src={selectedHistoryItem.imageData} alt="Captured" style={{ width: '100%', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                        </div>
                    )}

                    {selectedHistoryItem.additionalPrompt && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>ADDITIONAL PROMPT</label>
                            <div style={{ backgroundColor: '#f3f4f6', padding: '8px', borderRadius: '6px', fontSize: '0.9rem' }}>
                                {selectedHistoryItem.additionalPrompt}
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>AI RESPONSE</label>
                        <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', whiteSpace: 'pre-wrap', border: '1px solid #e2e8f0' }}>
                            {selectedHistoryItem.result}
                        </div>
                    </div>

                    {selectedHistoryItem.usage && (
                        <div style={{ display: 'flex', gap: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>PROMPT</div>
                                <div style={{ fontWeight: 600 }}>{selectedHistoryItem.usage.prompt_tokens}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>COMPLETION</div>
                                <div style={{ fontWeight: 600 }}>{selectedHistoryItem.usage.completion_tokens}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>TOTAL</div>
                                <div style={{ fontWeight: 600 }}>{selectedHistoryItem.usage.total_tokens}</div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Main Tabs View
                <>
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px' }}>
                        <button
                            onClick={() => setActiveTab('settings')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                border: 'none',
                                borderBottom: activeTab === 'settings' ? '2px solid #2563eb' : '2px solid transparent',
                                backgroundColor: 'transparent',
                                color: activeTab === 'settings' ? '#2563eb' : '#4b5563',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                border: 'none',
                                borderBottom: activeTab === 'history' ? '2px solid #2563eb' : '2px solid transparent',
                                backgroundColor: 'transparent',
                                color: activeTab === 'history' ? '#2563eb' : '#4b5563',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            History
                        </button>
                    </div>

                    {activeTab === 'settings' && (
                        <div className="card">
                            <div className="toggle-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ fontWeight: 600 }}>Enable Extension Globally</span>
                                <input
                                    type="checkbox"
                                    checked={settings.isEnabled}
                                    onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Whitelist Domain Section */}
                            <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Current Site</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{currentDomain || 'Unknown'}</div>
                                    </div>
                                    <button
                                        onClick={toggleWhitelist}
                                        style={{
                                            backgroundColor: isCurrentDomainWhitelisted ? '#dc2626' : '#2563eb',
                                            padding: '6px 12px',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        {isCurrentDomainWhitelisted ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {isCurrentDomainWhitelisted
                                        ? 'The assistant is active on this site.'
                                        : 'The assistant is hidden on this site.'}
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>OpenRouter API Key</label>
                                <input
                                    type="password"
                                    value={settings.apiKey}
                                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                                    placeholder="sk-or-..."
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>Model</label>
                                <input
                                    list="models"
                                    value={settings.model}
                                    onChange={(e) => handleInputChange('model', e.target.value)}
                                    placeholder="Select or type model..."
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                                />
                                <datalist id="models">
                                    <option value="google/gemini-2.5-flash" />
                                    <option value="anthropic/claude-3-opus" />
                                    <option value="openai/gpt-4-turbo" />
                                </datalist>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="card" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h2 style={{ fontSize: '1rem', margin: 0 }}>Recent Scans</h2>
                                <button
                                    onClick={clearHistory}
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Clear History
                                </button>
                            </div>

                            {history.length === 0 ? (
                                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>No history yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {history.slice().reverse().map((item) => (
                                        <div
                                            key={item.id}
                                            className="history-item"
                                            onClick={() => setSelectedHistoryItem(item)}
                                            style={{
                                                padding: '12px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                backgroundColor: 'white',
                                                transition: 'background-color 0.2s',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                                                    {QUETION_TYPE_LABELS[item.questionType || 'other'] || 'Other'}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                    {formatDate(item.timestamp)}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.result}
                                            </div>
                                            {item.usage && (
                                                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>
                                                    {item.usage.total_tokens} tokens
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default App;
