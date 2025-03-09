import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      compressVideo(options: {
        inputPath: string;
        outputPath: string;
        resolution: string;
        targetSize: number;
        format: string;
        fps: number;
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
    };
  }
}
