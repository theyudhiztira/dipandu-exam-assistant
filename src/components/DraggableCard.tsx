import React, { useState, useEffect, useRef } from 'react';

interface DraggableProps {
    initialPosition?: { x: number; y: number };
    children: React.ReactNode;
}

export const DraggableCard: React.FC<DraggableProps> = ({
    initialPosition = { x: 20, y: 20 },
    children
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && dragStartRef.current) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;

                setPosition(prev => ({
                    x: prev.x + dx,
                    y: prev.y + dy
                }));

                dragStartRef.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            dragStartRef.current = null;
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;

        // Check if click is on or inside an interactive element
        if (target.closest('input, select, textarea, button, a, [role="button"]')) {
            return;
        }

        // Check if click is on or inside a text-selectable element
        if (target.closest('[data-selectable="true"]')) {
            return;
        }

        // Check computed style for user-select
        const computedStyle = window.getComputedStyle(target);
        if (computedStyle.userSelect === 'text' || computedStyle.userSelect === 'all') {
            return;
        }

        // Prevent focus stealing for non-interactive elements to keep drag smooth
        e.preventDefault();

        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    return (
        <div
            ref={cardRef}
            onMouseDown={handleMouseDown}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                // Styles for the card look
                backgroundColor: '#1a1a1a',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                minWidth: '300px',
                zIndex: 1000
            }}
        >
            {children}
        </div>
    );
};
