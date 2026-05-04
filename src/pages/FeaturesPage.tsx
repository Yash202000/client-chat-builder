import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav, MarketingFooter } from "@/components/MarketingLayout";
import {
  Workflow, Brain, Database, Globe, Video, Code, MessageSquare,
  BarChart2, Shield, Zap, Phone, GitBranch, Settings, CheckCircle,
  ArrowRight, Users, Target, Layers, Cpu, Lock, RefreshCw,
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
  {
    icon: Workflow,
    title: "Visual Workflow Builder",
    tagline: "Build agent logic without code",
    description: "Drag-and-drop your ally's brain. 11+ node types including LLM reasoning, conditional branching, tool calls, API requests, and code execution. Design complex multi-step workflows in minutes.",
    bullets: ["11+ workflow node types", "Conditional logic & branching", "Loop, retry, and fallback nodes", "One-click deploy to any channel"],
    gradient: "from-violet-600 to-purple-700",
  },
  {
    icon: Brain,
    title: "Multi-LLM Intelligence",
    tagline: "Every model, one platform",
    description: "Your agent can think with GPT-4o, Claude 3.5, Gemini 1.5, Groq Llama, or NVIDIA — whichever model fits the task. Switch providers per workflow without rebuilding anything.",
    bullets: ["OpenAI, Anthropic, Google, Groq, NVIDIA", "Per-workflow model selection", "Streaming responses built-in", "Cost optimisation across providers"],
    gradient: "from-purple-600 to-violet-700",
  },
  {
    icon: Database,
    title: "Deep Knowledge Memory",
    tagline: "Your docs, your agent's brain",
    description: "Upload PDFs, docs, and web content. Your agent searches them semantically using ChromaDB, FAISS, or LanceDB — giving answers grounded in your reality, not hallucinations.",
    bullets: ["PDF, DOCX, URL, and CSV ingestion", "Semantic vector search (RAG)", "ChromaDB / FAISS / LanceDB support", "Auto-sync and re-indexing"],
    gradient: "from-cyan-500 to-violet-600",
  },
  {
    icon: Globe,
    title: "Every Channel, One Agent",
    tagline: "Meet customers where they are",
    description: "WhatsApp, Instagram, Messenger, Telegram, Email, SMS, or your website — one agent, all channels. Your customers choose their preferred channel. Your agent shows up everywhere.",
    bullets: ["WhatsApp Business API", "Instagram & Facebook Messenger", "Telegram, Email & SMS", "Embeddable web chat widget"],
    gradient: "from-violet-600 to-cyan-500",
  },
  {
    icon: Phone,
    title: "Voice & Video AI",
    tagline: "An agent that speaks",
    description: "Give your agent a real voice. VAPI-powered voice agents handle inbound calls, book appointments, and transfer to humans naturally. LiveKit enables real-time video support sessions.",
    bullets: ["Natural voice conversations (VAPI)", "Inbound & outbound call handling", "Smart call routing & transfer", "LiveKit video call integration"],
    gradient: "from-purple-600 to-cyan-500",
  },
  {
    icon: Code,
    title: "Custom Tools & MCP",
    tagline: "Connect anything",
    description: "Your agent can use any tool you build — Python-powered custom tools, pre-built connectors, webhooks, and full Model Context Protocol (MCP) support for any integration imaginable.",
    bullets: ["Python custom tool builder", "Webhook triggers & receivers", "REST API tool nodes", "Model Context Protocol (MCP) support"],
    gradient: "from-violet-700 to-purple-600",
  },
  {
    icon: Users,
    title: "Built-in CRM",
    tagline: "Leads, contacts, deals — unified",
    description: "Every conversation your agent has auto-captures leads, updates contact records, and moves deals through your pipeline. No manual CRM data entry. Ever.",
    bullets: ["Auto contact & lead capture", "Deal pipeline management", "Email campaign sequences", "LinkedIn lead enrichment"],
    gradient: "from-cyan-600 to-violet-600",
  },
  {
    icon: BarChart2,
    title: "Analytics & Reporting",
    tagline: "Know what's working",
    description: "Real-time dashboards show conversation volume, resolution rates, agent performance, and conversion metrics. Weekly digests delivered automatically to your team.",
    bullets: ["Conversation & resolution analytics", "Agent performance scoring", "Campaign attribution tracking", "Automated weekly digest reports"],
    gradient: "from-violet-600 to-purple-600",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    tagline: "Secure by default",
    description: "AES-256 encryption at rest, TLS 1.2+ in transit, role-based access control, audit logs, and SOC 2-aligned practices. Your data stays yours.",
    bullets: ["AES-256 encryption at rest", "Role-based access control (RBAC)", "Full audit log trail", "GDPR & data residency controls"],
    gradient: "from-slate-600 to-violet-700",
  },
];

const FeaturesPage = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
    <SEOHead
      title="HeyGenAlly Features – AI Agent Builder with CRM, Voice, Knowledge Base & More"
      description="Explore HeyGenAlly's full feature set: visual workflow builder, multi-LLM support, WhatsApp & multichannel messaging, voice AI, knowledge base RAG, built-in CRM, and enterprise security."
      canonical="/features"
    />
    <MarketingNav />

    {/* Hero */}
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge className="mb-6 px-4 py-2 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">
            Everything your agent needs
          </Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-syne text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
        >
          Built for teams who
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">expect more</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10"
        >
          HeyGenAlly packs everything into one platform — visual workflow builder, multi-LLM support, knowledge base RAG, CRM, voice AI, and more. No stitching tools together.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white px-8 py-6 text-lg shadow-lg shadow-violet-500/30">
              Start Free — No Credit Card <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/use-cases">
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-slate-300 dark:border-slate-600">
              See Use Cases
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>

    {/* Feature stats */}
    <section className="relative py-14 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-purple-700 to-violet-800" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
        {[
          { n: "11+", label: "Workflow Node Types" },
          { n: "6+", label: "LLM Providers" },
          { n: "8+", label: "Channels Supported" },
          { n: "99.9%", label: "Uptime SLA" },
        ].map(({ n, label }) => (
          <div key={label}>
            <p className="text-4xl font-bold font-syne mb-2">{n}</p>
            <p className="text-violet-200 text-sm">{label}</p>
          </div>
        ))}
      </div>
    </section>

    {/* All features */}
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {FEATURES.map((f, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="h-full border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300">
                <CardHeader>
                  <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                    <f.icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-1">{f.tagline}</p>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{f.description}</p>
                  <ul className="space-y-2">
                    {f.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="h-4 w-4 text-violet-500 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Deep dive — workflow builder */}
    <section className="py-24 bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-950 dark:to-violet-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">Deep Dive</Badge>
            <h2 className="font-syne text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              The workflow builder
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">your engineers will love</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Most no-code tools hit a ceiling when your logic gets complex. HeyGenAlly's workflow builder was designed to handle real-world complexity — branching, loops, retries, code nodes, and multi-LLM chaining — without locking you out of the details.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: GitBranch, label: "Conditional branching" },
                { icon: RefreshCw, label: "Retry & fallback logic" },
                { icon: Cpu, label: "Code execution nodes" },
                { icon: Layers, label: "Sub-workflow nesting" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                </div>
              ))}
            </div>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white">
                Try the Builder Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-sm text-slate-400 ml-2">Customer Support Workflow</span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: MessageSquare, label: "Customer message received", color: "violet" },
                  { icon: Brain, label: "LLM: Classify intent", color: "purple" },
                  { icon: GitBranch, label: "Branch: billing / support / general", color: "cyan" },
                  { icon: Database, label: "RAG: Search knowledge base", color: "violet" },
                  { icon: Settings, label: "Tool: Update CRM contact", color: "purple" },
                  { icon: CheckCircle, label: "Reply & close conversation", color: "cyan" },
                ].map(({ icon: Icon, label, color }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                    </div>
                    {i < 5 && <div className="w-px h-4 bg-violet-300 dark:bg-violet-700 absolute left-[calc(2rem+12px)] mt-8" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-purple-700 to-violet-800" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-3xl mx-auto px-4 text-center text-white"
      >
        <h2 className="font-syne text-4xl md:text-5xl font-bold mb-6">Ready to build your ally?</h2>
        <p className="text-xl text-violet-100 mb-10">Start free in 5 minutes. No credit card. No lock-in.</p>
        <Link to="/signup">
          <Button size="lg" className="bg-white text-violet-700 hover:bg-slate-100 text-lg px-12 py-6 shadow-2xl font-semibold">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </motion.div>
    </section>

    <MarketingFooter />
  </div>
);

export default FeaturesPage;
