import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const App = (): JSX.Element => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resolution, setResolution] = useState("1920x1080");
  const [targetSize, setTargetSize] = useState("500");
  const [format, setFormat] = useState("mp4");
  const [fps, setFps] = useState("30");
  const [isCompressing, setIsCompressing] = useState(false);

  // Bug workaround: https://github.com/react-dropzone/file-selector/issues/10#issuecomment-714312214
  const onDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file != null) {
      setSelectedFile(file);
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
          setSelectedFile(acceptedFiles[0]);
        }
      }
    },
  });

  const handleCompression = async (): Promise<void> => {
    if (!selectedFile) {
      toast("Error", {
        description: "Please select a video file first",
      });
      return;
    }

    setIsCompressing(true);
    try {
      const inputPath = window.api.getPathForFile(selectedFile);
      const result = await window.api.compressVideo({
        inputPath: inputPath,
        outputPath: inputPath.replace(/\.[^/.]+$/, `_compressed.${format}`),
        resolution,
        targetSize: parseInt(targetSize),
        format,
        fps: parseInt(fps),
      });

      if (result.success) {
        toast("Success", {
          description: "Video compression completed",
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

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Video Compressor</CardTitle>
          <CardDescription>
            Compress your videos with custom settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            onDrop={onDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-[200px] 
            flex items-center justify-center cursor-pointer hover:border-primary"
          >
            <input {...getInputProps()} />
            <p className="text-center">
              {selectedFile
                ? `Selected: ${selectedFile.name}`
                : "Drag and drop a video file here, or click to select"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
                  <SelectItem value="2560x1440">2K (2560x1440)</SelectItem>
                  <SelectItem value="1920x1080">1080p (1920x1080)</SelectItem>
                  <SelectItem value="1280x720">720p (1280x720)</SelectItem>
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
              <Label htmlFor="format">Output Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="mov">MOV</SelectItem>
                  <SelectItem value="avi">AVI</SelectItem>
                  <SelectItem value="mkv">MKV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fps">FPS</Label>
              <Input
                id="fps"
                type="number"
                value={fps}
                onChange={(e) => setFps(e.target.value)}
                min="1"
                max="60"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleCompression}
              disabled={isCompressing}
            >
              {isCompressing ? "Compressing..." : "Compress Video"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default App;
