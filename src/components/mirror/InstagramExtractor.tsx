import { useState } from 'react';
import { PostData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  updateData: (updates: Partial<PostData>) => void;
  compact?: boolean;
}

const InstagramExtractor = ({ updateData, compact }: Props) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    const clean = username.trim().replace(/^@/, '');
    if (!clean) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('instagram-extract', {
        body: { username: clean },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const d = data.data;
        const normalizedProfileImage = typeof d.profileImage === 'string' && d.profileImage.startsWith('data:image/')
          ? d.profileImage
          : null;

        const updates: Partial<PostData> = { username: d.username || clean };
        if (normalizedProfileImage) updates.profileImage = normalizedProfileImage;
        if (d.likesCount) updates.likesCount = d.likesCount;
        if (d.commentsCount) updates.commentsCount = d.commentsCount;
        if (d.caption) updates.caption = d.caption;
        if (d.hashtags?.length) updates.hashtags = d.hashtags.slice(0, 5);
        if (d.location) { updates.location = d.location; updates.useLocation = true; }
        else if (d.music) { updates.music = d.music; updates.useLocation = false; }

        if (!normalizedProfileImage && !d.caption && !d.likesCount && !d.commentsCount) {
          toast.error('تعذر استخراج البيانات من هذا الحساب');
          return;
        }

        updateData(updates);
        toast.success(normalizedProfileImage ? 'تم استخراج البيانات والصورة' : 'تم استخراج البيانات');
        return;
      }

      toast.error('تعذر استخراج البيانات من هذا الحساب');
    } catch (err) {
      console.error('Instagram extraction failed:', err);
      toast.error('حدث خطأ أثناء استخراج البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className={compact ? 'px-3 py-1.5' : ''}>
      <p className="text-[10px] font-bold text-center mb-1 text-foreground/80">
        استخراج البيانات من الإنستجرام
      </p>
      <div className="panel-card ig-bordered !p-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[9px] text-muted-foreground shrink-0 leading-snug max-w-[92px] text-right">
            ضع الاسم بشكل صحيح كما هو في انستجرام
          </p>
          <input className="field-input flex-1 text-[10px] !py-0.5 !px-1.5 min-w-0" value={username}
            onChange={e => setUsername(e.target.value)} placeholder="user_name"
            onKeyDown={e => e.key === 'Enter' && handleExtract()} disabled={loading} />
          <button onClick={handleExtract} disabled={loading}
            className="text-[10px] font-semibold text-blue-500 hover:text-blue-600 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0">
            {loading ? '...' : 'استخراج'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstagramExtractor;
