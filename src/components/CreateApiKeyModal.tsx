
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyCreated: () => void;
}

export const CreateApiKeyModal = ({
  isOpen,
  onClose,
  onApiKeyCreated,
}: CreateApiKeyModalProps) => {
  const { toast } = useToast();
  const { authFetch } = useAuth();
  const [newApiKeyName, setNewApiKeyName] = useState("");

  const handleCreateApiKey = async () => {
    try {
      const response = await authFetch("/api/v1/api-keys/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newApiKeyName }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "API key created successfully.",
        });
        onApiKeyCreated();
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to create API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create API key", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
          <DialogDescription>
            Enter a name for your new API key.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateApiKey}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
