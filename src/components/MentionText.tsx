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

    // Replace @user:123 with @FirstName
    return text.replace(/@user:(\d+)/g, (match, userId) => {
      const user = users[parseInt(userId)];
      if (user) {
        const displayName = user.first_name || user.email.split('@')[0];
        return `**@${displayName}**`;
      }
      return match;
    });
  };

  const processedContent = processContent(content);

  // Custom renderer to style mentions
  const components = {
    strong: ({ node, ...props }: any) => {
      const text = props.children?.[0];
      if (typeof text === 'string' && text.startsWith('@')) {
        return (
          <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
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
