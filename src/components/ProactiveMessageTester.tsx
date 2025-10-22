
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

export const ProactiveMessageTester = () => {
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
          title: "Success",
          description: "Proactive message sent successfully.",
        });
        setTargetValue("");
        setMessage("");
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.detail || "Failed to send proactive message.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to send proactive message", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Proactive Message Tester
        </CardTitle>
        <CardDescription>
          Send a proactive message to a user via the API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            placeholder="Your API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <Label>Target:</Label>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="session_id"
              name="target"
              value="session_id"
              checked={target === "session_id"}
              onChange={() => setTarget("session_id")}
            />
            <Label htmlFor="session_id">Session ID</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="contact_id"
              name="target"
              value="contact_id"
              checked={target === "contact_id"}
              onChange={() => setTarget("contact_id")}
            />
            <Label htmlFor="contact_id">Contact ID</Label>
          </div>
        </div>
        <div>
          <Label htmlFor="targetValue">Target Value</Label>
          <Input
            id="targetValue"
            placeholder={`Enter ${target === "session_id" ? "Session ID" : "Contact ID"}`}
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Enter your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button onClick={handleSendMessage}>Send Message</Button>
      </CardContent>
    </Card>
  );
};
