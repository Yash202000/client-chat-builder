import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Plus, Trash2, Edit2, Loader2, Server, FileCode } from "lucide-react";
import { Agent } from "@/types";

interface FreeSwitchPhoneNumber {
  id: number;
  phone_number: string;
  friendly_name: string | null;
  company_id: number;
  default_agent_id: number | null;
  is_active: boolean;
  welcome_message: string | null;
  language: string;
  audio_format: string;
  sample_rate: number;
  freeswitch_server: string | null;
}

export const FreeSwitchPhoneNumbersManager = () => {
  const { t } = useI18n();
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDialplanDialogOpen, setIsDialplanDialogOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState<FreeSwitchPhoneNumber | null>(null);
  const [dialplanExample, setDialplanExample] = useState<string>("");
  const [formData, setFormData] = useState({
    phone_number: "",
    friendly_name: "",
    default_agent_id: "none",
    welcome_message: "",
    language: "en-US",
    audio_format: "l16",
    sample_rate: "8000",
    freeswitch_server: "",
    is_active: true,
  });

  // Fetch phone numbers
  const { data: phoneNumbers, isLoading: loadingNumbers } = useQuery<FreeSwitchPhoneNumber[]>({
    queryKey: ["freeswitch-phone-numbers"],
    queryFn: async () => {
      const response = await authFetch("/api/v1/freeswitch/phone-numbers");
      if (!response.ok) throw new Error("Failed to fetch phone numbers");
      const data = await response.json();
      return data.phone_numbers || [];
    },
  });

  // Fetch agents for the dropdown
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const response = await authFetch("/api/v1/agents/");
      if (!response.ok) throw new Error("Failed to fetch agents");
      return response.json();
    },
  });

  // Create phone number mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await authFetch("/api/v1/freeswitch/phone-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: data.phone_number,
          friendly_name: data.friendly_name || null,
          default_agent_id: data.default_agent_id && data.default_agent_id !== "none" ? parseInt(data.default_agent_id) : null,
          welcome_message: data.welcome_message || null,
          language: data.language,
          audio_format: data.audio_format,
          sample_rate: parseInt(data.sample_rate),
          freeswitch_server: data.freeswitch_server || null,
          is_active: data.is_active,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create phone number");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freeswitch-phone-numbers"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: t("settings.freeswitch.numberAdded"),
        description: t("settings.freeswitch.numberAddedDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update phone number mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await authFetch(`/api/v1/freeswitch/phone-numbers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendly_name: data.friendly_name || null,
          default_agent_id: data.default_agent_id && data.default_agent_id !== "none" ? parseInt(data.default_agent_id) : null,
          welcome_message: data.welcome_message || null,
          language: data.language,
          audio_format: data.audio_format,
          sample_rate: parseInt(data.sample_rate),
          freeswitch_server: data.freeswitch_server || null,
          is_active: data.is_active,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update phone number");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freeswitch-phone-numbers"] });
      setEditingNumber(null);
      resetForm();
      toast({
        title: t("settings.freeswitch.numberUpdated"),
        description: t("settings.freeswitch.numberUpdatedDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete phone number mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await authFetch(`/api/v1/freeswitch/phone-numbers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete phone number");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freeswitch-phone-numbers"] });
      toast({
        title: t("settings.freeswitch.numberDeleted"),
        description: t("settings.freeswitch.numberDeletedDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      phone_number: "",
      friendly_name: "",
      default_agent_id: "none",
      welcome_message: "",
      language: "en-US",
      audio_format: "l16",
      sample_rate: "8000",
      freeswitch_server: "",
      is_active: true,
    });
  };

  const handleEdit = (number: FreeSwitchPhoneNumber) => {
    setEditingNumber(number);
    setFormData({
      phone_number: number.phone_number,
      friendly_name: number.friendly_name || "",
      default_agent_id: number.default_agent_id?.toString() || "none",
      welcome_message: number.welcome_message || "",
      language: number.language,
      audio_format: number.audio_format,
      sample_rate: number.sample_rate.toString(),
      freeswitch_server: number.freeswitch_server || "",
      is_active: number.is_active,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNumber) {
      updateMutation.mutate({ id: editingNumber.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const fetchDialplanExample = async () => {
    try {
      const response = await authFetch("/api/v1/freeswitch/dialplan-example");
      if (response.ok) {
        const data = await response.json();
        setDialplanExample(data.dialplan);
        setIsDialplanDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to fetch dialplan example",
        variant: "destructive",
      });
    }
  };

  const languages = [
    { value: "en-US", label: "English (US)" },
    { value: "en-GB", label: "English (UK)" },
    { value: "es-ES", label: "Spanish (Spain)" },
    { value: "es-MX", label: "Spanish (Mexico)" },
    { value: "fr-FR", label: "French" },
    { value: "de-DE", label: "German" },
    { value: "it-IT", label: "Italian" },
    { value: "pt-BR", label: "Portuguese (Brazil)" },
    { value: "ar-SA", label: "Arabic" },
    { value: "zh-CN", label: "Chinese (Mandarin)" },
    { value: "ja-JP", label: "Japanese" },
    { value: "ko-KR", label: "Korean" },
  ];

  const audioFormats = [
    { value: "l16", label: "L16 (16-bit PCM)" },
    { value: "PCMU", label: "PCMU (G.711 μ-law)" },
    { value: "PCMA", label: "PCMA (G.711 A-law)" },
  ];

  const sampleRates = [
    { value: "8000", label: "8 kHz" },
    { value: "16000", label: "16 kHz" },
    { value: "48000", label: "48 kHz" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {t("settings.freeswitch.title")}
            </CardTitle>
            <CardDescription>{t("settings.freeswitch.description")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchDialplanExample}>
              <FileCode className="h-4 w-4 mr-2" />
              {t("settings.freeswitch.viewDialplan")}
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("settings.freeswitch.addNumber")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingNumbers ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : phoneNumbers && phoneNumbers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.freeswitch.phoneNumber")}</TableHead>
                <TableHead>{t("settings.freeswitch.friendlyName")}</TableHead>
                <TableHead>{t("settings.freeswitch.agent")}</TableHead>
                <TableHead>{t("settings.freeswitch.audioFormat")}</TableHead>
                <TableHead>{t("settings.freeswitch.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phoneNumbers.map((number) => (
                <TableRow key={number.id}>
                  <TableCell className="font-mono">{number.phone_number}</TableCell>
                  <TableCell>{number.friendly_name || "-"}</TableCell>
                  <TableCell>
                    {number.default_agent_id
                      ? agents?.find((a) => a.id === number.default_agent_id)?.name || "-"
                      : "-"}
                  </TableCell>
                  <TableCell>{number.audio_format} @ {number.sample_rate}Hz</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        number.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {number.is_active ? t("common.active") : t("common.inactive")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(number)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(number.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("settings.freeswitch.noNumbers")}</p>
            <p className="text-sm mt-2">{t("settings.freeswitch.noNumbersDesc")}</p>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={isAddDialogOpen || editingNumber !== null}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingNumber(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNumber
                  ? t("settings.freeswitch.editNumber")
                  : t("settings.freeswitch.addNumber")}
              </DialogTitle>
              <DialogDescription>
                {editingNumber
                  ? t("settings.freeswitch.editNumberDesc")
                  : t("settings.freeswitch.addNumberDesc")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">{t("settings.freeswitch.phoneNumber")} *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="1001 or +14155551234"
                  disabled={editingNumber !== null}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.freeswitch.phoneNumberHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="friendly_name">{t("settings.freeswitch.friendlyName")}</Label>
                <Input
                  id="friendly_name"
                  value={formData.friendly_name}
                  onChange={(e) => setFormData({ ...formData, friendly_name: e.target.value })}
                  placeholder="Main Office Line"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_agent_id">{t("settings.freeswitch.defaultAgent")}</Label>
                <Select
                  value={formData.default_agent_id}
                  onValueChange={(value) => setFormData({ ...formData, default_agent_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.freeswitch.selectAgent")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {agents?.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome_message">{t("settings.freeswitch.welcomeMessage")}</Label>
                <Textarea
                  id="welcome_message"
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  placeholder={t("settings.freeswitch.welcomeMessagePlaceholder")}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">{t("settings.freeswitch.language")}</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audio_format">{t("settings.freeswitch.audioFormat")}</Label>
                  <Select
                    value={formData.audio_format}
                    onValueChange={(value) => setFormData({ ...formData, audio_format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audioFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample_rate">{t("settings.freeswitch.sampleRate")}</Label>
                  <Select
                    value={formData.sample_rate}
                    onValueChange={(value) => setFormData({ ...formData, sample_rate: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleRates.map((rate) => (
                        <SelectItem key={rate.value} value={rate.value}>
                          {rate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freeswitch_server">{t("settings.freeswitch.server")}</Label>
                  <Input
                    id="freeswitch_server"
                    value={formData.freeswitch_server}
                    onChange={(e) => setFormData({ ...formData, freeswitch_server: e.target.value })}
                    placeholder="fs1.example.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">{t("settings.freeswitch.active")}</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingNumber(null);
                    resetForm();
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingNumber ? t("common.save") : t("common.add")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialplan Example Dialog */}
        <Dialog open={isDialplanDialogOpen} onOpenChange={setIsDialplanDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{t("settings.freeswitch.dialplanExample")}</DialogTitle>
              <DialogDescription>
                {t("settings.freeswitch.dialplanExampleDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[50vh]">
              <pre className="text-sm font-mono whitespace-pre-wrap">{dialplanExample}</pre>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(dialplanExample);
                  toast({ title: t("common.copied") });
                }}
              >
                {t("common.copyToClipboard")}
              </Button>
              <Button onClick={() => setIsDialplanDialogOpen(false)}>{t("common.close")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
