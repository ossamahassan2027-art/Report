import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  Camera,
  Check,
  ClipboardList,
  Edit3,
  FileText,
  Phone,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { ReportData } from '../types/report';
import {
  AssignedSessionItem,
  CaseProfileMeta,
  DEFAULT_CASE_PROFILE_META,
  SessionLogItem,
} from '../types/studio';

interface CaseProfileCardProps {
  data: ReportData;
  caseProfile: CaseProfileMeta;
  assignedSessions: AssignedSessionItem[];
  sessionLogs: SessionLogItem[];
  buttonRadiusClass: string;
  followUpFocusSeq?: number;
  onUpdateData: (next: ReportData) => void;
  onUpdateCaseProfile: (next: CaseProfileMeta, logDesc?: string) => void;
  onNotify: (msg: string) => void;
}

export const CaseProfileCard: React.FC<CaseProfileCardProps> = ({
  data,
  caseProfile,
  assignedSessions,
  sessionLogs,
  buttonRadiusClass,
  followUpFocusSeq = 0,
  onUpdateData,
  onUpdateCaseProfile,
  onNotify,
}) => {
  const profile = { ...DEFAULT_CASE_PROFILE_META, ...caseProfile };
  const [editingProfile, setEditingProfile] = useState(false);

  // Draft fields when editing profile modal/drawer inline
  const [draftName, setDraftName] = useState(data.childName);
  const [draftAge, setDraftAge] = useState(data.age);
  const [draftBirthDate, setDraftBirthDate] = useState(data.birthDate);
  const [draftDiagnosis, setDraftDiagnosis] = useState(data.diagnosis);
  const [draftRefNumber, setDraftRefNumber] = useState(data.referenceNumber);
  const [draftStatus, setDraftStatus] = useState<CaseProfileMeta['status']>(profile.status);
  const [draftGender, setDraftGender] = useState(profile.gender);
  const [draftSpecialty, setDraftSpecialty] = useState(profile.specialty);
  const [draftGuardian, setDraftGuardian] = useState(profile.guardianName);
  const [draftPhone, setDraftPhone] = useState(profile.guardianPhone || data.phone);
  const [draftComplaint, setDraftComplaint] = useState(profile.mainComplaint);
  const [draftImprovement, setDraftImprovement] = useState(profile.improvementPercent);

  // Quick follow-up inline fields
  const [followDate, setFollowDate] = useState(profile.nextFollowUpDate);
  const [followNote, setFollowNote] = useState(profile.nextFollowUpNote);
  const followUpInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraftName(data.childName);
    setDraftAge(data.age);
    setDraftBirthDate(data.birthDate);
    setDraftDiagnosis(data.diagnosis);
    setDraftRefNumber(data.referenceNumber);
  }, [data]);

  useEffect(() => {
    setDraftStatus(profile.status);
    setDraftGender(profile.gender);
    setDraftSpecialty(profile.specialty);
    setDraftGuardian(profile.guardianName);
    setDraftPhone(profile.guardianPhone || data.phone);
    setDraftComplaint(profile.mainComplaint);
    setDraftImprovement(profile.improvementPercent);
    setFollowDate(profile.nextFollowUpDate);
    setFollowNote(profile.nextFollowUpNote);
  }, [caseProfile, data.phone]);

  useEffect(() => {
    if (followUpFocusSeq > 0) {
      followUpInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => followUpInputRef.current?.focus(), 200);
    }
  }, [followUpFocusSeq]);

  // Compute genuine stats from assignedSessions & sessionLogs
  const totalAssignedCount = assignedSessions.reduce(
    (sum, item) => sum + (Number(item.sessionsCount) || 0),
    0
  );
  const completedLogsCount = sessionLogs.filter((l) => l.attendance === 'تم').length;
  const totalLogsCount = sessionLogs.length;
  const complianceRate =
    totalLogsCount > 0 ? Math.round((completedLogsCount / totalLogsCount) * 100) : null;

  // Group summary rows by sessionType
  const sessionSummaryRows = React.useMemo(() => {
    const map = new Map<string, { type: string; planned: number; done: number }>();
    assignedSessions.forEach((item) => {
      const key = item.sessionType.trim() || 'جلسة';
      const existing = map.get(key) || { type: key, planned: 0, done: 0 };
      existing.planned += Number(item.sessionsCount) || 0;
      map.set(key, existing);
    });
    sessionLogs.forEach((log) => {
      const key = log.sessionType.trim() || 'جلسة';
      const existing = map.get(key) || { type: key, planned: 0, done: 0 };
      if (log.attendance === 'تم') existing.done += 1;
      map.set(key, existing);
    });
    return Array.from(map.values()).map((row) => ({
      ...row,
      remaining: Math.max(0, row.planned - row.done),
    }));
  }, [assignedSessions, sessionLogs]);

  const handleSaveProfileEdit = () => {
    onUpdateData({
      ...data,
      childName: draftName.trim() || '[ ... ]',
      age: draftAge.trim() || '[ ... ]',
      birthDate: draftBirthDate.trim() || '[ ... ]',
      diagnosis: draftDiagnosis.trim() || '[ ... ]',
      referenceNumber: draftRefNumber.trim() || '[ ... ]',
      phone: draftPhone.trim() || data.phone,
    });
    onUpdateCaseProfile(
      {
        ...profile,
        status: draftStatus,
        gender: draftGender.trim() || '[ ... ]',
        specialty: draftSpecialty.trim() || '[ ... ]',
        guardianName: draftGuardian.trim() || '[ ... ]',
        guardianPhone: draftPhone.trim() || '[ ... ]',
        mainComplaint: draftComplaint.trim() || '[ ... ]',
        improvementPercent: draftImprovement.trim(),
      },
      `تحديث بطاقة بيانات الحالة (${draftName.trim() || data.childName})`
    );
    setEditingProfile(false);
    onNotify('تم تحديث بيانات بطاقة الحالة ومزامنتها مع التقرير');
  };

  const handleUpdateFollowUp = () => {
    onUpdateCaseProfile(
      {
        ...profile,
        nextFollowUpDate: followDate.trim() || '[ ... ]',
        nextFollowUpNote: followNote.trim(),
      },
      `تحديث موعد المتابعة القادم: ${followDate.trim() || '[ ... ]'}`
    );
    onNotify('تم تحديث موعد المتابعة القادم بنجاح');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      onNotify('يرجى اختيار صورة أقل من 3 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateCaseProfile(
        {
          ...profile,
          photoDataUrl: String(reader.result || ''),
        },
        'تحديث صورة ملف الحالة'
      );
      onNotify('تم تحديث صورة الحالة');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const statusTone =
    profile.status === 'نشط'
      ? { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' }
      : profile.status === 'قيد المتابعة'
      ? { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' }
      : { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' };

  return (
    <section
      aria-label="بطاقة بيانات الحالة"
      className="no-print bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-[#E2E8F0]">
        {/* Right Zone: Case Identity, Metadata Rows & Follow-up Box */}
        <div className="lg:col-span-8 p-4 md:p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0">
              {/* Avatar / Photo Upload */}
              <div className="relative shrink-0">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  title="اضغط لإضافة أو تغيير صورة الحالة"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-xl border border-[#CBD5E1] bg-[#EFF6FF] overflow-hidden flex items-center justify-center relative group cursor-pointer"
                >
                  {profile.photoDataUrl ? (
                    <img
                      src={profile.photoDataUrl}
                      alt={data.childName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-[#2563EB]" />
                  )}
                  <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-4 h-4" />
                  </span>
                </button>
              </div>

              {/* Name + 4 Colored Status/Info Tags */}
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    className="font-editorial text-xl md:text-2xl font-bold text-[#0F172A] hover:text-[#2563EB] text-right cursor-pointer"
                    title="اضغط لتعديل بيانات الحالة"
                  >
                    {data.childName || '[ ... ]'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    className="px-2.5 py-0.5 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF] cursor-pointer"
                  >
                    العمر: {data.age || '[ ... ]'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    className="px-2.5 py-0.5 rounded-md border cursor-pointer"
                    style={{
                      backgroundColor: statusTone.bg,
                      color: statusTone.color,
                      borderColor: statusTone.border,
                    }}
                  >
                    {profile.status}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    className="px-2.5 py-0.5 rounded-md border border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9] cursor-pointer"
                  >
                    النوع: {profile.gender || '[ ... ]'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    className="px-2.5 py-0.5 rounded-md border border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E] cursor-pointer"
                  >
                    {profile.specialty || '[ ... ]'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditingProfile((p) => !p)}
              className={`min-h-[34px] px-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#1E3A8A] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 ${buttonRadiusClass}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editingProfile ? 'إغلاق التعديل' : 'تعديل البطاقة'}</span>
            </button>
          </div>

          {/* Inline Edit Panel OR Organized Click-to-Edit Info Rows */}
          {editingProfile ? (
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">اسم الحالة</label>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">رقم الملف</label>
                  <input
                    type="text"
                    value={draftRefNumber}
                    onChange={(e) => setDraftRefNumber(e.target.value)}
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">الحالة</label>
                  <select
                    value={draftStatus}
                    onChange={(e) =>
                      setDraftStatus(e.target.value as CaseProfileMeta['status'])
                    }
                    className={`w-full min-h-[36px] px-2 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  >
                    <option value="نشط">نشط</option>
                    <option value="قيد المتابعة">قيد المتابعة</option>
                    <option value="مؤرشف">مؤرشف</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">العمر</label>
                  <input
                    type="text"
                    value={draftAge}
                    onChange={(e) => setDraftAge(e.target.value)}
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">تاريخ الميلاد</label>
                  <input
                    type="text"
                    value={draftBirthDate}
                    onChange={(e) => setDraftBirthDate(e.target.value)}
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">النوع</label>
                  <input
                    type="text"
                    value={draftGender}
                    onChange={(e) => setDraftGender(e.target.value)}
                    placeholder="ذكر / أنثى / [ ... ]"
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">التخصص</label>
                  <input
                    type="text"
                    value={draftSpecialty}
                    onChange={(e) => setDraftSpecialty(e.target.value)}
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">ولي الأمر</label>
                  <input
                    type="text"
                    value={draftGuardian}
                    onChange={(e) => setDraftGuardian(e.target.value)}
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">الهاتف</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] text-right ${buttonRadiusClass}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">التشخيص المسجل</label>
                  <input
                    type="text"
                    value={draftDiagnosis}
                    onChange={(e) => setDraftDiagnosis(e.target.value)}
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">نسبة التحسن (%)</label>
                  <input
                    type="text"
                    value={draftImprovement}
                    onChange={(e) => setDraftImprovement(e.target.value)}
                    placeholder="مثال: 75% أو اتركه فارغاً"
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-bold mb-1">الشكوى الرئيسية</label>
                  <input
                    type="text"
                    value={draftComplaint}
                    onChange={(e) => setDraftComplaint(e.target.value)}
                    className={`w-full min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveProfileEdit}
                  className={`min-h-[36px] px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ ومزامنة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className={`min-h-[36px] px-3 bg-white border border-[#CBD5E1] font-semibold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {(
                [
                  [FileText, 'رقم الملف', data.referenceNumber || '[ ... ]'],
                  [UserCheck, 'ولي الأمر', profile.guardianName || '[ ... ]'],
                  [Phone, 'الهاتف', profile.guardianPhone || data.phone || '[ ... ]'],
                  [Calendar, 'تاريخ الميلاد', data.birthDate || '[ ... ]'],
                  [AlertCircle, 'الشكوى الرئيسية', profile.mainComplaint || '[ ... ]'],
                  [ClipboardList, 'التشخيص المسجل', data.diagnosis || '[ ... ]'],
                ] as [React.ComponentType<{ className?: string }>, string, string][]
              ).map(([RowIcon, label, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  className="flex items-center gap-2 text-right px-2.5 py-1.5 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
                  title="اضغط للتعديل"
                >
                  <RowIcon className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span className="text-[#64748B] font-semibold shrink-0">{label}:</span>
                  <span className="text-[#0F172A] font-bold truncate tabular-nums-ar">
                    {value}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Light-Tinted Follow-up Strip (like Transport Fee box) */}
          <div
            className={`p-3 bg-[#EFF6FF] border border-[#BFDBFE] flex flex-wrap items-center justify-between gap-2.5 text-xs ${buttonRadiusClass}`}
          >
            <div className="flex items-center gap-2 font-bold text-[#1E3A8A]">
              <CalendarClock className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>موعد المتابعة القادم:</span>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[220px]">
              <input
                ref={followUpInputRef}
                type="text"
                value={followDate}
                onChange={(e) => setFollowDate(e.target.value)}
                placeholder="مثال: 2026/12/05"
                className={`w-36 min-h-[34px] px-2.5 bg-white border border-[#93C5FD] text-[#0F172A] font-semibold tabular-nums-ar ${buttonRadiusClass}`}
              />
              <input
                type="text"
                value={followNote}
                onChange={(e) => setFollowNote(e.target.value)}
                placeholder="ملاحظة الموعد (اختياري)..."
                className={`flex-1 min-w-[140px] min-h-[34px] px-2.5 bg-white border border-[#93C5FD] text-[#0F172A] ${buttonRadiusClass}`}
              />
              <button
                type="button"
                onClick={handleUpdateFollowUp}
                className={`min-h-[34px] px-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer shrink-0 ${buttonRadiusClass}`}
              >
                تحديث
              </button>
            </div>
          </div>
        </div>

        {/* Left Zone: Quick Summary KPIs & Mini Sessions Table */}
        <div className="lg:col-span-4 p-4 md:p-5 bg-[#F8FAFC]/70 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base font-bold text-[#0F172A]">ملخص سريع</h3>
            <span className="text-[11px] text-[#64748B]">مرتبط بالجلسات</span>
          </div>

          {/* 3 Colored Summary Boxes */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-center">
              <div className="text-[10.5px] font-bold text-[#065F46]">نسبة الالتزام</div>
              <div className="text-base font-bold text-[#047857] mt-0.5 tabular-nums-ar">
                {complianceRate !== null ? `${complianceRate}%` : '[ ... ]'}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-center">
              <div className="text-[10.5px] font-bold text-[#1E3A8A]">عدد الجلسات</div>
              <div className="text-base font-bold text-[#1D4ED8] mt-0.5 tabular-nums-ar">
                {totalAssignedCount || totalLogsCount}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-center cursor-pointer hover:border-[#F59E0B]"
              title="اضغط لتحديث نسبة التحسن"
            >
              <div className="text-[10.5px] font-bold text-[#92400E]">نسبة التحسن</div>
              <div className="text-base font-bold text-[#B45309] mt-0.5 tabular-nums-ar">
                {profile.improvementPercent || '[ ... ]'}
              </div>
            </button>
          </div>

          {/* Mini Table: ملخص الجلسات */}
          <div className="space-y-1.5">
            <div className="font-bold text-[#1E3A8A]">ملخص الجلسات</div>
            <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-white">
              <table className="w-full text-right border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                    <th className="py-1.5 px-2 font-bold">نوع الجلسة</th>
                    <th className="py-1.5 px-1.5 font-bold text-center">العدد</th>
                    <th className="py-1.5 px-1.5 font-bold text-center">تم</th>
                    <th className="py-1.5 px-1.5 font-bold text-center">متبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {sessionSummaryRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 px-2 text-center text-[#64748B]">
                        أضف جلسات من بطاقة «الجلسات المخصصة» بالأسفل لعرض الملخص هنا.
                      </td>
                    </tr>
                  ) : (
                    sessionSummaryRows.map((row) => (
                      <tr key={row.type} className="even:bg-[#F8FAFC]">
                        <td className="py-1.5 px-2 font-semibold text-[#0F172A]">{row.type}</td>
                        <td className="py-1.5 px-1.5 text-center tabular-nums-ar">{row.planned}</td>
                        <td className="py-1.5 px-1.5 text-center text-[#059669] font-bold tabular-nums-ar">
                          {row.done}
                        </td>
                        <td className="py-1.5 px-1.5 text-center text-[#D97706] font-bold tabular-nums-ar">
                          {row.remaining}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
