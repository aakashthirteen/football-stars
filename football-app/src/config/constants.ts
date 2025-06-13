// App-wide configuration constants
export const APP_CONFIG = {
  // Input limits
  INPUT_LIMITS: {
    TEAM_NAME: { MIN: 3, MAX: 50 },
    TEAM_DESCRIPTION: { MAX: 200 },
    PLAYER_NAME: { MIN: 2, MAX: 50 },
    PLAYER_BIO: { MAX: 500 },
    TOURNAMENT_NAME: { MIN: 5, MAX: 100 },
    TOURNAMENT_DESCRIPTION: { MAX: 500 },
    VENUE_NAME: { MAX: 100 },
    PASSWORD: { MIN: 6, MAX: 128 },
    EMAIL: { MAX: 255 },
    LOCATION: { MAX: 100 },
    MATCH_DURATION: { MIN: 1, MAX: 180 }, // minutes
    JERSEY_NUMBER: { MIN: 0, MAX: 99 },
    HEIGHT: { MIN: 100, MAX: 250 }, // cm
    WEIGHT: { MIN: 30, MAX: 200 }, // kg
  },

  // Team limits
  TEAM_LIMITS: {
    MIN_PLAYERS: 7,
    MAX_PLAYERS: 25,
    MIN_FOR_MATCH: 7,
  },

  // Tournament limits
  TOURNAMENT_LIMITS: {
    MIN_TEAMS: 2,
    MAX_TEAMS: 32,
    MIN_ENTRY_FEE: 0,
    MAX_ENTRY_FEE: 100000,
    MIN_PRIZE_POOL: 0,
    MAX_PRIZE_POOL: 1000000,
  },

  // Match limits
  MATCH_LIMITS: {
    MIN_MINUTE: 0,
    MAX_MINUTE: 120, // Including extra time
    MIN_SCORE: 0,
    MAX_SCORE: 99,
    MAX_EVENTS_PER_MATCH: 200,
  },

  // API timeouts (milliseconds)
  API_TIMEOUTS: {
    DEFAULT: 30000,
    UPLOAD: 60000,
    LONG_OPERATION: 120000,
  },

  // Refresh intervals (milliseconds)
  REFRESH_INTERVALS: {
    LIVE_MATCH: 30000, // 30 seconds
    STANDINGS: 60000, // 1 minute
    LEADERBOARD: 300000, // 5 minutes
  },

  // Session settings
  SESSION: {
    TOKEN_KEY: 'token',
    USER_KEY: 'user',
    REMEMBER_ME_KEY: 'rememberMe',
    SESSION_TIMEOUT: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },

  // File upload limits
  FILE_UPLOAD: {
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
    MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
  },

  // Date/Time formats
  DATE_FORMATS: {
    DISPLAY_DATE: 'MMM DD, YYYY',
    DISPLAY_TIME: 'hh:mm A',
    DISPLAY_DATETIME: 'MMM DD, YYYY at hh:mm A',
    API_DATE: 'YYYY-MM-DD',
    API_DATETIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  },

  // Regular expressions for validation
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\d\s+()-]+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    NUMERIC: /^\d+$/,
    NAME: /^[a-zA-Z\s'-]+$/,
    USERNAME: /^[a-zA-Z0-9_-]+$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  },

  // Error retry settings
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 30000, // 30 seconds
    BACKOFF_FACTOR: 2,
  },

  // Cache settings
  CACHE: {
    TEAMS_TTL: 5 * 60 * 1000, // 5 minutes
    PLAYERS_TTL: 10 * 60 * 1000, // 10 minutes
    TOURNAMENTS_TTL: 5 * 60 * 1000, // 5 minutes
    MATCHES_TTL: 1 * 60 * 1000, // 1 minute
    STATS_TTL: 5 * 60 * 1000, // 5 minutes
  },

  // Feature flags
  FEATURES: {
    ENABLE_CHAT: false,
    ENABLE_VIDEO_HIGHLIGHTS: false,
    ENABLE_PUSH_NOTIFICATIONS: false,
    ENABLE_SOCIAL_LOGIN: false,
    ENABLE_PLAYER_TRANSFER: false,
    ENABLE_MATCH_PREDICTIONS: false,
  },

  // UI settings
  UI: {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    TOAST_DURATION: 3000,
    MAX_RETRIES_SHOWN: 3,
    SKELETON_ITEMS: 5,
  },
};

// Helper functions for validation
export const isWithinLimit = (value: string, min: number, max: number): boolean => {
  const length = value.trim().length;
  return length >= min && length <= max;
};

export const isValidEmail = (email: string): boolean => {
  return APP_CONFIG.REGEX.EMAIL.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return APP_CONFIG.REGEX.PHONE.test(phone) && phone.length >= 10;
};

export const isValidName = (name: string): boolean => {
  return APP_CONFIG.REGEX.NAME.test(name) && 
    isWithinLimit(name, APP_CONFIG.INPUT_LIMITS.PLAYER_NAME.MIN, APP_CONFIG.INPUT_LIMITS.PLAYER_NAME.MAX);
};

export const isValidNumber = (value: string, min: number, max: number): boolean => {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max;
};

export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isFutureDate = (date: Date): boolean => {
  return isValidDate(date) && date.getTime() > Date.now();
};

export const isPastDate = (date: Date): boolean => {
  return isValidDate(date) && date.getTime() < Date.now();
};

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

export const sanitizeNumber = (input: string): number => {
  const num = parseInt(input.replace(/\D/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValidDate(d)) return 'Invalid Date';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValidDate(d)) return 'Invalid Time';
  
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};
