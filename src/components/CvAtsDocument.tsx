import React from 'react';
import {
  ATS_CV_TEMPLATES,
  ATS_EXACT_HEADINGS,
  ATS_SECTION_ORDER,
  CvData,
  CvLanguage,
  CvTemplateId,
  DEFAULT_CV_DESIGN_CONFIG,
} from '../types/cv';
import { getFontCssFamily } from '../utils/cvSmartSuite';

interface CvAtsDocumentProps {
  cv: CvData;
  secondaryCv?: CvData;
  language: CvLanguage;
  templateId: CvTemplateId;
  docRef?: React.RefObject<HTMLDivElement | null>;
}

const renderTextWithMissingHighlight = (text: string): React.ReactNode => {
  if (!text) return text;
  if (!text.includes('[ غير موجود ]')) return text;
  const parts = text.split('[ غير موجود ]');
  return parts.map((p, idx) => (
    <React.Fragment key={idx}>
      {p}
      {idx < parts.length - 1 && (
        <span className="bg-[#FEF08A] text-[#854D0E] px-1 rounded font-bold">
          [ غير موجود ]
        </span>
      )}
    </React.Fragment>
  ));
};

const SingleSheetCv: React.FC<{
  cv: CvData;
  language: CvLanguage;
  templateId: CvTemplateId;
}> = ({ cv, language, templateId }) => {
  const isAr = language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const headings = ATS_EXACT_HEADINGS[language];
  const tpl =
    ATS_CV_TEMPLATES.find((t) => t.id === templateId) || ATS_CV_TEMPLATES[0];

  const design = cv.designConfig || DEFAULT_CV_DESIGN_CONFIG;
  const visualTpl = design.visualTemplate || 'ats';
  const accent = visualTpl === 'ats' ? '#111827' : design.accentColor || '#1E3A8A';
  const fontFamily = getFontCssFamily(
    design.fontId || (isAr ? 'cairo' : 'arial')
  );

  // Strict ATS template enforces 1 column and plain rules
  const useTwoColumns = visualTpl !== 'ats' && design.columns === 2;
  const hasPhoto =
    Boolean(cv.personalPhotoDataUrl) &&
    (design.photoPosition !== 'none' || Boolean(cv.showPhotoInCv));
  const photoPos = design.photoPosition === 'none' && cv.showPhotoInCv ? 'left' : design.photoPosition;

  const isLuxury = visualTpl === 'luxury-arabic';
  const isModernOrCreative = visualTpl === 'modern' || visualTpl === 'creative' || visualTpl === 'infographic';
  const isMedical = visualTpl === 'medical';

  const hiddenSet = new Set(cv.hiddenSections || []);
  const orderList = cv.sectionOrder?.length ? cv.sectionOrder : [...ATS_SECTION_ORDER];

  const contactItems = [
    `${isAr ? 'الهاتف' : 'Phone'}: ${cv.phone}`,
    `${isAr ? 'البريد' : 'Email'}: ${cv.email}`,
    `${isAr ? 'الموقع' : 'Location'}: ${cv.location}`,
    cv.websiteOrLink && cv.websiteOrLink !== '[ ... ]'
      ? `${isAr ? 'الرابط' : 'Link'}: ${cv.websiteOrLink}`
      : '',
  ].filter(Boolean);

  const headingStyle: React.CSSProperties = {
    color: visualTpl === 'ats' ? '#111827' : accent,
    borderBottomColor: visualTpl === 'ats' ? '#111827' : accent,
  };

  const ruleClass =
    tpl.sectionRuleStyle === 'double-line' || isLuxury
      ? 'border-b-2 pb-1 mb-2.5'
      : 'border-b pb-1 mb-2.5';

  const renderSectionByKey = (secKey: string) => {
    if (hiddenSet.has(secKey)) return null;

    if (secKey === 'summary') {
      return (
        <section key="summary" className="mb-4">
          <h2 className={`text-[14px] font-bold ${ruleClass}`} style={headingStyle}>
            {headings.summary}
          </h2>
          <p className="text-[12.5px] leading-[1.7] text-[#111827] m-0">
            {renderTextWithMissingHighlight(cv.summary)}
          </p>
        </section>
      );
    }

    if (secKey === 'experience') {
      return (
        <section key="experience" className="mb-4">
          <h2 className={`text-[14px] font-bold ${ruleClass}`} style={headingStyle}>
            {headings.experience}
          </h2>
          <div className="space-y-3">
            {cv.experiences.map((exp) => (
              <div key={exp.id}>
                <p className="text-[12.5px] font-bold text-[#111827] m-0">
                  {renderTextWithMissingHighlight(exp.jobTitle)} —{' '}
                  {renderTextWithMissingHighlight(exp.company)} ({exp.location})
                </p>
                <p className="text-[11.5px] text-[#374151] mt-0.5 mb-1 tabular-nums-ar">
                  {exp.dateRange}
                </p>
                <ul className="list-disc list-inside space-y-1 text-[12px] leading-[1.65] text-[#111827] m-0 p-0">
                  {exp.bullets
                    .filter((b) => b.trim())
                    .map((b, i) => (
                      <li key={i}>{renderTextWithMissingHighlight(b)}</li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (secKey === 'education') {
      return (
        <section key="education" className="mb-4">
          <h2 className={`text-[14px] font-bold ${ruleClass}`} style={headingStyle}>
            {headings.education}
          </h2>
          <div className="space-y-2">
            {cv.education.map((edu) => (
              <div key={edu.id}>
                <p className="text-[12.5px] font-bold text-[#111827] m-0">
                  {renderTextWithMissingHighlight(edu.degree)} —{' '}
                  {renderTextWithMissingHighlight(edu.institution)}
                </p>
                <p className="text-[11.5px] text-[#374151] mt-0.5 m-0 tabular-nums-ar">
                  {edu.dateRange}
                  {edu.details.trim() ? ` | ${edu.details.trim()}` : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (secKey === 'skills') {
      return (
        <section key="skills" className="mb-4">
          <h2 className={`text-[14px] font-bold ${ruleClass}`} style={headingStyle}>
            {headings.skills}
          </h2>
          <p className="text-[12.5px] leading-[1.7] text-[#111827] m-0">
            {cv.skills
              .map((s) => (s.level.trim() ? `${s.name} - ${s.level}` : s.name))
              .join(isAr ? '، ' : ', ')}
          </p>
        </section>
      );
    }

    if (secKey === 'certifications' && cv.certifications.length > 0) {
      return (
        <section key="certifications" className="mb-4">
          <h2 className={`text-[14px] font-bold ${ruleClass}`} style={headingStyle}>
            {headings.certifications}
          </h2>
          <div className="space-y-1.5">
            {cv.certifications.map((cert) => (
              <p key={cert.id} className="text-[12px] text-[#111827] m-0">
                <span className="font-bold">{cert.name}</span> — {cert.issuer} (
                <span className="tabular-nums-ar">{cert.date}</span>)
              </p>
            ))}
          </div>
        </section>
      );
    }

    if (secKey === 'languages') {
      return (
        <section key="languages" className="mb-4">
          <h2 className={`text-[14px] font-bold ${ruleClass}`} style={headingStyle}>
            {headings.languages}
          </h2>
          <p className="text-[12.5px] leading-[1.7] text-[#111827] m-0">
            {cv.languages
              .map((l) => `${l.name} - ${l.proficiency}`)
              .join(isAr ? '، ' : ', ')}
          </p>
        </section>
      );
    }

    if (secKey === 'training' && cv.trainings.length > 0) {
      return (
        <section key="training" className="mb-4">
          <h2 className={`text-[14px] font-bold ${ruleClass}`} style={headingStyle}>
            {headings.training}
          </h2>
          <div className="space-y-1.5">
            {cv.trainings.map((trn) => (
              <p key={trn.id} className="text-[12px] text-[#111827] m-0">
                <span className="font-bold">{trn.title}</span> — {trn.provider} (
                <span className="tabular-nums-ar">{trn.dateRange}</span>)
              </p>
            ))}
          </div>
        </section>
      );
    }

    const customSec = (cv.customSections || []).find((c) => c.id === secKey);
    if (customSec && !customSec.hidden) {
      return (
        <section key={customSec.id} className="mb-4">
          <h2 className={`text-[14px] font-bold ${ruleClass}`} style={headingStyle}>
            {customSec.title}
          </h2>
          <ul className="list-disc list-inside space-y-1 text-[12px] leading-[1.65] text-[#111827] m-0 p-0">
            {customSec.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>
      );
    }

    return null;
  };

  const sidebarKeys = new Set(['skills', 'languages', 'certifications']);
  const mainKeys = orderList.filter((k) => !sidebarKeys.has(k));
  const sideKeys = orderList.filter((k) => sidebarKeys.has(k));

  return (
    <div
      dir={dir}
      lang={language}
      className="w-[794px] min-h-[1123px] bg-white text-[#111827] px-11 py-10 box-border select-text relative"
      style={{
        fontFamily,
        backgroundColor: '#FFFFFF',
        color: '#111827',
        borderTop: isLuxury
          ? '10px solid #0A1633'
          : isModernOrCreative || isMedical
          ? `6px solid ${accent}`
          : undefined,
      }}
    >
      {isLuxury && (
        <div
          className="h-1 w-full mb-4"
          style={{ backgroundColor: '#D97706' }}
        />
      )}

      {/* Top Identification Block */}
      <div
        className={`mb-5 pb-3 ${
          visualTpl !== 'ats' ? 'border-b border-[#E2E8F0]' : ''
        } ${
          hasPhoto && photoPos === 'top'
            ? 'flex flex-col items-center text-center gap-3'
            : hasPhoto
            ? `flex items-center justify-between gap-4 ${
                photoPos === 'right' ? 'flex-row-reverse' : 'flex-row'
              }`
            : tpl.headerAlign === 'center'
            ? 'text-center'
            : isAr
            ? 'text-right'
            : 'text-left'
        }`}
      >
        <div className="min-w-0 flex-1">
          <h1
            className="text-[22px] font-bold leading-snug m-0"
            style={{ color: visualTpl === 'ats' ? '#111827' : accent }}
          >
            {renderTextWithMissingHighlight(cv.fullName)}
          </h1>
          <p className="text-[14px] font-bold text-[#1F2937] mt-1 mb-2">
            {renderTextWithMissingHighlight(cv.targetJobTitle)}
          </p>
          <p className="text-[12px] text-[#111827] leading-relaxed m-0">
            {contactItems.map((ci, i) => (
              <React.Fragment key={i}>
                {i > 0 && ' | '}
                {renderTextWithMissingHighlight(ci)}
              </React.Fragment>
            ))}
          </p>
        </div>
        {hasPhoto && cv.personalPhotoDataUrl && (
          <img
            src={cv.personalPhotoDataUrl}
            alt={cv.fullName}
            className="w-20 h-20 object-cover border-2 rounded-lg shrink-0"
            style={{ borderColor: accent }}
          />
        )}
      </div>

      {/* Custom Fields Bar if present */}
      {(cv.customFields || []).length > 0 && (
        <div className="mb-4 p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          {(cv.customFields || []).map((cf) => (
            <div key={cf.id} className="text-[11.5px] text-[#0F172A] flex items-center gap-2">
              <span className="font-bold" style={{ color: accent }}>
                {cf.label}:
              </span>
              {cf.type === 'image' && cf.value.startsWith('data:image') ? (
                <img src={cf.value} alt={cf.label} className="h-10 rounded border" />
              ) : (
                <span>{cf.value}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Body Layout: 1-Column ATS Standard OR 2-Column Visual Design */}
      {useTwoColumns ? (
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-4 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            {sideKeys.map((k) => renderSectionByKey(k))}
          </div>
          <div className="col-span-8">{mainKeys.map((k) => renderSectionByKey(k))}</div>
        </div>
      ) : (
        <div>{orderList.map((k) => renderSectionByKey(k))}</div>
      )}
    </div>
  );
};

export const CvAtsDocument: React.FC<CvAtsDocumentProps> = ({
  cv,
  secondaryCv,
  language,
  templateId,
  docRef,
}) => {
  const design = cv.designConfig || DEFAULT_CV_DESIGN_CONFIG;
  const displayMode = design.displayMode || language;

  if (displayMode === 'bilingual' && secondaryCv) {
    const arSheet = language === 'ar' ? cv : secondaryCv;
    const enSheet = language === 'en' ? cv : secondaryCv;
    return (
      <div
        ref={docRef}
        className="space-y-6 a4-sheet-wrapper shadow-[0_8px_28px_rgba(15,23,42,0.08)] print:shadow-none"
      >
        <SingleSheetCv cv={arSheet} language="ar" templateId={templateId} />
        <div className="border-t-2 border-dashed border-[#CBD5E1] no-print" />
        <SingleSheetCv cv={enSheet} language="en" templateId={templateId} />
      </div>
    );
  }

  const effectiveLang: CvLanguage =
    displayMode === 'en' ? 'en' : displayMode === 'ar' ? 'ar' : language;
  const effectiveCv =
    effectiveLang !== language && secondaryCv ? secondaryCv : cv;

  return (
    <div
      ref={docRef}
      className="a4-sheet-wrapper shadow-[0_8px_28px_rgba(15,23,42,0.08)] print:shadow-none"
    >
      <SingleSheetCv cv={effectiveCv} language={effectiveLang} templateId={templateId} />
    </div>
  );
};

