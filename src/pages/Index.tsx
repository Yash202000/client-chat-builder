
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  Settings,
  Code,
  CheckCircle,
  Workflow,
  Brain,
  Zap,
  Database,
  Phone,
  Mail,
  MessageCircle,
  Video,
  BarChart3,
  Lock,
  Globe,
  Sparkles,
  ArrowRight,
  Bot,
  Webhook,
  GitBranch,
  FileText,
  Shield,
  CloudCog
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionPlan } from "@/types";

const Index = () => {
  const { authFetch } = useAuth();

  const { data: plans, isLoading, isError } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await authFetch("/api/v1/subscription/plans/");
      if (!response.ok) {
        throw new Error("Failed to fetch subscription plans");
      }
      return response.json();
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">AgentConnect</span>
                <Badge variant="secondary" className="ml-2 text-xs">Platform</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-6 px-4 py-1 text-sm bg-blue-100 text-blue-700 border-blue-200">
              <Sparkles className="w-3 h-3 mr-1 inline" />
              Enterprise-Grade AI Agent Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Build Intelligent AI Agents
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                With Visual Workflows
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              The complete platform for creating, deploying, and managing AI agents across multiple channels.
              <span className="font-semibold text-gray-800"> Visual workflow builder, multi-LLM support, knowledge bases, and real-time analytics</span> - all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                  Start Building Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 border-2 hover:bg-gray-50">
                  View Live Demo
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Deploy in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Multi-tenant ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">11+</div>
              <div className="text-blue-100">Workflow Node Types</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">8+</div>
              <div className="text-blue-100">Channel Integrations</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5+</div>
              <div className="text-blue-100">LLM Providers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Open & Customizable</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm">Core Platform</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Build AI Agents
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade tools designed for agencies, enterprises, and developers building the next generation of AI experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Workflow className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Visual Workflow Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Drag-and-drop workflow designer with 11+ node types. Build complex agent logic with LLM nodes, conditional branching, tools, knowledge bases, and custom code execution.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Multi-LLM Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Switch between Groq, OpenAI, Anthropic, Google Gemini, and NVIDIA providers. Route different workflows to different models with unified API interface.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Knowledge Base Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Upload documents, PDFs, and web content. Powered by ChromaDB, FAISS, and LanceDB for semantic search. Automatic chunking and vectorization.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Multi-Channel Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Deploy to WhatsApp, Messenger, Instagram, Telegram, Email, SMS, and Web. Single agent, multiple channels with customizable experiences.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-pink-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle className="text-xl">Voice & Video Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Built-in voice agent capabilities with VAPI integration. LiveKit-powered video calls. Real-time communication with WebSocket support.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Custom Tools & MCP</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Create custom tools with Python code. Model Context Protocol (MCP) support for external integrations. Pre-built connectors for common services.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm bg-purple-100 text-purple-700">Advanced Capabilities</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Enterprise-Ready Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for scale, security, and performance from day one.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 border-2 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GitBranch className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Workflow Versioning</h3>
                  <p className="text-gray-600">
                    Version control for workflows and agents. Create new versions, test changes, and activate with confidence. Rollback capabilities built-in.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Analytics & Monitoring</h3>
                  <p className="text-gray-600">
                    Real-time conversation analytics, execution tracing with Zipkin, workflow performance metrics, and comprehensive reporting dashboard.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Multi-Tenant Architecture</h3>
                  <p className="text-gray-600">
                    Complete data isolation by company. Team-based access control, role-based permissions, and secure credential management with encryption.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Webhook className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Webhooks & API</h3>
                  <p className="text-gray-600">
                    RESTful API with comprehensive documentation. Webhook support for real-time events. WebSocket for live updates and streaming responses.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CloudCog className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Docker & Self-Hosted</h3>
                  <p className="text-gray-600">
                    Deploy anywhere with Docker Compose. PostgreSQL, Redis, ChromaDB, MinIO included. Full control over your data and infrastructure.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Document Processing</h3>
                  <p className="text-gray-600">
                    Automatic document parsing for PDF, DOCX, TXT, and web content. Smart chunking, embedding generation, and semantic search capabilities.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Workflow Node Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-1 text-sm">Workflow Nodes</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              11+ Powerful Node Types
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Build sophisticated agent workflows with our comprehensive node library.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { name: "Start Node", desc: "Workflow entry point", icon: Zap, color: "blue" },
              { name: "LLM Node", desc: "Call AI models", icon: Brain, color: "purple" },
              { name: "Tool Node", desc: "Execute custom tools", icon: Code, color: "green" },
              { name: "Condition Node", desc: "Branching logic", icon: GitBranch, color: "orange" },
              { name: "Knowledge Node", desc: "Vector DB search", icon: Database, color: "indigo" },
              { name: "Listen Node", desc: "Wait for input", icon: MessageSquare, color: "pink" },
              { name: "Prompt Node", desc: "Ask questions", icon: MessageCircle, color: "red" },
              { name: "Output Node", desc: "Workflow output", icon: CheckCircle, color: "green" },
              { name: "Code Node", desc: "Python execution", icon: Code, color: "gray" },
              { name: "HTTP Node", desc: "API requests", icon: Globe, color: "blue" },
              { name: "Form Node", desc: "Collect data", icon: FileText, color: "purple" },
              { name: "Data Node", desc: "Transform data", icon: Settings, color: "orange" },
            ].map((node, idx) => (
              <div key={idx} className="p-4 border-2 rounded-lg hover:shadow-md transition-all bg-gray-50">
                <div className={`w-10 h-10 bg-${node.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                  <node.icon className={`h-5 w-5 text-${node.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900">{node.name}</h3>
                <p className="text-sm text-gray-600">{node.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm">Use Cases</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Every Industry
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From customer support to sales automation, AgentConnect powers AI agents across industries.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-shadow border-2">
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Customer Support</h3>
              <p className="text-gray-600 mb-4">
                24/7 intelligent support agents that understand context, access knowledge bases, and escalate to humans when needed.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Multi-language support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Ticket creation & tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Knowledge base integration
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow border-2">
              <Zap className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Sales Automation</h3>
              <p className="text-gray-600 mb-4">
                Qualify leads, book meetings, answer product questions, and nurture prospects through intelligent conversations.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Lead qualification workflows
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Calendar integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  CRM synchronization
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow border-2">
              <Phone className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Voice Assistants</h3>
              <p className="text-gray-600 mb-4">
                Deploy voice-enabled AI agents for phone support, appointment booking, and interactive voice response systems.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Natural speech processing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Call routing & transfers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Voice analytics
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Build Your First AI Agent?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of teams building the future of customer engagement with AgentConnect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {plans && plans.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 px-4 py-1 text-sm">Pricing</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the plan that fits your needs. Scale as you grow. No hidden fees.
              </p>
            </div>

            {isLoading && <div className="text-center text-gray-600">Loading plans...</div>}
            {isError && <div className="text-center text-red-600">Error loading plans. Please try again later.</div>}

            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className="relative flex flex-col justify-between p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300"
                >
                  {plan.name.toLowerCase().includes('pro') && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-xl text-gray-600 ml-2">{plan.currency}/month</span>
                    </div>
                    <ul className="text-left text-gray-700 space-y-4 mb-8">
                      {plan.features && plan.features.split(',').map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Get Started
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">AgentConnect</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The most powerful platform for building, deploying, and managing AI agents across every channel.
              </p>
              <div className="flex gap-4">
                <Badge variant="secondary">Multi-LLM</Badge>
                <Badge variant="secondary">Self-Hosted</Badge>
                <Badge variant="secondary">Open Platform</Badge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2025 AgentConnect. Building the future of AI-powered customer engagement.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
