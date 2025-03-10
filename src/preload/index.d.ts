import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      compressVideoWithCrf(options: {
        inputPath: string;
        outputPath: string;
        resolution: string;
        format: string;
        fps: number;
        crf: string;
      }): Promise<{ success: boolean }>;
      compressVideoWithBitrate(options: {
        inputPath: string;
        outputPath: string;
        resolution: string;
        format: string;
        fps: number;
        targetSize: number;
      }): Promise<{ success: boolean }>;
      getPathForFile(file: File): string;
      getRecentFiles(): {
        path: string;
        folder: string;
        mtime: number;
        id: number;
        filename: string;
        thumbnail: string;
      }[];
      clearRecentFolders(): void;
      openInFileManager(path: string): void;
    };
  }
}
