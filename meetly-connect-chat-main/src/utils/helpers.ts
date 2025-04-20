/**
 * Generates a random room ID for Meetly meetings
 */
export const generateRoomId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generates a random user ID (unique per session/tab load)
 */
export const generateUserId = (): string => {
  // Using sessionStorage ensures a unique ID per tab session
  let userId = sessionStorage.getItem('sessionUserId');
  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('sessionUserId', userId);
    console.log("Generated new session UserId:", userId);
  } else {
    console.log("Using existing session UserId:", userId);
  }
  return userId;
};

/**
 * Formats a date for chat messages
 */
export const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};