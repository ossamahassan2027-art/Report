import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  FilePlus2,
  Globe,
  MessageCircle,
  Printer,
  ShieldCheck,
  Sparkles,
  Stamp,
  Trash2,
  X,
} from 'lucide-react';
import {
  LibraryCard,
  ParentReport15Document,
  ParentReportSectionItem,
  TrustedSourceCitation,
} from '../types/library';
import { analyzeComplaintLocally } from '../utils/libraryEngine';
import {
  buildParentReport15Sections,
  fetchTrustedEnrichment,
  sanitizeNoMedicationText,
} from '../utils/trustedEvidenceSources';
import { copyTextToClipboard } from '../utils/storageAndBackup';

interface ParentReportWizardModalProps {
  open: boolean;
  onClose: () => void;
  buttonRadiusClass: string;
  libraryCards: LibraryCard[];
  centerName: string;
  specialistName: string;
  specialistRole: string;
  initialComplaint?: string;
  initialChildName?: string;
  initialAge?: string;
  initialBirthDate?: string;
  initialGuardianName?: string;
  initialPhone?: string;
  onSaveAndStampReport: (doc: ParentReport15Document) => void;
  onPrintParentReport: (doc: ParentReport15Document) => void;
  onNotify: (msg: string) => void;
}

export const ParentReportWizardModal: React.FC<ParentReportWizardModalProps> = ({
  open,
  onClose,
  buttonRadiusClass,
  libraryCards,
  centerName,
  specialistName,
  specialistRole,
  initialComplaint = '',
  initialChildName = '',
  initialAge = '',
  initialBirthDate = '',
  initialGuardianName = '',
  initialPhone = '',
  onSaveAndStampReport,
  onPrintParentReport,
  onNotify,
}) => {
  const [step, setStep] = useState<'input' | 'review' | 'done'>('input');

  const [childName, setChildName] = useState(initialChildName);
  const [age, setAge] = useState(initialAge);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [guardianName, setGuardianName] = useState(initialGuardianName);
  const [guardianPhone, setGuardianPhone] = useState(initialPhone);
  const [complaintText, setComplaintText] = useState(initialComplaint);

  const [busyEnrich, setBusyEnrich] = useState(false);
  const [usedOnlineFlag, setUsedOnlineFlag] = useState(false);
  const [docState, setDocState] = useState<ParentReport15Document | null>(null);
  const [editingSecId, setEditingSecId] = useState<string | null>(null);
  const [editingSecText, setEditingSecText] = useState('');

  useEffect(() => {
    if (open) {
      setStep('input');
      setChildName(initialChildName || '');
      setAge(initialAge || '');
      setBirthDate(initialBirthDate || '');
      setGuardianName(initialGuardianName || '');
      setGuardianPhone(initialPhone || '');
      setComplaintText(initialComplaint || '');
      setDocState(null);
      setEditingSecId(null);
    }
  }, [
    open,
    initialAge,
    initialBirthDate,
    initialChildName,
    initialComplaint,
    initialGuardianName,
    initialPhone,
  ]);

  const liveMatchPreview = useMemo(() => {
    if (!complaintText.trim()) return null;
    return analyzeComplaintLocally(complaintText, libraryCards);
  }, [complaintText, libraryCards]);

  if (!open) return null;

  const handleGenerateAndEnrich = async () => {
    if (!childName.trim() || !complaintText.trim()) {
      onNotify('يرجى إدخال اسم الطفل ونص الشكوى/الملاحظات أولاً.');
      return;
    }

    setBusyEnrich(true);
    try {
      const matchRes = analyzeComplaintLocally(complaintText, libraryCards);
      const matchedCards = matchRes.top5.map((m) => m.card);
      const conditions = matchedCards.map((c) => c.condition);

      const { citations, usedOnline } = await fetchTrustedEnrichment({
        complaintText,
        matchedConditions: conditions,
      });
      setUsedOnlineFlag(usedOnline);

      const builtDoc = buildParentReport15Sections({
        childName: childName.trim(),
        age: age.trim() || '[ ... ]',
        birthDate: birthDate.trim() || '[ ... ]',
        guardianName: guardianName.trim() || '[ ... ]',
        guardianPhone: guardianPhone.trim() || '[ ... ]',
        centerName,
        specialistName,
        specialistRole,
        complaintText: sanitizeNoMedicationText(complaintText.trim()),
        matchedCards,
        citations,
      });

      setDocState(builtDoc);
      setStep('review');
      onNotify(
        usedOnline
          ? 'تم الاستخراج من المكتبة وإثراء المراجع الموثوقة (NIMH/DSM-5-TR/WHO/CDC/ASHA) بنجاح'
          : 'تم توليد التقرير الـ 15 قسم مع المراجع العلمية الموثوقة المعتمدة بنجاح'
      );
    } finally {
      setBusyEnrich(false);
    }
  };

  const handleUpdateSectionStatus = (
    id: string,
    status: ParentReportSectionItem['status']
  ) => {
    setDocState((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) => (s.id === id ? { ...s, status } : s)),
          }
        : prev
    );
  };

  const handleSaveSectionEdit = (id: string) => {
    const clean = sanitizeNoMedicationText(editingSecText);
    setDocState((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === id ? { ...s, content: clean, status: 'approved' } : s
            ),
          }
        : prev
    );
    setEditingSecId(null);
    onNotify('تم حفظ تعديل القسم والموافقة عليه (مع فحص خلوه من المعلومات الدوائية)');
  };

  const handleApproveAllRemaining = () => {
    setDocState((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) =>
              s.status === 'pending' ? { ...s, status: 'approved' } : s
            ),
          }
        : prev
    );
    onNotify('تمت الموافقة على كافة الأقسام النشطة');
  };

  const allThreeConfirmed = Boolean(
    docState &&
      docState.confirmations[0] &&
      docState.confirmations[1] &&
      docState.confirmations[2]
  );

  const handleConfirmAndStamp = () => {
    if (!docState || !allThreeConfirmed) return;
    const stampedDoc: ParentReport15Document = {
      ...docState,
      stamped: true,
      stampedAt: new Date().toISOString().slice(0, 10),
    };
    setDocState(stampedDoc);
    onSaveAndStampReport(stampedDoc);
    setStep('done');
  };

  const serializeFullReportText = (doc: ParentReport15Document) => {
    const activeSecs = doc.sections.filter((s) => s.status !== 'deleted');
    return [
      `📄 ${doc.centerName} — تقرير ولي الأمر المعتمد (15 قسم)`,
      `الطفل: ${doc.childName} | العمر: ${doc.age} | التاريخ: ${doc.createdAt}`,
      doc.stamped ? `✅ مختوم ومعتمد بتاريخ ${doc.stampedAt}` : '',
      '====================================',
      ...activeSecs.map((s) => `\n[${s.title}]\n${s.content}\n(المصدر: ${s.sourceTag})`),
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleCopyReport = async () => {
    if (!docState) return;
    const ok = await copyTextToClipboard(serializeFullReportText(docState));
    onNotify(ok ? 'تم نسخ نص التقرير الكامل (15 قسم) للحافظة' : 'تعذر النسخ التلقائي');
  };

  const handleShareWhatsapp = () => {
    if (!docState) return;
    const fullText = serializeFullReportText(docState);
    const shortMsg =
      fullText.length > 1800
        ? `${fullText.slice(0, 1800)}\n...\n(ملخص من ${docState.centerName})`
        : fullText;
    const cleanPhone = (docState.guardianPhone || '').replace(/\D/g, '');
    const waUrl = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(shortMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(shortMsg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      dir="rtl"
      className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="معالج تقرير ولي الأمر الموثق (15 قسم)"
    >
      <div className="w-full max-w-5xl bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0A1633] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shrink-0">
              <FilePlus2 className="w-5 h-5 text-white" />
            </span>
            <div>
              <h2 className="text-sm md:text-base font-bold">
                تقرير ولي الأمر الموثق (قالب 15 قسم متكامل)
              </h2>
              <p className="text-[11px] text-[#93C5FD]">
                استخراج من المكتبة + مصادر علمية معتمدة فقط (NIMH / DSM-5-TR / WHO / CDC / ASHA) · بدون أي معلومات دوائية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className={`p-2 bg-[#1E293B] hover:bg-[#334155] text-white cursor-pointer ${buttonRadiusClass}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'input', label: '1. بيانات الطفل والمكتبة + المصادر' },
            { id: 'review', label: '2. مراجعة الـ 15 قسم والتأكيد الإجباري (3 خانات)' },
            { id: 'done', label: '3. الختم والحفظ والطباعة ومشاركة واتساب' },
          ].map((st) => {
            const active = step === st.id;
            return (
              <span
                key={st.id}
                className={`px-3 py-1 font-bold ${buttonRadiusClass}`}
                style={{
                  backgroundColor: active ? '#2563EB' : '#E2E8F0',
                  color: active ? '#FFFFFF' : '#475569',
                }}
              >
                {st.label}
              </span>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'input' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    اسم الطفل / الحالة *
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="الاسم الكامل..."
                    className={`w-full min-h-[38px] px-3 text-xs border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">العمر</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="مثال: 7 سنوات و3 أشهر"
                    className={`w-full min-h-[38px] px-3 text-xs border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    تاريخ الميلاد
                  </label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className={`w-full min-h-[38px] px-3 text-xs border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    اسم ولي الأمر
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="اسم ولي الأمر..."
                    className={`w-full min-h-[38px] px-3 text-xs border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">
                    رقم الهاتف / واتساب
                  </label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className={`w-full min-h-[38px] px-3 text-xs border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div className="flex items-end">
                  <div className="w-full p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg text-[11px] font-semibold text-[#166534]">
                    ممنوع منعاً باتاً إدراج أي معلومات أو وصفات دوائية.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  شكوى ولي الأمر والملاحظات السلوكية والتربوية *
                </label>
                <textarea
                  rows={4}
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="اكتب الشكوى والملاحظات كما وردت من الأسرة أو المدرسة (يقبل العامية والفصحى)..."
                  className={`w-full p-3 text-xs border border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none ${buttonRadiusClass}`}
                />
              </div>

              {liveMatchPreview && (
                <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl space-y-2">
                  {liveMatchPreview.redFlags.length > 0 && (
                    <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs font-bold text-[#B91C1C] flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{liveMatchPreview.redFlags.join(' · ')}</div>
                    </div>
                  )}
                  <div className="text-xs font-bold text-[#1E3A8A]">
                    المطابقة الفورية مع بطاقات المكتبة ({libraryCards.length} بطاقة):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {liveMatchPreview.top5.map((m) => (
                      <span
                        key={m.card.id}
                        className="px-2.5 py-1 rounded-md bg-white border border-[#BFDBFE] text-[11px] font-semibold text-[#1E40AF]"
                      >
                        {m.card.title} ({m.score}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={busyEnrich}
                  onClick={handleGenerateAndEnrich}
                  className={`min-h-[42px] px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 ${buttonRadiusClass}`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {busyEnrich
                      ? 'جاري الاستخراج من المكتبة والمصادر الموثوقة...'
                      : 'توليد التقرير (15 قسم) وإكمال المصادر الموثوقة'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 'review' && docState && (
            <div className="space-y-4">
              {/* Trusted Citations Strip */}
              <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                    <Globe className="w-4 h-4" />
                    <span>
                      المراجع الموثوقة المرفقة بالتقرير ({docState.citations.length}) —{' '}
                      {usedOnlineFlag ? 'مُحدّثة من البحث المباشر' : 'قاعدة الأدلة العلمية الموثقة'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApproveAllRemaining}
                    className={`px-3 py-1 bg-[#15803D] hover:bg-[#166534] text-white text-[11px] font-bold cursor-pointer ${buttonRadiusClass}`}
                  >
                    موافقة سريعة على كل الأقسام النشطة
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {docState.citations.map((cit: TrustedSourceCitation) => (
                    <div
                      key={cit.id}
                      className="p-2.5 bg-white border border-[#DCFCE7] rounded-lg text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534] font-bold">
                          {cit.org}
                        </span>
                        <span className="text-[#64748B]">{cit.retrievedDate}</span>
                      </div>
                      <div className="font-bold text-[#0F172A]">{cit.title}</div>
                      <p className="text-[#475569]">{cit.summaryAr}</p>
                      <a
                        href={cit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{cit.url}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* All 15 Sections Review Cards */}
              <div className="space-y-2.5">
                {docState.sections.map((sec) => {
                  const isEditing = editingSecId === sec.id;
                  const isDeleted = sec.status === 'deleted';
                  const isApproved = sec.status === 'approved';
                  return (
                    <div
                      key={sec.id}
                      className={`p-3.5 border rounded-xl transition-colors ${
                        isDeleted
                          ? 'bg-[#FEF2F2]/60 border-[#FECACA] opacity-60'
                          : isApproved
                          ? 'bg-[#F0FDF4]/50 border-[#86EFAC]'
                          : 'bg-white border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-bold text-[#0F172A]">{sec.title}</span>
                          <span className="mr-2 text-[10.5px] px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1E40AF] font-semibold">
                            المصدر: {sec.sourceTag}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSecId(sec.id);
                              setEditingSecText(sec.content);
                            }}
                            className={`px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSectionStatus(
                                sec.id,
                                isDeleted ? 'pending' : 'deleted'
                              )
                            }
                            className={`px-2.5 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{isDeleted ? 'استعادة' : 'حذف'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateSectionStatus(sec.id, 'approved')}
                            className={`px-2.5 py-1 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                            style={{
                              backgroundColor: isApproved ? '#15803D' : '#ECFDF5',
                              color: isApproved ? '#FFFFFF' : '#166534',
                            }}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isApproved ? 'تمت الموافقة ✓' : 'موافق'}</span>
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            value={editingSecText}
                            onChange={(e) => setEditingSecText(e.target.value)}
                            className={`w-full p-2.5 text-xs border border-[#2563EB] ${buttonRadiusClass}`}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveSectionEdit(sec.id)}
                              className={`px-3 py-1.5 bg-[#2563EB] text-white text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                            >
                              حفظ التعديل والموافقة
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSecId(null)}
                              className={`px-3 py-1.5 bg-[#E2E8F0] text-[#334155] text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-xs text-[#334155] leading-relaxed">
                          {sec.content}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mandatory 3 Confirmation Checkboxes */}
              <div className="p-4 bg-[#FFFBEB] border-2 border-[#FCD34D] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#92400E]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>التأكيد المهني الإلزامي (لا يعمل زر الاعتماد والختم إلا بعد تحديد الخانات الثلاث):</span>
                </div>

                {[
                  '1. أؤكد مراجعة بيانات الطفل والملاحظات والـ 15 قسماً والتحقق من دقتها التربوية الميدانية.',
                  '2. أؤكد خلو التقرير تماماً من أي وصفات أو توصيات دوائية أو قطع تشخيصي طبي خارج الاختصاص.',
                  '3. أوافق على ختم التقرير باسم الأخصائي والمركز وحفظه في سجل الحالات المعتمد.',
                ].map((label, idx) => (
                  <label
                    key={label}
                    className="flex items-start gap-2.5 text-xs font-semibold text-[#0F172A] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={docState.confirmations[idx]}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDocState((prev) => {
                          if (!prev) return prev;
                          const nextConf: [boolean, boolean, boolean] = [...prev.confirmations] as [
                            boolean,
                            boolean,
                            boolean,
                          ];
                          nextConf[idx] = checked;
                          return { ...prev, confirmations: nextConf };
                        });
                      }}
                      className="mt-0.5 w-4 h-4 accent-[#15803D]"
                    />
                    <span>{label}</span>
                  </label>
                ))}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className={`min-h-[38px] px-4 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] text-xs font-bold cursor-pointer ${buttonRadiusClass}`}
                  >
                    رجوع لتعديل البيانات
                  </button>
                  <button
                    type="button"
                    disabled={!allThreeConfirmed}
                    onClick={handleConfirmAndStamp}
                    className={`min-h-[42px] px-5 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors ${buttonRadiusClass} ${
                      allThreeConfirmed
                        ? 'bg-[#059669] hover:bg-[#047857] cursor-pointer'
                        : 'bg-[#94A3B8] cursor-not-allowed opacity-70'
                    }`}
                  >
                    <Stamp className="w-4 h-4" />
                    <span>اعتماد وختم التقرير وحفظه في سجل الحالات</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'done' && docState && (
            <div className="space-y-4">
              <div className="p-5 bg-[#ECFDF5] border border-[#6EE7B7] rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#059669] mx-auto" />
                <h3 className="text-base font-bold text-[#065F46]">
                  تم اعتماد وختم تقرير ({docState.childName}) وحفظه في سجل الحالات
                </h3>
                <p className="text-xs text-[#047857]">
                  ختم المراجعة: مُراجع ومُعتمد ✓ · {docState.specialistName} ({docState.stampedAt}) · 15 قسماً موثقاً
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className={`min-h-[40px] px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Copy className="w-4 h-4" />
                  <span>نسخ التقرير الكامل</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPrintParentReport(docState)}
                  className={`min-h-[40px] px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة / حفظ PDF (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsapp}
                  className={`min-h-[40px] px-4 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مشاركة واتساب لولي الأمر</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`min-h-[40px] px-4 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <BookOpenCheck className="w-4 h-4" />
                  <span>عرض في معاينة التقرير الرئيسي</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
