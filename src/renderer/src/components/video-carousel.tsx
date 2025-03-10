import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import VideoCard from "./video-card";
import ClearRecentFoldersCard from "./clear-recent-folders-card";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";

interface VideoCarouselProps {
  files: {
    path: string;
    folder: string;
    mtime: number;
    id: number;
    filename: string;
    thumbnail: string;
  }[];
  onSelect: (path: string) => void;
  onClearRecentFolders: () => void;
}

export default function VideoCarousel({
  files,
  onSelect,
  onClearRecentFolders,
}: VideoCarouselProps) {
  return (
    <div className="relative select-none">
      <Carousel className="w-full" plugins={[WheelGesturesPlugin()]}>
        <CarouselContent>
          {files.map((video) => (
            <CarouselItem
              key={video.id}
              className="sm:basis-1/2 md:basis-1/2 lg:basis-1/3"
            >
              <VideoCard video={video} onSelect={onSelect} />
            </CarouselItem>
          ))}
          <CarouselItem className="sm:basis-1/2 md:basis-1/2 lg:basis-1/3">
            <ClearRecentFoldersCard
              onClearRecentFolders={onClearRecentFolders}
            />
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious className="left-1" />
        <CarouselNext className="right-1" />
      </Carousel>
    </div>
  );
}
