import { forwardRef, useState } from 'react';
import { PostData, Visibility, formatCount, parseCount } from './types';

interface Props {
  data: PostData;
  updateData: (updates: Partial<PostData>) => void;
  visibility: Visibility;
  compact?: boolean;
  exportMode?: boolean;
}

const InstagramPost = forwardRef<HTMLDivElement, Props>(({ data, updateData, visibility, compact, exportMode }, ref) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const startEdit = (field: string, value: string) => {
    setTempValue(value);
    setEditingField(field);
  };

  const finishEdit = (field: string) => {
    if (field === 'likes') updateData({ likesCount: parseCount(tempValue) });
    else if (field === 'comments') updateData({ commentsCount: parseCount(tempValue) });
    else if (field === 'caption') updateData({ caption: tempValue });
    else if (field.startsWith('hashtag-')) {
      const i = parseInt(field.split('-')[1]);
      const newTags = [...data.hashtags];
      newTags[i] = tempValue;
      updateData({ hashtags: newTags });
    }
    setEditingField(null);
  };

  const addHashtag = () => {
    if (data.hashtags.length < 5) updateData({ hashtags: [...data.hashtags, `Hashtag${data.hashtags.length + 1}`] });
  };
  const removeLastHashtag = () => {
    if (data.hashtags.length > 1) updateData({ hashtags: data.hashtags.slice(0, -1) });
  };

  const postWidth = compact ? 240 : 360;

  return (
    <div ref={ref} data-export-post={exportMode ? 'true' : 'false'}>
      <div className={exportMode ? '' : 'ig-border-wrap'} style={exportMode ? { borderRadius: 0, background: 'var(--ig-gradient)', padding: '1.5px' } : { borderRadius: 0 }}>
        <div className="bg-white select-none" style={{ width: postWidth, fontFamily: "'Cairo', sans-serif" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex items-center gap-2.5">
              {/* Profile pic - always visible, stories only controls the gradient ring */}
              <div className="relative">
                {visibility.stories ? (
                  <div className="rounded-full p-[2.5px]" style={{ background: 'var(--ig-gradient)' }}>
                    <div className="rounded-full bg-white p-[2px]">
                      <ProfileAvatar src={data.profileImage} size={34} />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <ProfileAvatar src={data.profileImage} size={38} />
                    <div className="absolute -top-0.5 -right-0.5 -bottom-0.5 -left-0.5 rounded-full flex items-center justify-center pointer-events-none">
                      <EyeOff size={14} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="text-[13px] font-semibold leading-tight">{data.username}</div>
                {visibility.address ? (
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {data.useLocation ? (data.location || 'Title, music') : (data.music || 'Title, music')}
                  </div>
                ) : (
                  <div className="relative">
                    <div className="text-[11px] text-muted-foreground leading-tight opacity-30">Title, music</div>
                    <div className="absolute inset-0 flex items-center justify-center"><EyeOff size={12} /></div>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              {visibility.more ? (
                <div className="flex flex-col gap-[3px] px-2 cursor-pointer">
                  <div className="w-[3px] h-[3px] rounded-full bg-foreground" />
                  <div className="w-[3px] h-[3px] rounded-full bg-foreground" />
                  <div className="w-[3px] h-[3px] rounded-full bg-foreground" />
                </div>
              ) : (
                <div className="relative px-2">
                  <div className="flex flex-col gap-[3px] opacity-20">
                    <div className="w-[3px] h-[3px] rounded-full bg-foreground" />
                    <div className="w-[3px] h-[3px] rounded-full bg-foreground" />
                    <div className="w-[3px] h-[3px] rounded-full bg-foreground" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center"><EyeOff size={12} /></div>
                </div>
              )}
            </div>
          </div>

          {/* Mirror Image */}
          <div className="mirror-surface flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
            <div className="text-center select-none" style={exportMode ? { opacity: 0.85 } : { mixBlendMode: 'overlay' }}>
              <div className="text-[40px] font-bold text-white leading-[1.1]" style={{ fontFamily: "'Cairo', sans-serif" }}>مراية</div>
              <div className="text-[32px] font-bold text-white leading-[1]">Mirror</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3.5">
              <HeartIcon />
              {visibility.comments ? <CommentIcon /> : (
                <div className="relative"><CommentIcon opacity={0.2} /><div className="absolute inset-0 flex items-center justify-center"><EyeOff size={10} /></div></div>
              )}
              <ShareIcon />
            </div>
            <BookmarkIcon />
          </div>

          {/* Likes */}
          <div className="px-3 pb-1">
            {editingField === 'likes' ? (
              <span className="text-[13px] font-semibold">
                <input className="editable-inline w-16 text-[13px] font-semibold" value={tempValue}
                  onChange={e => setTempValue(e.target.value)} onBlur={() => finishEdit('likes')}
                  onKeyDown={e => e.key === 'Enter' && finishEdit('likes')} autoFocus /> Likes
              </span>
            ) : (
              <span className="text-[13px] font-semibold cursor-pointer hover:text-foreground/70 transition-colors"
                onClick={() => startEdit('likes', formatCount(data.likesCount))}>
                {formatCount(data.likesCount)} Likes
              </span>
            )}
          </div>

          {/* Caption & Hashtags - NO username next to caption */}
          <div className="px-3 pb-1 text-[13px] leading-relaxed">
            {editingField === 'caption' ? (
              <input className="editable-inline w-full text-[13px]" value={tempValue}
                onChange={e => setTempValue(e.target.value)} onBlur={() => finishEdit('caption')}
                onKeyDown={e => e.key === 'Enter' && finishEdit('caption')} autoFocus />
            ) : (
              <span className="cursor-pointer hover:text-foreground/60 transition-colors"
                onClick={() => startEdit('caption', data.caption || 'The caption')}>
                {data.caption || 'The caption'}
              </span>
            )}{' '}
            {visibility.hashtags ? (
              <>
                {data.hashtags.map((tag, i) => (
                  <span key={i}>
                    {editingField === `hashtag-${i}` ? (
                      <input className="editable-inline w-16 text-[13px] text-blue-500" value={tempValue}
                        onChange={e => setTempValue(e.target.value)} onBlur={() => finishEdit(`hashtag-${i}`)}
                        onKeyDown={e => e.key === 'Enter' && finishEdit(`hashtag-${i}`)} autoFocus />
                    ) : (
                      <span className="text-blue-500 cursor-pointer hover:text-blue-400 transition-colors"
                        onClick={() => startEdit(`hashtag-${i}`, tag)}>#{tag}</span>
                    )}{' '}
                  </span>
                ))}
                {data.hashtags.length < 5 && (
                  <button onClick={addHashtag} className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border border-blue-400 text-blue-400 text-xs hover:bg-blue-50 transition-colors align-middle">+</button>
                )}
                {data.hashtags.length > 1 && (
                  <button onClick={removeLastHashtag} className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border border-red-400 text-red-400 text-xs hover:bg-red-50 transition-colors align-middle ml-1">×</button>
                )}
              </>
            ) : (
              <div className="relative inline-block">
                <span className="text-blue-500 opacity-20">#Hashtag #Hashtag2</span>
                <div className="absolute inset-0 flex items-center justify-center"><EyeOff size={12} /></div>
              </div>
            )}
          </div>

          {/* View All Comments */}
          {visibility.viewAll ? (
            <div className="px-3 pb-3">
              {editingField === 'comments' ? (
                <span className="text-[13px] text-muted-foreground">
                  View All{' '}
                  <input className="editable-inline w-12 text-[13px] text-muted-foreground" value={tempValue}
                    onChange={e => setTempValue(e.target.value)} onBlur={() => finishEdit('comments')}
                    onKeyDown={e => e.key === 'Enter' && finishEdit('comments')} autoFocus />
                  {' '}Comments
                </span>
              ) : (
                <span className="text-[13px] text-muted-foreground cursor-pointer hover:text-muted-foreground/60 transition-colors"
                  onClick={() => startEdit('comments', formatCount(data.commentsCount))}>
                  View All {formatCount(data.commentsCount)} Comments
                </span>
              )}
            </div>
          ) : (
            <div className="px-3 pb-3 relative">
              <span className="text-[13px] text-muted-foreground opacity-20">View All 5k Comments</span>
              <div className="absolute inset-0 flex items-center justify-center"><EyeOff size={12} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const ProfileAvatar = ({ src, size }: { src: string | null; size: number }) => (
  <div className="rounded-full overflow-hidden bg-muted flex items-center justify-center" style={{ width: size, height: size }}>
    {src ? (
      <img src={src} alt="" className="w-full h-full object-cover" />
    ) : (
      <svg viewBox="0 0 36 36" className="text-muted-foreground/40" style={{ width: size * 0.7, height: size * 0.7 }}>
        <circle cx="18" cy="13" r="6" fill="currentColor" /><path d="M6 34c0-7 5.4-12 12-12s12 5 12 12" fill="currentColor" />
      </svg>
    )}
  </div>
);

const EyeOff = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" className="text-foreground">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#ed4956" className="cursor-pointer hover:scale-110 transition-transform">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const CommentIcon = ({ opacity = 1 }: { opacity?: number }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:scale-110 transition-transform" style={{ opacity }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:scale-110 transition-transform">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const BookmarkIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cursor-pointer hover:scale-110 transition-transform">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

InstagramPost.displayName = 'InstagramPost';
export default InstagramPost;
