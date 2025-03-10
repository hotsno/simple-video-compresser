import { contextBridge, ipcRenderer, webUtils } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
const api = {
  compressVideo: (options): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("compress-video", options),
  getPathForFile: (file): string => webUtils.getPathForFile(file),
  getRecentFiles: () => ipcRenderer.invoke("get-recent-files"),
  clearRecentFolders: () => ipcRenderer.invoke("clear-recent-folders"),
  openInFileManager: (path: string) =>
    ipcRenderer.invoke("open-in-file-manager", path),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
