import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";
import SocialWidgetPage, { type ChannelMeta } from "./SocialWidgetPage";
import { Loader2 } from "lucide-react";

const WhatsAppWidgetPage = lazy(() => import("./WhatsAppWidgetPage"));

// ---- channel icons (inline SVG, no dependency) ----
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
  </svg>
);

// ---- channel configs ----
const INSTAGRAM_META: ChannelMeta = {
  channel: "instagram",
  label: "Instagram",
  handleLabel: "Instagram Username",
  handlePlaceholder: "yourbrand",
  handleHint: "Enter your Instagram username without @. Visitors will be taken to your DMs.",
  defaultColor: "#E1306C",
  icon: <InstagramIcon />,
  defaultGreeting: "DM us on Instagram!",
  defaultSubtext: "We reply to every message",
  defaultButtonLabel: "Message on Instagram",
};

const TELEGRAM_META: ChannelMeta = {
  channel: "telegram",
  label: "Telegram",
  handleLabel: "Bot or Channel Username",
  handlePlaceholder: "yourbotname",
  handleHint: "Enter your Telegram bot or channel username without @.",
  defaultColor: "#26A5E4",
  icon: <TelegramIcon />,
  defaultGreeting: "Chat with us on Telegram!",
  defaultSubtext: "Typically replies within minutes",
  defaultButtonLabel: "Open Telegram",
};

const MESSENGER_META: ChannelMeta = {
  channel: "messenger",
  label: "Messenger",
  handleLabel: "Facebook Page Username",
  handlePlaceholder: "yourpagename",
  handleHint: "Enter your Facebook Page username or Page ID. Visitors will open Messenger to chat.",
  defaultColor: "#0078FF",
  icon: <MessengerIcon />,
  defaultGreeting: "Message us on Messenger!",
  defaultSubtext: "We usually reply quickly",
  defaultButtonLabel: "Chat on Messenger",
};

// ---- tabs ----
const TABS = [
  { key: "chat",      label: "Chat Widget" },
  { key: "whatsapp",  label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
  { key: "telegram",  label: "Telegram" },
  { key: "messenger", label: "Messenger" },
] as const;

type Tab = typeof TABS[number]["key"];

const DesignerPage = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("agentId");
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Tab bar */}
      <div className="shrink-0 border-b border-border bg-background px-4 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === "chat" && (
        <div className="flex-1 px-4 sm:px-5 py-3 sm:py-5 overflow-y-auto lg:overflow-hidden">
          <AdvancedChatPreview selectedAgentId={agentId ? parseInt(agentId) : undefined} />
        </div>
      )}

      {tab === "whatsapp" && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <WhatsAppWidgetPage />
          </Suspense>
        </div>
      )}

      {tab === "instagram" && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <SocialWidgetPage meta={INSTAGRAM_META} />
        </div>
      )}

      {tab === "telegram" && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <SocialWidgetPage meta={TELEGRAM_META} />
        </div>
      )}

      {tab === "messenger" && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <SocialWidgetPage meta={MESSENGER_META} />
        </div>
      )}
    </div>
  );
};

export default DesignerPage;
