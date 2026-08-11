import type { OpenDialogReturnValue } from 'electron';

import type {
    FileDialogOperationResult,
    FileDialogSelectSourceDirectoryData
} from '../shared/file-dialog';
import { fileDialogIpcChannels } from '../shared/file-dialog-channels';

type FileDialogIpcEvent = unknown;

type FileDialogIpcMain = {
    handle: (
        channel: string,
        handler: (
            event: FileDialogIpcEvent,
            input?: unknown
        ) => Promise<unknown> | unknown
    ) => void;
};

type FileDialog = {
    showOpenDialog: (options: {
        properties: 'openDirectory'[];
        title: string;
    }) => Promise<OpenDialogReturnValue>;
};

const success = <T>(data: T): FileDialogOperationResult<T> => ({
    data,
    success: true
});

const failure = <T>({
    code,
    message
}: {
    code: 'SELECTION_CANCELLED' | 'SELECTION_FAILED';
    message: string;
}): FileDialogOperationResult<T> => ({
    error: {
        code,
        message
    },
    success: false
});

const serializeError = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

export const registerFileDialogIpc = ({
    dialog,
    ipcMain
}: {
    dialog: FileDialog;
    ipcMain: FileDialogIpcMain;
}) => {
    ipcMain.handle(fileDialogIpcChannels.selectSourceDirectory, async () => {
        try {
            const selected = await dialog.showOpenDialog({
                properties: ['openDirectory'],
                title: '选择本地视频素材目录'
            });

            if (selected.canceled || !selected.filePaths[0]) {
                return failure<FileDialogSelectSourceDirectoryData>({
                    code: 'SELECTION_CANCELLED',
                    message: '已取消选择本地素材目录'
                });
            }

            return success<FileDialogSelectSourceDirectoryData>({
                directoryPath: selected.filePaths[0]
            });
        } catch (error) {
            return failure<FileDialogSelectSourceDirectoryData>({
                code: 'SELECTION_FAILED',
                message: serializeError(error)
            });
        }
    });
};
