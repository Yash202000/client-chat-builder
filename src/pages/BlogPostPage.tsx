import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { MarketingNav, MarketingFooter } from "@/components/MarketingLayout";
import { ArrowRight, ArrowLeft, Clock, Calendar } from "lucide-react";
import { getPostBySlug, getRelatedPosts } from "@/data/blogPosts";

const CATEGORY_COLORS: Record<string, string> = {
  "How-To": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "Comparison": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "Education": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "Guide": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : null;

  if (!post) return <Navigate to="/blog" replace />;

  const related = getRelatedPosts(post.relatedSlugs);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      <SEOHead
        title={post.title}
        description={post.description}
        canonical={`/blog/${post.slug}`}
      />
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> All articles
            </Link>
            <div className="flex items-center gap-3 mb-6">
              <Badge className={`text-xs ${CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-700"}`}>
                {post.category}
              </Badge>
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <Clock className="h-4 w-4" /> {post.readTime}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <Calendar className="h-4 w-4" /> {formatDate(post.date)}
              </span>
            </div>
            <h1 className="font-syne text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              {post.description}
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 pb-8 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {post.author.name[0]}
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">{post.author.name}</span>
                <span className="mx-2">·</span>
                <span>{post.author.role}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article content */}
      <section className="py-12 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-slate dark:prose-invert prose-lg max-w-none
              prose-headings:font-syne prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-slate-900 dark:prose-h2:text-white
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-slate-800 dark:prose-h3:text-slate-100
              prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-p:my-4
              prose-li:text-slate-600 dark:prose-li:text-slate-400
              prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-semibold
              prose-code:text-violet-600 dark:prose-code:text-violet-400 prose-code:bg-violet-50 dark:prose-code:bg-violet-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal
              prose-pre:bg-slate-900 dark:prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700
              prose-blockquote:border-violet-500 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
              prose-hr:border-slate-200 dark:prose-hr:border-slate-700
              prose-table:text-sm
              prose-th:text-slate-700 dark:prose-th:text-slate-300 prose-th:font-semibold
              prose-td:text-slate-600 dark:prose-td:text-slate-400
              prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
            "
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </motion.div>

          {/* CTA inside article */}
          <div className="mt-16 p-8 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-3xl border-2 border-violet-200 dark:border-violet-800 text-center">
            <h3 className="font-syne text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Ready to build your AI agent?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Start free in 5 minutes. No credit card, no engineering required.
            </p>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white px-8 py-5 text-base shadow-lg shadow-violet-500/25">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="font-syne text-2xl font-bold text-slate-900 dark:text-white mb-8">Related articles</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {related.map((rp) => (
                <Link key={rp.slug} to={`/blog/${rp.slug}`}>
                  <Card className="p-5 border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg transition-all group cursor-pointer h-full">
                    <Badge className={`text-xs mb-3 ${CATEGORY_COLORS[rp.category] ?? "bg-slate-100 text-slate-700"}`}>
                      {rp.category}
                    </Badge>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {rp.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{rp.readTime}</p>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/blog">
                <Button variant="outline" className="border-slate-300 dark:border-slate-600">
                  See all articles <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <MarketingFooter />
    </div>
  );
};

export default BlogPostPage;
