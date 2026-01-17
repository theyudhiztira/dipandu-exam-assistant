import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child components to simplify testing logic
vi.mock('../../components/DraggableCard', () => ({
    DraggableCard: ({ children }: any) => <div data-testid="draggable-card">{children}</div>
}));

vi.mock('../../components/SelectionOverlay', () => ({
    SelectionOverlay: ({ onSelect }: any) => (
        <div data-testid="selection-overlay">
            <button onClick={() => onSelect({ x: 0, y: 0, width: 100, height: 100 })}>Select Region</button>
        </div>
    )
}));

describe('Content App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: Extension enabled, key present, domain whitelisted
        Object.defineProperty(window, 'location', {
            value: { hostname: 'example.com' },
            writable: true
        });
        (global.chrome.storage.sync.get as any).mockImplementation((keys, callback) => {
            callback({
                apiKey: 'test-key',
                isEnabled: true,
                whitelistedDomains: ['example.com']
            });
        });
    });

    it('renders nothing if domain not whitelisted', async () => {
        (global.chrome.storage.sync.get as any).mockImplementation((keys, callback) => {
            callback({
                apiKey: 'test-key',
                isEnabled: true,
                whitelistedDomains: ['other.com']
            });
        });

        const { container } = render(<App />);
        // Wait for effect
        await waitFor(() => { });
        expect(container).toBeEmptyDOMElement();
    });

    it('renders main UI when whitelisted', async () => {
        render(<App />);
        await waitFor(() => {
            expect(screen.getByText('AI Assistant')).toBeInTheDocument();
        });
    });

    it('starts capture and shows overlay', async () => {
        render(<App />);
        await waitFor(() => screen.getByText('Select Area to Capture'));

        fireEvent.click(screen.getByText('Select Area to Capture'));

        expect(screen.getByTestId('selection-overlay')).toBeInTheDocument();
    });
});
