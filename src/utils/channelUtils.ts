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
export const getChannelDisplayName = (channel: Channel, currentUserId?: number): string => {
  // For DM channels, show the other user's name
  if (channel.channel_type?.toUpperCase() === 'DM' && currentUserId) {
    const otherParticipant = channel.participants.find(
      (p) => p.user_id !== currentUserId
    );

    if (otherParticipant?.user) {
      const user = otherParticipant.user;
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
      } else if (user.first_name) {
        return user.first_name;
      } else {
        return user.email;
      }
    }
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
    const otherParticipant = channel.participants.find(
      (p) => p.user_id !== currentUserId
    );

    if (otherParticipant?.user) {
      const user = otherParticipant.user;
      return {
        url: user.profile_picture_url,
        fallback: user.first_name?.[0] || user.email[0].toUpperCase(),
        isUser: true,
      };
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
  // For DM channels, show the other user's email
  if (channel.channel_type?.toUpperCase() === 'DM' && currentUserId) {
    const otherParticipant = channel.participants.find(
      (p) => p.user_id !== currentUserId
    );

    if (otherParticipant?.user) {
      return otherParticipant.user.email;
    }
  }

  // For TEAM channels
  return channel.description || 'No description';
};
