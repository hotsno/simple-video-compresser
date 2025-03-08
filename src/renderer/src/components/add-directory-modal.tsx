import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddDirectoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (directoryName: string) => void;
};

export default function AddDirectoryModal({
  isOpen,
  onClose,
  onAdd,
}: AddDirectoryModalProps) {
  const [directoryName, setDirectoryName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!directoryName.trim()) {
      setError("Directory name cannot be empty");
      return;
    }

    onAdd(directoryName);
    setDirectoryName("");
    setError("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
        setError("");
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Directory</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="directory-name">Directory Name</Label>
              <Input
                id="directory-name"
                value={directoryName}
                onChange={(e) => {
                  setDirectoryName(e.target.value);
                  setError("");
                }}
                placeholder="Enter directory name"
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Directory</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
