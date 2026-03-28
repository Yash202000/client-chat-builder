import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useInView, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";
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
  CloudCog,
  Play,
  Star,
  ChevronDown,
  Layers,
  Target,
  Clock,
  TrendingUp,
  Award,
  Headphones
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionPlan } from "@/types";

// Animated counter component
const AnimatedCounter = ({ target, duration = 2, suffix = "" }: { target: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = target;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Floating animation variants
const floatingVariants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const floatingVariants2 = {
  animate: {
    y: [0, 20, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Stagger container variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const Index = () => {
  const { authFetch } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 0.95]);

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

  // Section refs for scroll animations
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const workflowRef = useRef(null);
  const useCasesRef = useRef(null);
  const pricingRef = useRef(null);

  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const workflowInView = useInView(workflowRef, { once: true, margin: "-100px" });
  const useCasesInView = useInView(useCasesRef, { once: true, margin: "-100px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 z-[100] origin-left"
        style={{ scaleX: smoothProgress }}
      />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <div className="relative">
                  <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/25">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    HeyGenAlly
                  </span>
                  <Badge variant="secondary" className="ml-2 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    Platform
                  </Badge>
                </div>
              </motion.div>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Features</a>
              <a href="#workflow" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Workflow</a>
              <a href="#use-cases" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Use Cases</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Pricing</a>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-blue-600 dark:text-slate-400">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 text-white">
                    Get Started Free
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />

          {/* Animated gradient orbs */}
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-400/30 dark:bg-blue-500/20 rounded-full blur-3xl"
          />
          <motion.div
            variants={floatingVariants2}
            animate="animate"
            className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-400/30 dark:bg-indigo-500/20 rounded-full blur-3xl"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/20 to-indigo-300/20 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-full blur-3xl"
          />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-full border border-blue-200/50 dark:border-blue-700/50 mb-8"
            >
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Enterprise-Grade AI Agent Platform
              </span>
              <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
          >
            <span className="text-slate-900 dark:text-white">Build </span>
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
                Intelligent
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 -skew-x-6 rounded"
              />
            </span>
            <br />
            <span className="text-slate-900 dark:text-white">AI Agents</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Create, deploy, and manage AI agents with our{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">visual workflow builder</span>.
            Multi-LLM support, knowledge bases, and{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">real-time analytics</span> — all in one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-7 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all text-white"
                >
                  Start Building Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/dashboard">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-7 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600 dark:text-slate-400"
          >
            {[
              { icon: CheckCircle, text: "No credit card required" },
              { icon: Clock, text: "Deploy in 5 minutes" },
              { icon: Shield, text: "Enterprise security" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + idx * 0.1 }}
                className="flex items-center gap-2"
              >
                <item.icon className="h-4 w-4 text-green-500" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-slate-400"
            >
              <span className="text-xs font-medium">Scroll to explore</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating UI Elements */}
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute top-1/3 left-10 hidden lg:block"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-4 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI Model</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">GPT-4 Connected</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={floatingVariants2}
          animate="animate"
          className="absolute top-1/2 right-10 hidden lg:block"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-4 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Conversations</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">+147% this week</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute bottom-1/3 left-20 hidden lg:block"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-4 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-gradient-to-br ${
                    i === 0 ? 'from-blue-400 to-blue-600' :
                    i === 1 ? 'from-indigo-400 to-indigo-600' :
                    'from-cyan-400 to-cyan-600'
                  }`} />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">+2.4k users</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:40px_40px]" />

        <motion.div
          initial="hidden"
          animate={statsInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            {[
              { number: 11, suffix: "+", label: "Workflow Node Types" },
              { number: 8, suffix: "+", label: "Channel Integrations" },
              { number: 5, suffix: "+", label: "LLM Providers" },
              { number: 99, suffix: "%", label: "Uptime Guarantee" }
            ].map((stat, idx) => (
              <motion.div key={idx} variants={itemVariants} className="relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
                >
                  <div className="text-5xl md:text-6xl font-bold mb-2">
                    <AnimatedCounter target={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="text-blue-100 font-medium">{stat.label}</div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="text-center mb-20"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-6 px-4 py-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                Core Platform
              </Badge>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Everything You Need to Build
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Powerful AI Agents
              </span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Professional-grade tools designed for agencies, enterprises, and developers building the next generation of AI experiences.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Workflow,
                title: "Visual Workflow Builder",
                description: "Drag-and-drop workflow designer with 11+ node types. Build complex agent logic with LLM nodes, conditional branching, tools, and custom code execution.",
                gradient: "from-blue-500 to-indigo-600"
              },
              {
                icon: Brain,
                title: "Multi-LLM Support",
                description: "Switch between Groq, OpenAI, Anthropic, Google Gemini, and NVIDIA providers. Route different workflows to different models seamlessly.",
                gradient: "from-indigo-500 to-blue-600"
              },
              {
                icon: Database,
                title: "Knowledge Base Integration",
                description: "Upload documents, PDFs, and web content. Powered by ChromaDB, FAISS, and LanceDB for semantic search with automatic chunking.",
                gradient: "from-cyan-500 to-blue-600"
              },
              {
                icon: Globe,
                title: "Multi-Channel Deployment",
                description: "Deploy to WhatsApp, Messenger, Instagram, Telegram, Email, SMS, and Web. Single agent, multiple channels.",
                gradient: "from-blue-500 to-cyan-600"
              },
              {
                icon: Video,
                title: "Voice & Video Support",
                description: "Built-in voice agent capabilities with VAPI integration. LiveKit-powered video calls with real-time WebSocket support.",
                gradient: "from-indigo-500 to-cyan-600"
              },
              {
                icon: Code,
                title: "Custom Tools & MCP",
                description: "Create custom tools with Python code. Model Context Protocol (MCP) support for external integrations and pre-built connectors.",
                gradient: "from-blue-600 to-indigo-500"
              }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-full border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden group">
                    <CardHeader>
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                        className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
                      >
                        <feature.icon className="h-7 w-7 text-white" />
                      </motion.div>
                      <CardTitle className="text-xl text-slate-900 dark:text-white">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow Section */}
      <section ref={workflowRef} id="workflow" className="py-32 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={workflowInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="text-center mb-20"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-6 px-4 py-2 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
                Workflow Nodes
              </Badge>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              11+ Powerful Node Types
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Build sophisticated agent workflows with our comprehensive node library.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={workflowInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="grid md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {[
              { name: "Start Node", desc: "Workflow entry point", icon: Zap, color: "from-blue-500 to-blue-600" },
              { name: "LLM Node", desc: "Call AI models", icon: Brain, color: "from-indigo-500 to-indigo-600" },
              { name: "Tool Node", desc: "Execute custom tools", icon: Code, color: "from-cyan-500 to-cyan-600" },
              { name: "Condition Node", desc: "Branching logic", icon: GitBranch, color: "from-blue-600 to-indigo-500" },
              { name: "Knowledge Node", desc: "Vector DB search", icon: Database, color: "from-indigo-600 to-blue-500" },
              { name: "Listen Node", desc: "Wait for input", icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
              { name: "Prompt Node", desc: "Ask questions", icon: MessageCircle, color: "from-cyan-500 to-blue-500" },
              { name: "Output Node", desc: "Workflow output", icon: CheckCircle, color: "from-green-500 to-emerald-500" },
              { name: "Code Node", desc: "Python execution", icon: Code, color: "from-slate-600 to-slate-700" },
              { name: "HTTP Node", desc: "API requests", icon: Globe, color: "from-blue-500 to-indigo-600" },
              { name: "Form Node", desc: "Collect data", icon: FileText, color: "from-indigo-500 to-blue-600" },
              { name: "Data Node", desc: "Transform data", icon: Settings, color: "from-cyan-600 to-blue-600" }
            ].map((node, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="p-5 bg-white dark:bg-slate-800/80 border-2 border-slate-200/50 dark:border-slate-700/50 rounded-2xl hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${node.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all`}>
                    <node.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{node.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{node.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section ref={useCasesRef} id="use-cases" className="py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={useCasesInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="text-center mb-20"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-6 px-4 py-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                Use Cases
              </Badge>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Built for Every Industry
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              From customer support to sales automation, HeyGenAlly powers AI agents across industries.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={useCasesInView ? "visible" : "hidden"}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Headphones,
                title: "Customer Support",
                description: "24/7 intelligent support agents that understand context, access knowledge bases, and escalate to humans when needed.",
                features: ["Multi-language support", "Ticket creation & tracking", "Knowledge base integration"],
                gradient: "from-blue-500 to-indigo-600"
              },
              {
                icon: Target,
                title: "Sales Automation",
                description: "Qualify leads, book meetings, answer product questions, and nurture prospects through intelligent conversations.",
                features: ["Lead qualification workflows", "Calendar integration", "CRM synchronization"],
                gradient: "from-indigo-500 to-blue-600"
              },
              {
                icon: Phone,
                title: "Voice Assistants",
                description: "Deploy voice-enabled AI agents for phone support, appointment booking, and interactive voice response systems.",
                features: ["Natural speech processing", "Call routing & transfers", "Voice analytics"],
                gradient: "from-cyan-500 to-blue-600"
              }
            ].map((useCase, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-full p-8 border-2 border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 bg-white dark:bg-slate-800/50 overflow-hidden group">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-16 h-16 bg-gradient-to-br ${useCase.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}
                    >
                      <useCase.icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{useCase.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      {useCase.description}
                    </p>
                    <ul className="space-y-3">
                      {useCase.features.map((feature, featureIdx) => (
                        <motion.li
                          key={featureIdx}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: featureIdx * 0.1 }}
                          className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonial/Trust Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}
            </div>
            <blockquote className="text-2xl md:text-3xl font-medium text-slate-800 dark:text-white max-w-4xl mx-auto mb-8 leading-relaxed">
              "HeyGenAlly transformed how we handle customer interactions. Our response time dropped by 80% and customer satisfaction soared."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                JD
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900 dark:text-white">John Davidson</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">CTO, TechCorp Inc.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700" />
        <div className="absolute inset-0">
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            variants={floatingVariants2}
            animate="animate"
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <Award className="w-16 h-16 mx-auto mb-8 text-white/80" />
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Build Your First AI Agent?
          </h2>
          <p className="text-xl mb-10 text-blue-100 max-w-2xl mx-auto">
            Join thousands of teams building the future of customer engagement with HeyGenAlly. Start free, scale infinitely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-slate-100 text-lg px-10 py-7 shadow-2xl hover:shadow-white/25 transition-all font-semibold"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/dashboard">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-7 font-semibold"
                >
                  View Documentation
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      {plans && plans.length > 0 && (
        <section ref={pricingRef} id="pricing" className="py-32 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              animate={pricingInView ? "visible" : "hidden"}
              variants={containerVariants}
              className="text-center mb-20"
            >
              <motion.div variants={itemVariants}>
                <Badge className="mb-6 px-4 py-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                  Pricing
                </Badge>
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                Simple, Transparent Pricing
              </motion.h2>
              <motion.p variants={itemVariants} className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Choose the plan that fits your needs. Scale as you grow. No hidden fees.
              </motion.p>
            </motion.div>

            {isLoading && (
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
            {isError && <div className="text-center text-red-600">Error loading plans. Please try again later.</div>}

            <motion.div
              initial="hidden"
              animate={pricingInView ? "visible" : "hidden"}
              variants={containerVariants}
              className="grid md:grid-cols-3 gap-8"
            >
              {plans.map((plan, idx) => (
                <motion.div key={plan.id} variants={itemVariants}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className={`relative h-full flex flex-col justify-between p-8 border-2 ${
                      plan.name.toLowerCase().includes('pro')
                        ? 'border-blue-500 dark:border-blue-400 shadow-2xl shadow-blue-500/20'
                        : 'border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600'
                    } transition-all duration-300 bg-white dark:bg-slate-800/50 overflow-hidden`}>
                      {plan.name.toLowerCase().includes('pro') && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1.5 rounded-bl-xl text-sm font-semibold">
                          Most Popular
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{plan.name}</CardTitle>
                        <div className="mb-8">
                          <span className="text-5xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                          <span className="text-xl text-slate-600 dark:text-slate-400 ml-2">{plan.currency}/month</span>
                        </div>
                        <ul className="text-left space-y-4 mb-8">
                          {plan.features && plan.features.split(',').map((feature, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-3 text-slate-700 dark:text-slate-300"
                            >
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{feature.trim()}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button className={`w-full py-6 text-lg font-semibold ${
                          plan.name.toLowerCase().includes('pro')
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25'
                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600'
                        } text-white`}>
                          Get Started
                        </Button>
                      </motion.div>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center space-x-3 mb-6"
              >
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">HeyGenAlly</span>
              </motion.div>
              <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
                The most powerful platform for building, deploying, and managing AI agents across every channel. Connect smarter, grow faster.
              </p>
              <div className="flex gap-3">
                <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">Multi-LLM</Badge>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">Self-Hosted</Badge>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">Open Platform</Badge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-6">Platform</h3>
              <ul className="space-y-4 text-slate-400">
                <li><Link to="/dashboard" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Dashboard</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-6">Resources</h3>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-sm">
                © 2025 HeyGenAlly. Connect Smarter, Grow Faster.
              </p>
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
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
