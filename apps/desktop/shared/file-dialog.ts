export type FileDialogSelectSourceDirectoryData = {
    directoryPath: string;
};

export type FileDialogErrorCode = 'SELECTION_CANCELLED' | 'SELECTION_FAILED';

export type FileDialogOperationResult<T> =
    | {
          data: T;
          success: true;
      }
    | {
          error: {
              code: FileDialogErrorCode;
              message: string;
          };
          success: false;
      };
