import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface MentionTextProps {
  content: string;
  users?: { [key: number]: User };
  className?: string;
}

const MentionText: React.FC<MentionTextProps> = ({ content, users = {}, className }) => {
  // Convert @user:123 format to @FirstName with styling
  const processContent = (text: string): string => {
    if (!text) return text;

    // Replace @user:123 with bold mention (stored/API format)
    let out = text.replace(/@user:(\d+)/g, (match, userId) => {
      const user = users[parseInt(userId)];
      if (user) {
        const displayName = user.first_name || user.email.split('@')[0];
        return `**@${displayName}**`;
      }
      return match;
    });

    // Replace @{Name:ID} with bold mention (input display format, conversion safety-net)
    out = out.replace(/@\{([^}:]+):(\d+)\}/g, (_match, name, userId) => {
      const user = users[parseInt(userId)];
      const displayName = user ? (user.first_name || user.email.split('@')[0]) : name;
      return `**@${displayName}**`;
    });

    return out;
  };

  const processedContent = processContent(content);

  // Custom renderer to style mentions
  const components = {
    strong: ({ node, ...props }: any) => {
      // children can be a plain string (single text child) or an array — handle both
      const raw = props.children;
      const text = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join('') : String(raw ?? '');
      if (text.startsWith('@')) {
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-[0.8em]">
            {text}
          </span>
        );
      }
      return <strong {...props} />;
    },
  };

  return (
    <div className={cn('prose prose-sm max-w-full', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MentionText;
