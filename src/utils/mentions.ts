interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Convert display mentions to API format (@user:123).
 * Pass 1: @{Name:ID} safety-net (old stored messages, kept for backward compat)
 * Pass 2: @Name → @user:ID via exact first_name / email-prefix lookup
 */
export const convertMentionsToApiFormat = (content: string, users: User[]): string => {
  if (!content) return content;

  // Pass 1: @{Name:ID} → @user:ID  (no lookup needed; {} is markdown-safe unlike [])
  let processed = content.replace(/@\{([^}:]+):(\d+)\}/g, (_match, _name, id) => `@user:${id}`);

  // Pass 2: @Name → @user:ID  (exact match against inserted display name)
  // Regex matches @<anything except whitespace and @> so it handles hyphens, dots, etc.
  // Already-converted @user:123 tokens won't match any real user name, so they pass through safely.
  if (users.length > 0) {
    const legacyRegex = /@([^\s@{}\[\]]+)/g;
    const legacyMatches = Array.from(processed.matchAll(legacyRegex));
    for (const match of legacyMatches) {
      const mentionText = match[1];
      const fullMatch = match[0];
      const matchedUser = users.find((user) => {
        const firstName = user.first_name?.toLowerCase() || '';
        const emailName = user.email.split('@')[0].toLowerCase();
        const searchText = mentionText.toLowerCase();
        return firstName === searchText || emailName === searchText;
      });
      if (matchedUser) {
        processed = processed.replace(fullMatch, `@user:${matchedUser.id}`);
      }
    }
  }

  return processed;
};

/**
 * Convert API format mentions (@user:123) to display format (@FirstName)
 */
export const convertMentionsToDisplayFormat = (
  content: string,
  users: { [key: number]: User }
): string => {
  if (!content) return content;

  return content.replace(/@user:(\d+)/g, (match, userId) => {
    const user = users[parseInt(userId)];
    if (user) {
      return `@${user.first_name || user.email.split('@')[0]}`;
    }
    return match;
  });
};
