import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  Globe,
  Tag,
  ExternalLink,
  Copy,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  History
} from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { useState } from 'react';
import { Button } from './ui/button';

interface ConversationSidebarProps {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  sessionId: string;
  createdAt: string;
  summary?: string;
  tags?: string[];
  location?: string;
  totalConversations?: number;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  contactName,
  contactEmail,
  contactPhone,
  sessionId,
  createdAt,
  summary,
  tags = [],
  location,
  totalConversations = 1,
}) => {
  const { isRTL } = useI18n();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-col overflow-y-auto ${isRTL ? 'border-r' : 'border-l'} border-slate-200 dark:border-slate-700`}
    >
      {/* Profile Header */}
      <div className="relative">
        {/* Gradient Background */}
        <div className="h-24 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMiAyIDQgMiA0cy0yIDItMiA0IDIgNCA0IDQgNC0yIDQtNC0yLTQtMi00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="relative"
          >
            <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-800 shadow-xl">
              <AvatarImage src={`https://avatar.vercel.sh/${contactEmail}.png`} alt={contactName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                {getInitials(contactName)}
              </AvatarFallback>
            </Avatar>
            {/* Online Status */}
            <span className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
          </motion.div>
        </div>
      </div>

      {/* Name & Role */}
      <div className="pt-14 pb-4 px-4 text-center">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-lg font-bold text-slate-800 dark:text-white"
        >
          {contactName}
        </motion.h3>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium"
        >
          <User className="h-3 w-3" />
          Customer
        </motion.span>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mx-4 mb-4 p-3 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl grid grid-cols-2 gap-3"
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalConversations}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Conversations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">98%</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Satisfaction</div>
        </div>
      </motion.div>

      {/* Contact Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-4 mb-4"
      >
        <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
          Contact Info
        </h4>
        <div className="space-y-1">
          {/* Email */}
          <div
            className={`group flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
            onClick={() => copyToClipboard(contactEmail, 'email')}
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Email</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{contactEmail}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {copiedField === 'email' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>

          {/* Phone */}
          <div
            className={`group flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
            onClick={() => contactPhone && copyToClipboard(contactPhone, 'phone')}
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Phone</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{contactPhone || 'Not provided'}</p>
            </div>
            {contactPhone && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {copiedField === 'phone' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className={`flex items-center gap-3 p-2.5 rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Location</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{location || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Session Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mx-4 mb-4"
      >
        <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
          Session Details
        </h4>
        <div className="bg-slate-100/80 dark:bg-slate-800/50 rounded-xl p-3 space-y-3">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
              <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Started</p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{formatDate(createdAt)}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
              <MessageSquare className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Session ID</p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300">#{sessionId.slice(0, 12)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-4 mb-4"
        >
          <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            AI Summary
          </h4>
          <div className="relative p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
            <div className="absolute top-2 right-2">
              <Sparkles className="h-4 w-4 text-purple-400/50" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {summary}
            </p>
          </div>
        </motion.div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mx-4 mb-4"
        >
          <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <Tag className="h-3.5 w-3.5" />
            Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700"
      >
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9"
          >
            <History className="h-3.5 w-3.5 mr-1.5" />
            History
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Profile
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
