import React, { useState } from 'react';
import { Briefcase, Building2, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import {
  CvData,
  CvLanguage,
  DEFAULT_CAREER_SECTORS,
  DEFAULT_EXPERIENCE_LEVELS,
  DEFAULT_TARGET_ENTITIES,
} from '../types/cv';
import { requestTailorCvFromServer } from '../utils/cvFileParser';

interface CvTargetSectorPanelProps {
  cv: CvData;
  language: CvLanguage;
  buttonRadiusClass: string;
  onUpdateCv: (next: CvData) => void;
  onNotify: (msg: string) => void;
}

export const CvTargetSectorPanel: React.FC<CvTargetSectorPanelProps> = ({
  cv,
  language,
  buttonRadiusClass,
  onUpdateCv,
  onNotify,
}) => {
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const orgValue = cv.targetOrganization || '';
  const sectorValue = cv.targetSector || '';
  const levelValue = cv.experienceLevel || '';
  const levels = DEFAULT_EXPERIENCE_LEVELS[language];

  const handleTailorForTarget = async () => {
    setErrorMsg('');
    if (!orgValue.trim() && !sectorValue.trim() && !cv.jobDescriptionText.trim()) {
      setErrorMsg('يرجى تحديد الجهة المستهدفة أو المجال المهني أولاً.');
      return;
    }

    setBusy(true);
    try {
      const tailored = await requestTailorCvFromServer({
        cv,
        targetOrganization: orgValue,
        targetSector: sectorValue,
        experienceLevel: levelValue,
        jobDescriptionText: cv.jobDescriptionText,
        language,
      });

      onUpdateCv({
        ...cv,
        targetJobTitle: tailored.targetJobTitle,
        summary: tailored.summary,
      });
      onNotify('تم تخصيص الملخص المهني والمسمى للجهة والمجال باستخدام خبراتك الحقيقية فقط');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'تعذر تخصيص السيرة الذاتية حالياً.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-[11px] leading-relaxed">
        حدد الجهة والمجال والمستوى الوظيفي المستهدف لتوجيه صياغة الملخص المهني والمسمى الوظيفي
        بصيغة ATS قياسية — يعتمد التخصيص على مهاراتك وخبراتك الحقيقية فقط دون إضافة أي معلومات غير حقيقية.
      </div>

      {/* 1. Target Organization */}
      <div className="space-y-2">
        <label className="font-bold text-[#0F172A] flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-[#2563EB]" />
          <span>الجهة / المؤسسة المستهدفة</span>
        </label>
        <input
          type="text"
          value={orgValue}
          onChange={(e) => onUpdateCv({ ...cv, targetOrganization: e.target.value })}
          placeholder="مثال: مدرسة دولية، مستشفى، شركة تقنية، وزارة..."
          className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
        />
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_TARGET_ENTITIES.map((entity) => {
            const selected = orgValue === entity;
            return (
              <button
                key={entity}
                type="button"
                onClick={() => onUpdateCv({ ...cv, targetOrganization: entity })}
                className={`px-2.5 py-1 text-[11px] border font-semibold cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: selected ? '#2563EB' : '#F8FAFC',
                  borderColor: selected ? '#2563EB' : '#CBD5E1',
                  color: selected ? '#FFFFFF' : '#334155',
                }}
              >
                {entity}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Target Sector / Field */}
      <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
        <label className="font-bold text-[#0F172A] flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-[#059669]" />
          <span>المجال / التخصص المهني</span>
        </label>
        <input
          type="text"
          value={sectorValue}
          onChange={(e) => onUpdateCv({ ...cv, targetSector: e.target.value })}
          placeholder="مثال: التربية الخاصة، التعليم، تقنية المعلومات، الموارد البشرية..."
          className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
        />
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_CAREER_SECTORS.map((sector) => {
            const selected = sectorValue === sector;
            return (
              <button
                key={sector}
                type="button"
                onClick={() => onUpdateCv({ ...cv, targetSector: sector })}
                className={`px-2.5 py-1 text-[11px] border font-semibold cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: selected ? '#059669' : '#F8FAFC',
                  borderColor: selected ? '#059669' : '#CBD5E1',
                  color: selected ? '#FFFFFF' : '#334155',
                }}
              >
                {sector}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Experience Level */}
      <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
        <label className="block font-bold text-[#0F172A]">المستوى المهني</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {levels.map((lvl) => {
            const selected = levelValue === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onUpdateCv({ ...cv, experienceLevel: lvl })}
                className={`min-h-[34px] px-2.5 border text-right font-semibold cursor-pointer ${buttonRadiusClass}`}
                style={{
                  backgroundColor: selected ? '#EFF6FF' : '#FFFFFF',
                  borderColor: selected ? '#2563EB' : '#CBD5E1',
                  color: selected ? '#1E3A8A' : '#334155',
                }}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Target Job Title Sync */}
      <div className="pt-3 border-t border-[#E2E8F0] space-y-1.5">
        <label className="block font-bold text-[#0F172A]">
          المسمى الوظيفي المستهدف في السيرة الذاتية
        </label>
        <input
          type="text"
          value={cv.targetJobTitle}
          onChange={(e) => onUpdateCv({ ...cv, targetJobTitle: e.target.value })}
          className={`w-full min-h-[36px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
        />
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[11px] font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={handleTailorForTarget}
          className={`flex-1 min-h-[38px] px-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${buttonRadiusClass}`}
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>تخصيص الملخص للجهة والمجال</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onUpdateCv({
              ...cv,
              targetOrganization: '',
              targetSector: '',
              experienceLevel: '',
            });
            setErrorMsg('');
            onNotify('تم مسح إعدادات الجهة والمجال');
          }}
          className={`min-h-[38px] px-3 bg-[#F8FAFC] border border-[#CBD5E1] text-[#334155] font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>مسح</span>
        </button>
      </div>
    </div>
  );
};
