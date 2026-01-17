import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// Import styles as string using Vite's ?inline resource query
import styles from './index.css?inline';

function mount() {
    // Generate random ID for the host container
    const hostId = `crs-${Math.random().toString(36).substr(2, 9)}`;

    const container = document.createElement('div');
    container.id = hostId;
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '0';
    container.style.height = '0';
    container.style.zIndex = '2147483647'; // Max z-index
    container.style.pointerEvents = 'none'; // Let clicks pass through the container itself

    // Create CLOSED Shadow DOM
    const shadowRoot = container.attachShadow({ mode: 'closed' });

    // Inject Styles
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    shadowRoot.appendChild(styleElement);

    // Mount Point for React
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    rootElement.style.pointerEvents = 'auto'; // Re-enable pointer events for the app
    shadowRoot.appendChild(rootElement);

    document.body.appendChild(container);

    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

mount();
