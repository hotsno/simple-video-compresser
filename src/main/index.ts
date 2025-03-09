import { app, shell, BrowserWindow, ipcMain, screen } from "electron";
import path, { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import fs from "fs";
import Store from "electron-store";

function createWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.5),
    height: Math.floor(height * 0.65),
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "darwin" ? { titleBarStyle: "hiddenInset" } : {}),
    ...(process.platform === "linux" ? { icon } : {}),
    ...(process.platform !== "darwin" ? { titleBarOverlay: true } : {}),
    titleBarOverlay: {
      color: "#0a0a0a",
      symbolColor: "#eee",
    },
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Compress video IPC
  ipcMain.handle("compress-video", (event, options) =>
    compressVideo(event, options),
  );

  // Get recent files IPC
  ipcMain.handle("get-recent-files", getRecentFiles);

  // Get recent files IPC
  ipcMain.handle("clear-recent-folders", clearRecentFolders);

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function getFfmpegPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "ffmpeg");
  }
  return ffmpegPath;
}

function getFfprobePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "ffprobe");
  }
  return ffprobePath;
}

interface StoreSchema {
  recentDirs: string[];
}

async function compressVideo(_event, options): Promise<{ success: boolean }> {
  const { inputPath, outputPath, resolution, format, fps } = options;

  return new Promise((resolve, reject) => {
    ffmpeg.setFfmpegPath(getFfmpegPath());
    ffmpeg.setFfprobePath(getFfprobePath());

    const command = ffmpeg(inputPath);

    if (resolution) {
      const [width, height] = resolution.split("x");
      command.size(`${width}x${height}`);
    }

    if (fps && fps != "Keep same") {
      command.fps(parseInt(fps));
    }

    if (format) {
      command.videoCodec(format);
    }

    const store = new Store<StoreSchema>();
    let recentDirs = store.get("recentDirs", []);
    if (!recentDirs.includes(path.dirname(inputPath))) {
      recentDirs.push(path.dirname(inputPath));
    }
    store.set("recentDirs", recentDirs);

    // Add more compression options as needed
    command
      .on("end", () => resolve({ success: true }))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

function getRecentFiles(_event) {
  const store = new Store<StoreSchema>();
  const recentDirs = store.get("recentDirs", []);
  const allRecentFiles: { folder: string; path: string; mtime: number }[] = [];

  for (const dir of recentDirs) {
    try {
      const files = fs
        .readdirSync(dir)
        .filter((file) => /\.(mp4|mov|avi|mkv)$/i.test(file))
        .filter((file) => !file.includes("compressed"))
        .map((file) => {
          const filePath = path.join(dir, file);
          return {
            path: filePath,
            folder: path.basename(dir),
            mtime: fs.statSync(filePath).mtime.getTime(),
            filename: file,
          };
        })
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, 3);

      allRecentFiles.push(...files);
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
  }

  return allRecentFiles
    .sort((a, b) => b.mtime - a.mtime)
    .map((file, index) => ({ ...file, id: index + 1 }));
}

function clearRecentFolders(_event) {
  const store = new Store<StoreSchema>();
  store.set("recentDirs", []);
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
