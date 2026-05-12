interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
}

interface ChannelParticipant {
  user_id: number;
  user?: User;
}

interface Channel {
  id: number;
  name: string | null;
  channel_type: string;
  participants: ChannelParticipant[];
}

/**
 * Get display name for a channel
 * - For DM channels: Show the other user's name
 * - For TEAM channels: Show the channel name
 */
const getUserDisplayName = (user: User): string => {
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.email;
};

export const getChannelDisplayName = (channel: Channel, currentUserId?: number): string => {
  if (channel.channel_type?.toUpperCase() === 'DM' && currentUserId) {
    const others = channel.participants
      .filter((p) => p.user_id !== currentUserId && p.user)
      .map((p) => p.user!);

    if (others.length === 0) return channel.name || 'Direct Message';
    if (others.length === 1) return getUserDisplayName(others[0]);

    // Group DM: show up to 3 names, then "+N more"
    const names = others.map(getUserDisplayName);
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3}`;
  }

  // For TEAM channels or fallback
  return channel.name || 'Direct Message';
};

/**
 * Get avatar info for a channel
 * - For DM channels: Show the other user's avatar
 * - For TEAM channels: Show channel initial
 */
export const getChannelAvatar = (channel: Channel, currentUserId?: number) => {
  // For DM channels, get the other user's avatar
  if (channel.channel_type?.toUpperCase() === 'DM' && currentUserId) {
    const others = channel.participants.filter((p) => p.user_id !== currentUserId && p.user);

    if (others.length === 1 && others[0].user) {
      const user = others[0].user;
      return {
        url: user.profile_picture_url,
        fallback: user.first_name?.[0] || user.email[0].toUpperCase(),
        isUser: true,
      };
    }

    if (others.length > 1) {
      return { url: undefined, fallback: '#', isUser: false, isGroup: true };
    }
  }

  // For MEETING channels
  if (channel.channel_type?.toUpperCase() === 'MEETING') {
    return { url: undefined, fallback: 'MEETING_ICON', isUser: false, isMeeting: true };
  }

  // For TEAM channels
  return {
    url: undefined,
    fallback: channel.name ? channel.name[0].toUpperCase() : '#',
    isUser: false,
  };
};

/**
 * Get description for a channel
 * - For DM channels: Show the other user's email
 * - For TEAM channels: Show channel description
 */
export const getChannelDescription = (channel: Channel, currentUserId?: number): string => {
  if (channel.channel_type?.toUpperCase() === 'DM' && currentUserId) {
    const others = channel.participants
      .filter((p) => p.user_id !== currentUserId && p.user)
      .map((p) => p.user!);

    if (others.length === 1) return others[0].email;
    if (others.length > 1) return others.map((u) => u.email).join(', ');
  }

  // For TEAM channels
  return channel.description || 'No description';
};
