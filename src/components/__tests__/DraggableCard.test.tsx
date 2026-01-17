import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableCard } from '../DraggableCard';
import { describe, it, expect } from 'vitest';

describe('DraggableCard', () => {
    it('renders children correctly', () => {
        render(
            <DraggableCard>
                <div>Test Content</div>
            </DraggableCard>
        );
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('has initial styles', () => {
        const { container } = render(
            <DraggableCard initialPosition={{ x: 100, y: 100 }}>
                <div>Content</div>
            </DraggableCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card).toHaveStyle({
            position: 'fixed',
            left: '100px',
            top: '100px',
        });
    });

    // Note: Testing actual drag and drop with jsdom is tricky because of layout calculations, 
    // but we can check if event handlers allow interactions with inputs
    it('does not prevent default on input click', () => {
        const { getByRole } = render(
            <DraggableCard>
                <input type="text" />
            </DraggableCard>
        );
        const input = getByRole('textbox');
        const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        // We can't easily spy on preventDefault here without mocking the event extensively, 
        // but basic rendering ensures the logic doesn't crash.
        fireEvent(input, event);
        expect(event.defaultPrevented).toBe(false);
    });
});
