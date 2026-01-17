import { render, fireEvent } from '@testing-library/react';
import { SelectionOverlay } from '../SelectionOverlay';
import { describe, it, expect, vi } from 'vitest';

describe('SelectionOverlay', () => {
    it('calls onSelect when a region is selected', () => {
        const handleSelect = vi.fn();
        const handleCancel = vi.fn();
        const { container } = render(
            <SelectionOverlay onSelect={handleSelect} onCancel={handleCancel} />
        );

        const overlay = container.firstChild as HTMLElement;

        // Simulate drag
        fireEvent.mouseDown(overlay, { clientX: 10, clientY: 10 });
        fireEvent.mouseMove(overlay, { clientX: 110, clientY: 110 });
        fireEvent.mouseUp(overlay);

        expect(handleSelect).toHaveBeenCalledWith({
            x: 10,
            y: 10,
            width: 100,
            height: 100
        });
    });

    it('calls onCancel when Escape is pressed', () => {
        const handleSelect = vi.fn();
        const handleCancel = vi.fn();
        const { getByText } = render(
            <SelectionOverlay onSelect={handleSelect} onCancel={handleCancel} />
        );

        // Focus the overlay (it has tabIndex=0)
        const overlay = getByText('Select Area to Capture').parentElement?.parentElement as HTMLElement;
        overlay.focus();

        fireEvent.keyDown(overlay, { key: 'Escape' });

        expect(handleCancel).toHaveBeenCalled();
    });
});
