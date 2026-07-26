import type { ConfigMode } from '../types/config';

export type ConfigModeChangeHandler = (mode: ConfigMode) => void;

export const createConfigModeSelectionHandler =
    (onModeChange: ConfigModeChangeHandler) => (mode: ConfigMode) => {
        onModeChange(mode);
    };
