import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav, MarketingFooter } from "@/components/MarketingLayout";
import {
  Headphones, Target, ShoppingBag, Zap, Users, BarChart2,
  CheckCircle, ArrowRight, MessageSquare, Brain, Database,
  Globe, Phone, BarChart, Clock, TrendingUp,
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

type UseCaseData = {
  slug: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSub: string;
  gradient: string;
  challenge: string;
  howItWorks: { icon: React.ElementType; step: string; description: string }[];
  results: { metric: string; label: string }[];
  features: { title: string; description: string }[];
  relatedSlugs: string[];
};

const USE_CASES: Record<string, UseCaseData> = {
  "customer-support": {
    slug: "customer-support",
    icon: Headphones,
    title: "AI Customer Support",
    subtitle: "Resolve tickets 24/7. Automatically.",
    seoTitle: "AI Customer Support Agent – Automate 80% of Tickets | HeyGenAlly",
    seoDescription: "HeyGenAlly AI customer support agents handle tickets 24/7, search your knowledge base for accurate answers, and escalate to humans only when needed. Start free.",
    heroHeadline: "Resolve 80% of tickets without lifting a finger",
    heroSub: "Your AI support agent handles routine queries around the clock — using your actual knowledge base, not hallucinations. Your team wakes up to resolved tickets, not a backlog.",
    gradient: "from-violet-600 to-purple-700",
    challenge: "Most support teams are drowning. The same questions come in daily, response times slip overnight, and agents burn out on repetitive tickets. HeyGenAlly's AI support agent handles the volume — so your human team can focus on the conversations that actually need them.",
    howItWorks: [
      { icon: MessageSquare, step: "Customer sends a message", description: "On any channel — web chat, WhatsApp, Instagram, email, or Telegram." },
      { icon: Brain, step: "Agent classifies intent", description: "LLM reasoning identifies whether it's billing, technical, general, or escalation-required." },
      { icon: Database, step: "Searches your knowledge base", description: "RAG-powered semantic search finds the most relevant answer from your docs and FAQs." },
      { icon: Globe, step: "Responds or escalates", description: "Resolves the ticket autonomously, or routes to the right human agent with full context." },
    ],
    results: [
      { metric: "80%", label: "Ticket auto-resolution rate" },
      { metric: "< 1 min", label: "Average first response time" },
      { metric: "24/7", label: "Support availability" },
      { metric: "60%", label: "Cost reduction vs headcount" },
    ],
    features: [
      { title: "Knowledge base RAG", description: "Upload your docs, FAQs, and help articles. Your agent answers from your source of truth — no hallucinations." },
      { title: "Smart escalation", description: "Define escalation rules. Complex or sensitive tickets go to the right human immediately, with full conversation context." },
      { title: "Multi-channel inbox", description: "Manage web chat, WhatsApp, Instagram, Telegram, email, and SMS — all in one unified inbox." },
      { title: "CSAT tracking", description: "Auto-collect customer satisfaction scores and track resolution quality over time." },
    ],
    relatedSlugs: ["lead-generation", "ecommerce"],
  },
  "lead-generation": {
    slug: "lead-generation",
    icon: Target,
    title: "AI Lead Generation",
    subtitle: "Qualify, nurture, and book demos. Automatically.",
    seoTitle: "AI Lead Generation Agent – Qualify Leads & Book Demos Automatically | HeyGenAlly",
    seoDescription: "HeyGenAlly AI lead generation agents engage website visitors, qualify leads 24/7, book demos into your calendar, and push contacts into your CRM. Start free.",
    heroHeadline: "Your best sales rep — available 24/7, never tired",
    heroSub: "Your AI agent engages every visitor, qualifies them against your criteria, books demos straight into your calendar, and populates your CRM — while your sales team focuses on closing.",
    gradient: "from-purple-600 to-cyan-500",
    challenge: "Most website visitors leave without converting. Your sales team can't respond to every chat at 2am. Leads go cold while you sleep. HeyGenAlly's AI lead gen agent is always on — qualifying every visitor and booking meetings automatically.",
    howItWorks: [
      { icon: MessageSquare, step: "Visitor starts a conversation", description: "On your website, WhatsApp, LinkedIn, or any channel you activate." },
      { icon: Brain, step: "Agent qualifies the lead", description: "Asks your qualification questions — budget, timeline, team size — naturally, like a real salesperson." },
      { icon: Target, step: "Books a demo or nurtures", description: "Qualified leads get a calendar link. Unqualified leads enter a nurture sequence automatically." },
      { icon: Database, step: "Pushes to your CRM", description: "Every lead, every note, every signal auto-populated in your CRM. No manual data entry." },
    ],
    results: [
      { metric: "3×", label: "More leads qualified per month" },
      { metric: "< 5 min", label: "Response time to new leads" },
      { metric: "40%", label: "Increase in demo bookings" },
      { metric: "24/7", label: "Lead capture availability" },
    ],
    features: [
      { title: "Custom qualification scripts", description: "Define your ICP criteria. The agent asks the right questions in a natural, conversational way." },
      { title: "Calendar integration", description: "Book demos directly into Calendly, Google Calendar, or your scheduling tool of choice." },
      { title: "CRM auto-sync", description: "Leads, scores, and conversation history sync to your CRM automatically. No manual input." },
      { title: "LinkedIn lead enrichment", description: "Enrich lead profiles with LinkedIn data for better qualification and personalisation." },
    ],
    relatedSlugs: ["customer-support", "saas"],
  },
  "ecommerce": {
    slug: "ecommerce",
    icon: ShoppingBag,
    title: "AI for E-commerce",
    subtitle: "Turn browsers into buyers, automatically.",
    seoTitle: "AI Chatbot for E-commerce – Product Discovery, Cart Recovery & Order Support | HeyGenAlly",
    seoDescription: "HeyGenAlly e-commerce AI agents help shoppers find products, recover abandoned carts, answer order questions, and support customers on WhatsApp and Instagram. Start free.",
    heroHeadline: "Your store never sleeps — and neither does your agent",
    heroSub: "Help shoppers find what they're looking for, recover abandoned carts, answer order questions in seconds, and handle returns — on every channel your customers use.",
    gradient: "from-cyan-500 to-violet-600",
    challenge: "E-commerce customers expect instant answers. A 5-minute delay on a product question means a lost sale. HeyGenAlly's agent knows your entire catalogue, can recover carts proactively, and answers order questions before customers even think to ask.",
    howItWorks: [
      { icon: ShoppingBag, step: "Shopper asks a question", description: "On your website chat, WhatsApp, Instagram DMs, or Messenger." },
      { icon: Brain, step: "Agent understands the intent", description: "Product search, order status, return request, or general help — the agent knows." },
      { icon: Database, step: "Searches your product catalogue", description: "Finds the right product, checks stock, answers sizing questions from your knowledge base." },
      { icon: TrendingUp, step: "Guides to checkout or resolves", description: "Adds to cart, recovers abandoned orders, or resolves the support issue without a ticket." },
    ],
    results: [
      { metric: "25%", label: "Cart abandonment recovery" },
      { metric: "90%", label: "Order queries resolved automatically" },
      { metric: "2×", label: "Faster customer response times" },
      { metric: "4.8★", label: "Average post-chat CSAT" },
    ],
    features: [
      { title: "Product catalogue integration", description: "Connect your catalogue so the agent can recommend, search, and answer product questions accurately." },
      { title: "Cart abandonment recovery", description: "Proactively reach out to customers who left without buying — via WhatsApp or email." },
      { title: "Order tracking & returns", description: "Customers check order status and initiate returns without contacting a human." },
      { title: "WhatsApp & Instagram shopping", description: "Meet shoppers on the channels they're already on — WhatsApp Business and Instagram DMs." },
    ],
    relatedSlugs: ["customer-support", "lead-generation"],
  },
  "saas": {
    slug: "saas",
    icon: Zap,
    title: "AI for SaaS Companies",
    subtitle: "Reduce churn. Accelerate onboarding.",
    seoTitle: "AI Agents for SaaS – Onboarding, In-App Support & Churn Prevention | HeyGenAlly",
    seoDescription: "HeyGenAlly AI agents help SaaS companies onboard users faster, answer in-app questions instantly, and proactively prevent churn. Start free.",
    heroHeadline: "Onboard faster. Retain longer. Grow smarter.",
    heroSub: "Your AI agent guides new users through onboarding, answers in-app questions with knowledge base precision, and proactively reaches out to accounts showing churn signals.",
    gradient: "from-violet-600 to-cyan-500",
    challenge: "SaaS companies bleed revenue through poor onboarding and slow in-app support. Users who don't reach their 'aha moment' within the first week churn within 30 days. HeyGenAlly's agent makes sure every user gets guided, supported, and nudged toward activation.",
    howItWorks: [
      { icon: Users, step: "User signs up", description: "The agent starts an onboarding conversation immediately — guiding them through setup steps." },
      { icon: Brain, step: "Monitors engagement signals", description: "Tracks product usage and surfaces users who are stuck or at risk of churning." },
      { icon: MessageSquare, step: "Answers in-app questions", description: "Proactively or reactively, using your documentation as the source of truth." },
      { icon: TrendingUp, step: "Nudges toward key features", description: "Sends targeted messages when users haven't discovered high-value features." },
    ],
    results: [
      { metric: "45%", label: "Faster time to activation" },
      { metric: "30%", label: "Churn reduction in 90 days" },
      { metric: "60%", label: "Support queries self-served" },
      { metric: "24/7", label: "In-app support coverage" },
    ],
    features: [
      { title: "Guided onboarding flows", description: "Step-by-step onboarding conversations that adapt to what the user has and hasn't done yet." },
      { title: "Proactive churn prevention", description: "Define churn signals. The agent reaches out automatically when accounts go quiet." },
      { title: "Documentation-powered support", description: "Connect your help centre. Users get accurate answers without opening a ticket." },
      { title: "Feature adoption nudges", description: "Identify users who haven't used key features and send targeted prompts to drive adoption." },
    ],
    relatedSlugs: ["lead-generation", "customer-support"],
  },
  "hr-onboarding": {
    slug: "hr-onboarding",
    icon: Users,
    title: "HR & Employee Onboarding",
    subtitle: "The most patient colleague your team ever had.",
    seoTitle: "AI HR Assistant – Employee Onboarding, Policy Q&A & Leave Management | HeyGenAlly",
    seoDescription: "HeyGenAlly AI HR agents answer policy questions 24/7, guide new hires through onboarding, and handle leave requests automatically. Start free.",
    heroHeadline: "Every new hire gets the same great start",
    heroSub: "Your AI HR agent answers policy questions at 11pm, guides new hires through their first week, handles leave requests, and never gets tired of being asked the same thing twice.",
    gradient: "from-purple-600 to-violet-700",
    challenge: "HR teams spend 60% of their time answering the same questions about policies, benefits, and processes. New hires feel lost in the first week. HeyGenAlly's HR agent handles the routine — so your HR team can focus on the strategic work that actually needs humans.",
    howItWorks: [
      { icon: Users, step: "New hire joins", description: "Agent starts the onboarding journey immediately — welcome message, checklist, key contacts." },
      { icon: MessageSquare, step: "Employee asks a question", description: "Policy, benefits, leave, payroll — the agent answers from your HR knowledge base." },
      { icon: Brain, step: "Handles leave requests", description: "Employee requests leave through chat. Agent checks balance, confirms, and notifies managers." },
      { icon: CheckCircle, step: "Escalates when needed", description: "Complex or sensitive matters route to your HR team with full context." },
    ],
    results: [
      { metric: "70%", label: "HR queries handled automatically" },
      { metric: "2 days", label: "Faster new hire productivity" },
      { metric: "24/7", label: "Policy question availability" },
      { metric: "85%", label: "Employee satisfaction with HR support" },
    ],
    features: [
      { title: "Onboarding journey automation", description: "Day-by-day guided onboarding flows that keep new hires on track through their first month." },
      { title: "Policy & benefits Q&A", description: "Upload your employee handbook. The agent answers any policy question accurately, 24/7." },
      { title: "Leave & PTO management", description: "Employees request, check balances, and track leave through a simple chat interface." },
      { title: "Multi-language support", description: "Support employees across locations in their preferred language." },
    ],
    relatedSlugs: ["operations", "customer-support"],
  },
  "operations": {
    slug: "operations",
    icon: BarChart2,
    title: "Operations Automation",
    subtitle: "Connect your tools. Automate the routine.",
    seoTitle: "AI Operations Automation – Workflows, Alerts & Daily Digests | HeyGenAlly",
    seoDescription: "HeyGenAlly AI agents automate cross-tool workflows, surface anomalies proactively, and deliver daily ops digest reports. Start free.",
    heroHeadline: "Your ops team should be solving problems, not chasing updates",
    heroSub: "Connect your tools, monitor workflows, surface anomalies, and send daily digest reports — so your ops team spends time on strategy, not status chasing.",
    gradient: "from-violet-700 to-purple-600",
    challenge: "Operations teams live in fragmented tooling — Slack, Jira, HubSpot, Notion, spreadsheets. Information doesn't flow. Anomalies go undetected. HeyGenAlly connects everything and surfaces what matters before it becomes a problem.",
    howItWorks: [
      { icon: Database, step: "Connect your tools", description: "Webhooks, APIs, and native integrations pull data from your existing stack." },
      { icon: Brain, step: "Agent monitors workflows", description: "Continuously checks for anomalies, delays, or conditions you define." },
      { icon: MessageSquare, step: "Sends proactive alerts", description: "Notifies the right person in Slack, email, or Teams when something needs attention." },
      { icon: BarChart, step: "Delivers daily digest", description: "Morning briefing with key metrics, blockers, and action items — automatically." },
    ],
    results: [
      { metric: "5 hrs", label: "Saved per team member per week" },
      { metric: "< 1 min", label: "Anomaly detection time" },
      { metric: "100%", label: "Cross-tool visibility" },
      { metric: "Zero", label: "Missed status updates" },
    ],
    features: [
      { title: "Cross-tool workflow automation", description: "Trigger actions across tools based on conditions — no manual hand-offs." },
      { title: "Proactive anomaly detection", description: "Define thresholds. Get alerted the moment something looks wrong." },
      { title: "Daily ops digest", description: "Automated morning briefing with metrics, blockers, and wins — delivered to Slack or email." },
      { title: "Custom reporting", description: "Build reports that pull from multiple data sources and deliver on schedule." },
    ],
    relatedSlugs: ["saas", "hr-onboarding"],
  },
};

const TITLES: Record<string, string> = {
  "customer-support": "AI Customer Support",
  "lead-generation": "AI Lead Generation",
  "ecommerce": "AI for E-commerce",
  "saas": "AI for SaaS",
  "hr-onboarding": "HR & Onboarding",
  "operations": "Operations",
};

const UseCaseDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const uc = slug ? USE_CASES[slug] : null;

  if (!uc) return <Navigate to="/use-cases" replace />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      <SEOHead
        title={uc.seoTitle}
        description={uc.seoDescription}
        canonical={`/use-cases/${uc.slug}`}
      />
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`w-16 h-16 bg-gradient-to-br ${uc.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
              <uc.icon className="h-8 w-8 text-white" />
            </div>
            <Badge className="mb-4 px-4 py-2 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">
              {uc.title}
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-syne text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
          >
            {uc.heroHeadline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10"
          >
            {uc.heroSub}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white px-10 py-6 text-lg shadow-lg shadow-violet-500/25">
                Start Free — No Credit Card <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/use-cases">
              <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-slate-300 dark:border-slate-600">
                See All Use Cases
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Results metrics */}
      <section className="relative py-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-purple-700 to-violet-800" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {uc.results.map(({ metric, label }) => (
            <div key={label}>
              <p className="text-4xl font-bold font-syne mb-2">{metric}</p>
              <p className="text-violet-200 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The challenge */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-6 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700">The Problem</Badge>
            <h2 className="font-syne text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">Sound familiar?</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{uc.challenge}</p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-950 dark:to-violet-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">How it works</Badge>
            <h2 className="font-syne text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Four steps. Fully automated.</h2>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-6"
          >
            {uc.howItWorks.map(({ icon: Icon, step, description }, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="p-6 border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-violet-300 dark:hover:border-violet-600 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-violet-500 uppercase tracking-widest">Step {i + 1}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{step}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Key features */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">Key capabilities</Badge>
            <h2 className="font-syne text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Everything you need out of the box</h2>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-8"
          >
            {uc.features.map(({ title, description }, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-violet-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Related use cases */}
      <section className="py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-syne text-2xl font-bold text-slate-900 dark:text-white mb-8">More use cases</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {uc.relatedSlugs.map((s) => (
              <Link key={s} to={`/use-cases/${s}`}>
                <Badge className="px-4 py-2 text-sm cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:text-violet-600 transition-all">
                  {TITLES[s]} →
                </Badge>
              </Link>
            ))}
            <Link to="/use-cases">
              <Badge className="px-4 py-2 text-sm cursor-pointer bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700 hover:bg-violet-200 transition-all">
                See all use cases →
              </Badge>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-purple-700 to-violet-800" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto px-4 text-center text-white"
        >
          <h2 className="font-syne text-4xl font-bold mb-4">Ready to build your {uc.title.toLowerCase()} agent?</h2>
          <p className="text-violet-100 text-lg mb-10">Free plan, no credit card. Live in 5 minutes.</p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-violet-700 hover:bg-slate-100 text-lg px-12 py-6 font-semibold shadow-2xl">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default UseCaseDetailPage;
