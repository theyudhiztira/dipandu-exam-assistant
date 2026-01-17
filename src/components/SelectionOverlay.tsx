import React, { useState, useRef, useCallback } from 'react';

interface SelectionOverlayProps {
    onSelect: (region: { x: number; y: number; width: number; height: number }) => void;
    onCancel: () => void;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ onSelect, onCancel }) => {
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsSelecting(true);
        setStartPoint({ x: e.clientX, y: e.clientY });
        setEndPoint({ x: e.clientX, y: e.clientY });
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isSelecting) return;
        setEndPoint({ x: e.clientX, y: e.clientY });
    }, [isSelecting]);

    const handleMouseUp = useCallback(() => {
        if (!isSelecting || !startPoint || !endPoint) return;

        const x = Math.min(startPoint.x, endPoint.x);
        const y = Math.min(startPoint.y, endPoint.y);
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);

        if (width > 10 && height > 10) {
            onSelect({ x, y, width, height });
        }

        setIsSelecting(false);
        setStartPoint(null);
        setEndPoint(null);
    }, [isSelecting, startPoint, endPoint, onSelect]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    }, [onCancel]);

    const getSelectionStyle = (): React.CSSProperties => {
        if (!startPoint || !endPoint) return { display: 'none' };

        const x = Math.min(startPoint.x, endPoint.x);
        const y = Math.min(startPoint.y, endPoint.y);
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);

        return {
            position: 'fixed',
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            border: '2px dashed #2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            pointerEvents: 'none',
            zIndex: 10001
        };
    };

    return (
        <div
            ref={overlayRef}
            tabIndex={0}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onKeyDown={handleKeyDown}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                cursor: 'crosshair',
                zIndex: 10000
            }}
        >
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                zIndex: 10002,
                textAlign: 'center'
            }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Select Area to Capture</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Click and drag to select • Press ESC to cancel</div>
            </div>

            <div style={getSelectionStyle()} />
        </div>
    );
};
