import type { BrowserWindowConstructorOptions } from 'electron';

type CreateMainWindowOptionsInput = {
    preloadPath: string;
};

export const createMainWindowOptions = ({
    preloadPath
}: CreateMainWindowOptionsInput): BrowserWindowConstructorOptions => ({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 720,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#0E0F12',
    webPreferences: {
        preload: preloadPath
    }
});
