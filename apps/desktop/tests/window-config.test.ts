import { describe, expect, it } from 'vitest';

import { createMainWindowOptions } from '../client/window-options';

describe('createMainWindowOptions', () => {
    it('creates a frameless editor window with the configured preload script', () => {
        const options = createMainWindowOptions({
            preloadPath: '/tmp/preload.js'
        });

        expect(options.width).toBe(1280);
        expect(options.height).toBe(800);
        expect(options.minWidth).toBe(1280);
        expect(options.minHeight).toBe(720);
        expect(options.frame).toBe(false);
        expect(options.titleBarStyle).toBe('hidden');
        expect(options.autoHideMenuBar).toBe(true);
        expect(options.backgroundColor).toBe('#0E0F12');
        expect(options.webPreferences?.preload).toBe('/tmp/preload.js');
    });
});
