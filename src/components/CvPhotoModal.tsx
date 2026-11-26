import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface CvPhotoModalProps {
  open: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  currentShowPhoto: boolean;
  buttonRadiusClass: string;
  onSavePhoto: (photoDataUrl: string | undefined, showInCv: boolean) => void;
}

export const CvPhotoModal: React.FC<CvPhotoModalProps> = ({
  open,
  onClose,
  currentPhotoUrl,
  currentShowPhoto,
  buttonRadiusClass,
  onSavePhoto,
}) => {
  const [photoDraft, setPhotoDraft] = useState<string | undefined>(currentPhotoUrl);
  const [showInCvDraft, setShowInCvDraft] = useState<boolean>(currentShowPhoto);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhotoDraft(currentPhotoUrl);
    setShowInCvDraft(currentShowPhoto);
    setErrorMsg('');

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, currentPhotoUrl, currentShowPhoto, onClose]);

  if (!open) return null;

  const handlePhotoFile = (file: File) => {
    setErrorMsg('');
    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (PNG أو JPG أو WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDraft(String(reader.result || ''));
      setShowInCvDraft(true);
    };
    reader.onerror = () => setErrorMsg('تعذر قراءة الصورة المحددة.');
    reader.readAsDataURL(file);
  };

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="استيراد صورة شخصية للـ CV"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg bg-white border border-[#CBD5E1] shadow-2xl overflow-hidden ${buttonRadiusClass}`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0F172A] text-white border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-[#60A5FA]" />
            <div>
              <h3 className="font-editorial text-base font-bold">استيراد صورة شخصية للـ CV</h3>
              <p className="text-[11px] text-[#CBD5E1]">
                إضافة صورة اختيارية مع تحكم كامل بالإظهار أو الإخفاء للتوافق مع ATS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className={`min-h-[34px] min-w-[34px] flex items-center justify-center border border-[#334155] text-[#CBD5E1] hover:text-white cursor-pointer ${buttonRadiusClass}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* ATS Advisory */}
          <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
            <span>
              <strong>تنبيه أنظمة ATS:</strong> أنظمة التوظيف الآلية (ATS) تفضل السيرة الخالية من الصور عند التقديم الإلكتروني. يمكنك حفظ الصورة هنا وإظهارها للنسخ التقديمية المباشرة، أو إخفاؤها بضغطة واحدة للوصول لتوافق 100%.
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhotoFile(f);
              e.target.value = '';
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handlePhotoFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={`p-5 border-2 border-dashed text-center cursor-pointer transition-colors ${buttonRadiusClass}`}
            style={{
              borderColor: dragging ? '#2563EB' : '#CBD5E1',
              backgroundColor: dragging ? '#EFF6FF' : '#F8FAFC',
            }}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-[#2563EB]" />
            <div className="font-bold text-[#0F172A]">اضغط لاختيار صورة شخصية أو اسحبها هنا</div>
            <div className="text-[11px] text-[#64748B] mt-0.5">PNG / JPG / WEBP حتى 5 ميجابايت</div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] font-semibold">
              {errorMsg}
            </div>
          )}

          {photoDraft && (
            <div
              className={`p-3 border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3 ${buttonRadiusClass}`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={photoDraft}
                  alt="معاينة الصورة الشخصية"
                  className="w-16 h-16 object-cover border border-[#CBD5E1] rounded-lg bg-white"
                />
                <div className="space-y-1.5">
                  <div className="font-bold text-[#0F172A]">تم تحميل الصورة</div>
                  <button
                    type="button"
                    onClick={() => setShowInCvDraft((prev) => !prev)}
                    className={`min-h-[32px] px-2.5 border text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: showInCvDraft ? '#EFF6FF' : '#FFFFFF',
                      borderColor: showInCvDraft ? '#2563EB' : '#CBD5E1',
                      color: showInCvDraft ? '#1E3A8A' : '#475569',
                    }}
                  >
                    {showInCvDraft ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>ظاهرة في معاينة الـ CV</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>مخفية (توافق ATS 100%)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPhotoDraft(undefined);
                  setShowInCvDraft(false);
                }}
                className={`min-h-[34px] px-2.5 border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إزالة</span>
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[36px] px-4 border border-[#CBD5E1] bg-white font-semibold cursor-pointer ${buttonRadiusClass}`}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              onSavePhoto(photoDraft, Boolean(photoDraft && showInCvDraft));
              onClose();
            }}
            className={`min-h-[36px] px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتطبيق</span>
          </button>
        </div>
      </div>
    </div>
  );
};
