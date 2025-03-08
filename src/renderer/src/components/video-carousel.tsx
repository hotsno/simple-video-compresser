import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import VideoCard from "./video-card";
import ClearRecentFoldersCard from "./clear-recent-folders-card";

interface VideoCarouselProps {
  files: {
    path: string;
    folder: string;
    mtime: number;
    id: number;
    filename: string;
  }[];
  onSelect: (path: string) => void;
}

export default function VideoCarousel({ files, onSelect }: VideoCarouselProps) {
  return (
    <div className="relative select-none">
      <Carousel className="w-full">
        <CarouselContent>
          {files.map((video) => (
            <CarouselItem
              key={video.id}
              className="md:basis-1/3 lg:basis-1/3 xl:basis-1/4"
            >
              <VideoCard video={video} onSelect={onSelect} />
            </CarouselItem>
          ))}
          <CarouselItem className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
            <ClearRecentFoldersCard
              onClick={() => {
                window.api.clearRecentFiles();
                window.location.reload();
              }}
            />
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious className="left-1" />
        <CarouselNext className="right-1" />
      </Carousel>
    </div>
  );
}
