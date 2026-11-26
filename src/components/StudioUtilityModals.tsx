import React, { useEffect, useState } from 'react';
import {
  Bell,
  CalendarClock,
  Check,
  Copy,
  History,
  KeyRound,
  Lock,
  LogOut,
  Redo2,
  Send,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { ReportData } from '../types/report';
import {
  AssignedSessionItem,
  CaseProfileMeta,
  ChangeLogEntry,
  ContactSettings,
  SessionLogItem,
  WeeklyTaskItem,
} from '../types/studio';
import { AccountSecurityConfig, copyTextToClipboard } from '../utils/storageAndBackup';

export type UtilityModalType =
  | null
  | 'change-log'
  | 'comm-schedule'
  | 'comm-reminder'
  | 'comm-alerts'
  | 'account-password'
  | 'account-logout';

interface StudioUtilityModalsProps {
  modalType: UtilityModalType;
  onClose: () => void;
  buttonRadiusClass: string;
  data: ReportData;
  caseProfile: CaseProfileMeta;
  weeklyTasks: WeeklyTaskItem[];
  assignedSessions: AssignedSessionItem[];
  sessionLogs: SessionLogItem[];
  contactSettings: ContactSettings;
  changeLog: ChangeLogEntry[];
  canUndo: boolean;
  canRedo: boolean;
  accountSecurity: AccountSecurityConfig;
  onUndo: () => void;
  onRedo: () => void;
  onClearChangeLog: () => void;
  onSavePasscode: (newPasscode: string) => void;
  onLockWorkspace: () => void;
  onUpdateSpecialist: (name: string, role: string) => void;
  onJumpToTasks: () => void;
  onNotify: (msg: string) => void;
}

export const StudioUtilityModals: React.FC<StudioUtilityModalsProps> = ({
  modalType,
  onClose,
  buttonRadiusClass,
  data,
  caseProfile,
  weeklyTasks,
  assignedSessions,
  sessionLogs,
  contactSettings,
  changeLog,
  canUndo,
  canRedo,
  accountSecurity,
  onUndo,
  onRedo,
  onClearChangeLog,
  onSavePasscode,
  onLockWorkspace,
  onUpdateSpecialist,
  onJumpToTasks,
  onNotify,
}) => {
  const [reminderBody, setReminderBody] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [specialistName, setSpecialistName] = useState(data.directorName);
  const [specialistRole, setSpecialistRole] = useState(data.directorRole);
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (!modalType) return;
    setPassError('');
    setNewPasscode('');
    setConfirmPasscode('');
    setSpecialistName(data.directorName);
    setSpecialistRole(data.directorRole);
    setReminderBody(
      `تذكير متابعة للحالة (${data.childName}) — الموعد القادم: ${
        caseProfile.nextFollowUpDate || '[ ... ]'
      }${caseProfile.nextFollowUpNote ? ` (${caseProfile.nextFollowUpNote})` : ''}. للتواصل: ${
        contactSettings.phone
      }`
    );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalType, data, caseProfile, contactSettings.phone, onClose]);

  if (!modalType) return null;

  const scheduleText =
    weeklyTasks.length === 0
      ? `جدول المهام الأسبوعي للحالة: ${data.childName}\nلا توجد مهام مجدولة حالياً.\n— ${data.centerName} · هاتف: ${contactSettings.phone}`
      : `جدول المهام الأسبوعي للحالة: ${data.childName}\n${weeklyTasks
          .map((t, i) => `${i + 1}. [${t.day}] ${t.task} — (${t.owner}) [${t.status}]`)
          .join('\n')}\n— ${data.centerName} · هاتف: ${contactSettings.phone}`;

  const missedSessions = sessionLogs.filter((l) => l.attendance === 'لم يتم');
  const activePrograms = assignedSessions.filter((a) => a.status === 'نشط' || a.status === 'قيد المتابعة');

  return (
    <div
      dir="rtl"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl max-h-[88vh] overflow-y-auto bg-white border border-[#E2E8F0] shadow-2xl ${buttonRadiusClass}`}
      >
        <div className="px-5 py-3.5 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-editorial text-base font-bold">
            {modalType === 'change-log' && (
              <>
                <History className="w-4 h-4 text-[#60A5FA]" />
                <span>سجل التعديلات والمتابعة</span>
              </>
            )}
            {modalType === 'comm-schedule' && (
              <>
                <Send className="w-4 h-4 text-[#60A5FA]" />
                <span>إرسال جدول المهام للحالة</span>
              </>
            )}
            {modalType === 'comm-reminder' && (
              <>
                <CalendarClock className="w-4 h-4 text-[#60A5FA]" />
                <span>إرسال تذكير متابعة</span>
              </>
            )}
            {modalType === 'comm-alerts' && (
              <>
                <Bell className="w-4 h-4 text-[#FBBF24]" />
                <span>تنبيهات الحالة والمواعيد</span>
              </>
            )}
            {modalType === 'account-password' && (
              <>
                <KeyRound className="w-4 h-4 text-[#60A5FA]" />
                <span>تغيير رمز المرور وبيانات الحساب</span>
              </>
            )}
            {modalType === 'account-logout' && (
              <>
                <LogOut className="w-4 h-4 text-[#F87171]" />
                <span>قفل الجلسة أو تبديل الأخصائي</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1E293B] text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* 1. CHANGE LOG */}
          {modalType === 'change-log' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canUndo}
                    onClick={onUndo}
                    className={`min-h-[34px] px-3 border border-[#CBD5E1] font-bold inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>تراجع</span>
                  </button>
                  <button
                    type="button"
                    disabled={!canRedo}
                    onClick={onRedo}
                    className={`min-h-[34px] px-3 border border-[#CBD5E1] font-bold inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer ${buttonRadiusClass}`}
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                    <span>إعادة</span>
                  </button>
                </div>
                {changeLog.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearChangeLog}
                    className="text-[#DC2626] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                      <th className="py-2 px-3">الوقت</th>
                      <th className="py-2 px-3">الإجراء</th>
                      <th className="py-2 px-3">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {changeLog.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-5 text-center text-[#64748B]">
                          لا توجد تعديلات مسجلة في هذه الجلسة حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      changeLog.map((item) => (
                        <tr key={item.id} className="even:bg-[#F8FAFC]">
                          <td className="py-2 px-3 text-[#64748B] whitespace-nowrap tabular-nums-ar">
                            {item.timestamp}
                          </td>
                          <td className="py-2 px-3 font-bold text-[#0F172A]">{item.action}</td>
                          <td className="py-2 px-3 text-[#334155]">{item.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 2. SEND SCHEDULE */}
          {modalType === 'comm-schedule' && (
            <>
              <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A]">
                الرسالة الجاهزة للإرسال عبر واتساب أو البريد:
              </div>
              <textarea
                rows={5}
                readOnly
                value={scheduleText}
                className={`w-full p-3 border border-[#CBD5E1] bg-[#F8FAFC] ${buttonRadiusClass}`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyTextToClipboard(scheduleText);
                    onNotify(ok ? 'تم نسخ الجدول للإرسال' : 'تعذر النسخ');
                  }}
                  className={`min-h-[36px] px-4 bg-[#2563EB] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الرسالة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onJumpToTasks();
                  }}
                  className={`min-h-[36px] px-3 border border-[#CBD5E1] font-bold cursor-pointer ${buttonRadiusClass}`}
                >
                  تعديل جدول المهام
                </button>
              </div>
            </>
          )}

          {/* 3. SEND REMINDER */}
          {modalType === 'comm-reminder' && (
            <>
              <div className="font-bold text-[#0F172A]">نص التذكير لولي الأمر أو المدرسة:</div>
              <textarea
                rows={4}
                value={reminderBody}
                onChange={(e) => setReminderBody(e.target.value)}
                className={`w-full p-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
              />
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyTextToClipboard(reminderBody);
                  onNotify(ok ? 'تم نسخ رسالة التذكير بنجاح' : 'تعذر النسخ');
                }}
                className={`min-h-[36px] px-4 bg-[#2563EB] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ التذكير للإرسال</span>
              </button>
            </>
          )}

          {/* 4. ALERTS */}
          {modalType === 'comm-alerts' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between">
                <span className="font-bold text-[#1E3A8A]">موعد المتابعة القادم:</span>
                <span className="font-bold tabular-nums-ar">
                  {caseProfile.nextFollowUpDate || '[ ... ]'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <div className="font-bold text-[#0F172A]">
                  الجلسات والبرامج النشطة ({activePrograms.length})
                </div>
                <div className="text-[#475569]">
                  {activePrograms.length > 0
                    ? activePrograms.map((p) => p.sessionType).join(' ، ')
                    : 'لا توجد جلسات نشطة مسجلة بعد.'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] space-y-1">
                <div className="font-bold text-[#991B1B]">
                  جلسات لم يتم حضورها ({missedSessions.length})
                </div>
                <div className="text-[#7F1D1D]">
                  {missedSessions.length > 0
                    ? missedSessions.map((m) => `#${m.sessionNumber} (${m.sessionType} - ${m.date})`).join(' ، ')
                    : 'لا توجد جلسات متغيبة مسجلة.'}
                </div>
              </div>
            </div>
          )}

          {/* 5. ACCOUNT PASSWORD */}
          {modalType === 'account-password' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A]">
                {accountSecurity.passcode
                  ? 'الرمز السري المحلي مفعّل لحماية شاشة البرنامج عند القفل أو الخروج.'
                  : 'يمكنك تعيين رمز مرور محلي لقفل الشاشة عند مغادرة الجهاز.'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">رمز المرور الجديد</label>
                  <input
                    type="password"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    placeholder="أدخل 4 أرقام أو أحرف على الأقل..."
                    className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">تأكيد رمز المرور</label>
                  <input
                    type="password"
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value)}
                    placeholder="أعد كتابة الرمز..."
                    className={`w-full min-h-[38px] px-3 border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
              </div>
              {passError && <div className="text-[#DC2626] font-bold">{passError}</div>}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newPasscode.trim().length < 4) {
                      setPassError('يجب أن يتكون رمز المرور من 4 أحرف/أرقام على الأقل.');
                      return;
                    }
                    if (newPasscode !== confirmPasscode) {
                      setPassError('رمزا المرور غير متطابقين.');
                      return;
                    }
                    onSavePasscode(newPasscode.trim());
                    onNotify('تم حفظ رمز المرور بنجاح');
                    onClose();
                  }}
                  className={`min-h-[36px] px-4 bg-[#2563EB] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ رمز المرور</span>
                </button>
                {accountSecurity.passcode && (
                  <button
                    type="button"
                    onClick={() => {
                      onSavePasscode('');
                      onNotify('تم إلغاء رمز المرور المحلي');
                      onClose();
                    }}
                    className={`min-h-[36px] px-3 border border-[#FECACA] text-[#DC2626] font-bold cursor-pointer ${buttonRadiusClass}`}
                  >
                    إلغاء القفل بكلمة مرور
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 6. LOGOUT / LOCK SESSION OR SWITCH SPECIALIST */}
          {modalType === 'account-logout' && (
            <div className="space-y-4">
              <div className="space-y-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="font-bold text-[#0F172A]">تبديل الأخصائي النشط:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={specialistName}
                    onChange={(e) => setSpecialistName(e.target.value)}
                    placeholder="اسم الأخصائي..."
                    className={`min-h-[36px] px-3 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                  <input
                    type="text"
                    value={specialistRole}
                    onChange={(e) => setSpecialistRole(e.target.value)}
                    placeholder="الدور الوظيفي..."
                    className={`min-h-[36px] px-3 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSpecialist(
                      specialistName.trim() || data.directorName,
                      specialistRole.trim() || data.directorRole
                    );
                    onNotify('تم تحديث الأخصائي المسؤول في النظام');
                    onClose();
                  }}
                  className={`min-h-[34px] px-3.5 bg-[#059669] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
                >
                  حفظ وتبديل الأخصائي
                </button>
              </div>

              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex flex-wrap items-center justify-between gap-2">
                <div className="text-[#991B1B] font-semibold">
                  {accountSecurity.passcode
                    ? 'قفل الجلسة الحالية وطلب رمز المرور عند العودة.'
                    : 'قم بتعيين رمز مرور أولاً لقفل الشاشة عند تسجيل الخروج.'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!accountSecurity.passcode) {
                      onNotify('عيّن رمز مرور أولاً من «تغيير كلمة المرور»');
                      return;
                    }
                    onLockWorkspace();
                    onClose();
                  }}
                  className={`min-h-[36px] px-4 bg-[#DC2626] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>قفل الشاشة (تسجيل خروج)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
