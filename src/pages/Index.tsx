import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  MessageSquare,
  Settings,
  Code,
  CheckCircle,
  Workflow,
  Brain,
  Zap,
  Database,
  Phone,
  MessageCircle,
  Video,
  Globe,
  Sparkles,
  ArrowRight,
  Bot,
  GitBranch,
  FileText,
  Shield,
  Play,
  Star,
  ChevronDown,
  Target,
  Clock,
  TrendingUp,
  Award,
  Headphones,
  Users,
  Handshake,
  Rocket,
  Heart,
  Coffee,
  Lightbulb,
  BarChart2,
  Mail,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionPlan } from "@/types";

// ─── Animated Counter ────────────────────────────────────────────────────────
const AnimatedCounter = ({
  target,
  duration = 2,
  suffix = "",
}: {
  target: number;
  duration?: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
};

// ─── Typing Animation ─────────────────────────────────────────────────────────
const roles = ["Sales Teams", "Support Agents", "Marketing Teams", "Dev Squads", "Operations", "HR Teams"];

const TypingRole = () => {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = roles[index];
    if (!deleting && displayed.length < current.length) {
      const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === current.length) {
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % roles.length);
    }
  }, [displayed, deleting, index]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-400">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// ─── Motion Variants ──────────────────────────────────────────────────────────
const float = {
  animate: { y: [0, -18, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } },
};
const float2 = {
  animate: { y: [0, 18, 0], transition: { duration: 5, repeat: Infinity, ease: "easeInOut" } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 90, damping: 14 } },
};

// ─── Component ────────────────────────────────────────────────────────────────
const Index = () => {
  const { authFetch } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroOpacity = useTransform(smooth, [0, 0.18], [1, 0]);
  const heroScale = useTransform(smooth, [0, 0.18], [1, 0.96]);

  const { data: plans, isLoading, isError } = useQuery<SubscriptionPlan[]>({
    queryKey: ["subscriptionPlans"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/subscription/plans/");
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
  });

  const storyRef = useRef(null);
  const allyRef = useRef(null);
  const featuresRef = useRef(null);
  const useCasesRef = useRef(null);
  const pricingRef = useRef(null);

  const storyInView = useInView(storyRef, { once: true, margin: "-80px" });
  const allyInView = useInView(allyRef, { once: true, margin: "-80px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });
  const useCasesInView = useInView(useCasesRef, { once: true, margin: "-80px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      {/* ── Scroll progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 z-[100] origin-left"
        style={{ scaleX: smooth }}
      />

      {/* ── Nav ── */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-3 cursor-pointer">
                <img src="/logo.png" alt="HeyGenAlly" className="h-9 w-auto" />
              </motion.div>
            </Link>

            {/* Links */}
            <div className="hidden md:flex items-center space-x-8">
              {["Story", "Features", "Use Cases", "Pricing"].map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase().replace(" ", "-")}`}
                  className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-violet-600 dark:text-slate-400">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shadow-md shadow-violet-500/30 text-white text-sm">
                    Meet Your Ally →
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO  — "Your generative ally is here"
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950" />
          <motion.div variants={float} animate="animate" className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl" />
          <motion.div variants={float2} animate="animate" className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-cyan-400/20 dark:bg-cyan-600/10 rounded-full blur-3xl" />
          <motion.div variants={float} animate="animate" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-violet-300/10 to-cyan-300/10 dark:from-violet-700/10 dark:to-cyan-700/10 rounded-full blur-3xl" />
          {/* subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
        </div>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/40 rounded-full border border-violet-300/50 dark:border-violet-600/40 mb-8"
          >
            <Handshake className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Your Generative Ally — built for teams</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-syne text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.05] tracking-tight"
          >
            <span className="text-slate-900 dark:text-white">Hey, meet your</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500">
              GenAlly
            </span>
          </motion.h1>

          {/* Subheadline with typewriter */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-4 max-w-3xl mx-auto leading-relaxed"
          >
            The AI ally your whole team has been waiting for.
            <br />
            Always on, always learning — built for{" "}
            <TypingRole />
          </motion.p>

          {/* Story hook */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12"
          >
            HeyGenAlly isn't just another chatbot. It's the teammate who never clocks out — answering customers,
            qualifying leads, routing tasks, and reporting back while your team focuses on what truly matters.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
          >
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Button size="lg" className="w-full sm:w-auto text-lg px-10 py-7 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shadow-2xl shadow-violet-500/30 hover:shadow-violet-600/50 text-white transition-all">
                  Get Your Ally Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/dashboard">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-10 py-7 border-2 border-slate-300 dark:border-slate-600 hover:border-violet-400 dark:hover:border-violet-500 transition-all">
                  <Play className="mr-2 h-5 w-5" />
                  See It in Action
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-400"
          >
            {[
              { icon: Clock, text: "Live in 5 minutes" },
              { icon: Shield, text: "No credit card needed" },
              { icon: Users, text: "Built for whole teams" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 + i * 0.1 }} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-violet-500" />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll hint */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex flex-col items-center gap-1 text-slate-400">
              <span className="text-xs">Scroll to discover your ally</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating cards */}
        <motion.div variants={float} animate="animate" className="absolute top-1/3 left-8 hidden xl:block">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg px-4 py-3 rounded-2xl shadow-2xl border border-violet-200/40 dark:border-violet-700/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Your Ally just handled</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">47 chats while you slept</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={float2} animate="animate" className="absolute top-1/2 right-8 hidden xl:block">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg px-4 py-3 rounded-2xl shadow-2xl border border-cyan-200/40 dark:border-cyan-700/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Lead conversion this week</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">↑ 3.2× vs last month</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={float} animate="animate" className="absolute bottom-1/3 left-16 hidden xl:block">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg px-4 py-3 rounded-2xl shadow-2xl border border-purple-200/40 dark:border-purple-700/30">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["from-violet-400 to-violet-600", "from-purple-400 to-purple-600", "from-cyan-400 to-cyan-600"].map((g, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 bg-gradient-to-br ${g}`} />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 pl-1">Team of 3 — managed by 1 ally</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STORY  — The narrative
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="story" ref={storyRef} className="py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section label */}
          <motion.div
            initial="hidden"
            animate={storyInView ? "visible" : "hidden"}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-6 px-4 py-2 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">
                The HeyGenAlly Story
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-syne text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Your team deserves an ally,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">not another tool to manage</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
              Most AI tools hand you a blank canvas and wish you luck. HeyGenAlly works alongside your team
              from day one — remembering context, taking action, and growing smarter with every interaction.
            </motion.p>
          </motion.div>

          {/* Story beats */}
          <div className="space-y-24">
            {/* Beat 1 */}
            <motion.div
              initial="hidden"
              animate={storyInView ? "visible" : "hidden"}
              variants={stagger}
              className="grid lg:grid-cols-2 gap-16 items-center"
            >
              <motion.div variants={fadeUp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Coffee className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest">The Problem</span>
                </div>
                <h3 className="font-syne text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  Your team is amazing.<br />But they can't be everywhere at once.
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Leads go cold at 2 AM. Support tickets pile up over weekends. Marketing campaigns go live with no one monitoring responses. Your team hustles, but human bandwidth has a ceiling.
                </p>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  You don't need more headcount — you need an ally who's always present, always on, and always learning what your business needs.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} className="relative">
                <div className="bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-800 dark:to-violet-900/20 rounded-3xl p-8 border border-violet-100 dark:border-violet-800/30">
                  {[
                    { icon: Clock, color: "from-red-400 to-red-500", text: "Lead came in at 2:47 AM", sub: "No one responded. Gone by morning.", bad: true },
                    { icon: MessageSquare, color: "from-orange-400 to-orange-500", text: "48 support tickets in queue", sub: "Team won't see them until Monday.", bad: true },
                    { icon: BarChart2, color: "from-yellow-400 to-yellow-500", text: "Campaign live — 0 monitoring", sub: "High-intent clicks with zero follow-up.", bad: true },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={storyInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.3 + i * 0.15 }}
                      className="flex items-start gap-4 mb-5 last:mb-0"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 opacity-70`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.text}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{item.sub}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Beat 2 */}
            <motion.div
              initial="hidden"
              animate={storyInView ? "visible" : "hidden"}
              variants={stagger}
              className="grid lg:grid-cols-2 gap-16 items-center"
            >
              <motion.div variants={fadeUp} className="order-2 lg:order-1 relative">
                <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-3xl p-8 text-white shadow-2xl shadow-violet-500/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">HeyGenAlly</p>
                      <p className="text-violet-300 text-xs">● Active — watching for you</p>
                    </div>
                  </div>
                  {[
                    { icon: CheckCircle, text: "Responded to 47 leads overnight", time: "2:47 AM" },
                    { icon: CheckCircle, text: "Resolved 32 support tickets automatically", time: "Sat 9:14 PM" },
                    { icon: CheckCircle, text: "Qualified 8 high-value prospects for you", time: "Sun 4:00 AM" },
                    { icon: CheckCircle, text: "Sent campaign follow-ups with context", time: "Mon 6:00 AM" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={storyInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.4 + i * 0.12 }}
                      className="flex items-start gap-3 mb-4 last:mb-0"
                    >
                      <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <span className="text-sm text-white/90">{item.text}</span>
                        <span className="text-xs text-violet-300 whitespace-nowrap">{item.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div variants={fadeUp} className="order-1 lg:order-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">The Ally Difference</span>
                </div>
                <h3 className="font-syne text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  While your team rests,<br />your ally never stops.
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  HeyGenAlly works the shifts your team can't — handling conversations with context, qualifying leads with your criteria, and resolving support issues with your knowledge base.
                </p>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Monday morning, your team walks in to a report, not a pile of missed work.
                </p>
              </motion.div>
            </motion.div>

            {/* Beat 3 */}
            <motion.div
              initial="hidden"
              animate={storyInView ? "visible" : "hidden"}
              variants={stagger}
              className="grid lg:grid-cols-2 gap-16 items-center"
            >
              <motion.div variants={fadeUp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-widest">The Promise</span>
                </div>
                <h3 className="font-syne text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  One ally for every<br />role in your team.
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                  Sales, support, marketing, ops — each team member gets an ally tuned to their workflow, their language, and their goals. HeyGenAlly adapts, not the other way around.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Target, label: "Sales", desc: "Qualifies & nurtures" },
                    { icon: Headphones, label: "Support", desc: "Resolves & escalates" },
                    { icon: BarChart2, label: "Marketing", desc: "Engages & converts" },
                    { icon: Activity, label: "Operations", desc: "Automates & reports" },
                  ].map((role, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={storyInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
                        <role.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">{role.label}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{role.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div variants={fadeUp} className="relative">
                <div className="bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-800 dark:to-violet-900/20 rounded-3xl p-8 border border-violet-100 dark:border-violet-800/30">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider">Your Ally in a day</p>
                  <div className="space-y-4">
                    {[
                      { time: "9:00 AM", event: "Briefed your team on overnight activity", icon: Users, color: "violet" },
                      { time: "11:30 AM", event: "Handled 12 support chats autonomously", icon: MessageSquare, color: "cyan" },
                      { time: "2:15 PM", event: "Qualified 3 leads — booked demos for sales", icon: Target, color: "purple" },
                      { time: "4:00 PM", event: "Sent weekly campaign digest to marketing", icon: BarChart2, color: "violet" },
                      { time: "Overnight", event: "Monitoring, responding, learning — always", icon: Sparkles, color: "cyan" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -16 }}
                        animate={storyInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        <div className="text-xs text-slate-400 w-20 flex-shrink-0 text-right">{item.time}</div>
                        <div className={`w-2 h-2 rounded-full bg-${item.color}-500 flex-shrink-0 shadow-sm`} />
                        <div className={`w-8 h-8 bg-gradient-to-br from-${item.color}-500 to-${item.color}-700 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{item.event}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS  — Social proof numbers
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-purple-700 to-violet-800" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] bg-[size:40px_40px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8 text-center text-white">
          {[
            { n: 11, s: "+", label: "Workflow Node Types" },
            { n: 8, s: "+", label: "Channel Integrations" },
            { n: 5, s: "+", label: "LLM Providers" },
            { n: 99, s: "%", label: "Uptime Guarantee" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <div className="text-5xl md:text-6xl font-bold font-syne mb-2">
                <AnimatedCounter target={stat.n} suffix={stat.s} />
              </div>
              <div className="text-violet-200 font-medium text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          USE CASES  — Role-based personalization
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="use-cases" ref={useCasesRef} className="py-32 bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-950 dark:to-violet-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={useCasesInView ? "visible" : "hidden"}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-6 px-4 py-2 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">
                Your Ally's Role
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-syne text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Every team. One ally.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">Infinite impact.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              HeyGenAlly learns your team's language, workflows, and goals — so every member gets an ally that feels built just for them.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={useCasesInView ? "visible" : "hidden"}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Target,
                role: "For Sales Teams",
                headline: "Close more. Chase less.",
                story: "Your ally qualifies every inbound lead the moment they land — scoring intent, asking the right questions, and booking demos in your calendar before your morning coffee.",
                wins: ["Auto-qualify leads 24/7", "Book demos directly to calendar", "Context-aware follow-up sequences"],
                gradient: "from-violet-600 to-purple-700",
              },
              {
                icon: Headphones,
                role: "For Support Teams",
                headline: "Resolve first. Escalate smart.",
                story: "Your ally handles Tier-1 tickets autonomously using your knowledge base. The tricky ones? It escalates with full context, so your agents start where it left off.",
                wins: ["Handle 80% of tickets solo", "Smart human escalation", "Learns from every resolution"],
                gradient: "from-purple-600 to-violet-700",
              },
              {
                icon: BarChart2,
                role: "For Marketing Teams",
                headline: "Engage every click. Convert more.",
                story: "Your ally turns campaign traffic into conversations — engaging visitors at peak intent, nurturing them through the funnel, and feeding your CRM with rich data.",
                wins: ["Engage high-intent visitors instantly", "Personalized nurture flows", "CRM sync with context"],
                gradient: "from-cyan-500 to-violet-600",
              },
              {
                icon: Phone,
                role: "For Voice & Field Teams",
                headline: "Voice-first. Always available.",
                story: "Deploy a voice ally for inbound calls, appointment booking, and outreach. It sounds natural, handles objections, and transfers seamlessly when humans need to step in.",
                wins: ["Natural voice conversations", "Smart call routing & transfer", "Appointment booking built-in"],
                gradient: "from-violet-600 to-cyan-500",
              },
              {
                icon: Activity,
                role: "For Operations",
                headline: "Automate the repetitive. Amplify the strategic.",
                story: "Your ally connects your tools, monitors workflows, and surfaces insights — so your ops team spends time solving problems, not chasing status updates.",
                wins: ["Workflow automation across tools", "Proactive anomaly alerts", "Daily ops digest reports"],
                gradient: "from-purple-600 to-cyan-500",
              },
              {
                icon: Users,
                role: "For HR & People Teams",
                headline: "Onboard faster. Retain better.",
                story: "From answering policy questions to guiding new hires through onboarding, your ally is the first face every employee meets — and the most patient one at that.",
                wins: ["24/7 employee FAQs", "Guided onboarding journeys", "Leave, policy & benefits queries"],
                gradient: "from-violet-700 to-purple-600",
              },
            ].map((card, idx) => (
              <motion.div key={idx} variants={fadeUp}>
                <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="h-full p-8 border-2 border-slate-200/50 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 bg-white dark:bg-slate-800/50 group">
                    <motion.div whileHover={{ scale: 1.1, rotate: 4 }} className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-xl`}>
                      <card.icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">{card.role}</p>
                    <h3 className="font-syne text-xl font-bold text-slate-900 dark:text-white mb-3">{card.headline}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">{card.story}</p>
                    <ul className="space-y-2">
                      {card.wins.map((w, wi) => (
                        <li key={wi} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle className="h-4 w-4 text-violet-500 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES  — The ally's superpowers
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" ref={featuresRef} className="py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-6 px-4 py-2 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">
                Ally Superpowers
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-syne text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              What makes your ally<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">genuinely powerful</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Behind every great ally is serious infrastructure. Here's what HeyGenAlly brings to your team's table.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Workflow,
                title: "Visual Workflow Builder",
                description: "Drag-and-drop your ally's brain. 11+ node types including LLM reasoning, conditional branching, tool calls, and code execution — no engineering degree needed.",
                gradient: "from-violet-600 to-purple-700",
              },
              {
                icon: Brain,
                title: "Multi-LLM Intelligence",
                description: "Your ally can think with GPT-4, Claude, Gemini, Groq, or NVIDIA — whichever model fits the task. Switch providers per workflow without rebuilding anything.",
                gradient: "from-purple-600 to-violet-700",
              },
              {
                icon: Database,
                title: "Deep Knowledge Memory",
                description: "Upload your docs, PDFs, and web content. Your ally searches them semantically using ChromaDB, FAISS, or LanceDB — giving answers grounded in your reality.",
                gradient: "from-cyan-500 to-violet-600",
              },
              {
                icon: Globe,
                title: "Everywhere Your Customers Are",
                description: "WhatsApp, Instagram, Messenger, Telegram, Email, SMS, or your website — one ally, all channels. Your customers choose. Your ally shows up.",
                gradient: "from-violet-600 to-cyan-500",
              },
              {
                icon: Video,
                title: "Voice & Video Ready",
                description: "Give your ally a voice. VAPI-powered voice agents and LiveKit video calls — so your ally can handle support calls, demos, and real-time conversations.",
                gradient: "from-purple-600 to-cyan-500",
              },
              {
                icon: Code,
                title: "Custom Tools & MCP",
                description: "Your ally can use any tool you build — Python-powered custom tools, pre-built connectors, and full Model Context Protocol (MCP) support for any integration.",
                gradient: "from-violet-700 to-purple-600",
              },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="h-full border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden group">
                    <CardHeader>
                      <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }} className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <f.icon className="h-7 w-7 text-white" />
                      </motion.div>
                      <CardTitle className="text-xl text-slate-900 dark:text-white">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">{f.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TESTIMONIAL  — Social proof with story
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-950 dark:to-violet-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}
            </div>
            <blockquote className="text-2xl md:text-3xl font-medium text-slate-800 dark:text-white max-w-4xl mx-auto mb-6 leading-relaxed">
              "HeyGenAlly felt like hiring three people overnight. Our sales team closes on Monday what used to take the full week — because the ally worked the whole weekend."
            </blockquote>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">It didn't replace anyone. It made everyone on the team twice as effective.</p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold font-syne text-lg">
                SA
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900 dark:text-white">Sofia Amara</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Head of Growth, ScaleUp.io</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════════════ */}
      {plans && plans.length > 0 && (
        <section id="pricing" ref={pricingRef} className="py-32 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              animate={pricingInView ? "visible" : "hidden"}
              variants={stagger}
              className="text-center mb-20"
            >
              <motion.div variants={fadeUp}>
                <Badge className="mb-6 px-4 py-2 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">
                  Choose Your Ally Plan
                </Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="font-syne text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                Simple pricing.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">Serious ally.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Start free. Scale as your ally grows with your team. No hidden fees, no surprises.
              </motion.p>
            </motion.div>

            {isLoading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
            {isError && <div className="text-center text-red-500 py-8">Could not load plans. Please try again.</div>}

            <motion.div
              initial="hidden"
              animate={pricingInView ? "visible" : "hidden"}
              variants={stagger}
              className="grid md:grid-cols-3 gap-8"
            >
              {plans.map((plan) => {
                const isPro = plan.name.toLowerCase().includes("pro");
                return (
                  <motion.div key={plan.id} variants={fadeUp}>
                    <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                      <Card className={`relative h-full flex flex-col justify-between p-8 border-2 ${isPro ? "border-violet-500 dark:border-violet-400 shadow-2xl shadow-violet-500/20" : "border-slate-200/50 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-600"} transition-all duration-300 bg-white dark:bg-slate-800/50 overflow-hidden`}>
                        {isPro && (
                          <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-600 to-purple-700 text-white px-4 py-1.5 rounded-bl-xl text-sm font-semibold">
                            Most Popular
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-2xl font-bold font-syne mb-4 text-slate-900 dark:text-white">{plan.name}</CardTitle>
                          <div className="mb-8">
                            <span className="text-5xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                            <span className="text-xl text-slate-500 dark:text-slate-400 ml-2">{plan.currency}/month</span>
                          </div>
                          <ul className="space-y-4 mb-8">
                            {plan.features &&
                              plan.features.split(",").map((f, i) => (
                                <motion.li key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                  <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{f.trim()}</span>
                                </motion.li>
                              ))}
                          </ul>
                        </div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button className={`w-full py-6 text-base font-semibold ${isPro ? "bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shadow-lg shadow-violet-500/25" : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"} text-white`}>
                            Get Your Ally
                          </Button>
                        </motion.div>
                      </Card>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CTA  — Final emotional close
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-purple-700 to-violet-800" />
        <div className="absolute inset-0">
          <motion.div variants={float} animate="animate" className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <motion.div variants={float2} animate="animate" className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
        >
          <motion.div initial={{ scale: 0.8 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 100 }}>
            <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Handshake className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h2 className="font-syne text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your team is ready.<br />
            Is your ally?
          </h2>
          <p className="text-xl mb-12 text-violet-100 max-w-2xl mx-auto leading-relaxed">
            Join teams who stopped managing tools and started working with an ally that actually has their back — every shift, every channel, every goal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Button size="lg" className="w-full sm:w-auto bg-white text-violet-700 hover:bg-slate-100 text-lg px-12 py-7 shadow-2xl hover:shadow-white/20 font-semibold transition-all">
                  Meet Your Ally — It's Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/dashboard">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/60 text-white hover:bg-white/10 hover:border-white text-lg px-10 py-7 font-semibold backdrop-blur">
                  See a Live Demo
                </Button>
              </motion.div>
            </Link>
          </div>
          <p className="mt-8 text-sm text-violet-300">No credit card. No lock-in. Just your ally, ready in 5 minutes.</p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center space-x-3 mb-6"
              >
                <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-2.5 rounded-xl shadow-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold font-syne">HeyGenAlly</span>
              </motion.div>
              <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
                Your generative ally — always on, always learning, always in your corner. Built for teams who want to move faster without burning out.
              </p>
              <div className="flex gap-3 flex-wrap">
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
                <li><Link to="/signup" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Get Your Ally</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-6">Resources</h3>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Support</a></li>
                <li><Link to="/security" className="hover:text-white transition-colors hover:translate-x-1 inline-block">Security & Trust</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">© 2026 HeyGenAlly. Your generative ally — built for your team's success.</p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
              <Link to="/security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
