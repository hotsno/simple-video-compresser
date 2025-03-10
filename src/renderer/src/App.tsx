import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import VideoCarousel from "./components/video-carousel";
import { Transition } from "@headlessui/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const App = (): JSX.Element => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [resolution, setResolution] = useState("1920x1080");
  const [targetSize, setTargetSize] = useState("500");
  const [crf, setCrf] = useState("23");
  const [format, setFormat] = useState("libx264");
  const [fps, setFps] = useState("Keep same");
  const [isCompressing, setIsCompressing] = useState(false);

  // Bug workaround: https://github.com/react-dropzone/file-selector/issues/10#issuecomment-714312214
  const onDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file != null) {
      setSelectedFile(window.api.getPathForFile(file));
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const filePath = window.api.getPathForFile(acceptedFiles[0]);
        // Bug workaround: https://github.com/react-dropzone/file-selector/issues/10#issuecomment-714312214
        if (filePath.length > 0) {
          setSelectedFile(window.api.getPathForFile(acceptedFiles[0]));
        }
      }
    },
  });

  const handleCompression = async (auto): Promise<void> => {
    if (!selectedFile) {
      toast("Error", {
        description: "Please select a video file first",
      });
      return;
    }

    setIsCompressing(true);
    try {
      let result;
      if (auto) {
        result = await window.api.compressVideoWithCrf({
          inputPath: selectedFile,
          outputPath: selectedFile.replace(/\.[^/.]+$/, `_compressed.mp4`),
          resolution,
          format,
          fps: parseInt(fps),
          crf,
        });
      } else {
        result = await window.api.compressVideoWithBitrate({
          inputPath: selectedFile,
          outputPath: selectedFile.replace(/\.[^/.]+$/, `_compressed.mp4`),
          resolution,
          format,
          fps: parseInt(fps),
          targetSize: parseInt(targetSize),
        });
      }

      if (result.success) {
        toast("Success", {
          description: "Video compression completed",
          action: (
            <Button
              // NOTE: Really, we should be opening the compressed file
              onClick={() => window.api.openInFileManager(selectedFile)}
              className="ml-auto"
            >
              Open
            </Button>
          ),
        });
      }
    } catch (error) {
      console.log(error);
      toast("Error", {
        description: "Failed to compress video",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  // Add this state at the top of your component with other useState declarations
  const [recentFiles, setRecentFiles] = useState<
    {
      path: string;
      folder: string;
      mtime: number;
      id: number;
      filename: string;
      thumbnail: string;
    }[]
  >([]);

  const fetchRecentFiles = async () => {
    const files = await window.api.getRecentFiles();
    setRecentFiles(files);
  };

  // Add this useEffect after the useState declarations
  useEffect(() => {
    fetchRecentFiles();
  }, []);

  // Modify the JSX section
  return (
    <div className="cursor-default">
      <Transition
        show={recentFiles.length > 0}
        enter="transition-all duration-300 ease-out"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-all duration-300 ease-in"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div>
          <div className="max-w-[80%] container mx-auto pt-10 md:max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight">
              Files From Recent Folders
            </h1>
          </div>
          <div className="max-w-[80%] md:max-w-2xl mx-auto pt-5">
            <VideoCarousel
              files={recentFiles}
              onSelect={(path) => {
                setSelectedFile(path);
              }}
              onClearRecentFolders={() => {
                window.api.clearRecentFolders();
                setRecentFiles([]);
              }}
            />
          </div>
        </div>
      </Transition>
      <div className="max-w-[80%] container mx-auto py-5 md:max-w-2xl">
        <Card>
          <CardContent className="space-y-6">
            <Label>File</Label>
            <div
              {...getRootProps()}
              onDrop={onDrop}
              className="border-1 border-gray-800 rounded-lg p-4 h-[200px] 
            flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors duration-300 ease-in-out"
            >
              <input {...getInputProps()} />
              <p className="text-center break-words overflow-hidden px-4 text-gray-400">
                {selectedFile ? (
                  <>
                    <span className="font-bold">Selected file: </span>
                    <br></br>
                    <span className="text-blue-400 underline">
                      {selectedFile}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-bold">Drag and drop</span>, or{" "}
                    <span className="font-bold">click to select</span>
                  </>
                )}
              </p>
            </div>

            <Tabs defaultValue="auto">
              <TabsList className="mx-auto">
                <TabsTrigger value="auto">Auto</TabsTrigger>
                <TabsTrigger value="target">File Size Target</TabsTrigger>
              </TabsList>
              <TabsContent value="auto">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3840x2160">
                          4K (3840x2160)
                        </SelectItem>
                        <SelectItem value="2560x1440">
                          2K (2560x1440)
                        </SelectItem>
                        <SelectItem value="1920x1080">
                          1080p (1920x1080)
                        </SelectItem>
                        <SelectItem value="1280x720">
                          720p (1280x720)
                        </SelectItem>
                        <SelectItem value="854x480">480p (854x480)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetSize">CRF</Label>
                    <Input
                      id="targetSize"
                      type="number"
                      value={crf}
                      onChange={(e) => setCrf(e.target.value)}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Codec + Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="libx264">
                          h264/mp4 (recommended)
                        </SelectItem>
                        <SelectItem value="libx265" disabled>
                          h265/mp4
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fps">FPS</Label>
                    <Select value={fps} onValueChange={(e) => setFps(e)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Keep same" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Keep same">Keep same</SelectItem>
                        <SelectItem value="20">20 FPS</SelectItem>
                        <SelectItem value="24">24 FPS</SelectItem>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="60">60 FPS</SelectItem>
                        <SelectItem value="120">120 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full cursor-pointer"
                    onClick={() => {
                      handleCompression(true);
                      fetchRecentFiles();
                    }}
                    disabled={isCompressing}
                  >
                    {isCompressing ? "Compressing..." : "Compress Video"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="target">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3840x2160">
                          4K (3840x2160)
                        </SelectItem>
                        <SelectItem value="2560x1440">
                          2K (2560x1440)
                        </SelectItem>
                        <SelectItem value="1920x1080">
                          1080p (1920x1080)
                        </SelectItem>
                        <SelectItem value="1280x720">
                          720p (1280x720)
                        </SelectItem>
                        <SelectItem value="854x480">480p (854x480)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetSize">Target Size (MB)</Label>
                    <Input
                      id="targetSize"
                      type="number"
                      value={targetSize}
                      onChange={(e) => setTargetSize(e.target.value)}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Codec + Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="libx264">
                          h264/mp4 (recommended)
                        </SelectItem>
                        <SelectItem value="libx265" disabled>
                          h265/mp4
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fps">FPS</Label>
                    <Select value={fps} onValueChange={(e) => setFps(e)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Keep same" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Keep same">Keep same</SelectItem>
                        <SelectItem value="20">20 FPS</SelectItem>
                        <SelectItem value="24">24 FPS</SelectItem>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="60">60 FPS</SelectItem>
                        <SelectItem value="120">120 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full cursor-pointer"
                    onClick={() => {
                      handleCompression(false);
                      fetchRecentFiles();
                    }}
                    disabled={isCompressing}
                  >
                    {isCompressing ? "Compressing..." : "Compress Video"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default App;
