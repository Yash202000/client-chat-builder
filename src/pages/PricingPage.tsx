import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav, MarketingFooter } from "@/components/MarketingLayout";
import { CheckCircle, ArrowRight, HelpCircle, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionPlan } from "@/types";
import { apiFetch } from "@/lib/api";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const PLAN_FEATURES: Record<string, string[]> = {
  "free trial": [
    "1 AI agent",
    "100 conversations / month",
    "Web chat widget",
    "Basic knowledge base (1 KB)",
    "WhatsApp, Instagram, Facebook channels",
    "Lead & contact management (up to 100)",
    "Email support",
    "Community access",
  ],
  starter: [
    "3 AI agents",
    "1,000 conversations / month",
    "All messaging channels (WhatsApp, Instagram, FB, SMS)",
    "Knowledge base (5 KB, 50 MB storage)",
    "CRM — Leads, Contacts, Deals",
    "Basic workflow automation",
    "Campaign broadcasts",
    "Voice AI (inbound)",
    "Email support (48 h SLA)",
  ],
  growth: [
    "10 AI agents",
    "5,000 conversations / month",
    "All channels + Email inbox",
    "Knowledge base (20 KB, 500 MB storage)",
    "Full CRM — Pipelines, Deals, Tags, Segments",
    "Advanced workflow automation",
    "Campaign broadcasts + scheduling",
    "Voice AI (inbound + outbound)",
    "Social media hub",
    "Analytics & reports",
    "Priority email support (24 h SLA)",
  ],
  pro: [
    "Unlimited AI agents",
    "20,000 conversations / month",
    "All channels + Omnichannel inbox",
    "Knowledge base (unlimited, 5 GB storage)",
    "Full CRM + Sales pipelines",
    "Advanced workflows + API integrations",
    "Voice AI + call queue + supervisor dashboard",
    "Social media hub + post scheduler",
    "White-label chat widget",
    "Developer API & webhooks",
    "Dedicated Slack support",
    "99.9% uptime SLA",
  ],
  enterprise: [
    "Everything in Pro — unlimited",
    "Custom conversation volume",
    "Self-hosted deployment (Docker / Kubernetes)",
    "SSO & SAML authentication",
    "Custom AI model integrations",
    "Dedicated infrastructure",
    "Data residency & GDPR compliance",
    "Custom SLA & uptime guarantee",
    "Dedicated customer success manager",
    "White-glove onboarding",
    "Custom integrations & development support",
    "Invoice billing & PO support",
  ],
};

const getPlanFeatures = (plan: SubscriptionPlan): string[] => {
  const key = plan.name.toLowerCase().trim();
  if (PLAN_FEATURES[key]) return PLAN_FEATURES[key];
  // fuzzy match prefix
  const match = Object.keys(PLAN_FEATURES).find((k) => key.includes(k) || k.includes(key));
  if (match) return PLAN_FEATURES[match];
  // fallback: parse comma-separated from DB
  if (plan.features && plan.features !== "all") return plan.features.split(",").map((f) => f.trim()).filter(Boolean);
  return [];
};

const getPlanCTA = (plan: SubscriptionPlan) => {
  const key = plan.name.toLowerCase();
  if (key.includes("enterprise")) return { label: "Contact Sales", href: "/contact" };
  if (plan.price === 0) return { label: "Start Free", href: "/signup" };
  return { label: "Get Started", href: "/signup" };
};

const formatPrice = (price: number, currency: string) => {
  if (price === 0) return { symbol: "", amount: "Free" };
  const symbol = currency?.toUpperCase() === "INR" ? "₹" : "$";
  return { symbol, amount: price.toLocaleString("en-IN") };
};

const FAQS = [
  {
    q: "Is there really a free plan?",
    a: "Yes. The free plan includes a fully functional AI agent, one channel, and up to 100 conversations per month. No credit card required to start.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade or downgrade any time. Changes take effect immediately and billing is prorated.",
  },
  {
    q: "Do you offer self-hosted deployment?",
    a: "Yes. Enterprise plans include full self-hosted deployment with Docker/Kubernetes. Your data never leaves your infrastructure.",
  },
  {
    q: "What LLMs are included?",
    a: "All plans include access to OpenAI, Anthropic Claude, Google Gemini, Groq, and NVIDIA models. You bring your own API keys.",
  },
  {
    q: "Is there a setup fee?",
    a: "No setup fees, no onboarding fees, no hidden costs. You pay only for your plan.",
  },
  {
    q: "What kind of support do I get?",
    a: "Free plans get community support. Pro plans get email support with 24-hour response. Enterprise gets dedicated Slack/Teams support and a success manager.",
  },
];

const PricingPage = () => {
  const { data: plans, isLoading, isError } = useQuery<SubscriptionPlan[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const res = await apiFetch("/api/v1/billing/plans");
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
  });

  const showFallback = isError || (!isLoading && (!plans || plans.length === 0));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      <SEOHead
        title="HeyGenAlly Pricing – Free AI Agent Builder Plan. No Credit Card."
        description="HeyGenAlly offers a free plan to get started, with Pro and Enterprise tiers as you scale. No credit card, no setup fees, no lock-in. Start building your AI agent today."
        canonical="/pricing"
      />
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-6 px-4 py-2 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">
              Simple, honest pricing
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-syne text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
          >
            Simple pricing.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">Serious ally.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-400 mb-4"
          >
            Start free. Scale as your ally grows with your team.
            <br />No hidden fees, no surprises, no lock-in.
          </motion.p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading && (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 mt-4">Loading plans…</p>
            </div>
          )}
          {showFallback && (
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="grid md:grid-cols-3 gap-8"
              >
                {[
                  {
                    name: "Free",
                    price: "0",
                    currency: "USD",
                    description: "For individuals and small teams getting started with AI agents.",
                    features: ["1 AI agent", "100 conversations/month", "Web chat widget", "Basic knowledge base", "Community support"],
                    isPro: false,
                  },
                  {
                    name: "Pro",
                    price: "49",
                    currency: "USD",
                    description: "For growing teams that need more power, channels, and automation.",
                    features: ["Unlimited agents", "5,000 conversations/month", "All channels (WhatsApp, Instagram, SMS)", "CRM & lead management", "Voice AI", "Email support (24h)"],
                    isPro: true,
                  },
                  {
                    name: "Enterprise",
                    price: "Custom",
                    currency: "",
                    description: "For large teams and enterprises that need full control and compliance.",
                    features: ["Unlimited everything", "Self-hosted deployment", "SSO & SAML", "Dedicated success manager", "SLA guarantee", "Custom integrations"],
                    isPro: false,
                  },
                ].map((plan, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className={`relative h-full flex flex-col p-8 border-2 ${plan.isPro ? "border-violet-500 dark:border-violet-400 shadow-2xl shadow-violet-500/20" : "border-slate-200/50 dark:border-slate-700/50"} bg-white dark:bg-slate-800/50`}>
                      {plan.isPro && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-purple-700 text-white px-4 py-1.5 rounded-bl-xl text-sm font-semibold">
                          Most Popular
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-bold font-syne mb-2 text-slate-900 dark:text-white">{plan.name}</CardTitle>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{plan.description}</p>
                        <div className="mb-8">
                          {plan.price === "Custom" ? (
                            <span className="text-4xl font-bold text-slate-900 dark:text-white">Custom</span>
                          ) : (
                            <>
                              <span className="text-5xl font-bold text-slate-900 dark:text-white">${plan.price}</span>
                              <span className="text-xl text-slate-500 dark:text-slate-400 ml-2">/ month</span>
                            </>
                          )}
                        </div>
                        <ul className="space-y-4 mb-8">
                          {plan.features.map((f, fi) => (
                            <li key={fi} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                              <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link to="/signup" className="w-full">
                        <Button className={`w-full py-6 text-base font-semibold ${plan.isPro ? "bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shadow-lg shadow-violet-500/25" : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"} text-white`}>
                          {plan.price === "Custom" ? "Contact Sales" : plan.price === "0" ? "Start Free" : "Get Your Ally"}
                        </Button>
                      </Link>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
          {plans && plans.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {plans.map((plan) => {
                const isPro = plan.name.toLowerCase().includes("pro");
                const isEnterprise = plan.name.toLowerCase().includes("enterprise");
                const { symbol, amount } = formatPrice(plan.price, plan.currency);
                const features = getPlanFeatures(plan);
                const cta = getPlanCTA(plan);
                return (
                  <motion.div key={plan.id} variants={fadeUp} className="flex">
                    <Card className={`relative w-full flex flex-col p-8 border-2 ${
                      isPro
                        ? "border-violet-500 dark:border-violet-400 shadow-2xl shadow-violet-500/20"
                        : isEnterprise
                        ? "border-slate-700 dark:border-slate-500 bg-slate-900 dark:bg-slate-800"
                        : "border-slate-200/50 dark:border-slate-700/50"
                    } bg-white dark:bg-slate-800/50`}>
                      {isPro && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-purple-700 text-white px-4 py-1.5 rounded-bl-xl text-sm font-semibold">
                          Most Popular
                        </div>
                      )}
                      {isEnterprise && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-slate-700 to-slate-900 text-white px-4 py-1.5 rounded-bl-xl text-sm font-semibold">
                          Custom
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className={`text-2xl font-bold font-syne mb-2 ${isEnterprise ? "text-white" : "text-slate-900 dark:text-white"}`}>
                          {plan.name}
                        </CardTitle>
                        <div className="mb-6 mt-4">
                          {amount === "Free" ? (
                            <div>
                              <span className={`text-5xl font-bold ${isEnterprise ? "text-white" : "text-slate-900 dark:text-white"}`}>Free</span>
                              <span className={`text-sm ml-2 ${isEnterprise ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>no credit card</span>
                            </div>
                          ) : isEnterprise ? (
                            <div>
                              <span className="text-4xl font-bold text-white">Custom</span>
                              <span className="text-sm ml-2 text-slate-300">pricing</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-2xl font-bold text-slate-900 dark:text-white">{symbol}</span>
                              <span className="text-5xl font-bold text-slate-900 dark:text-white">{amount}</span>
                              <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">/ month</span>
                            </div>
                          )}
                        </div>
                        <ul className="space-y-3 mb-8">
                          {features.map((f, i) => (
                            <li key={i} className={`flex items-start gap-3 ${isEnterprise ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}`}>
                              <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isEnterprise ? "text-violet-400" : "text-violet-500"}`} />
                              <span className="text-sm leading-snug">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link to={cta.href} className="w-full">
                        <Button className={`w-full py-6 text-base font-semibold ${
                          isPro
                            ? "bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shadow-lg shadow-violet-500/25 text-white"
                            : isEnterprise
                            ? "bg-white text-slate-900 hover:bg-slate-100"
                            : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white"
                        }`}>
                          {cta.label}
                        </Button>
                      </Link>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
            {["No credit card to start", "Cancel any time", "No setup fees", "GDPR compliant", "AES-256 encrypted"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-violet-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-syne text-4xl font-bold text-slate-900 dark:text-white mb-4">Frequently asked questions</h2>
            <p className="text-slate-600 dark:text-slate-400">Everything you need to know before you start.</p>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-6"
          >
            {FAQS.map((faq, i) => (
              <motion.div key={i} variants={fadeUp} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white mb-2">{faq.q}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
          <Zap className="h-12 w-12 mx-auto mb-6 text-yellow-300" />
          <h2 className="font-syne text-4xl font-bold mb-4">Start building in 5 minutes</h2>
          <p className="text-violet-100 text-lg mb-10">Free plan, no credit card. Your ally is waiting.</p>
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

export default PricingPage;
