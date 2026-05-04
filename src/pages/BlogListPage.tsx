import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav, MarketingFooter } from "@/components/MarketingLayout";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { getAllPosts } from "@/data/blogPosts";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const CATEGORY_COLORS: Record<string, string> = {
  "How-To": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "Comparison": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "Education": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "Guide": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const BlogListPage = () => {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      <SEOHead
        title="HeyGenAlly Blog – AI Agent Guides, Tutorials & Industry Insights"
        description="Learn how to build AI agents, automate customer support, generate leads, and grow your business. Practical guides and tutorials from the HeyGenAlly team."
        canonical="/blog"
      />
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-6 px-4 py-2 text-sm bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-700">
              The HeyGenAlly Blog
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-syne text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
          >
            Build smarter.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">Grow faster.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Practical guides on building AI agents, automating customer support, generating leads, and scaling your business with AI.
          </motion.p>
        </div>
      </section>

      {/* Featured post */}
      {featured && (
        <section className="pb-12 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Link to={`/blog/${featured.slug}`}>
                <Card className="border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-white dark:from-slate-800 dark:to-slate-800/50 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden group cursor-pointer">
                  <div className="p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-6">
                      <Badge className={`text-xs ${CATEGORY_COLORS[featured.category] ?? "bg-slate-100 text-slate-700"}`}>
                        {featured.category}
                      </Badge>
                      <span className="text-sm text-slate-400">Featured</span>
                    </div>
                    <h2 className="font-syne text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 max-w-3xl leading-relaxed">
                      {featured.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(featured.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {featured.readTime}
                      </div>
                      <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-medium group-hover:gap-3 transition-all">
                        Read article <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* All posts grid */}
      <section className="py-12 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {rest.length > 0 && (
            <>
              <h2 className="font-syne text-2xl font-bold text-slate-900 dark:text-white mb-8">All articles</h2>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {rest.map((post) => (
                  <motion.div key={post.slug} variants={fadeUp}>
                    <Link to={`/blog/${post.slug}`}>
                      <Card className="h-full border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 p-6 group cursor-pointer flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <Badge className={`text-xs ${CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-700"}`}>
                            {post.category}
                          </Badge>
                        </div>
                        <h3 className="font-syne text-lg font-bold text-slate-900 dark:text-white mb-3 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed line-clamp-3">
                          {post.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(post.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {post.readTime}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-violet-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
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
          <h2 className="font-syne text-4xl font-bold mb-4">Ready to build your first AI agent?</h2>
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

export default BlogListPage;
