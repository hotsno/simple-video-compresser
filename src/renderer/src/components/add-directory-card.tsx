import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type AddDirectoryCardProps = {
  onClick: () => void;
};

export default function AddDirectoryCard({ onClick }: AddDirectoryCardProps) {
  return (
    <Card className="h-full flex items-center justify-center border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-6 h-full">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full mb-2"
          onClick={onClick}
          aria-label="Add directory"
        >
          <Plus className="h-6 w-6" />
        </Button>
        <p className="text-center text-muted-foreground">Add Directory</p>
      </CardContent>
    </Card>
  );
}
