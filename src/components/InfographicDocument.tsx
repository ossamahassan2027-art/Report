import React from 'react';
import {
  ACCENT_THEMES,
  AccentTheme,
  PaperTone,
  ReportData,
  ReportLanguage,
  SectionVisibility,
} from '../types/report';
import { CenterEmblem, CenterOfficialStamp } from './CenterEmblem';

interface InfographicDocumentProps {
  data: ReportData;
  paperTone: PaperTone;
  accentTheme: AccentTheme;
  showStamp: boolean;
  visibility: SectionVisibility;
  language: ReportLanguage;
  infographicRef?: React.RefObject<HTMLDivElement | null>;
}

export const InfographicDocument: React.FC<InfographicDocumentProps> = ({
  data,
  paperTone,
  accentTheme,
  showStamp,
  visibility,
  language,
  infographicRef,
}) => {
  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  const theme = ACCENT_THEMES[accentTheme];
  const bg = paperTone === 'archival' ? '#FBF9F5' : '#FFFFFF';
  const cardBg = paperTone === 'archival' ? '#F4EFE6' : theme.primarySoft;
  const borderCol = paperTone === 'archival' ? '#DDD5C7' : theme.primaryBorder;

  const L = isRtl
    ? {
        bannerTag: 'ملخص بصري استرشادي للبيئة التعليمية والاحتياجات الفردية',
        addressedTo: 'موجه إلى',
        name: 'الاسم',
        dob: 'الميلاد',
        age: 'العمر',
        diag: 'التشخيص',
        bgTitle: 'الملف النمائي والسلوكي',
        envTitle: 'مقارنة أثر البيئة المحيطة',
        calmLabel: 'بيئة هادئة ومنظمة',
        calmOutcome: 'النتيجة: تركيز · مشاركة · استقرار',
        crowdedLabel: 'بيئة مزدحمة ومثيرة للضوضاء',
        homeTitle: 'مزايا التعليم المنزلي المنظم',
        recsTitle: 'خارطة التوصيات العملية',
        goalTitle: 'الخلاصة والهدف التربوي الأساسي',
        director: 'إشراف واعتماد',
      }
    : {
        bannerTag: 'Visual Educational & Environmental Needs Infographic',
        addressedTo: 'Addressed To',
        name: 'Student',
        dob: 'DOB',
        age: 'Age',
        diag: 'Diagnosis',
        bgTitle: 'Developmental & Behavioral Profile',
        envTitle: 'Environmental Impact Comparison',
        calmLabel: 'Calm & Structured Setting',
        calmOutcome: 'Outcome: Focus · Engagement · Stability',
        crowdedLabel: 'Crowded & Overstimulating Setting',
        homeTitle: 'Structured Home Schooling Benefits',
        recsTitle: 'Actionable Recommendations Roadmap',
        goalTitle: 'Professional Opinion & Core Goal',
        director: 'Prepared & Certified By',
      };

  return (
    <div className="a4-sheet-wrapper shadow-[0_18px_45px_-12px_rgba(28,25,23,0.18)]">
      <article
        ref={infographicRef}
        dir={dir}
        className="w-[794px] min-h-[1123px] relative flex flex-col justify-between p-7 text-[#1C1917] box-border"
        style={{ backgroundColor: bg }}
      >
        {/* Top Hero Banner */}
        <div>
          <header
            className="p-5 text-white relative overflow-hidden"
            style={{ backgroundColor: theme.primary }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="bg-white/95 p-1.5 rounded-sm shrink-0">
                  <CenterEmblem color={theme.primary} accent={theme.secondary} size={46} />
                </div>
                <div>
                  <div className="text-[10.5px] text-white/80 font-medium">
                    {data.centerName} {data.centerCity ? `· ${data.centerCity}` : ''}
                  </div>
                  <h1 className="font-editorial text-[22px] font-bold leading-snug mt-0.5">
                    {data.reportTitle}
                  </h1>
                  <p className="text-[11px] text-white/90 mt-0.5">{L.bannerTag}</p>
                </div>
              </div>

              <div className="text-[10.5px] text-white/90 tabular-nums-ar shrink-0 text-end">
                <div>{data.referenceNumber}</div>
                <div className="mt-0.5">{data.reportDate}</div>
                <div dir="ltr" className="mt-0.5 font-semibold">
                  {data.phone}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px]">
              <span>
                <span className="text-white/75">{L.addressedTo}: </span>
                <strong className="font-semibold">{data.schoolAddressee}</strong>
              </span>
              <span className="text-white/85">{data.reportSubtitle}</span>
            </div>
          </header>

          {/* Student Snapshot Strip */}
          {visibility.personal && (
            <section
              className="grid grid-cols-12 border-x border-b text-[11px]"
              style={{ borderColor: borderCol, backgroundColor: cardBg }}
            >
              <div className="col-span-3 p-2.5 border-e" style={{ borderColor: borderCol }}>
                <div className="text-[9.5px] text-[#78716C]">{L.name}</div>
                <div dir="ltr" className={`font-bold mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {data.childName}
                </div>
              </div>
              <div className="col-span-2 p-2.5 border-e" style={{ borderColor: borderCol }}>
                <div className="text-[9.5px] text-[#78716C]">{L.dob}</div>
                <div className="font-bold tabular-nums-ar mt-0.5">{data.birthDate}</div>
              </div>
              <div className="col-span-2 p-2.5 border-e" style={{ borderColor: borderCol }}>
                <div className="text-[9.5px] text-[#78716C]">{L.age}</div>
                <div className="font-bold mt-0.5">{data.age}</div>
              </div>
              <div className="col-span-5 p-2.5">
                <div className="text-[9.5px] text-[#78716C]">{L.diag}</div>
                <div className="font-bold mt-0.5" style={{ color: theme.primary }}>
                  {data.diagnosis}
                </div>
              </div>
            </section>
          )}

          {/* Main Infographic Visual Grid */}
          <div className="mt-4 space-y-3.5">
            {/* Background Summary Card */}
            {visibility.background && (
              <section className="border p-3.5" style={{ borderColor: borderCol }}>
                <div className="flex items-center justify-between mb-1.5">
                  <h2
                    className="font-editorial text-[15px] font-bold"
                    style={{ color: theme.primary }}
                  >
                    {L.bgTitle}
                  </h2>
                </div>
                <p className="text-[10.8px] leading-[1.6] text-[#292524]">
                  {data.backgroundParagraph1} {data.backgroundParagraph2}
                </p>
              </section>
            )}

            {/* Visual Environmental Comparison Split */}
            {visibility.environment && (
              <section>
                <h2
                  className="font-editorial text-[15px] font-bold mb-2"
                  style={{ color: theme.primary }}
                >
                  {L.envTitle}
                </h2>
                <div className="grid grid-cols-12 gap-3">
                  {/* Calm Side */}
                  <div
                    className="col-span-5 border p-3 flex flex-col justify-between"
                    style={{ backgroundColor: cardBg, borderColor: borderCol }}
                  >
                    <div>
                      <div
                        className="text-[12px] font-bold pb-1.5 mb-2 border-b"
                        style={{ color: theme.primary, borderColor: `${theme.primary}25` }}
                      >
                        {L.calmLabel}
                      </div>
                      <p className="text-[10.5px] leading-[1.6] text-[#292524]">
                        {data.envPositive}
                      </p>
                    </div>
                    <div
                      className="mt-2.5 pt-2 border-t text-[10px] font-bold"
                      style={{ color: theme.secondary, borderColor: `${theme.primary}20` }}
                    >
                      {L.calmOutcome}
                    </div>
                  </div>

                  {/* Crowded / Sensory Overload Side */}
                  <div className="col-span-7 border p-3" style={{ borderColor: borderCol }}>
                    <div
                      className="text-[12px] font-bold text-[#9A3412] pb-1.5 mb-2 border-b"
                      style={{ borderColor: borderCol }}
                    >
                      {L.crowdedLabel}
                    </div>
                    <div className="space-y-1.5">
                      {data.envNegativePoints.map((pt, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10.3px]">
                          <span
                            className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white shrink-0 tabular-nums-ar"
                            style={{ backgroundColor: theme.secondary }}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-[#1C1917] leading-snug">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Home Schooling Benefits Infographic Grid */}
            {visibility.homeSchool && data.homeSchoolBenefits.length > 0 && (
              <section>
                <h2
                  className="font-editorial text-[15px] font-bold mb-2"
                  style={{ color: theme.primary }}
                >
                  {L.homeTitle}
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {data.homeSchoolBenefits.map((benefit, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 border p-2.5 ${
                        idx === data.homeSchoolBenefits.length - 1 &&
                        data.homeSchoolBenefits.length % 2 === 1
                          ? 'col-span-2'
                          : ''
                      }`}
                      style={{ backgroundColor: cardBg, borderColor: borderCol }}
                    >
                      <div
                        className="font-editorial text-[16px] font-bold leading-none tabular-nums-ar shrink-0 mt-0.5"
                        style={{ color: theme.primary }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div className="text-[10.3px] leading-[1.45] text-[#1C1917]">{benefit}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Actionable Recommendations Roadmap */}
            {visibility.recommendations && data.recommendations.length > 0 && (
              <section>
                <h2
                  className="font-editorial text-[15px] font-bold mb-2"
                  style={{ color: theme.primary }}
                >
                  {L.recsTitle}
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border p-3" style={{ borderColor: borderCol }}>
                  {data.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 pb-1.5 border-b last:border-b-0 text-[10px] leading-[1.42]"
                      style={{ borderColor: `${theme.primary}15` }}
                    >
                      <span
                        className="font-bold tabular-nums-ar shrink-0"
                        style={{ color: theme.secondary }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[#1C1917]">{rec}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Core Mission Quote */}
            {visibility.opinion && (
              <section
                className="border-y py-3 px-4 text-center"
                style={{ backgroundColor: cardBg, borderColor: `${theme.secondary}66` }}
              >
                <div
                  className="text-[10.5px] font-bold mb-1"
                  style={{ color: theme.secondary }}
                >
                  {L.goalTitle}
                </div>
                <p
                  className="font-editorial text-[14px] font-bold leading-snug"
                  style={{ color: theme.primary }}
                >
                  «{data.coreGoalQuote}»
                </p>
              </section>
            )}
          </div>
        </div>

        {/* Footer Certification Bar */}
        <footer
          className="mt-4 pt-3 border-t flex items-center justify-between gap-4"
          style={{ borderColor: `${theme.primary}30` }}
        >
          <div className="text-[10.5px] leading-relaxed">
            <div className="text-[#78716C]">{L.director}</div>
            <div className="font-bold text-[#1C1917]">
              {data.preparedBy} — {data.professionalTitle}
            </div>
            <div className="text-[#57534E]">
              {data.signCenterName} ·{' '}
              <span dir="ltr" className="inline-block tabular-nums-ar font-semibold">
                {data.phone}
              </span>
            </div>
          </div>

          {showStamp && (
            <div className="-my-4 scale-[0.78] origin-center shrink-0">
              <CenterOfficialStamp
                centerName={data.centerName}
                city={data.centerCity}
                directorName={data.directorName}
                directorRole={data.directorRole}
                phone={data.phone}
                color={theme.primary}
              />
            </div>
          )}
        </footer>
      </article>
    </div>
  );
};
