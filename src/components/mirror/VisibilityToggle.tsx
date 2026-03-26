import { useState } from 'react';
import { Visibility } from './types';

interface Props {
  visibility: Visibility;
  toggleVisibility: (key: keyof Visibility) => void;
  compact?: boolean;
}

const labels: { key: keyof Visibility; ar: string; en: string }[] = [
  { key: 'stories', ar: 'القصص', en: 'Stories' },
  { key: 'hashtags', ar: 'هاشتاج', en: 'Hashtag' },
  { key: 'more', ar: 'المزيد', en: 'More' },
  { key: 'comments', ar: 'تعليقات', en: 'Comments' },
  { key: 'viewAll', ar: 'عرض الكل', en: 'View All' },
  { key: 'address', ar: 'المكان', en: 'address' },
];

const VisibilityToggle = ({ visibility, toggleVisibility, compact }: Props) => {
  const [open, setOpen] = useState(true);

  if (compact) {
    return (
      <div dir="rtl">
        <p className="text-[10px] font-bold mb-1 text-center text-foreground/80">إخفاء/اظهار</p>
        <div className="flex flex-col gap-0.5">
          {labels.map(({ key, ar, en }) => (
            <div key={key} className="flex items-center justify-between text-[9px] gap-1">
              <span className="text-foreground/70 w-10 text-right">{ar}</span>
              <Switch on={visibility[key]} onToggle={() => toggleVisibility(key)} small />
              <span className="text-foreground/70 w-12">{en}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl">
      {/* Collapsed / Open state */}
      <div className="panel-card ig-bordered">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">إخفاء/اظهار</span>
          <button onClick={() => setOpen(!open)}
            className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">
            {open ? '×' : '▼'}
          </button>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col gap-2">
            {labels.map(({ key, ar, en }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[11px] text-foreground/80 w-14 text-right">{ar}</span>
                <Switch on={visibility[key]} onToggle={() => toggleVisibility(key)} />
                <span className="text-[11px] text-foreground/80 w-16">{en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Switch = ({ on, onToggle, small }: { on: boolean; onToggle: () => void; small?: boolean }) => {
  const w = small ? 26 : 34;
  const h = small ? 14 : 18;
  const dot = small ? 10 : 14;
  return (
    <button onClick={onToggle} className="toggle-switch" style={{
      width: w, height: h,
      background: on ? 'linear-gradient(90deg, hsl(35 89% 57%), hsl(350 72% 50%), hsl(315 76% 40%))' : 'hsl(220 10% 82%)',
    }}>
      <div className="toggle-dot" style={{
        width: dot, height: dot,
        top: (h - dot) / 2,
        left: on ? w - dot - 2 : 2,
      }} />
    </button>
  );
};

export default VisibilityToggle;
