import React, { useState } from 'react';
import {
  CheckSquare,
  FileText,
  Loader2,
  MessageSquarePlus,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Zap,
} from 'lucide-react';
import {
  ADDRESSEE_SHORTCUTS,
  COMPLAINT_SAMPLES,
  ItemSelections,
  RECOMMENDATION_SHORTCUTS,
  REPORT_TEMPLATES,
  ReportData,
  ReportLanguage,
  ReportTemplate,
  SectionVisibility,
} from '../types/report';

export type EditorTab = 'school' | 'child' | 'items' | 'templates' | 'complaint';

interface EditorPanelProps {
  data: ReportData;
  visibility: SectionVisibility;
  selections: ItemSelections;
  language: ReportLanguage;
  onChangeData: (updated: ReportData) => void;
  onChangeVisibility: (updated: SectionVisibility) => void;
  onChangeSelections: (updated: ItemSelections) => void;
  onApplyTemplate: (template: ReportTemplate) => void;
  onGenerateFromComplaint: (payload: {
    complaintText: string;
    childName: string;
    birthDate: string;
    age: string;
    targetPurpose: string;
    outputLanguage: ReportLanguage;
  }) => Promise<void>;
  onRunShortcut: (mode: 'executive' | 'parent-brief' | 'school-memo') => Promise<void>;
  onReset: () => void;
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  aiBusy: boolean;
  aiError: string;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  data,
  visibility,
  selections,
  language,
  onChangeData,
  onChangeVisibility,
  onChangeSelections,
  onApplyTemplate,
  onGenerateFromComplaint,
  onRunShortcut,
  onReset,
  activeTab,
  onTabChange,
  aiBusy,
  aiError,
}) => {
  const [complaintText, setComplaintText] = useState('');
  const [complaintChildName, setComplaintChildName] = useState('');
  const [complaintAge, setComplaintAge] = useState('');
  const [complaintPurpose, setComplaintPurpose] = useState(
    'دعم طلب التعليم من المنزل (Home Schooling)'
  );
  const [complaintLang, setComplaintLang] = useState<ReportLanguage>(language);
  const [customItemText, setCustomItemText] = useState('');
  const [customTargetList, setCustomTargetList] = useState<
    'envNegativePoints' | 'homeSchoolBenefits' | 'recommendations'
  >('recommendations');

  const updateField = <K extends keyof ReportData>(key: K, value: ReportData[K]) => {
    onChangeData({ ...data, [key]: value });
  };

  const toggleSection = (key: keyof SectionVisibility) => {
    onChangeVisibility({ ...visibility, [key]: !visibility[key] });
  };

  const toggleListItem = (listKey: keyof ItemSelections, idx: number) => {
    const arr = [...selections[listKey]];
    arr[idx] = arr[idx] === false;
    onChangeSelections({ ...selections, [listKey]: arr });
  };

  const setAllListItems = (listKey: keyof ItemSelections, value: boolean) => {
    const len =
      listKey === 'envNegative'
        ? data.envNegativePoints.length
        : listKey === 'homeSchoolBenefits'
        ? data.homeSchoolBenefits.length
        : data.recommendations.length;
    onChangeSelections({
      ...selections,
      [listKey]: Array.from({ length: len }, () => value),
    });
  };

  const handleAddCustomItem = (textToAdd?: string) => {
    const clean = (textToAdd ?? customItemText).trim();
    if (!clean) return;
    if (customTargetList === 'envNegativePoints') {
      onChangeData({
        ...data,
        envNegativePoints: [...data.envNegativePoints, clean],
      });
      onChangeSelections({
        ...selections,
        envNegative: [...selections.envNegative, true],
      });
    } else if (customTargetList === 'homeSchoolBenefits') {
      onChangeData({
        ...data,
        homeSchoolBenefits: [...data.homeSchoolBenefits, clean],
      });
      onChangeSelections({
        ...selections,
        homeSchoolBenefits: [...selections.homeSchoolBenefits, true],
      });
    } else {
      onChangeData({
        ...data,
        recommendations: [...data.recommendations, clean],
      });
      onChangeSelections({
        ...selections,
        recommendations: [...selections.recommendations, true],
      });
    }
    if (!textToAdd) setCustomItemText('');
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim() || aiBusy) return;
    await onGenerateFromComplaint({
      complaintText,
      childName: complaintChildName,
      birthDate: '',
      age: complaintAge,
      targetPurpose: complaintPurpose,
      outputLanguage: complaintLang,
    });
  };

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'school', label: 'المدرسة' },
    { id: 'child', label: 'الطفل' },
    { id: 'items', label: 'اختيارات' },
    { id: 'templates', label: 'قوالب' },
    { id: 'complaint', label: 'من شكوى' },
  ];

  const inputDir = language === 'en' ? 'ltr' : 'rtl';
  const inputAlign = language === 'en' ? 'text-left' : 'text-right';

  return (
    <aside
      dir="rtl"
      className="no-print flex flex-col bg-[#FBF9F5] border border-[#DDD5C7] rounded-xl lg:rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5DEC9]">
        <div>
          <h3 className="font-editorial text-lg font-bold text-[#1C1917]">
            استوديو تحرير التقرير
          </h3>
          <p className="text-[11px] text-[#57534E]">
            تحرير مباشر للنسخة {language === 'ar' ? 'العربية' : 'الإنجليزية'}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:bg-[#EFEAE0] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>استعادة الأصل</span>
        </button>
      </div>

      {/* 5-Tab Bar */}
      <div className="grid grid-cols-5 gap-1 p-1.5 bg-[#EFEAE0] border-b border-[#E5DEC9]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`min-h-[40px] py-2 px-1 text-[11.5px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === t.id
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {aiError && (
        <div className="mx-3 mt-3 px-3 py-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded-lg">
          {aiError}
        </div>
      )}

      {/* Body */}
      <div className="p-4 space-y-4 lg:max-h-[calc(100vh-250px)] overflow-y-auto text-sm">
        {activeTab === 'school' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1">
                الجهة الموجه إليها التقرير
              </label>
              <input
                type="text"
                dir={inputDir}
                value={data.schoolAddressee}
                onChange={(e) => updateField('schoolAddressee', e.target.value)}
                className={`w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
              />
              {language === 'ar' && (
                <div className="mt-2 space-y-1.5">
                  <div className="text-[11px] text-[#78716C]">اختصارات التوجيه السريع:</div>
                  <div className="flex flex-col gap-1.5">
                    {ADDRESSEE_SHORTCUTS.map((addr, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => updateField('schoolAddressee', addr)}
                        className="min-h-[40px] text-right text-[11.5px] px-3 py-2 bg-white hover:bg-[#EFEAE0] border border-[#E5DEC9] rounded-md text-[#44403C] transition-colors cursor-pointer truncate"
                      >
                        {addr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  رقم المرجع / القيد
                </label>
                <input
                  type="text"
                  value={data.referenceNumber}
                  onChange={(e) => updateField('referenceNumber', e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] tabular-nums-ar focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  تاريخ التقرير
                </label>
                <input
                  type="text"
                  value={data.reportDate}
                  onChange={(e) => updateField('reportDate', e.target.value)}
                  onBlur={(e) => updateField('signDate', e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] tabular-nums-ar focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5DEC9] space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  اسم المركز
                </label>
                <input
                  type="text"
                  dir={inputDir}
                  value={data.centerName}
                  onChange={(e) => updateField('centerName', e.target.value)}
                  className={`w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#44403C] mb-1">
                    المدير الفني / المُعد
                  </label>
                  <input
                    type="text"
                    dir={inputDir}
                    value={data.preparedBy}
                    onChange={(e) => updateField('preparedBy', e.target.value)}
                    className={`w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#44403C] mb-1">
                    الصفة المهنية
                  </label>
                  <input
                    type="text"
                    dir={inputDir}
                    value={data.professionalTitle}
                    onChange={(e) => updateField('professionalTitle', e.target.value)}
                    className={`w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#44403C] mb-1">
                    الاسم داخل الختم
                  </label>
                  <input
                    type="text"
                    dir={inputDir}
                    value={data.directorName}
                    onChange={(e) => updateField('directorName', e.target.value)}
                    className={`w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#44403C] mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={data.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] tabular-nums-ar text-right focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'child' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1">
                اسم الطفل
              </label>
              <input
                type="text"
                dir="ltr"
                value={data.childName}
                onChange={(e) => updateField('childName', e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] text-right focus:outline-none focus:border-[#1E3A8A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  تاريخ الميلاد
                </label>
                <input
                  type="text"
                  value={data.birthDate}
                  onChange={(e) => updateField('birthDate', e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] tabular-nums-ar focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  العمر
                </label>
                <input
                  type="text"
                  dir={inputDir}
                  value={data.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className={`w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1">
                التشخيص المذكور
              </label>
              <input
                type="text"
                dir={inputDir}
                value={data.diagnosis}
                onChange={(e) => updateField('diagnosis', e.target.value)}
                className={`w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1">
                عنوان التقرير الرئيسي
              </label>
              <input
                type="text"
                dir={inputDir}
                value={data.reportTitle}
                onChange={(e) => updateField('reportTitle', e.target.value)}
                className={`w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1">
                العنوان الفرعي / الغرض
              </label>
              <input
                type="text"
                dir={inputDir}
                value={data.reportSubtitle}
                onChange={(e) => updateField('reportSubtitle', e.target.value)}
                className={`w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
              />
            </div>

            <div className="pt-2 border-t border-[#E5DEC9] space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  الخلفية النمائية والسلوكية (1)
                </label>
                <textarea
                  rows={3}
                  dir={inputDir}
                  value={data.backgroundParagraph1}
                  onChange={(e) => updateField('backgroundParagraph1', e.target.value)}
                  className={`w-full px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs leading-relaxed text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  الخلفية النمائية والسلوكية (2)
                </label>
                <textarea
                  rows={3}
                  dir={inputDir}
                  value={data.backgroundParagraph2}
                  onChange={(e) => updateField('backgroundParagraph2', e.target.value)}
                  className={`w-full px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs leading-relaxed text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  الهدف التربوي الأساسي (الخلاصة)
                </label>
                <textarea
                  rows={2}
                  dir={inputDir}
                  value={data.coreGoalQuote}
                  onChange={(e) => updateField('coreGoalQuote', e.target.value)}
                  className={`w-full px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs leading-relaxed text-[#1C1917] focus:outline-none focus:border-[#1E3A8A] ${inputAlign}`}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-4">
            <div className="border border-[#E5DEC9] bg-white rounded-lg p-3">
              <div className="text-xs font-bold text-[#1C1917] mb-2">
                أقسام التقرير المعروضة (اختيار متعدد)
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(
                  [
                    ['personal', 'أولاً: البيانات الشخصية'],
                    ['background', 'ثانياً: الخلفية النمائية'],
                    ['environment', 'ثالثاً: تأثير البيئة'],
                    ['homeSchool', 'رابعاً: التعليم المنزلي'],
                    ['recommendations', 'خامساً: التوصيات'],
                    ['opinion', 'سادساً: الرأي المهني'],
                  ] as [keyof SectionVisibility, string][]
                ).map(([key, label]) => {
                  const checked = visibility[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSection(key)}
                      className={`min-h-[42px] flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-right cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[#F1F5FB] border-[#CBD5E1] text-[#1E3A8A] font-semibold'
                          : 'bg-transparent border-[#E5DEC9] text-[#78716C]'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 shrink-0" />
                      )}
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#E5DEC9] bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1C1917]">
                  بنود تحديات البيئة ({selections.envNegative.filter((v) => v !== false).length}/
                  {data.envNegativePoints.length})
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setAllListItems('envNegative', true)}
                    className="min-h-[32px] px-1 text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllListItems('envNegative', false)}
                    className="min-h-[32px] px-1 text-[#78716C] hover:underline cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {data.envNegativePoints.map((pt, idx) => {
                  const checked = selections.envNegative[idx] !== false;
                  return (
                    <label
                      key={idx}
                      className="min-h-[40px] flex items-center gap-2.5 text-xs text-[#292524] cursor-pointer hover:bg-[#FAF8F5] px-1.5 py-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleListItem('envNegative', idx)}
                        className="w-4 h-4 accent-[#1E3A8A] shrink-0"
                      />
                      <span className={checked ? '' : 'line-through text-[#A8A29E]'}>{pt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#E5DEC9] bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1C1917]">
                  بنود التعليم المنزلي (
                  {selections.homeSchoolBenefits.filter((v) => v !== false).length}/
                  {data.homeSchoolBenefits.length})
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setAllListItems('homeSchoolBenefits', true)}
                    className="min-h-[32px] px-1 text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllListItems('homeSchoolBenefits', false)}
                    className="min-h-[32px] px-1 text-[#78716C] hover:underline cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {data.homeSchoolBenefits.map((item, idx) => {
                  const checked = selections.homeSchoolBenefits[idx] !== false;
                  return (
                    <label
                      key={idx}
                      className="min-h-[40px] flex items-center gap-2.5 text-xs text-[#292524] cursor-pointer hover:bg-[#FAF8F5] px-1.5 py-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleListItem('homeSchoolBenefits', idx)}
                        className="w-4 h-4 accent-[#1E3A8A] shrink-0"
                      />
                      <span className={checked ? '' : 'line-through text-[#A8A29E]'}>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#E5DEC9] bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1C1917]">
                  التوصيات التعليمية (
                  {selections.recommendations.filter((v) => v !== false).length}/
                  {data.recommendations.length})
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setAllListItems('recommendations', true)}
                    className="min-h-[32px] px-1 text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllListItems('recommendations', false)}
                    className="min-h-[32px] px-1 text-[#78716C] hover:underline cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {data.recommendations.map((rec, idx) => {
                  const checked = selections.recommendations[idx] !== false;
                  return (
                    <label
                      key={idx}
                      className="min-h-[40px] flex items-center gap-2.5 text-xs text-[#292524] cursor-pointer hover:bg-[#FAF8F5] px-1.5 py-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleListItem('recommendations', idx)}
                        className="w-4 h-4 accent-[#1E3A8A] shrink-0"
                      />
                      <span className={checked ? '' : 'line-through text-[#A8A29E]'}>{rec}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#E5DEC9] bg-white rounded-lg p-3 space-y-2.5">
              <div className="text-xs font-bold text-[#1C1917]">إضافة بند مخصص للتقرير</div>
              <select
                value={customTargetList}
                onChange={(e) =>
                  setCustomTargetList(
                    e.target.value as
                      | 'envNegativePoints'
                      | 'homeSchoolBenefits'
                      | 'recommendations'
                  )
                }
                className="w-full min-h-[42px] px-2.5 py-2 bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-xs"
              >
                <option value="recommendations">إضافة إلى: خامساً - التوصيات التعليمية</option>
                <option value="homeSchoolBenefits">إضافة إلى: رابعاً - التعليم المنزلي</option>
                <option value="envNegativePoints">إضافة إلى: ثالثاً - تحديات البيئة</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customItemText}
                  onChange={(e) => setCustomItemText(e.target.value)}
                  placeholder="اكتب البند الجديد..."
                  className="flex-1 min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomItem()}
                  className="min-h-[42px] px-3.5 py-2 bg-[#1E3A8A] text-white rounded-md text-xs font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917] mb-2">
                <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>قوالب التقارير التربوية (عربي + إنجليزي)</span>
              </div>
              <div className="space-y-2">
                {REPORT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onApplyTemplate(tpl)}
                    className="w-full min-h-[54px] text-right p-3 bg-white hover:bg-[#F1F5FB] border border-[#DDD5C7] hover:border-[#1E3A8A] rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-[#1C1917]">{tpl.name}</div>
                    <div className="text-[11px] text-[#57534E] mt-0.5">{tpl.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5DEC9]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917] mb-2">
                <Zap className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span>اختصارات ذكية لإعادة الصياغة ({language === 'ar' ? 'عربي' : 'English'})</span>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => onRunShortcut('executive')}
                  className="w-full min-h-[44px] text-right px-3 py-2.5 bg-white hover:bg-[#EFEAE0] border border-[#D6CEBE] rounded-lg text-xs font-semibold text-[#1C1917] disabled:opacity-50 cursor-pointer flex items-center justify-between"
                >
                  <span>توليد ملخص تنفيذي مختصر</span>
                  {aiBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => onRunShortcut('school-memo')}
                  className="w-full min-h-[44px] text-right px-3 py-2.5 bg-white hover:bg-[#EFEAE0] border border-[#D6CEBE] rounded-lg text-xs font-semibold text-[#1C1917] disabled:opacity-50 cursor-pointer flex items-center justify-between"
                >
                  <span>تحويل إلى مذكرة تسهيلات صفية عاجلة</span>
                  {aiBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => onRunShortcut('parent-brief')}
                  className="w-full min-h-[44px] text-right px-3 py-2.5 bg-white hover:bg-[#EFEAE0] border border-[#D6CEBE] rounded-lg text-xs font-semibold text-[#1C1917] disabled:opacity-50 cursor-pointer flex items-center justify-between"
                >
                  <span>إعادة صياغة كدليل إرشادي لولي الأمر</span>
                  {aiBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5DEC9]">
              <div className="text-xs font-bold text-[#1C1917] mb-2">
                إدراج توصية جاهزة بضغطة واحدة
              </div>
              <div className="space-y-1.5">
                {RECOMMENDATION_SHORTCUTS.map((snippet, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChangeData({
                        ...data,
                        recommendations: [...data.recommendations, snippet],
                      });
                      onChangeSelections({
                        ...selections,
                        recommendations: [...selections.recommendations, true],
                      });
                    }}
                    className="w-full min-h-[44px] text-right p-2.5 bg-white hover:bg-[#F1F5FB] border border-[#E5DEC9] rounded-lg text-[11.5px] text-[#292524] flex items-start gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                    <span>{snippet}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'complaint' && (
          <form onSubmit={handleComplaintSubmit} className="space-y-3.5">
            <div className="text-xs text-[#44403C] leading-relaxed bg-white border border-[#E5DEC9] p-3 rounded-lg">
              أدخل نص الشكوى أو الملاحظات الواردة من ولي الأمر أو المدرسة، وسيقوم النظام بتحليلها
              وتوليد تقرير تربوي رسمي كامل قابل للتعديل بالعربية أو الإنجليزية.
            </div>

            <div>
              <div className="text-[11.5px] font-semibold text-[#57534E] mb-1.5">
                نماذج شكاوى سريعة للتجربة:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {COMPLAINT_SAMPLES.map((sample, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setComplaintText(sample.text);
                      setComplaintPurpose(sample.purpose);
                    }}
                    className="min-h-[44px] p-2.5 text-right bg-white hover:bg-[#F1F5FB] border border-[#D6CEBE] rounded-lg text-xs font-semibold text-[#1E3A8A] cursor-pointer"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  اسم الطفل (اختياري)
                </label>
                <input
                  type="text"
                  value={complaintChildName}
                  onChange={(e) => setComplaintChildName(e.target.value)}
                  placeholder="مثال: سيف محمد"
                  className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#44403C] mb-1">
                  العمر (اختياري)
                </label>
                <input
                  type="text"
                  value={complaintAge}
                  onChange={(e) => setComplaintAge(e.target.value)}
                  placeholder="مثال: 8 سنوات"
                  className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1">
                لغة التقرير المولّد
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setComplaintLang('ar')}
                  className={`min-h-[42px] px-3 py-2 rounded-md border text-xs font-semibold cursor-pointer ${
                    complaintLang === 'ar'
                      ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white'
                      : 'bg-white border-[#D6CEBE] text-[#1C1917]'
                  }`}
                >
                  تقرير عربي
                </button>
                <button
                  type="button"
                  onClick={() => setComplaintLang('en')}
                  className={`min-h-[42px] px-3 py-2 rounded-md border text-xs font-semibold cursor-pointer ${
                    complaintLang === 'en'
                      ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white'
                      : 'bg-white border-[#D6CEBE] text-[#1C1917]'
                  }`}
                >
                  English Report
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1">
                الهدف من التقرير
              </label>
              <select
                value={complaintPurpose}
                onChange={(e) => setComplaintPurpose(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs"
              >
                <option value="دعم طلب التعليم من المنزل (Home Schooling)">
                  دعم طلب التعليم من المنزل (Home Schooling)
                </option>
                <option value="طلب ترتيبات صفية وتسهيلات اختبارات">
                  طلب ترتيبات صفية وتسهيلات اختبارات
                </option>
                <option value="خطة تربوية وسلوكية فردية (IEP)">
                  خطة تربوية وسلوكية فردية (IEP)
                </option>
                <option value="تقرير متابعة وتقييم حالة للمدرسة">
                  تقرير متابعة وتقييم حالة للمدرسة
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1">
                نص الشكوى أو الملاحظات السلوكية
              </label>
              <textarea
                rows={5}
                required
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="اكتب الشكوى هنا... مثال: يعاني الطفل من صعوبة الجلوس في الفصل والاندفاعية والحساسية من الضوضاء..."
                className="w-full px-3 py-2.5 bg-white border border-[#D6CEBE] rounded-md text-xs leading-relaxed focus:outline-none focus:border-[#1E3A8A]"
              />
            </div>

            <button
              type="submit"
              disabled={aiBusy || !complaintText.trim()}
              className="w-full min-h-[48px] py-2.5 px-4 bg-[#1E3A8A] hover:bg-[#172E6E] disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {aiBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تحليل الشكوى وتوليد التقرير...</span>
                </>
              ) : (
                <>
                  {complaintText ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <MessageSquarePlus className="w-4 h-4" />
                  )}
                  <span>توليد تقرير قابل للتعديل</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </aside>
  );
};
