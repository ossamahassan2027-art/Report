import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FilePlus2,
  GripVertical,
  LayoutGrid,
  Lightbulb,
  Palette,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Type,
  Wand2,
} from 'lucide-react';
import {
  ATS_EXACT_HEADINGS,
  ATS_SECTION_ORDER,
  CV_FONT_OPTIONS,
  CV_VISUAL_TEMPLATES,
  CvCustomFieldType,
  CvData,
  CvDesignConfig,
  CvDisplayMode,
  CvFontId,
  CvLanguage,
  CvTemplateId,
  CvVisualTemplateId,
  DEFAULT_CV_DESIGN_CONFIG,
  DEFAULT_OSAMA_ATS_KEYWORDS,
} from '../types/cv';
import {
  CvGoalMode,
  enhanceCvWithActionVerbs,
  evaluateCvFieldConfidences,
  generateThreeSummaryVersions,
  getFiveSpecialtySuggestions,
  READY_CV_SENTENCE_LIBRARY,
  runFullCvQualityAudit100,
} from '../utils/cvSmartSuite';

interface CvSmartEnhancerPanelProps {
  cv: CvData;
  language: CvLanguage;
  templateId: CvTemplateId;
  buttonRadiusClass: string;
  onUpdateCv: (next: CvData) => void;
  onChangeTemplateId: (id: CvTemplateId) => void;
  onNotify: (msg: string) => void;
}

const ACCENT_SWATCHES = [
  '#1E3A8A',
  '#2563EB',
  '#0F766E',
  '#7C3AED',
  '#0A1633',
  '#B71C1C',
  '#111827',
  '#D97706',
];

const CUSTOM_FIELD_TYPES: { id: CvCustomFieldType; label: string }[] = [
  { id: 'text', label: 'نص' },
  { id: 'date', label: 'تاريخ' },
  { id: 'link', label: 'رابط' },
  { id: 'list', label: 'قائمة' },
  { id: 'image', label: 'صورة' },
  { id: 'file', label: 'ملف' },
];

export const CvSmartEnhancerPanel: React.FC<CvSmartEnhancerPanelProps> = ({
  cv,
  language,
  buttonRadiusClass,
  onUpdateCv,
  onChangeTemplateId,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'enhance' | 'suggest' | 'design' | 'sections'>('enhance');
  const [goalMode, setGoalMode] = useState<CvGoalMode>('job');
  const [specialtyQuery, setSpecialtyQuery] = useState('علاج وظيفي وتأهيل حركي ABAT');
  const [summaryVersionsVisible, setSummaryVersionsVisible] = useState(true);
  const [careerObjGoal, setCareerObjGoal] = useState<CvGoalMode>('center');

  // Add custom field state
  const [newFieldType, setNewFieldType] = useState<CvCustomFieldType>('text');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // Add custom section state
  const [newSecTitle, setNewSecTitle] = useState('');
  const [newSecItemsText, setNewSecItemsText] = useState('');

  // Custom template builder drawer
  const [customDesignOpen, setCustomDesignOpen] = useState(false);

  // Drag reorder state
  const [dragSecIdx, setDragSecIdx] = useState<number | null>(null);

  const design: CvDesignConfig = cv.designConfig || DEFAULT_CV_DESIGN_CONFIG;
  const updateDesign = (patch: Partial<CvDesignConfig>) => {
    const nextDesign = { ...design, ...patch };
    onUpdateCv({
      ...cv,
      designConfig: nextDesign,
      showPhotoInCv: nextDesign.photoPosition !== 'none' && Boolean(cv.personalPhotoDataUrl),
    });
  };

  const summaryVersions = useMemo(
    () => generateThreeSummaryVersions(cv, language, goalMode),
    [cv, language, goalMode]
  );

  const suggestions = useMemo(
    () => getFiveSpecialtySuggestions(specialtyQuery || cv.targetJobTitle, goalMode),
    [specialtyQuery, cv.targetJobTitle, goalMode]
  );

  const qualityAudit = useMemo(() => runFullCvQualityAudit100(cv), [cv]);
  const fieldConfidences = useMemo(() => evaluateCvFieldConfidences(cv), [cv]);

  const headings = ATS_EXACT_HEADINGS[language];
  const sectionOrder = cv.sectionOrder?.length ? cv.sectionOrder : [...ATS_SECTION_ORDER];
  const hiddenSections = new Set(cv.hiddenSections || []);

  const handleMakeCvDistinctive = () => {
    const enhanced = enhanceCvWithActionVerbs(cv, language, goalMode);
    onUpdateCv({
      ...enhanced,
      designConfig: {
        ...(cv.designConfig || DEFAULT_CV_DESIGN_CONFIG),
        visualTemplate: design.visualTemplate === 'ats' ? 'modern' : design.visualTemplate,
        accentColor: design.accentColor || '#1E3A8A',
      },
    });
    onNotify('✨ تم ترقية سيرتك الذاتية بالكامل: صياغة إنجازية + أفعال قوية + كلمات ATS!');
  };

  const handleSmartEnhanceAll = () => {
    const enhanced = enhanceCvWithActionVerbs(cv, language, goalMode);
    onUpdateCv(enhanced);
    setSummaryVersionsVisible(true);
    onNotify('تم تطبيق التحسين الذكي وتحديث الأفعال القوية والكلمات المفتاحية ✓');
  };

  const handleInsertSuggestedSentence = (
    text: string,
    target: 'summary' | 'experience' | 'skill'
  ) => {
    if (target === 'skill') {
      const exists = cv.skills.some((s) => s.name.trim().toLowerCase() === text.trim().toLowerCase());
      if (exists) {
        onNotify('هذه المهارة موجودة بالفعل في سيرتك');
        return;
      }
      onUpdateCv({
        ...cv,
        skills: [
          ...cv.skills,
          { id: `sk-sug-${Date.now()}`, name: text, level: language === 'ar' ? 'متقدم' : 'Advanced' },
        ],
      });
      onNotify('تمت إضافة المهارة المقترحة إلى قسم المهارات ✓');
      return;
    }

    if (target === 'summary') {
      onUpdateCv({
        ...cv,
        summary: cv.summary && !cv.summary.includes('[') ? `${cv.summary} ${text}` : text,
      });
      onNotify('تم إدراج الصياغة في الملخص المهني ✓');
      return;
    }

    // Add to first experience or create one
    if (cv.experiences.length > 0) {
      const first = cv.experiences[0];
      if (!first.bullets.includes(text)) {
        onUpdateCv({
          ...cv,
          experiences: cv.experiences.map((ex, i) =>
            i === 0 ? { ...ex, bullets: [...ex.bullets.filter((b) => b && b !== '[ ... ]'), text] } : ex
          ),
        });
      }
    } else {
      onUpdateCv({
        ...cv,
        experiences: [
          {
            id: `exp-sug-${Date.now()}`,
            jobTitle: cv.targetJobTitle || 'أخصائي تأهيل',
            company: 'مركز التأهيل التخصصي',
            location: 'مصر',
            dateRange: '01/2023 - حتى الآن',
            bullets: [text],
          },
        ],
      });
    }
    onNotify('تمت الإضافة الذكية إلى الخبرات العملية ✓');
  };

  const handleExpandExperienceBullets = () => {
    if (cv.experiences.length === 0) return;
    const bank = READY_CV_SENTENCE_LIBRARY[goalMode];
    const nextExps = cv.experiences.map((exp, idx) => {
      if (idx !== 0) return exp;
      const existing = new Set(exp.bullets.map((b) => b.trim()));
      const additions = bank.filter((line) => !existing.has(line)).slice(0, 2);
      return {
        ...exp,
        bullets: [...exp.bullets.filter((b) => b.trim() && b !== '[ ... ]'), ...additions],
      };
    });
    onUpdateCv({ ...cv, experiences: nextExps });
    onNotify('تم توسيع نقاط الإنجاز في الخبرة الرئيسية بنجاح ✓');
  };

  const handleApplyCareerObjective = () => {
    const objectiveMap: Record<CvGoalMode, string> = {
      job: 'الهدف المهني: الانضمام إلى مؤسسة تأهيلية أو طبية رائدة لتطبيق خبرة +20 عاماً في العلاج الوظيفي والتأهيل الحركي وتحليل السلوك التطبيقي (ABAT) وتحقيق نتائج ملموسة للحالات.',
      center: 'الهدف المهني: قيادة وتطوير المراكز التأهيلية عبر الإشراف الفني وبناء أنظمة الجودة وتدريب الكوادر المتخصصة وفق أحدث المعايير المؤسسية.',
      academic: 'الهدف المهني: الإسهام في التدريب التخصصي وإعداد الحقائب العلمية وتطبيق المقاييس التشخيصية المعتمدة لتطوير قدرات الكوادر والأسر.',
    };
    const objLine = objectiveMap[careerObjGoal];
    const customFields = [...(cv.customFields || [])];
    const existingIdx = customFields.findIndex((f) => f.label === 'الهدف الوظيفي');
    if (existingIdx >= 0) {
      customFields[existingIdx] = { ...customFields[existingIdx], value: objLine };
    } else {
      customFields.unshift({
        id: `cf-obj-${Date.now()}`,
        type: 'text',
        label: 'الهدف الوظيفي',
        value: objLine,
      });
    }
    onUpdateCv({ ...cv, customFields });
    onNotify('تم توليد وإدراج الهدف الوظيفي المناسب في سيرتك ✓');
  };

  const handleAddCustomField = () => {
    const lbl = newFieldLabel.trim();
    if (!lbl) return;
    const item = {
      id: `cf-${Date.now()}`,
      type: newFieldType,
      label: lbl,
      value: newFieldValue.trim() || (newFieldType === 'date' ? '2026/01/01' : '—'),
      fileName: newFieldType === 'file' ? newFieldValue.trim() || 'مستند مرفق' : undefined,
    };
    onUpdateCv({
      ...cv,
      customFields: [...(cv.customFields || []), item],
    });
    setNewFieldLabel('');
    setNewFieldValue('');
    onNotify(`تمت إضافة الحقل المخصص «${lbl}» ✓`);
  };

  const handleCustomFieldFileSelect = (file: File, targetType: 'image' | 'file') => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!newFieldLabel.trim()) {
        setNewFieldLabel(targetType === 'image' ? 'شهادة / مرفق مصور' : 'ملف مرفق');
      }
      setNewFieldValue(targetType === 'image' ? dataUrl : file.name);
    };
    if (targetType === 'image') {
      reader.readAsDataURL(file);
    } else {
      setNewFieldValue(file.name);
      if (!newFieldLabel.trim()) setNewFieldLabel('مستند مرفق');
    }
  };

  const handleAddCustomSection = () => {
    const title = newSecTitle.trim();
    if (!title) return;
    const items = newSecItemsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const id = `custom-${Date.now()}`;
    onUpdateCv({
      ...cv,
      customSections: [
        ...(cv.customSections || []),
        { id, title, items: items.length > 0 ? items : ['بند مخصص'], hidden: false },
      ],
      sectionOrder: [...sectionOrder, id],
    });
    setNewSecTitle('');
    setNewSecItemsText('');
    onNotify(`تمت إضافة القسم المخصص «${title}» وترتيبه بالمعاينة ✓`);
  };

  const moveSectionOrder = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sectionOrder.length) return;
    const copy = [...sectionOrder];
    const tmp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = tmp;
    onUpdateCv({ ...cv, sectionOrder: copy });
  };

  const handleDropSection = (dropIdx: number) => {
    if (dragSecIdx === null || dragSecIdx === dropIdx) {
      setDragSecIdx(null);
      return;
    }
    const copy = [...sectionOrder];
    const [moved] = copy.splice(dragSecIdx, 1);
    copy.splice(dropIdx, 0, moved);
    onUpdateCv({ ...cv, sectionOrder: copy });
    setDragSecIdx(null);
    onNotify('تم إعادة ترتيب أقسام السيرة الذاتية بالسحب والإفلات ✓');
  };

  const toggleSectionHidden = (secId: string) => {
    const next = new Set(hiddenSections);
    if (next.has(secId)) next.delete(secId);
    else next.add(secId);
    onUpdateCv({ ...cv, hiddenSections: Array.from(next) });
  };

  const resolveSectionTitle = (secId: string): string => {
    if (secId in headings) {
      return headings[secId as keyof typeof headings];
    }
    const found = (cv.customSections || []).find((c) => c.id === secId);
    return found ? found.title : secId;
  };

  return (
    <div className="space-y-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3 text-xs">
      {/* Top Hero Smart Strip: [✨ اجعل سيرتي مميزة] & [✨ تحسين ذكي] */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
            <Wand2 className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold text-[#0F172A]">مساعد السيرة الذكية وتصميم القوالب</div>
            <div className="text-[10.5px] text-[#64748B]">
              تقييم الجودة الحالي: <span className="font-bold text-[#059669]">{qualityAudit.score}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleSmartEnhanceAll}
            className={`min-h-[32px] px-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ تحسين ذكي</span>
          </button>
          <button
            type="button"
            onClick={handleMakeCvDistinctive}
            className={`min-h-[32px] px-2.5 bg-[#0A1633] hover:bg-[#1E293B] text-[#FDE047] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>✨ اجعل سيرتي مميزة</span>
          </button>
        </div>
      </div>

      {/* 4 Sub-tabs for focused access */}
      <div className="grid grid-cols-4 gap-1 bg-white p-1 border border-[#E2E8F0] rounded-lg">
        {(
          [
            ['enhance', 'تحسين وجودة'],
            ['suggest', '💡 اقترح لي'],
            ['design', '8 قوالب و10 خطوط'],
            ['sections', 'حقول وأقسام'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`min-h-[30px] px-1.5 text-[11px] font-bold cursor-pointer transition-colors ${buttonRadiusClass}`}
            style={{
              backgroundColor: subTab === id ? '#2563EB' : 'transparent',
              color: subTab === id ? '#FFFFFF' : '#475569',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: SMART ENHANCE + 3 SUMMARY PHRASINGS + QUALITY AUDIT 100% */}
      {subTab === 'enhance' && (
        <div className="space-y-3">
          {/* Confidence Badges Row */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-1.5">
            <div className="font-bold text-[#1E3A8A] text-[11px]">
              مؤشرات الثقة واكتمال الحقول الأساسية:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fieldConfidences.map((fc) => (
                <span
                  key={fc.field}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                    fc.status === 'confirmed'
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                      : fc.status === 'review'
                      ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
                  }`}
                >
                  {fc.status === 'confirmed' ? '✅' : fc.status === 'review' ? '⚠️' : '❌'} {fc.label}
                </span>
              ))}
            </div>
          </div>

          {/* 3 Summary Phrasings */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A]">
                مولد 3 صياغات للملخص المهني:
              </span>
              <button
                type="button"
                onClick={() => setSummaryVersionsVisible((v) => !v)}
                className="text-[11px] text-[#2563EB] font-bold cursor-pointer"
              >
                {summaryVersionsVisible ? 'إخفاء' : 'عرض الصياغات'}
              </button>
            </div>
            {summaryVersionsVisible && (
              <div className="space-y-2">
                {summaryVersions.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-2 rounded-lg border border-[#DBEAFE] bg-[#EFF6FF]/50 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E3A8A] text-[11px]">{ver.label}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateCv({ ...cv, summary: ver.text });
                          onNotify(`تم اعتماد «${ver.label}» في الملخص المهني ✓`);
                        }}
                        className={`px-2 py-0.5 bg-[#2563EB] text-white text-[10.5px] font-bold cursor-pointer ${buttonRadiusClass}`}
                      >
                        تطبيق الصياغة
                      </button>
                    </div>
                    <p className="text-[11px] text-[#334155] leading-relaxed">{ver.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Career Objectives + Experience Bullets Expander */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-2">
            <div className="font-bold text-[#0F172A]">مولد الأهداف الوظيفية وموسّع الإنجازات:</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <select
                value={careerObjGoal}
                onChange={(e) => setCareerObjGoal(e.target.value as CvGoalMode)}
                className={`min-h-[32px] px-2 border border-[#CBD5E1] bg-[#F8FAFC] font-semibold ${buttonRadiusClass}`}
              >
                <option value="job">هدف وظيفة إكلينيكية / أخصائي</option>
                <option value="center">هدف إدارة مراكز تأهيل وإشراف فني</option>
                <option value="academic">هدف أكاديمي وتدريب كوادر</option>
              </select>
              <button
                type="button"
                onClick={handleApplyCareerObjective}
                className={`min-h-[32px] px-2.5 bg-[#059669] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                إدراج الهدف الوظيفي
              </button>
              <button
                type="button"
                onClick={handleExpandExperienceBullets}
                className={`min-h-[32px] px-2.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                توسيع نقاط الخبرة
              </button>
            </div>
          </div>

          {/* 100% Quality Audit Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A] inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
                <span>تقييم الجودة الشامل 100% ({qualityAudit.passedCount}/{qualityAudit.totalChecks})</span>
              </span>
              <span
                className="px-2 py-0.5 rounded font-bold text-[11px]"
                style={{
                  backgroundColor: qualityAudit.score >= 85 ? '#ECFDF5' : '#FFFBEB',
                  color: qualityAudit.score >= 85 ? '#047857' : '#B45309',
                }}
              >
                {qualityAudit.score}%
              </span>
            </div>
            <div className="space-y-1">
              {qualityAudit.checks.map((chk) => (
                <div
                  key={chk.id}
                  className="flex items-start gap-1.5 text-[11px] leading-snug"
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      chk.ok ? 'text-[#059669]' : 'text-[#D97706]'
                    }`}
                  />
                  <div>
                    <div className={chk.ok ? 'text-[#0F172A] font-semibold' : 'text-[#92400E] font-bold'}>
                      {chk.label}
                    </div>
                    {!chk.ok && <div className="text-[10px] text-[#B45309]">{chk.tip}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-1 border-t border-[#E2E8F0] flex flex-wrap gap-1">
              <span className="text-[10px] text-[#64748B] font-bold ml-1">الكلمات المفتاحية التخصصية:</span>
              {(cv.atsKeywords?.length ? cv.atsKeywords : DEFAULT_OSAMA_ATS_KEYWORDS).map((kw) => (
                <span
                  key={kw}
                  className="px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1E3A8A] text-[10px] font-semibold"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: [💡 اقترح لي] + READY SENTENCE LIBRARY */}
      {subTab === 'suggest' && (
        <div className="space-y-3">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-2">
            <label className="block font-bold text-[#1E3A8A]">
              💡 اقترح لي حسب التخصص والهدف:
            </label>
            <input
              type="text"
              value={specialtyQuery}
              onChange={(e) => setSpecialtyQuery(e.target.value)}
              placeholder="مثال: علاج وظيفي / ABAT / إشراف فني..."
              className={`w-full min-h-[34px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
            />
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['job', 'وظيفة'],
                  ['center', 'مركز'],
                  ['academic', 'أكاديمي'],
                ] as [CvGoalMode, string][]
              ).map(([gId, gLabel]) => (
                <button
                  key={gId}
                  type="button"
                  onClick={() => setGoalMode(gId)}
                  className={`min-h-[32px] font-bold border cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: goalMode === gId ? '#2563EB' : '#F8FAFC',
                    color: goalMode === gId ? '#FFFFFF' : '#334155',
                    borderColor: goalMode === gId ? '#2563EB' : '#CBD5E1',
                  }}
                >
                  {gLabel}
                </button>
              ))}
            </div>
          </div>

          {/* 5 Specialty Suggestions with [+ إضافة ذكية] */}
          <div className="space-y-1.5">
            <div className="font-bold text-[#0F172A] flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-[#D97706]" />
              <span>5 اقتراحات مخصصة ({suggestions.length}):</span>
            </div>
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
                    {sug.categoryLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInsertSuggestedSentence(sug.text, sug.targetSection)}
                    className={`min-h-[28px] px-2.5 bg-[#059669] hover:bg-[#047857] text-white text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ إضافة ذكية</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#334155] leading-relaxed">{sug.text}</p>
              </div>
            ))}
          </div>

          {/* Ready Sentence Library */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-1.5">
            <div className="font-bold text-[#1E3A8A]">مكتبة الجمل الجاهزة ({goalMode}):</div>
            {READY_CV_SENTENCE_LIBRARY[goalMode].map((sent, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <span className="text-[11px] text-[#334155] flex-1">{sent}</span>
                <button
                  type="button"
                  onClick={() => handleInsertSuggestedSentence(sent, 'experience')}
                  className="px-2 py-1 rounded bg-[#EFF6FF] text-[#1E3A8A] font-bold text-[10.5px] shrink-0 cursor-pointer"
                >
                  إدراج
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: 8 VISUAL TEMPLATES + CUSTOM DESIGNER + 10 FONTS + AR/EN/BILINGUAL */}
      {subTab === 'design' && (
        <div className="space-y-3">
          {/* Display Language Mode */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-1.5">
            <div className="font-bold text-[#0F172A]">وضع عرض اللغة في السيرة الذاتية:</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['ar', 'العربية فقط'],
                  ['en', 'English Only'],
                  ['bilingual', 'ثنائي اللغة AR+EN'],
                ] as [CvDisplayMode, string][]
              ).map(([mId, mLabel]) => (
                <button
                  key={mId}
                  type="button"
                  onClick={() => updateDesign({ displayMode: mId })}
                  className={`min-h-[32px] font-bold border text-[11px] cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: design.displayMode === mId ? '#2563EB' : '#F8FAFC',
                    color: design.displayMode === mId ? '#FFFFFF' : '#334155',
                    borderColor: design.displayMode === mId ? '#2563EB' : '#CBD5E1',
                  }}
                >
                  {mLabel}
                </button>
              ))}
            </div>
          </div>

          {/* 8 Visual Templates */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1E3A8A] inline-flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>8 قوالب تصميمية احترافية:</span>
              </span>
              <button
                type="button"
                onClick={() => setCustomDesignOpen((v) => !v)}
                className={`px-2.5 py-1 bg-[#7C3AED] text-white font-bold text-[10.5px] inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              >
                <Palette className="w-3 h-3" />
                <span>صمم لي قالب خاص</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {CV_VISUAL_TEMPLATES.map((tpl) => {
                const isSelected = design.visualTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      updateDesign({
                        visualTemplate: tpl.id as CvVisualTemplateId,
                        accentColor: tpl.defaultColor,
                        columns: tpl.defaultColumns,
                      });
                      onChangeTemplateId(tpl.mappedAtsId);
                      onNotify(`تم تطبيق قالب «${tpl.nameAr}» مباشرة بالمعاينة ✓`);
                    }}
                    className={`p-2 border text-right cursor-pointer transition-colors ${buttonRadiusClass}`}
                    style={{
                      backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                      borderColor: isSelected ? '#2563EB' : '#CBD5E1',
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 font-bold text-[#0F172A] text-[11px]">
                      <span className="truncate">{tpl.nameAr}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: tpl.defaultColor }}
                      />
                      <span className="text-[10px] text-[#64748B] truncate">{tpl.badge}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Template Designer */}
            {customDesignOpen && (
              <div className="p-2.5 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] space-y-2.5 mt-2">
                <div className="font-bold text-[#5B21B6]">تخصيص القالب الخاص (لون · أعمدة · صورة):</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold">اللون الأساسي:</span>
                  {ACCENT_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => updateDesign({ accentColor: hex })}
                      className="w-6 h-6 rounded-full border-2 cursor-pointer"
                      style={{
                        backgroundColor: hex,
                        borderColor: design.accentColor === hex ? '#0F172A' : '#FFFFFF',
                      }}
                      title={hex}
                    />
                  ))}
                  <input
                    type="color"
                    value={design.accentColor}
                    onChange={(e) => updateDesign({ accentColor: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[10.5px] mb-1">نظام الأعمدة:</label>
                    <select
                      value={design.columns}
                      onChange={(e) =>
                        updateDesign({ columns: Number(e.target.value) === 2 ? 2 : 1 })
                      }
                      className={`w-full min-h-[32px] px-2 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                    >
                      <option value={1}>عمود واحد (ATS القياسي)</option>
                      <option value={2}>عمودان (جانبي + رئيسي)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[10.5px] mb-1">موضع الصورة:</label>
                    <select
                      value={design.photoPosition}
                      onChange={(e) =>
                        updateDesign({
                          photoPosition: e.target.value as CvDesignConfig['photoPosition'],
                        })
                      }
                      className={`w-full min-h-[32px] px-2 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                    >
                      <option value="none">بدون صورة (ATS)</option>
                      <option value="right">أعلى اليمين</option>
                      <option value="left">أعلى اليسار</option>
                      <option value="top">أعلى الوسط</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 10 Fonts Selector */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-2">
            <div className="font-bold text-[#0F172A] inline-flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>اختر الخط (10 خطوط عربية وعالمية):</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CV_FONT_OPTIONS.map((f) => {
                const active = design.fontId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateDesign({ fontId: f.id as CvFontId })}
                    style={{
                      fontFamily: f.cssFamily,
                      backgroundColor: active ? '#EFF6FF' : '#F8FAFC',
                      borderColor: active ? '#2563EB' : '#CBD5E1',
                    }}
                    className={`min-h-[32px] px-2 border text-right text-[11px] font-bold cursor-pointer truncate ${buttonRadiusClass}`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: [+ إضافة حقل] (6 TYPES) + [+ إضافة قسم مخصص] + DRAG/REORDER SECTIONS */}
      {subTab === 'sections' && (
        <div className="space-y-3">
          {/* [+ إضافة حقل] 6 Types */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-2">
            <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة حقل جديد (6 أنواع):</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {CUSTOM_FIELD_TYPES.map((ft) => (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => setNewFieldType(ft.id)}
                  className={`min-h-[28px] text-[10.5px] font-bold border cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: newFieldType === ft.id ? '#2563EB' : '#F8FAFC',
                    color: newFieldType === ft.id ? '#FFFFFF' : '#334155',
                    borderColor: newFieldType === ft.id ? '#2563EB' : '#CBD5E1',
                  }}
                >
                  {ft.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="عنوان الحقل (مثال: الرخصة المهنية / رابط لينكدإن)..."
              className={`w-full min-h-[32px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
            />
            {newFieldType === 'image' || newFieldType === 'file' ? (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept={newFieldType === 'image' ? 'image/*' : '.pdf,.docx,.txt'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCustomFieldFileSelect(f, newFieldType);
                  }}
                  className="text-[11px] flex-1"
                />
              </div>
            ) : (
              <input
                type={newFieldType === 'date' ? 'date' : 'text'}
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                placeholder={
                  newFieldType === 'list'
                    ? 'عناصر مفصولة بفواصل...'
                    : newFieldType === 'link'
                    ? 'https://...'
                    : 'قيمة الحقل...'
                }
                className={`w-full min-h-[32px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
              />
            )}
            <button
              type="button"
              disabled={!newFieldLabel.trim()}
              onClick={handleAddCustomField}
              className={`w-full min-h-[32px] bg-[#2563EB] text-white font-bold cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
            >
              إضافة الحقل للسيرة الذاتية
            </button>

            {(cv.customFields || []).length > 0 && (
              <div className="space-y-1 pt-1 border-t border-[#E2E8F0]">
                {(cv.customFields || []).map((cf) => (
                  <div
                    key={cf.id}
                    className="flex items-center justify-between gap-2 px-2 py-1 bg-[#F8FAFC] rounded border border-[#E2E8F0]"
                  >
                    <div className="truncate">
                      <span className="font-bold text-[#0F172A]">{cf.label}:</span>{' '}
                      <span className="text-[#475569]">
                        {cf.type === 'image' ? '[صورة مرفقة]' : cf.value}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCv({
                          ...cv,
                          customFields: (cv.customFields || []).filter((x) => x.id !== cf.id),
                        })
                      }
                      className="text-[#DC2626] shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* [+ إضافة قسم مخصص] */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-2">
            <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5">
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>+ إضافة قسم مخصص جديد:</span>
            </div>
            <input
              type="text"
              value={newSecTitle}
              onChange={(e) => setNewSecTitle(e.target.value)}
              placeholder="عنوان القسم (مثال: الجوائز والمؤتمرات / العضويات)..."
              className={`w-full min-h-[32px] px-2.5 border border-[#CBD5E1] ${buttonRadiusClass}`}
            />
            <textarea
              rows={2}
              value={newSecItemsText}
              onChange={(e) => setNewSecItemsText(e.target.value)}
              placeholder="كل بند في سطر منفصل..."
              className={`w-full p-2 border border-[#CBD5E1] ${buttonRadiusClass}`}
            />
            <button
              type="button"
              disabled={!newSecTitle.trim()}
              onClick={handleAddCustomSection}
              className={`w-full min-h-[32px] bg-[#059669] text-white font-bold cursor-pointer disabled:opacity-50 ${buttonRadiusClass}`}
            >
              إضافة القسم المخصص
            </button>
          </div>

          {/* Drag-Drop Section Order & Hide/Show */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 space-y-1.5">
            <div className="font-bold text-[#0F172A]">
              ترتيب الأقسام (سحب وإفلات أو الأسهم) وإظهار/إخفاء:
            </div>
            <div className="space-y-1">
              {sectionOrder.map((secId, idx) => {
                const isHidden = hiddenSections.has(secId);
                return (
                  <div
                    key={secId}
                    draggable
                    onDragStart={() => setDragSecIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropSection(idx)}
                    className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded border cursor-move ${
                      isHidden
                        ? 'bg-[#F1F5F9] border-[#CBD5E1] opacity-60'
                        : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span className="font-bold text-[#0F172A] truncate">
                        {resolveSectionTitle(secId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSectionOrder(idx, -1)}
                        className="p-0.5 text-[#475569] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === sectionOrder.length - 1}
                        onClick={() => moveSectionOrder(idx, 1)}
                        className="p-0.5 text-[#475569] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionHidden(secId)}
                        title={isHidden ? 'إظهار القسم' : 'إخفاء القسم'}
                        className="p-0.5 text-[#2563EB] cursor-pointer"
                      >
                        {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
