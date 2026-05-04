export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  readTime: string;
  author: { name: string; role: string };
  content: string;
  relatedSlugs: string[];
};

const posts: BlogPost[] = [
  {
    slug: "how-to-build-ai-chatbot-customer-support",
    title: "How to Build an AI Chatbot for Customer Support in 2026",
    description:
      "A step-by-step guide to building an AI customer support agent that resolves tickets 24/7, uses your knowledge base, and escalates to humans when needed — without writing a single line of code.",
    date: "2026-05-01",
    category: "How-To",
    readTime: "8 min read",
    author: { name: "HeyGenAlly Team", role: "Product" },
    relatedSlugs: [
      "what-is-rag-train-ai-on-your-documents",
      "ai-agent-builder-comparison-2026",
    ],
    content: `
## Why AI customer support is no longer optional

The math is brutal. The average support ticket costs $15–$50 to resolve by a human agent. An AI agent resolves the same ticket for a fraction of a cent. And unlike your human team, the AI works at 3am on a Sunday without complaint.

But the real reason businesses are moving fast on AI support isn't cost — it's customer expectation. A 2025 Zendesk study found that 72% of customers expect a response within 5 minutes when they message a business. Human teams can't do that. AI can.

Here's how to build one.

---

## Step 1: Define what your agent should handle

Before you write a single prompt, map your support requests into three buckets:

**Tier 1 — Automate fully:** FAQs, order status, password resets, policy questions, refund eligibility checks. These should never touch a human agent.

**Tier 2 — Assist and escalate:** Complex technical issues, billing disputes, emotionally charged complaints. The AI handles the first response and gathers context, then routes to a human with everything ready.

**Tier 3 — Human-only:** Legal matters, executive escalations, anything requiring judgment or authority. Route immediately, no AI involvement.

Write out your top 20 support ticket types. Assign each to a tier. This is your agent's job description.

---

## Step 2: Build your knowledge base

Your AI agent is only as good as the knowledge you give it. This is where most teams underinvest — and then wonder why the agent gives wrong answers.

Your knowledge base should include:

- **Product documentation** — Features, how-tos, known limitations
- **FAQs** — The 20 questions you get asked every day
- **Policy documents** — Refund policy, SLA, terms of service
- **Troubleshooting guides** — Step-by-step fixes for common issues
- **Pricing information** — Plans, what's included, upgrade paths

In HeyGenAlly, you upload these as PDFs, Word docs, or URLs. The platform converts them into vector embeddings and stores them in a semantic search index. When a customer asks a question, the agent doesn't keyword-match — it semantically searches for the most relevant chunk and uses it to ground its answer.

This is called RAG (Retrieval-Augmented Generation). It's what stops your AI from hallucinating and gives it accurate, sourced answers.

---

## Step 3: Design your conversation workflow

This is where no-code workflow builders earn their keep. In HeyGenAlly, you build your agent's logic visually:

1. **Customer message received** → Trigger node
2. **Classify intent** → LLM node (GPT-4o or Claude) classifies the message into your categories
3. **Branch** → Conditional node routes to different flows based on classification
4. **Search knowledge base** → RAG node finds the relevant context
5. **Generate response** → LLM node writes the reply using the KB context
6. **Escalate if needed** → Condition: if confidence < threshold, route to human queue

For Tier 1 topics, the workflow ends at step 6 with a resolved ticket. For Tier 2, it routes to a human with the full conversation context pre-populated.

Design your workflow for the top 5 ticket categories first. You can expand later.

---

## Step 4: Set your escalation rules

The worst thing an AI support agent can do is confidently give a wrong answer. Set clear escalation triggers:

- **Confidence threshold** — If the agent isn't sure, escalate
- **Sentiment detection** — If the customer expresses frustration or anger, route to human
- **Topic triggers** — Legal, safety, account deletion always go to humans
- **Explicit request** — "I want to talk to a person" always overrides

In HeyGenAlly, you set these as conditions in your workflow. The agent never gets stubborn — it escalates gracefully with a message like "Let me connect you with one of my colleagues who can help with this."

---

## Step 5: Choose your channels

Your customers don't all use the same channel. Deploy your agent where they are:

- **Website chat widget** — Highest intent, usually the best place to start
- **WhatsApp** — Essential if you have a mobile-heavy customer base
- **Email** — Your agent can respond to support email threads automatically
- **Instagram / Facebook Messenger** — Critical for D2C and e-commerce brands
- **SMS** — Good for transactional notifications and simple Q&A

In HeyGenAlly, you connect all channels to the same agent. One agent, one knowledge base, every channel.

---

## Step 6: Test before you ship

Before going live, run your agent through 50 real historical tickets — use your last month of support data. Check:

- Does it give accurate answers?
- Does it escalate when it should?
- Does it stay on-topic and not go rogue?
- Does it handle edge cases gracefully?

Adjust your knowledge base content and workflow logic based on what breaks. Most issues at this stage are knowledge base gaps, not agent logic failures.

---

## Step 7: Monitor and improve

Your agent gets smarter every week if you invest in it. Review:

- **Resolution rate** — % of tickets resolved without human intervention
- **Escalation rate** — Are too many tickets going to humans? Is the KB incomplete?
- **CSAT scores** — Are customers happy with AI-resolved tickets?
- **Common failures** — What topics is the agent getting wrong? Add those to the KB.

Set a weekly 30-minute review. After 4 weeks, most teams see their AI resolution rate climb from 40% to 70%+.

---

## The bottom line

Building an AI customer support agent in 2026 is not a 6-month engineering project. With the right platform, it's a 1–2 week project for a non-technical team — and it starts paying back in week 3.

The teams that move fast on this create a compounding advantage: lower support costs, faster response times, happier customers, and a human team that focuses on work that actually matters.

The ones that wait are going to spend 2027 catching up.
    `.trim(),
  },

  {
    slug: "ai-agent-builder-comparison-2026",
    title: "Best AI Agent Builders in 2026 — Compared",
    description:
      "A no-fluff comparison of the top AI agent builder platforms in 2026. What each one does well, where they fall short, and how to pick the right one for your team.",
    date: "2026-04-22",
    category: "Comparison",
    readTime: "10 min read",
    author: { name: "HeyGenAlly Team", role: "Product" },
    relatedSlugs: [
      "how-to-build-ai-chatbot-customer-support",
      "what-is-rag-train-ai-on-your-documents",
    ],
    content: `
## The AI agent builder landscape in 2026

Two years ago, "AI chatbot" meant a decision-tree bot with canned responses. Today it means something fundamentally different: agents that reason, use tools, search knowledge bases, integrate with your CRM, and hand off to humans mid-conversation.

The market has exploded. There are now dozens of platforms claiming to be "AI agent builders." Most aren't. Here's an honest look at what's available and how to pick.

---

## What separates a real AI agent builder from a chatbot tool

Before comparing platforms, it's worth defining what a real AI agent builder needs to do:

- **LLM reasoning** — Not just keyword matching. The agent needs to understand intent and context.
- **Tool use** — The agent needs to take actions: search a database, update a CRM record, send an email.
- **Knowledge base (RAG)** — The agent needs to search your actual documents for accurate answers.
- **Multi-channel** — Deploy to web, WhatsApp, email, SMS, voice — not just one channel.
- **Workflow logic** — Branching, conditions, escalation rules, multi-step flows.
- **Human handoff** — Graceful escalation with full context preserved.

Most tools marketed as "AI chatbot builders" do none of these things beyond basic LLM chat. Keep that in mind.

---

## Platform comparison

### HeyGenAlly

**Best for:** Teams that want an all-in-one platform — agent builder, CRM, knowledge base, multi-channel, voice AI — without stitching together multiple tools.

HeyGenAlly is the most complete end-to-end platform in this list. The visual workflow builder supports 11+ node types including LLM reasoning, RAG search, conditional branching, code execution, webhook calls, and CRM actions. You can deploy the same agent to WhatsApp, Instagram, Telegram, email, SMS, web chat, and voice — all from one dashboard.

The built-in CRM means leads and contacts captured by your agent automatically appear in your pipeline. The knowledge base supports PDF, DOCX, URL, and CSV ingestion with semantic search. Voice AI via VAPI lets you deploy phone agents without a separate service.

**What it does well:** Breadth of features, multi-channel depth, built-in CRM, voice AI, no-code workflow builder.

**What to watch:** Newer platform — the ecosystem is growing but smaller than Intercom or Zendesk.

**Pricing:** Free plan available. Pro from $49/month.

---

### Intercom

**Best for:** Mid-market SaaS companies with an existing Intercom subscription looking to add AI to their existing support workflow.

Intercom's Fin AI is solid for in-product support chat. It uses your existing help articles and handles straightforward queries well. The handoff to human agents is smooth within the Intercom inbox.

**What it does well:** Seamless human handoff, strong product analytics, good for companies already on Intercom.

**What to watch:** Expensive for the feature set. Limited multi-channel support. No visual workflow builder — you're locked into their AI's behaviour. No voice. No CRM beyond their own contact records.

**Pricing:** Starts at $74/month, AI features are add-ons.

---

### Voiceflow

**Best for:** Developer teams that want deep customisation and are comfortable with a more technical interface.

Voiceflow is strong on conversational design. The canvas is powerful for mapping complex dialogue flows. It integrates well with external APIs and has good developer tooling.

**What it does well:** Complex dialogue design, developer-friendly, good API integrations.

**What to watch:** Steep learning curve. No built-in CRM. No native multi-channel deployment. Voice features require additional services. Primarily for developers, not operations or support teams.

**Pricing:** Free tier limited. Teams plan from $50/month per editor.

---

### Botpress

**Best for:** Technical teams who want an open-source foundation they can self-host and extend.

Botpress is developer-first. The open-source version is powerful and extensible. The cloud version has improved significantly in 2025 with better no-code tooling.

**What it does well:** Open source, self-hostable, strong developer community, good NLU.

**What to watch:** No-code experience is still rough. No built-in knowledge base. No CRM. Multi-channel requires significant setup. Not suitable for non-technical users.

**Pricing:** Free self-hosted. Cloud from $495/month for teams.

---

### Tidio

**Best for:** Small e-commerce businesses that want a simple, affordable chatbot with basic AI features.

Tidio is easy to set up and works well for small Shopify or WooCommerce stores. The AI features are basic but functional for simple Q&A and lead capture.

**What it does well:** Easy setup, e-commerce integrations, affordable pricing, good UI.

**What to watch:** Limited AI reasoning. No visual workflow builder. No knowledge base RAG. Not suitable for complex support or enterprise use cases.

**Pricing:** Free plan. Paid from $29/month.

---

## How to choose

Use this decision framework:

**You need a complete platform (agent + CRM + multi-channel + voice):** → HeyGenAlly

**You're already on Intercom and want to add AI to existing workflow:** → Intercom Fin

**You're a developer team building a highly custom agent:** → Voiceflow or Botpress

**You're a small e-commerce store with simple needs:** → Tidio

**You want to self-host on your own infrastructure:** → Botpress (open source) or HeyGenAlly (enterprise)

---

## The questions to ask any vendor

Before you sign up, ask:

1. Can I see the visual workflow builder or is it a black box?
2. Does the knowledge base use RAG or keyword matching?
3. Which LLM providers are supported — and can I switch?
4. Can I deploy to WhatsApp, SMS, and voice from the same platform?
5. Is there a built-in CRM or do I need to integrate Salesforce/HubSpot?
6. What does escalation look like — does the human agent get full context?
7. What does the pricing look like at 10,000 conversations/month?

The answers will tell you quickly whether you're looking at a real agent builder or a chatbot with an AI layer painted over it.

---

## The bottom line

The best AI agent builder is the one your team will actually use. For most businesses — especially those without a dedicated dev team — that means a platform that's powerful but doesn't require engineering to operate.

The market is moving fast. Platforms that were leading in 2024 have been overtaken by newer entrants with more complete feature sets. Evaluate based on where you're going, not where you are today.
    `.trim(),
  },

  {
    slug: "what-is-rag-train-ai-on-your-documents",
    title: "What is RAG? How to Train Your AI Agent on Your Own Documents",
    description:
      "RAG (Retrieval-Augmented Generation) is the technology that lets your AI agent search your actual documents instead of hallucinating. Here's how it works and how to use it.",
    date: "2026-04-10",
    category: "Education",
    readTime: "7 min read",
    author: { name: "HeyGenAlly Team", role: "Product" },
    relatedSlugs: [
      "how-to-build-ai-chatbot-customer-support",
      "ai-agent-builder-comparison-2026",
    ],
    content: `
## The problem RAG solves

You've probably heard that AI language models "hallucinate" — they confidently state things that aren't true. This is a real problem for business use cases. You can't have your customer support agent telling customers the wrong refund policy, or your sales agent quoting the wrong pricing.

RAG — Retrieval-Augmented Generation — is the technology that solves this. Instead of relying solely on what the AI model memorised during training, RAG gives the AI access to your actual documents at query time. The AI searches your knowledge base, retrieves the relevant information, and uses it to generate a grounded, accurate answer.

Think of it this way: without RAG, your AI agent is answering from memory. With RAG, it's answering with the manual open in front of it.

---

## How RAG works, step by step

### Step 1: Document ingestion

You upload your documents — PDFs, Word files, web pages, CSVs — to the knowledge base. The system splits them into chunks (usually 200–500 words each).

Each chunk gets converted into a **vector embedding** — a numerical representation of its meaning. Semantically similar content gets similar embeddings.

These embeddings get stored in a **vector database** (ChromaDB, FAISS, LanceDB, Pinecone, etc.).

### Step 2: Query processing

A customer asks your AI agent a question. The question also gets converted into a vector embedding using the same model.

### Step 3: Semantic retrieval

The system searches the vector database for the chunks most semantically similar to the question embedding. This is much more powerful than keyword search — it finds relevant content even when the exact words don't match.

For example: a customer asks "Can I get my money back?" — the system retrieves your refund policy chunks even though they contain the word "refund" rather than "money back."

### Step 4: Augmented generation

The retrieved chunks are injected into the prompt alongside the customer's question. The LLM now has both the question and the relevant context. It synthesises an answer grounded in your actual documentation.

The result: accurate, specific answers with no hallucination.

---

## What goes into a great knowledge base

The quality of your RAG system is directly proportional to the quality of your documents. Garbage in, garbage out.

**What to include:**

- **Product documentation** — Feature explanations, how-to guides, limitations
- **FAQ documents** — Explicit Q&A format works especially well
- **Policy documents** — Refund policy, shipping policy, terms of service
- **Troubleshooting guides** — Step-by-step issue resolution
- **Pricing pages** — Plans, what's included, upgrade/downgrade rules

**What to avoid:**

- **Duplicate content** — The same information in multiple formats confuses the retrieval
- **Outdated documents** — Old pricing, deprecated features, removed policies
- **Overly long documents without structure** — Break long docs into logical sections
- **Images and diagrams without text descriptions** — Embeddings work on text

**Best practice:** Write your FAQ document as explicit question-answer pairs. "What is your refund policy?" followed by the full answer. This format retrieves exceptionally well.

---

## Chunking strategy matters more than most people think

How you split your documents into chunks significantly affects retrieval quality.

**Too small (< 100 words):** Chunks lose context. "Our policy is 30 days" retrieved without the sentence before it is meaningless.

**Too large (> 800 words):** Chunks become noisy. The retrieval finds the right document but the relevant sentence is buried in 700 words of other content.

**Sweet spot:** 200–400 words with overlap between chunks. Most platforms handle this automatically, but it's worth knowing.

**Structured chunking:** Split by natural document boundaries — headings, sections, numbered items. A refund policy section should be one chunk, not split mid-sentence.

---

## Choosing a vector database

For most business use cases, the vector database choice matters less than your content quality. Here's a simple guide:

| Option | Best for |
|--------|---------|
| **ChromaDB** | Small to medium knowledge bases, easy setup |
| **FAISS** | High-performance local deployment |
| **LanceDB** | Serverless, good for cloud deployments |
| **Pinecone** | Large-scale enterprise knowledge bases |

HeyGenAlly supports ChromaDB, FAISS, and LanceDB out of the box. You choose when setting up your knowledge base.

---

## How to test your RAG setup

Before going live, test your knowledge base with 20 real questions your customers ask. Check:

1. **Does it find the right chunk?** Most platforms let you see which chunks were retrieved.
2. **Is the answer accurate?** Compare the AI's answer to what your documentation actually says.
3. **Does it know when it doesn't know?** Ask questions your KB doesn't cover. The agent should say "I don't have that information" — not hallucinate an answer.
4. **Does it handle paraphrased questions?** Ask the same question five different ways.

If retrieval is failing, the problem is usually one of three things:
- The content doesn't exist in the KB
- The content is there but poorly formatted
- The chunk size is wrong for your content type

---

## RAG vs fine-tuning: what's the difference?

People often ask whether to use RAG or fine-tune the LLM on their data. The answer is almost always RAG — here's why:

**Fine-tuning** bakes knowledge into the model weights. It's expensive, slow to update, and doesn't cite sources. When your pricing changes, you re-train. When the model makes something up, you can't tell where it came from.

**RAG** retrieves knowledge at query time. It's fast to update (just re-upload your docs), cheap to maintain, and explainable (you can see exactly which chunks were retrieved). When your pricing changes, you upload a new document and it's live in minutes.

For business knowledge bases — policies, docs, FAQs, pricing — RAG is the right choice every time. Fine-tuning makes sense for teaching a model a specific *style* or *domain expertise*, not for keeping it current on your business information.

---

## Getting started with RAG in HeyGenAlly

1. **Create a knowledge base** — Go to Knowledge Base → New KB
2. **Upload your documents** — PDF, DOCX, URL, or CSV
3. **Let it process** — Ingestion takes a few minutes depending on document size
4. **Add a RAG node to your workflow** — Connect it to your agent's flow
5. **Test with real questions** — Review retrieved chunks and adjust content as needed

Most teams have their first RAG-powered agent live within a day. The time investment is in writing good documentation — which is worth doing regardless of AI.

---

## The bottom line

RAG is the reason AI agents in 2026 are actually useful for business. It's what separates a hallucination machine from a knowledge-grounded assistant that your customers can trust.

If you're building any AI agent for business use — support, sales, HR, ops — RAG is not optional. It's the foundation.

The good news: modern platforms make RAG accessible to non-technical teams. You don't need to know what a vector embedding is to build one. You just need good documentation and 30 minutes.
    `.trim(),
  },

  {
    slug: "no-code-ai-agent-builder-guide",
    title: "The No-Code AI Agent Builder Guide for Non-Technical Teams",
    description:
      "You don't need developers to build a powerful AI agent in 2026. This guide walks non-technical teams through everything they need to know to build, deploy, and improve AI agents.",
    date: "2026-03-28",
    category: "Guide",
    readTime: "9 min read",
    author: { name: "HeyGenAlly Team", role: "Product" },
    relatedSlugs: [
      "how-to-build-ai-chatbot-customer-support",
      "what-is-rag-train-ai-on-your-documents",
    ],
    content: `
## The myth: building AI agents requires engineers

Two years ago this was true. You needed machine learning engineers, Python developers, and infrastructure teams to build anything resembling an AI agent.

In 2026, the tools have caught up with the ambition. A marketing manager, a customer support lead, or an operations analyst can build a fully functional AI agent — one that handles real customer conversations, searches your knowledge base, updates your CRM, and escalates to humans — without touching a line of code.

Here's everything you need to know to do it.

---

## What you're actually building

An AI agent is not a chatbot from 2019. It doesn't pattern-match keywords and return canned responses. A modern AI agent:

- **Understands natural language** — What the customer means, not just what they said
- **Reasons about context** — Remembers what was said earlier in the conversation
- **Searches your knowledge base** — Finds accurate answers from your actual documents
- **Takes actions** — Updates records, sends emails, creates tickets
- **Knows its limits** — Escalates to humans when the situation requires it

You're building something that can genuinely handle conversations that currently require a human.

---

## Before you open the platform: do this first

The biggest mistake non-technical teams make is opening a no-code builder and starting to click. Before you touch the tool, do this groundwork:

### 1. Map your use case

Pick one specific job for your agent. Not "handle all customer queries" — that's too broad. Start with "answer billing questions" or "qualify inbound leads from the website."

Specificity wins. A focused agent that handles one thing excellently is more valuable than a general agent that handles everything poorly.

### 2. Collect your 20 most common questions

Go into your email inbox, your Zendesk, your Slack — wherever customer questions land. Pull the last 30 days of messages. Find the 20 questions asked most often. These are your agent's first job description.

### 3. Write the answers

For each of your 20 questions, write a clear, complete answer in plain language. This becomes the foundation of your knowledge base. The agent is only as good as the documentation you give it.

### 4. Define your escalation rules

Before you build, decide: what should the agent *never* handle? When should it immediately route to a human? Write this down. Most teams define it as: "Any question about legal matters, account deletion, or if the customer explicitly asks for a human."

---

## Building your workflow: the visual approach

No-code AI agent builders use a visual canvas where you connect nodes. Think of nodes as steps in your agent's decision process.

**The core flow for a support agent:**

1. **Trigger node** — Customer sends a message
2. **LLM node** — AI reads the message and classifies what type of question it is
3. **Branch node** — Routes to different paths based on classification
4. **RAG node** — Searches your knowledge base for the answer
5. **LLM node** — Writes a clear response using the retrieved context
6. **Condition node** — Checks if confidence is high enough, or if escalation is needed
7. **End node** — Sends the response or routes to human queue

That's it. Your first agent can be 7 nodes. You'll add complexity later, but this handles most queries.

**Tips for beginners:**

- Start with one branch (e.g., billing questions only). Add more branches once the first one works well.
- Use the "test" function after every node to see what the AI is actually doing at each step.
- Don't try to handle every edge case in the first version. Ship a focused agent, then iterate.

---

## Setting up your knowledge base

Your knowledge base is the most important part of your agent. Spend more time here than anywhere else.

**What to upload:**

- Your FAQ document (write one specifically for the agent if you don't have it)
- Your policy documents (refund, shipping, cancellation, etc.)
- Your product documentation
- Any how-to guides or troubleshooting documents

**Format for maximum retrieval quality:**

Structure everything as Q&A pairs when possible. Instead of:

*"Our refund policy allows customers to return products within 30 days of purchase if the item is in original condition."*

Write it as:

*Q: What is your refund policy? A: You can return any item within 30 days of purchase as long as it's in its original condition. To initiate a return, contact us at support@example.com."*

The Q&A format retrieves significantly better because it mirrors how customers ask questions.

---

## Choosing channels

Start with one channel. The instinct is to deploy everywhere at once — resist it.

**For most B2B teams:** Start with your website chat widget. Highest intent, easiest to test.

**For D2C and e-commerce:** Start with WhatsApp. Your customers are already there.

**For internal teams (HR, IT helpdesk):** Start with Slack or email.

Once your first channel is working well — resolution rate above 60%, CSAT above 4 stars — then expand to additional channels.

---

## The first week after launch

Week one is critical. You're not just running an agent — you're training yourself to improve it.

**Check daily:**
- Conversations that escalated to humans: why did they escalate? Was it a knowledge gap?
- Conversations that got low CSAT scores: what did the agent say that frustrated the customer?
- Questions the agent couldn't answer: add these to your knowledge base

**Metrics to track:**

| Metric | What it tells you | Target (week 1) |
|--------|------------------|-----------------|
| Resolution rate | % of conversations fully handled by AI | > 40% |
| Escalation rate | % routed to humans | < 60% |
| CSAT | Customer satisfaction with AI responses | > 3.5 / 5 |
| Average first response time | How fast the agent responds | < 5 seconds |

Don't be discouraged if week 1 resolution rates are low. 40% is a great start. By week 4, most teams see 65–75%.

---

## The compounding advantage

Here's what makes AI agents special compared to most software: they compound.

Every time you add a document to the knowledge base, the agent gets smarter. Every conversation it handles gives you data about what to improve. Every escalation tells you what's missing.

After 90 days of iterating, most teams have an agent handling 70–80% of incoming queries without human involvement. That's not 70–80% less work for your team — it's 70–80% more capacity.

The teams that started building in Q1 2026 will have agents in Q3 that their competitors don't have yet. And those competitors will spend all of 2027 catching up.

---

## Where to start today

1. **Choose your first use case** — One specific job for the agent
2. **Write your 20 Q&As** — The core of your knowledge base
3. **Sign up for HeyGenAlly** — Free plan, no credit card
4. **Build your first workflow** — 7 nodes, focused on one category
5. **Deploy to your website chat** — Go live in day 1
6. **Review daily for the first week** — Iterate on the KB based on what breaks

You'll have a working agent by end of day. By end of week, it'll be handling real conversations. By end of month, you'll wonder how your team operated without it.
    `.trim(),
  },
];

export const getAllPosts = (): BlogPost[] =>
  [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  posts.find((p) => p.slug === slug);

export const getRelatedPosts = (slugs: string[]): BlogPost[] =>
  slugs.map((s) => posts.find((p) => p.slug === s)).filter(Boolean) as BlogPost[];
