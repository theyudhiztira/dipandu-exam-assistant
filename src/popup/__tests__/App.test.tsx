import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Popup App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.chrome.storage.sync.get as any).mockImplementation((keys, callback) => {
            callback({ apiKey: 'test-key', model: 'test-model', isEnabled: true, whitelistedDomains: [] });
        });
        (global.chrome.storage.local.get as any).mockImplementation((keys, callback) => {
            callback({ history: [] });
        });
        (global.chrome.tabs.query as any).mockImplementation((query, callback) => {
            callback([{ url: 'https://example.com' }]);
        });
    });

    it('renders and loads settings', async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('test-key')).toBeInTheDocument();
        });
    });

    it('updates settings on change', async () => {
        render(<App />);

        const input = await screen.findByDisplayValue('test-key');
        fireEvent.change(input, { target: { value: 'new-key' } });

        expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
            expect.objectContaining({ apiKey: 'new-key' }),
            expect.any(Function)
        );
    });

    it('switches tabs', async () => {
        render(<App />);

        const historyButton = screen.getByText('History');
        fireEvent.click(historyButton);

        expect(screen.getByText('Recent Scans')).toBeInTheDocument();

        const settingsButton = screen.getByText('Settings');
        fireEvent.click(settingsButton);

        expect(screen.getByText('Enable Extension Globally')).toBeInTheDocument();
    });
});
