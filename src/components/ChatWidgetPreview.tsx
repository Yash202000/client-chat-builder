
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Minimize2, X, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Dummy IDs for preview purposes - replace with actual agent/company/session IDs
  const companyId = 1; 
  const agentId = 1;   
  const sessionId = "preview-session-123"; 

  useEffect(() => {
    if (isExpanded) {
      // Establish WebSocket connection
      ws.current = new WebSocket(`ws://localhost:8000/ws/conversations/${companyId}/${agentId}/${sessionId}`);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        // The backend will send the welcome message upon connection.
      };

      ws.current.onmessage = (event) => {
        const receivedData = JSON.parse(event.data);
        console.log("Received data:", receivedData);

        // Only process and display messages that have content.
        // This ignores broadcast messages like { "type": "new_message", ... }
        if (receivedData.message) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: receivedData.message,
              sender: receivedData.sender === 'agent' ? 'bot' : receivedData.sender, // Treat 'agent' as 'bot' for styling
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
      ws.current.send(message);
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

  const handleHandoff = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/conversations/${sessionId}/handoff`, {
        method: 'POST',
        headers: {
          'X-Company-ID': companyId.toString(),
        },
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
