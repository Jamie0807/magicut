import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('magicutAPI', {
    ping: async () => ({ success: true })
});
