import React from 'react';
import {
  ATS_CV_TEMPLATES,
  ATS_EXACT_HEADINGS,
  CvData,
  CvLanguage,
  CvTemplateId,
} from '../types/cv';

interface CvAtsDocumentProps {
  cv: CvData;
  language: CvLanguage;
  templateId: CvTemplateId;
  docRef?: React.RefObject<HTMLDivElement | null>;
}

export const CvAtsDocument: React.FC<CvAtsDocumentProps> = ({
  cv,
  language,
  templateId,
  docRef,
}) => {
  const isAr = language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const headings = ATS_EXACT_HEADINGS[language];
  const tpl =
    ATS_CV_TEMPLATES.find((t) => t.id === templateId) || ATS_CV_TEMPLATES[0];

  const fontFamily = isAr
    ? "'Cairo', 'Tajawal', Arial, sans-serif"
    : 'Arial, Calibri, sans-serif';

  const ruleBorderClass =
    tpl.sectionRuleStyle === 'double-line'
      ? 'border-b-2 border-[#111827] pb-1 mb-2.5'
      : tpl.sectionRuleStyle === 'subtle'
      ? 'border-b border-[#9CA3AF] pb-1 mb-2.5'
      : 'border-b border-[#111827] pb-1 mb-2.5';

  const contactItems = [
    `${isAr ? 'الهاتف' : 'Phone'}: ${cv.phone}`,
    `${isAr ? 'البريد' : 'Email'}: ${cv.email}`,
    `${isAr ? 'الموقع' : 'Location'}: ${cv.location}`,
    cv.websiteOrLink && cv.websiteOrLink !== '[ ... ]'
      ? `${isAr ? 'الرابط' : 'Link'}: ${cv.websiteOrLink}`
      : '',
  ].filter(Boolean);

  return (
    <div className="a4-sheet-wrapper shadow-[0_8px_28px_rgba(15,23,42,0.08)] print:shadow-none">
      <div
        ref={docRef}
        dir={dir}
        lang={language}
        className="w-[794px] min-h-[1123px] bg-white text-[#111827] px-12 py-11 box-border select-text"
        style={{
          fontFamily,
          backgroundColor: '#FFFFFF',
          color: '#111827',
        }}
      >
        {/* Top Identification Block (Single-column plain text directly in main body — NO icons, NO header box) */}
        <div
          className={`mb-5 ${
            cv.showPhotoInCv && cv.personalPhotoDataUrl
              ? 'flex items-center justify-between gap-4'
              : ''
          } ${
            tpl.headerAlign === 'center' && !(cv.showPhotoInCv && cv.personalPhotoDataUrl)
              ? 'text-center'
              : isAr
              ? 'text-right'
              : 'text-left'
          }`}
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold text-[#111827] leading-snug m-0">
              {cv.fullName}
            </h1>
            <p className="text-[14px] font-bold text-[#1F2937] mt-1 mb-2">
              {cv.targetJobTitle}
            </p>
            <p className="text-[12px] text-[#111827] leading-relaxed m-0">
              {contactItems.join(' | ')}
            </p>
          </div>
          {cv.showPhotoInCv && cv.personalPhotoDataUrl && (
            <img
              src={cv.personalPhotoDataUrl}
              alt={cv.fullName}
              className="w-20 h-20 object-cover border border-[#D1D5DB] rounded shrink-0"
            />
          )}
        </div>

        {/* 1. Professional Summary */}
        <section className="mb-4">
          <h2 className={`text-[14px] font-bold text-[#111827] ${ruleBorderClass}`}>
            {headings.summary}
          </h2>
          <p className="text-[12.5px] leading-[1.7] text-[#111827] m-0">
            {cv.summary}
          </p>
        </section>

        {/* 2. Work Experience */}
        <section className="mb-4">
          <h2 className={`text-[14px] font-bold text-[#111827] ${ruleBorderClass}`}>
            {headings.experience}
          </h2>
          <div className="space-y-3">
            {cv.experiences.map((exp) => (
              <div key={exp.id}>
                <p className="text-[12.5px] font-bold text-[#111827] m-0">
                  {exp.jobTitle} — {exp.company} ({exp.location})
                </p>
                <p className="text-[11.5px] text-[#374151] mt-0.5 mb-1 tabular-nums-ar">
                  {exp.dateRange}
                </p>
                <ul className="list-disc list-inside space-y-1 text-[12px] leading-[1.65] text-[#111827] m-0 p-0">
                  {exp.bullets
                    .filter((b) => b.trim())
                    .map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Education */}
        <section className="mb-4">
          <h2 className={`text-[14px] font-bold text-[#111827] ${ruleBorderClass}`}>
            {headings.education}
          </h2>
          <div className="space-y-2">
            {cv.education.map((edu) => (
              <div key={edu.id}>
                <p className="text-[12.5px] font-bold text-[#111827] m-0">
                  {edu.degree} — {edu.institution}
                </p>
                <p className="text-[11.5px] text-[#374151] mt-0.5 m-0 tabular-nums-ar">
                  {edu.dateRange}
                  {edu.details.trim() ? ` | ${edu.details.trim()}` : ''}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Skills (Simple comma-separated plain text — NO columns, NO bars, NO icons) */}
        <section className="mb-4">
          <h2 className={`text-[14px] font-bold text-[#111827] ${ruleBorderClass}`}>
            {headings.skills}
          </h2>
          <p className="text-[12.5px] leading-[1.7] text-[#111827] m-0">
            {cv.skills
              .map((s) => (s.level.trim() ? `${s.name} - ${s.level}` : s.name))
              .join(isAr ? '، ' : ', ')}
          </p>
        </section>

        {/* 5. Certifications */}
        {cv.certifications.length > 0 && (
          <section className="mb-4">
            <h2 className={`text-[14px] font-bold text-[#111827] ${ruleBorderClass}`}>
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
        )}

        {/* 6. Languages */}
        <section className="mb-4">
          <h2 className={`text-[14px] font-bold text-[#111827] ${ruleBorderClass}`}>
            {headings.languages}
          </h2>
          <p className="text-[12.5px] leading-[1.7] text-[#111827] m-0">
            {cv.languages
              .map((l) => `${l.name} - ${l.proficiency}`)
              .join(isAr ? '، ' : ', ')}
          </p>
        </section>

        {/* 7. Training */}
        {cv.trainings.length > 0 && (
          <section>
            <h2 className={`text-[14px] font-bold text-[#111827] ${ruleBorderClass}`}>
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
        )}
      </div>
    </div>
  );
};
