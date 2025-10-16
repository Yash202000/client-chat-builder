import { useState } from "react";
import { Check, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const PRESENCE_OPTIONS = [
  { value: "online", label: "Available", color: "bg-green-500", icon: "●" },
  { value: "busy", label: "Busy", color: "bg-red-500", icon: "●" },
  { value: "away", label: "Away", color: "bg-yellow-500", icon: "●" },
  { value: "do_not_disturb", label: "Do Not Disturb", color: "bg-red-600", icon: "⊖" },
  { value: "offline", label: "Appear Offline", color: "bg-gray-400", icon: "○" },
];

interface PresenceSelectorProps {
  currentStatus?: string;
  showLabel?: boolean;
}

export const PresenceSelector = ({ currentStatus = "offline", showLabel = true }: PresenceSelectorProps) => {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const updatePresenceMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await authFetch(`/api/v1/auth/presence?presence_status=${status}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to update presence");
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedStatus(data.presence_status);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Status updated", description: "Your presence status has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (status: string) => {
    updatePresenceMutation.mutate(status);
  };

  const currentOption = PRESENCE_OPTIONS.find((opt) => opt.value === selectedStatus) || PRESENCE_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2"
        >
          <div className="relative">
            <Circle className="h-3 w-3 fill-current" style={{ color: currentOption.color.replace('bg-', '') }} />
            <span
              className={`absolute inset-0 h-3 w-3 rounded-full ${currentOption.color}`}
            />
          </div>
          {showLabel && (
            <span className="text-sm font-medium dark:text-white">{currentOption.label}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 dark:bg-slate-800 dark:border-slate-700">
        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          Set Status
        </div>
        {PRESENCE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className="flex items-center justify-between cursor-pointer dark:text-white dark:focus:bg-slate-700"
          >
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${option.color}`} />
              <span>{option.label}</span>
            </div>
            {selectedStatus === option.value && (
              <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
