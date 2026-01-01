
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Minimize2, X, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BACKEND_URL } from "@/config/env";

interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "bot" | "tool";
  timestamp: Date;
}

export const ChatWidgetPreview = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentForm, setCurrentForm] = useState(null);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { authFetch } = useAuth();

  // Dummy IDs for preview purposes - replace with actual agent/company/session IDs
  const companyId = 1; 
  const agentId = 1;   
  const sessionId = "preview-session-123"; 

  useEffect(() => {
    if (isExpanded) {
      // Establish WebSocket connection
      ws.current = new WebSocket(`${BACKEND_URL.replace('http', 'ws')}/ws/public/${companyId}/${agentId}/${sessionId}?user_type=user`);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        // The backend will send the welcome message upon connection.
      };

      ws.current.onmessage = (event) => {
        const receivedData = JSON.parse(event.data);
        console.log("Received data:", receivedData);

        if (receivedData.message_type === 'form') {
          setCurrentForm({
            title: receivedData.message,
            fields: receivedData.fields,
          });
          // Add a message indicating the form needs to be filled
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: receivedData.message || 'Please fill out the form below.',
              sender: 'bot',
              timestamp: new Date(),
            },
          ]);
        } else if (receivedData.message) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: receivedData.message,
              sender: receivedData.sender === 'agent' ? 'bot' : receivedData.sender,
              timestamp: new Date(),
            },
          ]);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length + 1,
            text: "Error: Could not connect to the chat service.",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      };
    } else {
      // Close WebSocket connection when chat is collapsed
      if (ws.current) {
        ws.current.close();
      }
      setMessages([]); // Clear messages when chat is collapsed
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isExpanded, companyId, agentId, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: messages.length + 1,
      text: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: message, sender: 'user' }));
    } else {
      console.error("WebSocket is not open.");
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: "Error: Chat service not available. Please try again later.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
    setMessage("");
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Send the form data back as a JSON string
      ws.current.send(JSON.stringify({ message: data, sender: 'user' }));
    } else {
      console.error("WebSocket is not open.");
    }

    // Add a confirmation message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: prevMessages.length + 1,
        text: "Form submitted. Thank you!",
        sender: "user",
        timestamp: new Date(),
      },
    ]);

    setCurrentForm(null); // Hide the form and show the regular input again
  };

  const handleHandoff = async () => {
    try {
      const response = await authFetch(`/api/v1/conversations/${encodeURIComponent(sessionId)}/handoff`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to handoff conversation');
      }
      toast({
        title: 'Success',
        description: 'You will be connected to a human agent shortly.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect to a human agent.',
        variant: 'destructive',
      });
      console.error('Error handing off conversation:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Preview</CardTitle>
        <CardDescription>
          See how your chat widget will appear on client websites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 p-4 rounded-lg min-h-[400px] relative">
          {/* Simulated website background */}
          <div className="bg-white p-4 rounded shadow-sm mb-4">
            <div className="h-2 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* Chat Widget */}
          <div className="absolute bottom-4 right-4">
            {isExpanded ? (
              <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        CS
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">Customer Support</div>
                      <div className="text-xs opacity-90">Online</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-blue-700 p-1 h-6 w-6"
                      onClick={handleHandoff}
                    >
                      <User className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-blue-700 p-1 h-6 w-6"
                      onClick={() => setIsExpanded(false)}
                    >
                      <Minimize2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-blue-700 p-1 h-6 w-6"
                      onClick={() => setIsExpanded(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          msg.sender === "user"
                            ? "bg-blue-600 text-white"
                            : msg.sender === "tool"
                            ? "bg-yellow-200 text-gray-900"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                  {currentForm ? (
                    <form onSubmit={handleFormSubmit} className="space-y-3">
                      <h4 className="font-semibold text-sm text-center">{currentForm.title}</h4>
                      {currentForm.fields.map((field) => (
                        <div key={field.name}>
                          <label className="text-xs font-medium text-gray-700 block mb-1" htmlFor={field.name}>
                            {field.label}
                          </label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            required
                            className="w-full text-sm"
                          />
                        </div>
                      ))}
                      <Button size="sm" type="submit" className="w-full">
                        Submit
                      </Button>
                    </form>
                  ) : (
                    <div className="flex space-x-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 text-sm"
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button size="sm" onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Button
                className="rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
                onClick={() => setIsExpanded(true)}
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Click the chat button to see the expanded view
        </p>
      </CardContent>
    </Card>
  );
};
