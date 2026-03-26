import { useState, useRef, useCallback, useEffect } from 'react';
import { PostData, Visibility, loadSavedData, saveDesignData, formatCount, parseCount } from './types';
import InstagramPost from './InstagramPost';
import CustomizationPanel from './CustomizationPanel';
import VisibilityToggle from './VisibilityToggle';
import InstagramExtractor from './InstagramExtractor';
import PurchaseFlow from './PurchaseFlow';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const MirrorPage = () => {
  const previewPostRef = useRef<HTMLDivElement>(null);
  const exportPostRef = useRef<HTMLDivElement>(null);
  const { data: savedData, visibility: savedVis } = loadSavedData();
  const [data, setData] = useState<PostData>(savedData);
  const [visibility, setVisibility] = useState<Visibility>(savedVis);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const isMoved = scale !== 1 || translate.x !== 0 || translate.y !== 0;

  const updateData = useCallback((updates: Partial<PostData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleVisibility = useCallback((key: keyof Visibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => saveDesignData(data, visibility), 300);
    return () => clearTimeout(timer);
  }, [data, visibility]);

  const handleSave = useCallback(() => {
    saveDesignData(data, visibility);
    toast('تم حفظ التصميم');
  }, [data, visibility]);

  const handleDownload = useCallback(async () => {
    if (!exportPostRef.current) return;
    try {
      await document.fonts?.ready;
      const canvas = await html2canvas(exportPostRef.current, {
        useCORS: true,
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `mirror-${data.username || 'design'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('تم تحميل التصميم');
    } catch {
      toast.error('فشل تحميل التصميم');
    }
  }, [data.username]);

  const resetPosition = () => { setScale(1); setTranslate({ x: 0, y: 0 }); };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(3, Math.max(0.3, s - e.deltaY * 0.001)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('input, button, [contenteditable]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setTranslate({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onPointerUp = () => setIsDragging(false);

  return (
    <div className="h-screen overflow-hidden font-cairo" style={{ background: 'hsl(var(--mirror-bg))' }}>
      {/* Desktop */}
      <div className="hidden lg:flex w-full h-full">
        <CustomizationPanel data={data} updateData={updateData} />

        <div className="flex-1 flex items-center justify-center relative overflow-hidden"
          onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}>
          <div style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.2s ease' }}>
            <InstagramPost ref={previewPostRef} data={data} updateData={updateData} visibility={visibility} />
          </div>
          {isMoved && (
            <button onClick={resetPosition}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-4 py-1.5 rounded-full shadow-md hover:bg-white transition-all text-foreground/70 border border-border/50"
              style={{ zIndex: 20 }}>
              محاذاه التصميم
            </button>
          )}
        </div>

        <div className="w-56 flex flex-col gap-2 p-2 pt-4 overflow-hidden">
          <VisibilityToggle visibility={visibility} toggleVisibility={toggleVisibility} />
          <InstagramExtractor updateData={updateData} />
          <div className="flex flex-col gap-1.5 mt-auto pb-3">
            <div className="flex items-center gap-2">
              <button onClick={handleSave} className="btn-save flex-1 !py-2 !text-sm">حفظ</button>
              <button onClick={handleDownload} className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted/50 transition-colors shrink-0" title="تحميل">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/60">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
            <PurchaseFlow data={data} visibility={visibility} postRef={exportPostRef} />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex flex-col w-full h-full overflow-hidden">
        <InstagramExtractor updateData={updateData} compact />

        <div className="flex-1 flex items-center justify-center relative overflow-hidden"
          onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}>
          <div style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.2s ease' }}>
            <InstagramPost ref={previewPostRef} data={data} updateData={updateData} visibility={visibility} compact />
          </div>
          {isMoved && (
            <button onClick={resetPosition}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-[10px] font-semibold px-3 py-1 rounded-full shadow-md z-20 border border-border/50">
              محاذاه التصميم
            </button>
          )}
        </div>

        <MobilePanel data={data} updateData={updateData} visibility={visibility}
          toggleVisibility={toggleVisibility} onSave={handleSave} onDownload={handleDownload} postRef={exportPostRef} />
      </div>

      <div className="pointer-events-none fixed -left-[200vw] -top-[200vh] opacity-0" aria-hidden="true">
        <InstagramPost ref={exportPostRef} data={data} updateData={updateData} visibility={visibility} exportMode />
      </div>
    </div>
  );
};

/* ── Mobile Bottom Panel ── */
interface MobilePanelProps {
  data: PostData;
  updateData: (u: Partial<PostData>) => void;
  visibility: Visibility;
  toggleVisibility: (k: keyof Visibility) => void;
  onSave: () => void;
  onDownload: () => void;
  postRef: React.RefObject<HTMLDivElement>;
}

const MobilePanel = ({ data, updateData, visibility, toggleVisibility, onSave, onDownload, postRef }: MobilePanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImg = (file: File) => {
    const r = new FileReader();
    r.onload = e => updateData({ profileImage: e.target?.result as string });
    r.readAsDataURL(file);
  };

  const updateTag = (i: number, v: string) => {
    const t = [...data.hashtags]; t[i] = v; updateData({ hashtags: t });
  };

  return (
    <div className="panel-card ig-bordered !rounded-b-none !rounded-t-2xl !p-2.5 shrink-0 overflow-hidden" dir="rtl">
      <div className="flex gap-1.5 text-[9px] items-stretch overflow-hidden">
        {/* Right: Caption, Hashtags, Counts */}
        <div className="flex-1 basis-0 flex flex-col gap-0.5 min-w-0 overflow-hidden">
          <p className="font-bold text-center text-[9px]">اكتب العنوان المراد</p>
          <input className="field-input w-full text-[9px] text-center !py-0.5 !px-1" value={data.caption}
            onChange={e => updateData({ caption: e.target.value })} placeholder="Caption" />
          <Divider />
          <p className="font-bold text-center text-[9px]">اكتب الهاشتاج المراد</p>
          <div className="flex flex-wrap gap-0.5 items-center justify-center">
            {data.hashtags.map((tag, i) => (
              <input key={i} className="field-input w-10 text-[8px] text-center !py-0 !px-0.5" value={tag}
                onChange={e => updateTag(i, e.target.value)} />
            ))}
            {data.hashtags.length < 5 && <button onClick={() => updateData({ hashtags: [...data.hashtags, `Tag${data.hashtags.length + 1}`] })}
              className="w-3 h-3 rounded-full border border-blue-400 text-blue-400 text-[7px] flex items-center justify-center leading-none">+</button>}
            {data.hashtags.length > 1 && <button onClick={() => updateData({ hashtags: data.hashtags.slice(0, -1) })}
              className="w-3 h-3 rounded-full border border-red-400 text-red-400 text-[7px] flex items-center justify-center leading-none">×</button>}
          </div>
          <Divider />
          <div className="flex gap-1">
            <MiniCount label="إعجابات" value={data.likesCount}
              onInc={() => updateData({ likesCount: data.likesCount + 500 })}
              onDec={() => updateData({ likesCount: Math.max(0, data.likesCount - 500) })}
              onChange={v => updateData({ likesCount: v })} />
            <MiniCount label="تعليقات" value={data.commentsCount}
              onInc={() => updateData({ commentsCount: data.commentsCount + 500 })}
              onDec={() => updateData({ commentsCount: Math.max(0, data.commentsCount - 500) })}
              onChange={v => updateData({ commentsCount: v })} />
          </div>
        </div>

        <div className="w-px bg-foreground/10 self-stretch shrink-0" />

        {/* Center: Upload, Username, Location */}
        <div className="flex-1 basis-0 flex flex-col gap-1 items-stretch min-w-0 overflow-hidden px-0.5">
          <div className="min-w-0">
            <p className="font-bold text-center text-[9px] mb-0.5">رفع صورة</p>
            <button onClick={() => fileInputRef.current?.click()}
              className="field-input w-full text-center text-[9px] !py-0.5 !px-0.5 cursor-pointer font-semibold">Upload</button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImg(f); }} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-center text-[9px] mb-0.5">اسم المستخدم</p>
            <input className="field-input w-full text-center text-[9px] !py-0.5 !px-0.5 min-w-0" value={data.username}
              onChange={e => updateData({ username: e.target.value })} placeholder="user_name" />
          </div>
          <Divider />
          <p className="font-bold text-[9px]">المكان/الموسيقى</p>
          <div className="flex items-center gap-0.5 w-full">
            <input className="field-input flex-1 text-[7px] !py-0.5 !px-0.5 min-w-0" value={data.location}
              onChange={e => updateData({ location: e.target.value })} placeholder="Egypt, Cairo" disabled={!data.useLocation} />
            <button onClick={() => updateData({ useLocation: true })}
              className={`w-3 h-3 rounded-full border text-[7px] flex items-center justify-center shrink-0 ${data.useLocation ? 'border-red-400 text-red-400' : 'border-blue-400 text-blue-400'}`}>
              {data.useLocation ? '×' : '+'}
            </button>
          </div>
          <div className="flex items-center gap-0.5 w-full">
            <input className="field-input flex-1 text-[7px] !py-0.5 !px-0.5 min-w-0" value={data.music}
              onChange={e => updateData({ music: e.target.value })} placeholder="TUL8TE · LA3BALY" disabled={data.useLocation} />
            <button onClick={() => updateData({ useLocation: false })}
              className={`w-3 h-3 rounded-full border text-[7px] flex items-center justify-center shrink-0 ${!data.useLocation ? 'border-red-400 text-red-400' : 'border-blue-400 text-blue-400'}`}>
              {!data.useLocation ? '×' : '+'}
            </button>
          </div>
        </div>

        <div className="w-px bg-foreground/10 self-stretch shrink-0" />

        {/* Left: Visibility + Actions */}
        <div className="flex-1 basis-0 flex flex-col gap-0.5 min-w-0 overflow-hidden">
          <VisibilityToggle visibility={visibility} toggleVisibility={toggleVisibility} compact />
          <Divider />
          <div className="flex items-center gap-1">
            <button onClick={onSave} className="btn-save flex-1 !text-[9px] !py-0.5 !px-1">حفظ</button>
            <button onClick={onDownload} className="w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground/60">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
          <PurchaseFlow data={data} visibility={visibility} postRef={postRef} compact />
        </div>
      </div>
    </div>
  );
};

const Divider = () => <hr className="border-foreground/10 my-0.5 w-full" />;

const MiniCount = ({ label, value, onInc, onDec, onChange }: {
  label: string; value: number; onInc: () => void; onDec: () => void; onChange: (v: number) => void;
}) => (
  <div className="flex-1 min-w-0">
    <p className="text-center text-[7px] font-semibold">{label}</p>
    <div className="flex items-center gap-px">
      <div className="flex flex-col text-[6px]">
        <button onClick={onInc} className="hover:bg-muted rounded px-0.5 leading-none">▲</button>
        <button onClick={onDec} className="hover:bg-muted rounded px-0.5 leading-none">▼</button>
      </div>
      <input className="field-input flex-1 text-center text-[8px] !py-0 min-w-0 !px-0.5" value={formatCount(value)}
        onChange={e => onChange(parseCount(e.target.value))} />
    </div>
  </div>
);

export default MirrorPage;
