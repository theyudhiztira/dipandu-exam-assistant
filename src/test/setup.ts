import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock chrome API
global.chrome = {
    runtime: {
        sendMessage: vi.fn(),
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
        onInstalled: {
            addListener: vi.fn(),
        },
        getURL: vi.fn((path) => path),
        openOptionsPage: vi.fn(),
    },
    storage: {
        sync: {
            get: vi.fn(),
            set: vi.fn(),
        },
        local: {
            get: vi.fn(),
            set: vi.fn(),
        },
        onChanged: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
    },
    tabs: {
        query: vi.fn(),
        captureVisibleTab: vi.fn(),
    },
} as any;
