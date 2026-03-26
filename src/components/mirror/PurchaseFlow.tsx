import { useState, RefObject } from 'react';
import { PostData, Visibility } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface Props {
  data: PostData;
  visibility: Visibility;
  postRef: RefObject<HTMLDivElement>;
  compact?: boolean;
}

const PurchaseFlow = ({ data, visibility, postRef, compact }: Props) => {
  const [showPurchase, setShowPurchase] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [sending, setSending] = useState(false);

  const buildDesignSnapshot = async () => {
    if (!postRef.current) return null;

    await document.fonts?.ready;
    const canvas = await html2canvas(postRef.current, {
      useCORS: true,
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const handleConfirm = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (!/^[\d\s+()-]{8,20}$/.test(form.phone.trim())) {
      toast.error('رقم التليفون غير صحيح');
      return;
    }

    setSending(true);
    try {
      const designImage = await buildDesignSnapshot();

      const { error } = await supabase.functions.invoke('create-order', {
        body: {
          customerName: form.name.trim(),
          customerAddress: form.address.trim(),
          customerPhone: form.phone.trim(),
          postData: {
            username: data.username,
            profileImage: data.profileImage,
            caption: data.caption,
            hashtags: data.hashtags,
            likesCount: data.likesCount,
            commentsCount: data.commentsCount,
            location: data.location,
            music: data.music,
            useLocation: data.useLocation,
            visibility,
            designImage,
          },
          profileImageUrl: data.profileImage,
        },
      });

      if (error) throw error;

      setShowPurchase(false);
      setForm({ name: '', address: '', phone: '' });
      toast.success('تم ارسال طلبك وسيتم مراجعته والتواصل معك لتأكيد عمليه الشراء قريبا');
    } catch (err) {
      console.error('Order error:', err);
      toast.error('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button className={`btn-purchase w-full ${compact ? 'text-[10px] py-1 px-2' : ''}`} onClick={() => setShowPurchase(true)}>شراء</button>
      <p className="hint-text text-center mt-1">
        يجب مراعاه{' '}
        <button className="text-blue-500 underline" onClick={() => setShowTerms(true)}>شروط التخصيص</button>
      </p>

      {/* Terms Modal */}
      {showTerms && (
        <Modal onClose={() => setShowTerms(false)}>
          <h3 className="text-base font-bold mb-3">شروط التخصيص</h3>
          <ul className="text-sm space-y-2 list-disc pr-5 text-foreground/80">
            <li>يجب ان تكون الصورة واضحة وبجودة عالية</li>
            <li>لا يمكن تعديل التصميم بعد تأكيد الطلب</li>
            <li>يتم التواصل خلال 24 ساعة لتأكيد الطلب</li>
            <li>الاسعار لا تشمل الشحن</li>
            <li>يحق للمتجر رفض اي طلب يخالف سياسة المتجر</li>
          </ul>
        </Modal>
      )}

      {/* Purchase Modal */}
      {showPurchase && (
        <Modal onClose={() => setShowPurchase(false)}>
          <h3 className="text-base font-bold mb-4">بيانات الطلب</h3>
          <div className="flex flex-col gap-3">
            <FormField label="الاسم الكامل">
              <input className="field-input w-full" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="الاسم الكامل" />
            </FormField>
            <FormField label="العنوان بالتفصيل">
              <textarea className="field-input w-full resize-none" rows={2} value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="المحافظة - المدينة - الشارع" />
            </FormField>
            <FormField label="رقم التليفون">
              <input className="field-input w-full" value={form.phone} type="tel"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
            </FormField>
            <button className="btn-save w-full mt-1" onClick={handleConfirm} disabled={sending}>
              {sending ? 'جاري الإرسال...' : 'تأكيد'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]" onClick={onClose}>
    <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-xl" dir="rtl" onClick={e => e.stopPropagation()}
      style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="flex justify-end mb-1">
        <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">×</button>
      </div>
      {children}
    </div>
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-semibold text-foreground/80 mb-1 block">{label}</label>
    {children}
  </div>
);

export default PurchaseFlow;
