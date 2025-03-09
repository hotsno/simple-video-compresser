import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClearRecentFoldersCardProps = {
  onClearRecentFolders: () => void;
};

export default function ClearRecentFoldersCard({
  onClearRecentFolders,
}: ClearRecentFoldersCardProps) {
  return (
    <Card className="h-full flex items-center justify-center border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-6 h-full">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full mb-2 cursor-pointer"
          onClick={onClearRecentFolders}
          aria-label="Add directory"
        >
          <X className="h-6 w-6" />
        </Button>
        <p className="text-center text-muted-foreground">Clear Recent</p>
      </CardContent>
    </Card>
  );
}
