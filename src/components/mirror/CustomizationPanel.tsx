import { useRef, useCallback } from 'react';
import { PostData, formatCount, parseCount } from './types';

interface Props {
  data: PostData;
  updateData: (updates: Partial<PostData>) => void;
}

const CustomizationPanel = ({ data, updateData }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => updateData({ profileImage: e.target?.result as string });
    reader.readAsDataURL(file);
  }, [updateData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleImageUpload(file);
  }, [handleImageUpload]);

  const updateHashtag = (i: number, v: string) => {
    const t = [...data.hashtags]; t[i] = v; updateData({ hashtags: t });
  };

  return (
    <div className="w-[280px] min-w-[280px] h-full p-2 overflow-hidden" dir="rtl">
      <div className="panel-card ig-bordered h-full flex flex-col gap-2.5 !p-3 overflow-y-auto scrollbar-thin">
        <h2 className="text-sm font-bold text-center text-foreground">تفاصيل التخصيص</h2>

        {/* Profile Section */}
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center"
              onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
              {data.profileImage ? (
                <img src={data.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 36 36" className="w-7 h-7 text-muted-foreground/30">
                  <circle cx="18" cy="13" r="6" fill="currentColor" />
                  <path d="M6 34c0-7 5.4-12 12-12s12 5 12 12" fill="currentColor" />
                </svg>
              )}
            </div>
            <span className="text-[8px] text-muted-foreground/50">ستظهر الصورة هنا</span>
            <span className="text-[10px] text-muted-foreground/50 truncate max-w-[70px]">{data.profileImage ? data.username : 'سيظهر الاسم هنا'}</span>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <button onClick={() => fileInputRef.current?.click()}
              className="field-input text-center cursor-pointer font-semibold hover:bg-muted/50 transition-colors text-[11px] !py-1">
              Upload
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            <p className="text-[9px] text-muted-foreground leading-tight">
              ارفع الصورة المراد وضعها او{' '}
              <span className="text-blue-500 underline cursor-pointer">استخرجها عن طريق اسم المستخدم</span>
            </p>
            <input className="field-input text-[11px] w-full !py-1" value={data.username}
              onChange={e => updateData({ username: e.target.value })} placeholder="user_name" />
            <p className="text-[9px] text-muted-foreground italic underline">ضع الاسم بشكل صحيح</p>
          </div>
        </div>

        <Divider />

        {/* Likes & Comments */}
        <div className="flex gap-2">
          <CountField label="عدد الإعجابات" sublabel="Number of likes" value={data.likesCount}
            onChange={v => updateData({ likesCount: v })} />
          <CountField label="عدد التعليقات" sublabel="Number of comments" value={data.commentsCount}
            onChange={v => updateData({ commentsCount: v })} />
        </div>

        <Divider />

        {/* Caption */}
        <div>
          <p className="section-label mb-1 text-[11px]">اكتب العنوان المراد</p>
          <input className="field-input w-full text-center text-[11px] !py-1" value={data.caption}
            onChange={e => updateData({ caption: e.target.value })} placeholder="Caption" />
          <p className="hint-text mt-0.5 text-center text-[9px]">يفضل الا يتجاوز الخمس كلمات</p>
        </div>

        <Divider />

        {/* Hashtags */}
        <div>
          <p className="section-label mb-1 text-[11px]">اكتب الهاشتاج المراد</p>
          <div className="flex flex-wrap gap-1 items-center justify-center">
            {data.hashtags.map((tag, i) => (
              <input key={i} className="field-input w-[60px] text-center text-[10px] !py-0.5 !px-1" value={tag}
                onChange={e => updateHashtag(i, e.target.value)} />
            ))}
            {data.hashtags.length < 5 && (
              <button onClick={() => updateData({ hashtags: [...data.hashtags, `Hashtag${data.hashtags.length + 1}`] })}
                className="w-5 h-5 rounded-full border border-blue-400 text-blue-400 text-[10px] flex items-center justify-center hover:bg-blue-50 transition-colors">+</button>
            )}
            {data.hashtags.length > 1 && (
              <button onClick={() => updateData({ hashtags: data.hashtags.slice(0, -1) })}
                className="w-5 h-5 rounded-full border border-red-400 text-red-400 text-[10px] flex items-center justify-center hover:bg-red-50 transition-colors">×</button>
            )}
          </div>
          <p className="hint-text mt-0.5 text-center text-[9px]">لا يمكن وضع اكثر من 5 علامات هاشتاج</p>
        </div>

        <Divider />

        {/* Location / Music */}
        <div>
          <p className="section-label mb-1 text-[11px]">المكان/الموسيقى</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <input className="field-input flex-1 text-[10px] !py-1 min-w-0" value={data.location}
                onChange={e => updateData({ location: e.target.value })}
                placeholder="Example: Egypt, Cairo" disabled={!data.useLocation} />
              <ToggleBtn active={data.useLocation} onClick={() => updateData({ useLocation: true })} />
            </div>
            <div className="flex items-center gap-1">
              <input className="field-input flex-1 text-[10px] !py-1 min-w-0" value={data.music}
                onChange={e => updateData({ music: e.target.value })}
                placeholder="Example: TUL8TE · LA3BALY" disabled={data.useLocation} />
              <ToggleBtn active={!data.useLocation} onClick={() => updateData({ useLocation: false })} />
            </div>
            <p className="hint-text text-center text-[9px]">يمكنك اختيار مكان او موسيقى لا يمكن الخيارين</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Divider = () => <hr className="border-foreground/10" />;

const ToggleBtn = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center transition-all duration-150 shrink-0 ${
      active ? 'border-red-400 text-red-400 hover:bg-red-50' : 'border-blue-400 text-blue-400 hover:bg-blue-50'
    }`}>{active ? '×' : '+'}</button>
);

const CountField = ({ label, sublabel, value, onChange }: {
  label: string; sublabel: string; value: number; onChange: (v: number) => void;
}) => (
  <div className="flex-1 min-w-0">
    <p className="text-[10px] font-semibold text-center mb-0.5 leading-tight">{label}<br /><span className="text-[9px] font-normal text-muted-foreground">{sublabel}</span></p>
    <div className="flex items-center gap-0.5">
      <div className="flex flex-col gap-px">
        <button onClick={() => onChange(value + 500)} className="text-[10px] px-0.5 rounded hover:bg-muted transition-colors leading-none">▲</button>
        <button onClick={() => onChange(Math.max(0, value - 500))} className="text-[10px] px-0.5 rounded hover:bg-muted transition-colors leading-none">▼</button>
      </div>
      <input className="field-input flex-1 text-center text-[11px] !py-0.5 min-w-0" value={formatCount(value)}
        onChange={e => onChange(parseCount(e.target.value))} />
    </div>
  </div>
);

export default CustomizationPanel;
