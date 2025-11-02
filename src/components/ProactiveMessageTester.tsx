
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useI18n } from '@/hooks/useI18n';

export const ProactiveMessageTester = () => {
  const { t, isRTL } = useI18n();
  const { toast } = useToast();
  const { authFetch } = useAuth();
  const [target, setTarget] = useState("session_id");
  const [targetValue, setTargetValue] = useState("");
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleSendMessage = async () => {
    try {
      const body = {
        [target]: targetValue,
        text: message,
      };

      const response = await apiFetch("/api/v1/proactive/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: t('proactiveMessageTester.success'),
          description: t('proactiveMessageTester.sentSuccess'),
        });
        setTargetValue("");
        setMessage("");
      } else {
        const errorData = await response.json();
        toast({
          title: t('proactiveMessageTester.error'),
          description: errorData.detail || t('proactiveMessageTester.sentError'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to send proactive message", error);
      toast({
        title: t('proactiveMessageTester.error'),
        description: t('proactiveMessageTester.unexpectedError'),
        variant: "destructive",
      });
    }
  };

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <MessageSquare className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          {t('proactiveMessageTester.title')}
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          {t('proactiveMessageTester.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="apiKey" className="dark:text-gray-300">{t('proactiveMessageTester.apiKey')}</Label>
          <Input
            id="apiKey"
            placeholder={t('proactiveMessageTester.apiKeyPlaceholder')}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
          />
        </div>
        <div className="flex items-center gap-4">
          <Label className="dark:text-gray-300">{t('proactiveMessageTester.target')}:</Label>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="session_id"
              name="target"
              value="session_id"
              checked={target === "session_id"}
              onChange={() => setTarget("session_id")}
              className="dark:accent-cyan-500"
            />
            <Label htmlFor="session_id" className="dark:text-gray-300">{t('proactiveMessageTester.sessionId')}</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="contact_id"
              name="target"
              value="contact_id"
              checked={target === "contact_id"}
              onChange={() => setTarget("contact_id")}
              className="dark:accent-cyan-500"
            />
            <Label htmlFor="contact_id" className="dark:text-gray-300">{t('proactiveMessageTester.contactId')}</Label>
          </div>
        </div>
        <div>
          <Label htmlFor="targetValue" className="dark:text-gray-300">{t('proactiveMessageTester.targetValue')}</Label>
          <Input
            id="targetValue"
            placeholder={target === "session_id" ? t('proactiveMessageTester.enterSessionId') : t('proactiveMessageTester.enterContactId')}
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="message" className="dark:text-gray-300">{t('proactiveMessageTester.message')}</Label>
          <Textarea
            id="message"
            placeholder={t('proactiveMessageTester.messagePlaceholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
          />
        </div>
        <Button onClick={handleSendMessage} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
          {t('proactiveMessageTester.sendMessage')}
        </Button>
      </CardContent>
    </Card>
  );
};
