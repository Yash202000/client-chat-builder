import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Phone, Plus, Trash2, Edit2, Loader2, PhoneCall, CheckCircle, XCircle, Download, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Agent } from "@/types";

interface TwilioPhoneNumber {
  id: number;
  phone_number: string;
  friendly_name: string | null;
  company_id: number;
  default_agent_id: number | null;
  integration_id: number;
  is_active: boolean;
  welcome_message: string | null;
  language: string;
}

interface Integration {
  id: number;
  type: string;
  name: string;
  is_active: boolean;
}

interface TwilioFetchedNumber {
  phone_number: string;
  friendly_name: string | null;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  is_configured: boolean;
}

export const TwilioPhoneNumbersManager = () => {
  const { t } = useI18n();
  const { isRTL } = useI18n();
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState<TwilioPhoneNumber | null>(null);
  const [fetchedNumbers, setFetchedNumbers] = useState<TwilioFetchedNumber[]>([]);
  const [selectedForImport, setSelectedForImport] = useState<Set<string>>(new Set());
  const [importIntegrationId, setImportIntegrationId] = useState<string>("");
  const [isFetchingNumbers, setIsFetchingNumbers] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: "",
    friendly_name: "",
    default_agent_id: "none",
    integration_id: "",
    welcome_message: "",
    language: "en-US",
    is_active: true,
  });

  // Fetch phone numbers
  const { data: phoneNumbers, isLoading: loadingNumbers } = useQuery<TwilioPhoneNumber[]>({
    queryKey: ["twilio-phone-numbers"],
    queryFn: async () => {
      const response = await authFetch("/api/v1/twilio/phone-numbers/");
      if (!response.ok) throw new Error("Failed to fetch phone numbers");
      return response.json();
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

  // Fetch Twilio Voice integrations
  const { data: integrations } = useQuery<Integration[]>({
    queryKey: ["twilio-integrations"],
    queryFn: async () => {
      const response = await authFetch("/api/v1/integrations/");
      if (!response.ok) throw new Error("Failed to fetch integrations");
      const allIntegrations = await response.json();
      return allIntegrations.filter((i: Integration) => i.type === "twilio_voice");
    },
  });

  // Create phone number mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await authFetch("/api/v1/twilio/phone-numbers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: data.phone_number,
          friendly_name: data.friendly_name || null,
          default_agent_id: data.default_agent_id && data.default_agent_id !== "none" ? parseInt(data.default_agent_id) : null,
          integration_id: parseInt(data.integration_id),
          welcome_message: data.welcome_message || null,
          language: data.language,
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
      queryClient.invalidateQueries({ queryKey: ["twilio-phone-numbers"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: t("settings.twilio.phoneNumberAdded") || "Phone Number Added",
        description: t("settings.twilio.phoneNumberAddedDesc") || "The phone number has been configured successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("settings.error") || "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update phone number mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await authFetch(`/api/v1/twilio/phone-numbers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: data.phone_number,
          friendly_name: data.friendly_name || null,
          default_agent_id: data.default_agent_id && data.default_agent_id !== "none" ? parseInt(data.default_agent_id) : null,
          integration_id: parseInt(data.integration_id),
          welcome_message: data.welcome_message || null,
          language: data.language,
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
      queryClient.invalidateQueries({ queryKey: ["twilio-phone-numbers"] });
      setEditingNumber(null);
      resetForm();
      toast({
        title: t("settings.twilio.phoneNumberUpdated") || "Phone Number Updated",
        description: t("settings.twilio.phoneNumberUpdatedDesc") || "The phone number has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("settings.error") || "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete phone number mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await authFetch(`/api/v1/twilio/phone-numbers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete phone number");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twilio-phone-numbers"] });
      toast({
        title: t("settings.twilio.phoneNumberDeleted") || "Phone Number Deleted",
        description: t("settings.twilio.phoneNumberDeletedDesc") || "The phone number has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("settings.error") || "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch numbers from Twilio
  const fetchNumbersFromTwilio = async (integrationId: string) => {
    if (!integrationId) {
      toast({
        title: t("settings.error") || "Error",
        description: t("settings.twilio.selectIntegrationFirst") || "Please select an integration first.",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingNumbers(true);
    try {
      const response = await authFetch(`/api/v1/twilio/phone-numbers/fetch-from-twilio/${integrationId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to fetch phone numbers from Twilio");
      }
      const data = await response.json();
      setFetchedNumbers(data.numbers || []);
      setSelectedForImport(new Set());
      setIsImportDialogOpen(true);
    } catch (error: any) {
      toast({
        title: t("settings.error") || "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsFetchingNumbers(false);
    }
  };

  // Import selected numbers
  const importSelectedNumbers = async () => {
    if (selectedForImport.size === 0 || !importIntegrationId) {
      toast({
        title: t("settings.error") || "Error",
        description: t("settings.twilio.selectNumbersToImport") || "Please select numbers to import.",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const phoneNumber of selectedForImport) {
      const fetchedNumber = fetchedNumbers.find(n => n.phone_number === phoneNumber);
      if (!fetchedNumber || fetchedNumber.is_configured) continue;

      try {
        const response = await authFetch("/api/v1/twilio/phone-numbers/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone_number: fetchedNumber.phone_number,
            friendly_name: fetchedNumber.friendly_name,
            integration_id: parseInt(importIntegrationId),
            default_agent_id: null,
            welcome_message: null,
            language: "en-US",
            is_active: true,
          }),
        });
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["twilio-phone-numbers"] });
    setIsImportDialogOpen(false);
    setSelectedForImport(new Set());

    if (successCount > 0) {
      toast({
        title: t("settings.twilio.numbersImported") || "Numbers Imported",
        description: `${successCount} ${t("settings.twilio.numbersImportedDesc") || "phone number(s) imported successfully."}${errorCount > 0 ? ` ${errorCount} failed.` : ""}`,
      });
    } else if (errorCount > 0) {
      toast({
        title: t("settings.error") || "Error",
        description: t("settings.twilio.importFailed") || "Failed to import phone numbers.",
        variant: "destructive",
      });
    }
  };

  const toggleNumberSelection = (phoneNumber: string) => {
    const newSelected = new Set(selectedForImport);
    if (newSelected.has(phoneNumber)) {
      newSelected.delete(phoneNumber);
    } else {
      newSelected.add(phoneNumber);
    }
    setSelectedForImport(newSelected);
  };

  const resetForm = () => {
    setFormData({
      phone_number: "",
      friendly_name: "",
      default_agent_id: "none",
      integration_id: "",
      welcome_message: "",
      language: "en-US",
      is_active: true,
    });
  };

  const handleEdit = (number: TwilioPhoneNumber) => {
    setEditingNumber(number);
    setFormData({
      phone_number: number.phone_number,
      friendly_name: number.friendly_name || "",
      default_agent_id: number.default_agent_id?.toString() || "none",
      integration_id: number.integration_id.toString(),
      welcome_message: number.welcome_message || "",
      language: number.language,
      is_active: number.is_active,
    });
  };

  const handleSubmit = () => {
    if (!formData.phone_number || !formData.integration_id) {
      toast({
        title: t("settings.error") || "Error",
        description: t("settings.twilio.requiredFields") || "Phone number and integration are required.",
        variant: "destructive",
      });
      return;
    }

    if (editingNumber) {
      updateMutation.mutate({ id: editingNumber.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const languageOptions = [
    { value: "en-US", label: "English (US)" },
    { value: "en-GB", label: "English (UK)" },
    { value: "es-ES", label: "Spanish (Spain)" },
    { value: "es-MX", label: "Spanish (Mexico)" },
    { value: "fr-FR", label: "French" },
    { value: "de-DE", label: "German" },
    { value: "it-IT", label: "Italian" },
    { value: "pt-BR", label: "Portuguese (Brazil)" },
    { value: "ja-JP", label: "Japanese" },
    { value: "ko-KR", label: "Korean" },
    { value: "zh-CN", label: "Chinese (Simplified)" },
    { value: "ar-SA", label: "Arabic" },
    { value: "hi-IN", label: "Hindi" },
  ];

  const PhoneNumberForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone_number" className="dark:text-gray-300">
            {t("settings.twilio.phoneNumber") || "Phone Number"} *
          </Label>
          <Input
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            placeholder="+1234567890"
            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t("settings.twilio.phoneNumberHelp") || "E.164 format (e.g., +1234567890)"}
          </p>
        </div>
        <div>
          <Label htmlFor="friendly_name" className="dark:text-gray-300">
            {t("settings.twilio.friendlyName") || "Friendly Name"}
          </Label>
          <Input
            id="friendly_name"
            value={formData.friendly_name}
            onChange={(e) => setFormData({ ...formData, friendly_name: e.target.value })}
            placeholder="Customer Support Line"
            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="integration_id" className="dark:text-gray-300">
            {t("settings.twilio.integration") || "Twilio Integration"} *
          </Label>
          <Select
            value={formData.integration_id}
            onValueChange={(value) => setFormData({ ...formData, integration_id: value })}
          >
            <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5">
              <SelectValue placeholder={t("settings.twilio.selectIntegration") || "Select integration"} />
            </SelectTrigger>
            <SelectContent>
              {integrations?.map((integration) => (
                <SelectItem key={integration.id} value={integration.id.toString()}>
                  {integration.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="default_agent_id" className="dark:text-gray-300">
            {t("settings.twilio.defaultAgent") || "Default Agent"}
          </Label>
          <Select
            value={formData.default_agent_id}
            onValueChange={(value) => setFormData({ ...formData, default_agent_id: value })}
          >
            <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5">
              <SelectValue placeholder={t("settings.twilio.selectAgent") || "Select agent (optional)"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("common.none") || "None"}</SelectItem>
              {agents?.map((agent) => (
                <SelectItem key={agent.id} value={agent.id.toString()}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="welcome_message" className="dark:text-gray-300">
          {t("settings.twilio.welcomeMessage") || "Welcome Message"}
        </Label>
        <Input
          id="welcome_message"
          value={formData.welcome_message}
          onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
          placeholder="Hello! How can I help you today?"
          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t("settings.twilio.welcomeMessageHelp") || "Spoken when caller connects"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="language" className="dark:text-gray-300">
            {t("settings.twilio.language") || "Language"}
          </Label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData({ ...formData, language: value })}
          >
            <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 mt-6">
          <div>
            <Label className="dark:text-white">{t("settings.twilio.active") || "Active"}</Label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("settings.twilio.activeHelp") || "Accept calls on this number"}
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>
    </div>
  );

  if (!integrations || integrations.length === 0) {
    return (
      <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <PhoneCall className="h-5 w-5 text-red-600 dark:text-red-400" />
            {t("settings.twilio.title") || "Twilio Voice"}
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            {t("settings.twilio.description") || "Manage your Twilio phone numbers for voice AI interactions"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium dark:text-white mb-2">
              {t("settings.twilio.noIntegration") || "No Twilio Integration Found"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t("settings.twilio.noIntegrationDesc") || "Please add a Twilio Voice integration in the Integrations tab first."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <PhoneCall className="h-5 w-5 text-red-600 dark:text-red-400" />
              {t("settings.twilio.title") || "Twilio Voice"}
            </CardTitle>
            <CardDescription className="dark:text-gray-400 mt-1">
              {t("settings.twilio.description") || "Manage your Twilio phone numbers for voice AI interactions"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Import from Twilio */}
            <div className="flex items-center gap-2">
              <Select
                value={importIntegrationId}
                onValueChange={(value) => setImportIntegrationId(value)}
              >
                <SelectTrigger className="w-40 dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                  <SelectValue placeholder={t("settings.twilio.selectIntegration") || "Select integration"} />
                </SelectTrigger>
                <SelectContent>
                  {integrations?.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id.toString()}>
                      {integration.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => fetchNumbersFromTwilio(importIntegrationId)}
                disabled={isFetchingNumbers || !importIntegrationId}
                className="dark:border-slate-600 dark:text-white"
              >
                {isFetchingNumbers ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {t("settings.twilio.importFromTwilio") || "Import from Twilio"}
              </Button>
            </div>
            {/* Add manually */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("settings.twilio.addNumber") || "Add Phone Number"}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  {t("settings.twilio.addNumberTitle") || "Add Phone Number"}
                </DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  {t("settings.twilio.addNumberDesc") || "Configure a Twilio phone number to receive voice calls."}
                </DialogDescription>
              </DialogHeader>
              <PhoneNumberForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("common.save") || "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        </div>
      </CardHeader>

      {/* Import from Twilio Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {t("settings.twilio.importFromTwilioTitle") || "Import Phone Numbers from Twilio"}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t("settings.twilio.importFromTwilioDesc") || "Select phone numbers from your Twilio account to import."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {fetchedNumbers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="dark:text-gray-300">{t("settings.twilio.phoneNumber") || "Phone Number"}</TableHead>
                    <TableHead className="dark:text-gray-300">{t("settings.twilio.name") || "Name"}</TableHead>
                    <TableHead className="dark:text-gray-300">{t("settings.twilio.capabilities") || "Capabilities"}</TableHead>
                    <TableHead className="dark:text-gray-300">{t("settings.twilio.status") || "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fetchedNumbers.map((number) => (
                    <TableRow key={number.phone_number} className={number.is_configured ? "opacity-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedForImport.has(number.phone_number)}
                          onCheckedChange={() => toggleNumberSelection(number.phone_number)}
                          disabled={number.is_configured}
                        />
                      </TableCell>
                      <TableCell className="font-medium dark:text-white">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {number.phone_number}
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        {number.friendly_name || "-"}
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        <div className="flex gap-1 text-xs">
                          {number.capabilities.voice && (
                            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Voice</span>
                          )}
                          {number.capabilities.sms && (
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">SMS</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {number.is_configured ? (
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            {t("settings.twilio.alreadyConfigured") || "Already configured"}
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400 text-sm">
                            {t("settings.twilio.availableToImport") || "Available"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t("settings.twilio.noNumbersInTwilio") || "No phone numbers found in your Twilio account."}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={importSelectedNumbers}
              disabled={selectedForImport.size === 0}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {t("settings.twilio.importSelected") || `Import Selected (${selectedForImport.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardContent className="pt-6">
        {loadingNumbers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : phoneNumbers && phoneNumbers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="dark:text-gray-300">{t("settings.twilio.phoneNumber") || "Phone Number"}</TableHead>
                <TableHead className="dark:text-gray-300">{t("settings.twilio.name") || "Name"}</TableHead>
                <TableHead className="dark:text-gray-300">{t("settings.twilio.agent") || "Agent"}</TableHead>
                <TableHead className="dark:text-gray-300">{t("settings.twilio.language") || "Language"}</TableHead>
                <TableHead className="dark:text-gray-300">{t("settings.twilio.status") || "Status"}</TableHead>
                <TableHead className="dark:text-gray-300 text-right">{t("settings.twilio.actions") || "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phoneNumbers.map((number) => {
                const agent = agents?.find((a) => a.id === number.default_agent_id);
                const langLabel = languageOptions.find((l) => l.value === number.language)?.label || number.language;
                return (
                  <TableRow key={number.id}>
                    <TableCell className="font-medium dark:text-white">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {number.phone_number}
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">
                      {number.friendly_name || "-"}
                    </TableCell>
                    <TableCell className="dark:text-gray-300">
                      {agent?.name || "-"}
                    </TableCell>
                    <TableCell className="dark:text-gray-300">
                      {langLabel}
                    </TableCell>
                    <TableCell>
                      {number.is_active ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          {t("settings.twilio.active") || "Active"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <XCircle className="h-4 w-4" />
                          {t("settings.twilio.inactive") || "Inactive"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(number)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(number.id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium dark:text-white mb-2">
              {t("settings.twilio.noNumbers") || "No Phone Numbers"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t("settings.twilio.noNumbersDesc") || "Add your first Twilio phone number to start receiving voice calls."}
            </p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingNumber} onOpenChange={(open) => { if (!open) { setEditingNumber(null); resetForm(); } }}>
          <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">
                {t("settings.twilio.editNumberTitle") || "Edit Phone Number"}
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                {t("settings.twilio.editNumberDesc") || "Update the configuration for this phone number."}
              </DialogDescription>
            </DialogHeader>
            <PhoneNumberForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingNumber(null); resetForm(); }}>
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("common.save") || "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
