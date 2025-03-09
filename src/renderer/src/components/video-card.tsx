import { Card, CardContent } from "@/components/ui/card";
import { Folder } from "lucide-react";

type VideoCardProps = {
  video: {
    path: string;
    folder: string;
    mtime: number;
    id: number;
    filename: string;
    thumbnail: string;
  };
  onSelect: (path: string) => void;
};

export default function VideoCard({ video, onSelect }: VideoCardProps) {
  return (
    <Card
      className="overflow-hidden h-full py-0 cursor-pointer"
      onClick={() => onSelect(video.path)}
    >
      <div className="relative aspect-video">
        <img
          src={`file://${video.thumbnail}`}
          alt={video.filename}
          className="absolute inset-0 w-full h-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-base truncate" title={video.filename}>
          {video.filename}
        </h3>
        <div className="flex items-center mt-2 text-sm text-muted-foreground">
          <Folder className="h-4 w-4 mr-1" />
          <span className="truncate" title={video.folder}>
            {video.folder}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
