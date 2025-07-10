
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Settings, Code } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AgentConnect</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Build & Deploy
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Smart Chat Agents
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create intelligent chat agents for your clients and embed them seamlessly on any website. 
            Customize appearance, manage conversations, and deliver exceptional customer experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Launch Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to manage chat agents
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From creation to deployment, AgentConnect provides all the tools to build professional chat experiences.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Agent Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create and configure multiple chat agents with unique personalities and responses.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Settings className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Full Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Customize colors, themes, and branding to match each client's website perfectly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Code className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Easy Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simple script tag integration - just copy and paste to add chat to any website.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Real-time Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  WebSocket-powered instant messaging with conversation history and analytics.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <MessageSquare className="h-6 w-6" />
            <span className="text-lg font-semibold">AgentConnect</span>
          </div>
          <p className="text-center text-gray-400">
            © 2024 AgentConnect. Building the future of customer engagement.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
