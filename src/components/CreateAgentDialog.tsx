
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAgentDialog = ({ open, onOpenChange }: CreateAgentDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    welcomeMessage: "",
    fallbackMessage: "",
    primaryColor: "#3B82F6",
    website: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here we would typically send the data to our backend
    console.log("Creating agent:", formData);
    
    toast({
      title: "Agent created successfully!",
      description: `${formData.name} has been created and is ready to deploy.`,
    });
    
    // Reset form and close dialog
    setFormData({
      name: "",
      description: "",
      welcomeMessage: "",
      fallbackMessage: "",
      primaryColor: "#3B82F6",
      website: ""
    });
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Chat Agent</DialogTitle>
          <DialogDescription>
            Configure your new chat agent with custom responses and branding.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gray-100 text-gray-600">
                  <Upload className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Customer Support Bot"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of what this agent does..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="website">Target Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="e.g., mycompany.com"
                type="url"
              />
            </div>
          </div>

          {/* Chat Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Chat Configuration</h3>
            
            <div>
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={(e) => handleInputChange("welcomeMessage", e.target.value)}
                placeholder="Hi! How can I help you today?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="fallbackMessage">Fallback Message</Label>
              <Textarea
                id="fallbackMessage"
                value={formData.fallbackMessage}
                onChange={(e) => handleInputChange("fallbackMessage", e.target.value)}
                placeholder="I'm sorry, I didn't understand that. Could you please rephrase?"
                rows={2}
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                  className="w-12 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Agent</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
