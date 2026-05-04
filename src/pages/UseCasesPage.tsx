import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav, MarketingFooter } from "@/components/MarketingLayout";
import {
  Headphones, Target, ShoppingBag, Zap, Users, BarChart2,
  ArrowRight, CheckCircle,
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const USE_CASES = [
  {
    slug: "customer-support",
    icon: Headphones,
    title: "AI Customer Support",
    tagline: "Resolve 80% of tickets automatically",
    description: "Deploy an AI agent that handles support tickets 24/7, searches your knowledge base for accurate answers, and escalates to humans only when needed. Customers get faster resolution. Your team gets breathing room.",
    wins: ["24/7 automated ticket resolution", "Knowledge base-powered answers", "Smart escalation to human agents", "Multi-channel: web, WhatsApp, email"],
    gradient: "from-violet-600 to-purple-700",
    color: "violet",
  },
  {
    slug: "lead-generation",
    icon: Target,
    title: "AI Lead Generation",
    tagline: "Qualify and nurture leads around the clock",
    description: "Your AI agent engages website visitors, qualifies leads against your criteria, books demos directly into your calendar, and pushes qualified contacts into your CRM — while you sleep.",
    wins: ["Automated lead qualification", "Demo booking & calendar sync", "CRM auto-population", "LinkedIn & multi-channel outreach"],
    gradient: "from-purple-600 to-cyan-500",
    color: "purple",
  },
  {
    slug: "ecommerce",
    icon: ShoppingBag,
    title: "AI for E-commerce",
    tagline: "Turn browsers into buyers, automatically",
    description: "Reduce cart abandonment, answer product questions instantly, and guide shoppers to checkout with an AI agent that knows your catalogue inside-out — available on every channel your customers use.",
    wins: ["Product discovery & recommendations", "Cart abandonment recovery", "Order tracking & returns", "WhatsApp & Instagram shopping"],
    gradient: "from-cyan-500 to-violet-600",
    color: "cyan",
  },
  {
    slug: "saas",
    icon: Zap,
    title: "AI for SaaS Companies",
    tagline: "Reduce churn, accelerate onboarding",
    description: "Onboard new users faster, answer in-app questions instantly, proactively reach out to at-risk accounts, and turn your documentation into a self-serve support experience.",
    wins: ["Guided user onboarding flows", "In-app AI support chat", "Proactive churn prevention", "Feature adoption nudges"],
    gradient: "from-violet-600 to-cyan-500",
    color: "violet",
  },
  {
    slug: "hr-onboarding",
    icon: Users,
    title: "HR & Employee Onboarding",
    tagline: "Onboard faster, answer policy questions instantly",
    description: "Give every new hire an AI ally that answers policy questions, guides them through onboarding checklists, handles leave requests, and never gets tired of being asked the same thing twice.",
    wins: ["Guided new hire onboarding", "24/7 policy & benefits Q&A", "Leave & PTO request handling", "Employee satisfaction tracking"],
    gradient: "from-purple-600 to-violet-700",
    color: "purple",
  },
  {
    slug: "operations",
    icon: BarChart2,
    title: "Operations Automation",
    tagline: "Automate the repetitive. Amplify the strategic.",
    description: "Connect your tools, monitor workflows, surface anomalies, and send daily digest reports — so your ops team spends time solving real problems, not chasing status updates across 10 systems.",
    wins: ["Cross-tool workflow automation", "Proactive anomaly alerts", "Daily ops digest reports", "Webhook & API integrations"],
    gradient: "from-violet-700 to-purple-600",
    color: "violet",
  },
];

const UseCasesPage = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
    <SEOHead
      title="HeyGenAlly Use Cases – AI Agents for Customer Support, Lead Gen, E-commerce & More"
      description="See how HeyGenAlly AI agents power customer support, lead generation, e-commerce, SaaS onboarding, HR, and operations automation. Pick your use case and start free."
      canonical="/use-cases"
    />
    <MarketingNav />

    {/* Hero */}
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Badge className="mb-6 px-4 py-2 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">
            One platform, every use case
          </Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-syne text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
        >
          Your ally for every
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">team and workflow</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10"
        >
          Sales, support, marketing, ops, HR — HeyGenAlly agents are tuned to the specific workflows of every function. Pick your use case and see how it works.
        </motion.p>
      </div>
    </section>

    {/* Use case cards */}
    <section className="pb-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {USE_CASES.map((uc, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Link to={`/use-cases/${uc.slug}`}>
                <Card className="h-full border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 p-8 group cursor-pointer">
                  <div className={`w-14 h-14 bg-gradient-to-br ${uc.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <uc.icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">{uc.tagline}</p>
                  <h2 className="font-syne text-xl font-bold text-slate-900 dark:text-white mb-3">{uc.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">{uc.description}</p>
                  <ul className="space-y-2 mb-6">
                    {uc.wins.map((w, wi) => (
                      <li key={wi} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="h-4 w-4 text-violet-500 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-semibold group-hover:gap-3 transition-all">
                    See how it works <ArrowRight className="h-4 w-4" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Social proof strip */}
    <section className="py-16 bg-gradient-to-r from-violet-700 via-purple-700 to-violet-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
        {[
          { n: "80%", label: "Tickets resolved automatically" },
          { n: "3×", label: "Faster lead response time" },
          { n: "24/7", label: "Agent availability" },
          { n: "5 min", label: "Setup time to first agent" },
        ].map(({ n, label }) => (
          <div key={label}>
            <p className="text-4xl font-bold font-syne mb-2">{n}</p>
            <p className="text-violet-200 text-sm">{label}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="relative py-24 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto px-4 text-center"
      >
        <h2 className="font-syne text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Which team gets their ally first?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-10">
          Start with one use case. Add more as you grow. It's free to begin.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white px-10 py-6 text-lg shadow-lg shadow-violet-500/25">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/features">
            <Button size="lg" variant="outline" className="px-10 py-6 text-lg border-slate-300 dark:border-slate-600">
              See All Features
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>

    <MarketingFooter />
  </div>
);

export default UseCasesPage;
