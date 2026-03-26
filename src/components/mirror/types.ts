export interface PostData {
  username: string;
  profileImage: string | null;
  caption: string;
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  location: string;
  music: string;
  useLocation: boolean;
}

export interface Visibility {
  stories: boolean;
  hashtags: boolean;
  more: boolean;
  comments: boolean;
  viewAll: boolean;
  address: boolean;
}

export function formatCount(num: number): string {
  if (num >= 1000000) {
    const m = num / 1000000;
    return m % 1 === 0 ? `${m}m` : `${parseFloat(m.toFixed(1))}m`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}k` : `${parseFloat(k.toFixed(1))}k`;
  }
  return num.toString();
}

export function parseCount(str: string): number {
  str = str.trim().toLowerCase();
  if (str.endsWith('m')) return Math.round(parseFloat(str) * 1000000);
  if (str.endsWith('k')) return Math.round(parseFloat(str) * 1000);
  return parseInt(str) || 0;
}

export const DEFAULT_POST_DATA: PostData = {
  username: 'user_name',
  profileImage: null,
  caption: '',
  hashtags: ['Hashtag', 'Hashtag2', 'Hashtag3'],
  likesCount: 9500,
  commentsCount: 5000,
  location: '',
  music: '',
  useLocation: true,
};

export const DEFAULT_VISIBILITY: Visibility = {
  stories: true,
  hashtags: true,
  more: true,
  comments: true,
  viewAll: true,
  address: true,
};

const STORAGE_KEY = 'mirror_design_data';
const VISIBILITY_KEY = 'mirror_visibility';

function normalizeProfileImage(profileImage: string | null | undefined) {
  if (!profileImage) return null;
  const value = profileImage.trim();
  if (value.startsWith('data:image/')) return value;
  if (value.startsWith('blob:')) return value;
  if (value.startsWith('http')) return null;
  return value;
}

export function loadSavedData(): { data: PostData; visibility: Visibility } {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedVis = localStorage.getItem(VISIBILITY_KEY);
    const parsedData = savedData ? JSON.parse(savedData) : DEFAULT_POST_DATA;
    const parsedVisibility = savedVis ? JSON.parse(savedVis) : DEFAULT_VISIBILITY;

    return {
      data: {
        ...DEFAULT_POST_DATA,
        ...parsedData,
        profileImage: normalizeProfileImage(parsedData?.profileImage),
      },
      visibility: {
        ...DEFAULT_VISIBILITY,
        ...parsedVisibility,
      },
    };
  } catch {
    return { data: DEFAULT_POST_DATA, visibility: DEFAULT_VISIBILITY };
  }
}

export function saveDesignData(data: PostData, visibility: Visibility) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(visibility));
  } catch (e) {
    console.error('Failed to save design data:', e);
  }
}
