import { app, shell, BrowserWindow, ipcMain, screen } from "electron";
import path, { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import fs from "fs";
import Store from "electron-store";

ffmpeg.setFfmpegPath(getFfmpegPath());
ffmpeg.setFfprobePath(getFfprobePath());

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
      webSecurity: is.dev ? false : true,
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

  // Compress video with CRF IPC
  ipcMain.handle("compress-video-with-crf", (event, options) =>
    compressVideoWithCrf(event, options),
  );

  // Compress video with bitrate IPC
  ipcMain.handle("compress-video-with-bitrate", (event, options) =>
    compressVideoWithBitrate(event, options),
  );

  // Get recent files IPC
  ipcMain.handle("get-recent-files", getRecentFiles);

  // Get recent files IPC
  ipcMain.handle("clear-recent-folders", clearRecentFolders);

  // Open file in file explorer IPC
  ipcMain.handle("open-in-file-manager", openInFileManager);

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
  return ffprobe.path;
}

interface StoreSchema {
  recentDirs: string[];
}

async function compressVideoWithCrf(
  _event,
  options,
): Promise<{ success: boolean }> {
  const { inputPath, outputPath, resolution, format, fps, crf } = options;

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);

    if (resolution) {
      const [width, _height] = resolution.split("x");
      command.size(`${width}x?`);
    }

    if (fps && fps != "Keep same") {
      command.fps(parseInt(fps));
    }

    if (format) {
      command.videoCodec(format);
    }

    if (crf) {
      command.addOption("-crf", crf);
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
async function compressVideoWithBitrate(
  _event,
  options,
): Promise<{ success: boolean }> {
  const { inputPath, outputPath, resolution, format, fps, targetSize } =
    options;

  const duration: number = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      resolve(metadata.format.duration);
    });
  });
  const [width, _height] = resolution.split("x");

  const targetBitrate = Math.floor((targetSize * 8192) / duration);

  return new Promise((resolve, reject) => {
    const firstPass = ffmpeg(inputPath)
      .size(`${width}x?`)
      .addOption("-y")
      .addOption("-c:v", format)
      .addOption("-b:v", `${targetBitrate}k`)
      .addOption("-pass", "1");

    if (fps && fps != "Keep same") {
      firstPass.fps(parseInt(fps));
    }

    const store = new Store<StoreSchema>();
    let recentDirs = store.get("recentDirs", []);
    if (!recentDirs.includes(path.dirname(inputPath))) {
      recentDirs.push(path.dirname(inputPath));
    }
    store.set("recentDirs", recentDirs);

    firstPass
      .on("end", () => {
        resolve({ success: true });
      })
      .on("error", (err) => {
        reject(err);
      })
      .save(outputPath);
  });
}

interface RecentFile {
  path: string;
  folder: string;
  mtime: number;
  filename: string;
  thumbnail?: string;
  id?: number;
}

async function getRecentFiles(_event) {
  const store = new Store<StoreSchema>();
  const recentDirs = store.get("recentDirs", []);
  const allRecentFiles: RecentFile[] = [];

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

  const sortedFiles = allRecentFiles.sort((a, b) => b.mtime - a.mtime);
  const filesWithThumbnails = await Promise.all(
    sortedFiles.map(async (file, index) => ({
      ...file,
      thumbnail: await getThumbnail(file.path),
      id: index + 1,
    })),
  );

  return filesWithThumbnails;
}

function clearRecentFolders(_event) {
  const store = new Store<StoreSchema>();
  store.set("recentDirs", []);
}

async function getThumbnail(videoPath) {
  const userDataPath = app.getPath("userData");
  const thumbnailPath =
    path.join(userDataPath, path.basename(videoPath)).replace(/\.[^/.]+$/, "") +
    ".jpg";
  if (fs.existsSync(thumbnailPath)) {
    return thumbnailPath;
  }

  const folder = path.dirname(thumbnailPath);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ["00:00"],
        filename: path.basename(thumbnailPath),
        folder: folder,
        size: "1280x?",
      })
      .on("end", () => {
        resolve(thumbnailPath);
      })
      .on("error", (err) => {
        console.error("Error generating thumbnail:", err);
        reject(err);
      });
    return thumbnailPath;
  });
}

function openInFileManager(_event, path: string) {
  shell.showItemInFolder(path);
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
