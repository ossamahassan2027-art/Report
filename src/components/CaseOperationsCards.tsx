import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Edit3,
  Maximize2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { AssignedSessionItem, SessionLogItem } from '../types/studio';

interface CaseOperationsCardsProps {
  assignedSessions: AssignedSessionItem[];
  sessionLogs: SessionLogItem[];
  buttonRadiusClass: string;
  onChangeAssignedSessions: (next: AssignedSessionItem[], logDesc: string) => void;
  onChangeSessionLogs: (next: SessionLogItem[], logDesc: string) => void;
  onNotify: (msg: string) => void;
}

type FullViewModalKind = null | 'assigned' | 'logs' | 'attendance';

export const CaseOperationsCards: React.FC<CaseOperationsCardsProps> = ({
  assignedSessions,
  sessionLogs,
  buttonRadiusClass,
  onChangeAssignedSessions,
  onChangeSessionLogs,
  onNotify,
}) => {
  const [fullViewModal, setFullViewModal] = useState<FullViewModalKind>(null);

  // Assigned Session Add/Edit Form
  const [assignedFormOpen, setAssignedFormOpen] = useState(false);
  const [editingAssignedId, setEditingAssignedId] = useState<string | null>(null);
  const [aType, setAType] = useState('');
  const [aCode, setACode] = useState('');
  const [aGoal, setAGoal] = useState('');
  const [aCount, setACount] = useState('4');
  const [aStatus, setAStatus] = useState<AssignedSessionItem['status']>('نشط');
  const [aPriority, setAPriority] = useState<AssignedSessionItem['priority']>('متوسطة');

  // Session Log Add/Edit Form
  const [logFormOpen, setLogFormOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [lNumber, setLNumber] = useState('');
  const [lType, setLType] = useState('');
  const [lDate, setLDate] = useState(new Date().toISOString().slice(0, 10));
  const [lAttendance, setLAttendance] = useState<SessionLogItem['attendance']>('تم');
  const [lNotes, setLNotes] = useState('');

  // Confirmation before delete
  const [pendingDelete, setPendingDelete] = useState<
    { kind: 'assigned'; id: string; label: string } | { kind: 'log'; id: string; label: string } | null
  >(null);

  const openAddAssigned = () => {
    setEditingAssignedId(null);
    setAType('');
    setACode(`S-${assignedSessions.length + 1}`);
    setAGoal('');
    setACount('4');
    setAStatus('نشط');
    setAPriority('متوسطة');
    setAssignedFormOpen(true);
  };

  const openEditAssigned = (item: AssignedSessionItem) => {
    setEditingAssignedId(item.id);
    setAType(item.sessionType);
    setACode(item.code);
    setAGoal(item.goal);
    setACount(String(item.sessionsCount));
    setAStatus(item.status);
    setAPriority(item.priority);
    setAssignedFormOpen(true);
  };

  const handleSaveAssigned = () => {
    if (!aType.trim()) {
      onNotify('يرجى كتابة نوع الجلسة أولاً');
      return;
    }
    const payload: AssignedSessionItem = {
      id: editingAssignedId || `asg-${Date.now()}`,
      sessionType: aType.trim(),
      code: aCode.trim() || '[ ... ]',
      goal: aGoal.trim() || '[ ... ]',
      sessionsCount: Math.max(0, Number(aCount) || 0),
      status: aStatus,
      priority: aPriority,
    };
    const next = editingAssignedId
      ? assignedSessions.map((x) => (x.id === editingAssignedId ? payload : x))
      : [...assignedSessions, payload];
    onChangeAssignedSessions(
      next,
      editingAssignedId ? `تعديل جلسة مخصصة: ${payload.sessionType}` : `إضافة جلسة مخصصة: ${payload.sessionType}`
    );
    setAssignedFormOpen(false);
    onNotify(editingAssignedId ? 'تم تحديث بيانات الجلسة المخصصة' : 'تمت إضافة الجلسة المخصصة');
  };

  const openAddLog = () => {
    setEditingLogId(null);
    setLNumber(`${sessionLogs.length + 1}`);
    setLType(assignedSessions[0]?.sessionType || '');
    setLDate(new Date().toISOString().slice(0, 10));
    setLAttendance('تم');
    setLNotes('');
    setLogFormOpen(true);
  };

  const openEditLog = (item: SessionLogItem) => {
    setEditingLogId(item.id);
    setLNumber(item.sessionNumber);
    setLType(item.sessionType);
    setLDate(item.date);
    setLAttendance(item.attendance);
    setLNotes(item.notes);
    setLogFormOpen(true);
  };

  const handleSaveLog = () => {
    if (!lType.trim()) {
      onNotify('يرجى إدخال نوع الجلسة أولاً');
      return;
    }
    const payload: SessionLogItem = {
      id: editingLogId || `log-${Date.now()}`,
      sessionNumber: lNumber.trim() || `${sessionLogs.length + 1}`,
      sessionType: lType.trim(),
      date: lDate.trim() || new Date().toISOString().slice(0, 10),
      attendance: lAttendance,
      notes: lNotes.trim() || '[ ... ]',
    };
    const next = editingLogId
      ? sessionLogs.map((x) => (x.id === editingLogId ? payload : x))
      : [payload, ...sessionLogs];
    onChangeSessionLogs(
      next,
      editingLogId ? `تعديل سجل الجلسة رقم ${payload.sessionNumber}` : `تسجيل جلسة رقم ${payload.sessionNumber}`
    );
    setLogFormOpen(false);
    onNotify(editingLogId ? 'تم تحديث سجل الجلسة' : 'تم تسجيل الجلسة في السجل');
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'assigned') {
      onChangeAssignedSessions(
        assignedSessions.filter((x) => x.id !== pendingDelete.id),
        `حذف الجلسة المخصصة: ${pendingDelete.label}`
      );
      onNotify(`تم حذف: ${pendingDelete.label}`);
    } else {
      onChangeSessionLogs(
        sessionLogs.filter((x) => x.id !== pendingDelete.id),
        `حذف سجل جلسة: ${pendingDelete.label}`
      );
      onNotify(`تم حذف سجل الجلسة: ${pendingDelete.label}`);
    }
    setPendingDelete(null);
  };

  const statusBadgeStyle = (status: AssignedSessionItem['status']) => {
    if (status === 'مكتمل') return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
    if (status === 'نشط') return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    if (status === 'قيد المتابعة') return { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
    return { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' };
  };

  const doneCount = sessionLogs.filter((l) => l.attendance === 'تم').length;
  const missedCount = sessionLogs.filter((l) => l.attendance === 'لم يتم').length;
  const postponedCount = sessionLogs.filter((l) => l.attendance === 'مؤجل').length;
  const totalLogs = sessionLogs.length;
  const attendancePct = totalLogs > 0 ? Math.round((doneCount / totalLogs) * 100) : 0;

  return (
    <div className="no-print space-y-5 text-xs">
      {/* Card 1: Assigned Sessions */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-editorial text-base font-bold text-[#0F172A]">
              المواد / الجلسات المخصصة
            </h3>
            <p className="text-[11px] text-[#64748B]">
              تحديد الجلسات العلاجية والتربوية والأكواد والأهداف وعدد الجلسات المقررة
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAddAssigned}
              className={`min-h-[34px] px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صف</span>
            </button>
            <button
              type="button"
              onClick={() => setFullViewModal('assigned')}
              className={`min-h-[34px] px-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#1E3A8A] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>عرض الكل</span>
            </button>
          </div>
        </div>

        {assignedFormOpen && (
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] space-y-2.5">
            <div className="font-bold text-[#1E3A8A]">
              {editingAssignedId ? 'تعديل صف الجلسة المخصصة' : 'إضافة جلسة مخصصة جديدة'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <input
                type="text"
                value={aType}
                onChange={(e) => setAType(e.target.value)}
                placeholder="نوع الجلسة (مثال: تعديل سلوك)"
                className={`min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
              />
              <input
                type="text"
                value={aCode}
                onChange={(e) => setACode(e.target.value)}
                placeholder="الكود"
                className={`min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
              />
              <input
                type="text"
                value={aGoal}
                onChange={(e) => setAGoal(e.target.value)}
                placeholder="الهدف"
                className={`min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
              />
              <input
                type="number"
                min={0}
                value={aCount}
                onChange={(e) => setACount(e.target.value)}
                placeholder="عدد الجلسات"
                className={`min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
              />
              <select
                value={aStatus}
                onChange={(e) => setAStatus(e.target.value as AssignedSessionItem['status'])}
                className={`min-h-[36px] px-2 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
              >
                <option value="نشط">نشط</option>
                <option value="قيد المتابعة">قيد المتابعة</option>
                <option value="مكتمل">مكتمل</option>
                <option value="مؤجل">مؤجل</option>
              </select>
              <select
                value={aPriority}
                onChange={(e) => setAPriority(e.target.value as AssignedSessionItem['priority'])}
                className={`min-h-[36px] px-2 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
              >
                <option value="عالية">عالية</option>
                <option value="متوسطة">متوسطة</option>
                <option value="عادية">عادية</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAssigned}
                className={`min-h-[34px] px-3.5 bg-[#059669] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>حفظ الصف</span>
              </button>
              <button
                type="button"
                onClick={() => setAssignedFormOpen(false)}
                className={`min-h-[34px] px-3 bg-white border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                <th className="py-2.5 px-3 font-bold">#</th>
                <th className="py-2.5 px-3 font-bold">نوع الجلسة</th>
                <th className="py-2.5 px-3 font-bold">الكود</th>
                <th className="py-2.5 px-3 font-bold">الهدف</th>
                <th className="py-2.5 px-3 font-bold text-center">عدد الجلسات</th>
                <th className="py-2.5 px-3 font-bold text-center">الحالة</th>
                <th className="py-2.5 px-3 font-bold text-center">الأولوية</th>
                <th className="py-2.5 px-3 font-bold text-left">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {assignedSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-5 px-4 text-center text-[#64748B]">
                    لا توجد جلسات مخصصة مضافة بعد — اضغط «إضافة صف» لإدراج جلسة جديدة.
                  </td>
                </tr>
              ) : (
                assignedSessions.map((item, idx) => {
                  const badge = statusBadgeStyle(item.status);
                  return (
                    <tr key={item.id} className="even:bg-[#F8FAFC] hover:bg-[#EFF6FF]/40">
                      <td className="py-2.5 px-3 font-bold tabular-nums-ar">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-[#0F172A]">{item.sessionType}</td>
                      <td className="py-2.5 px-3 text-[#475569] tabular-nums-ar">{item.code}</td>
                      <td className="py-2.5 px-3 text-[#334155]">{item.goal}</td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums-ar">
                        {item.sessionsCount}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-md border text-[11px] font-bold"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            borderColor: badge.border,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-[#475569]">
                        {item.priority}
                      </td>
                      <td className="py-2.5 px-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditAssigned(item)}
                            className="px-2 py-1 bg-[#EFF6FF] text-[#1E3A8A] rounded font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                kind: 'assigned',
                                id: item.id,
                                label: item.sessionType,
                              })
                            }
                            className="px-2 py-1 bg-[#FEF2F2] text-[#DC2626] rounded font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Card 2 & Card 3 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Card 2: Session Logs / Transactions */}
        <section className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-editorial text-base font-bold text-[#0F172A]">
                سجل الجلسات والمعاملات
              </h3>
              <p className="text-[11px] text-[#64748B]">
                توثيق كل جلسة منفذة أو مؤجلة وتحديث نسب الالتزام تلقائياً
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddLog}
                className={`min-h-[34px] px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صف</span>
              </button>
              <button
                type="button"
                onClick={() => setFullViewModal('logs')}
                className={`min-h-[34px] px-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#1E3A8A] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>عرض الكل</span>
              </button>
            </div>
          </div>

          {logFormOpen && (
            <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] space-y-2.5">
              <div className="font-bold text-[#1E3A8A]">
                {editingLogId ? 'تعديل سجل الجلسة' : 'تسجيل جلسة جديدة'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  value={lNumber}
                  onChange={(e) => setLNumber(e.target.value)}
                  placeholder="رقم الجلسة"
                  className={`min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
                <input
                  type="text"
                  value={lType}
                  onChange={(e) => setLType(e.target.value)}
                  placeholder="النوع"
                  className={`min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
                <input
                  type="date"
                  value={lDate}
                  onChange={(e) => setLDate(e.target.value)}
                  className={`min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
                <select
                  value={lAttendance}
                  onChange={(e) =>
                    setLAttendance(e.target.value as SessionLogItem['attendance'])
                  }
                  className={`min-h-[36px] px-2 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                >
                  <option value="تم">تم</option>
                  <option value="لم يتم">لم يتم</option>
                  <option value="مؤجل">مؤجل</option>
                </select>
                <input
                  type="text"
                  value={lNotes}
                  onChange={(e) => setLNotes(e.target.value)}
                  placeholder="ملاحظات..."
                  className={`min-h-[36px] px-2.5 bg-white border border-[#CBD5E1] ${buttonRadiusClass}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveLog}
                  className={`min-h-[34px] px-3.5 bg-[#059669] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ السجل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogFormOpen(false)}
                  className={`min-h-[34px] px-3 bg-white border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                  <th className="py-2.5 px-3 font-bold">رقم الجلسة</th>
                  <th className="py-2.5 px-3 font-bold">النوع</th>
                  <th className="py-2.5 px-3 font-bold">التاريخ</th>
                  <th className="py-2.5 px-3 font-bold text-center">تم / لم يتم</th>
                  <th className="py-2.5 px-3 font-bold">ملاحظات</th>
                  <th className="py-2.5 px-3 font-bold text-left">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {sessionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-5 px-4 text-center text-[#64748B]">
                      لم يتم تسجيل جلسات بعد — اضغط «إضافة صف» لتوثيق أول جلسة.
                    </td>
                  </tr>
                ) : (
                  sessionLogs.map((log) => (
                    <tr key={log.id} className="even:bg-[#F8FAFC] hover:bg-[#EFF6FF]/40">
                      <td className="py-2.5 px-3 font-bold tabular-nums-ar">#{log.sessionNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{log.sessionType}</td>
                      <td className="py-2.5 px-3 text-[#475569] tabular-nums-ar">{log.date}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-md border text-[11px] font-bold"
                          style={{
                            backgroundColor:
                              log.attendance === 'تم'
                                ? '#ECFDF5'
                                : log.attendance === 'مؤجل'
                                ? '#FFFBEB'
                                : '#FEF2F2',
                            color:
                              log.attendance === 'تم'
                                ? '#047857'
                                : log.attendance === 'مؤجل'
                                ? '#B45309'
                                : '#B91C1C',
                            borderColor:
                              log.attendance === 'تم'
                                ? '#A7F3D0'
                                : log.attendance === 'مؤجل'
                                ? '#FDE68A'
                                : '#FECACA',
                          }}
                        >
                          {log.attendance}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#334155]">{log.notes}</td>
                      <td className="py-2.5 px-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditLog(log)}
                            className="px-2 py-1 bg-[#EFF6FF] text-[#1E3A8A] rounded font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                kind: 'log',
                                id: log.id,
                                label: `جلسة #${log.sessionNumber}`,
                              })
                            }
                            className="px-2 py-1 bg-[#FEF2F2] text-[#DC2626] rounded font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Card 3: Attendance / Compliance Summary */}
        <section className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
            <div>
              <h3 className="font-editorial text-base font-bold text-[#0F172A]">
                ملخص الحضور والالتزام
              </h3>
              <p className="text-[11px] text-[#64748B]">يتحدث تلقائياً من سجل الجلسات</p>
            </div>
            <button
              type="button"
              onClick={() => setFullViewModal('attendance')}
              className={`min-h-[34px] px-3 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-[#1E3A8A] font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>عرض الكل</span>
            </button>
          </div>

          <div className="p-4">
            {totalLogs === 0 ? (
              <div className="p-5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-center space-y-2.5">
                <BarChart3 className="w-7 h-7 text-[#2563EB] mx-auto" />
                <div className="font-bold text-[#1E3A8A]">لا يوجد التزام مسجل بعد</div>
                <p className="text-[11px] text-[#475569]">
                  بمجرد تسجيل الجلسات في الجدول المجاور ستظهر نسبة الالتزام والرسم البياني تلقائياً.
                </p>
                <button
                  type="button"
                  onClick={openAddLog}
                  className={`min-h-[34px] px-3.5 bg-[#2563EB] text-white font-bold inline-flex items-center gap-1 cursor-pointer ${buttonRadiusClass}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسجيل أول جلسة</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E3A8A]">نسبة الالتزام الكلية</span>
                  <span className="text-lg font-bold text-[#047857] tabular-nums-ar">
                    {attendancePct}%
                  </span>
                </div>

                {/* Simple Automatic Bar Chart */}
                <div className="space-y-2">
                  {[
                    { label: 'تم الحضور', count: doneCount, color: '#059669' },
                    { label: 'لم يتم', count: missedCount, color: '#DC2626' },
                    { label: 'مؤجل', count: postponedCount, color: '#D97706' },
                  ].map((bar) => {
                    const pct = totalLogs > 0 ? Math.round((bar.count / totalLogs) * 100) : 0;
                    return (
                      <div key={bar.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span>{bar.label}</span>
                          <span className="tabular-nums-ar">
                            {bar.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-white rounded-full overflow-hidden border border-[#DBEAFE]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: bar.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Confirmation Delete Modal */}
      {pendingDelete && (
        <div
          onClick={() => setPendingDelete(null)}
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm bg-white border border-[#E2E8F0] shadow-2xl p-5 space-y-3 ${buttonRadiusClass}`}
          >
            <div className="flex items-center gap-2 text-[#DC2626] font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>تأكيد الحذف</span>
            </div>
            <p className="text-xs text-[#334155]">
              هل أنت متأكد من حذف «<strong>{pendingDelete.label}</strong>»؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className={`min-h-[34px] px-3 border border-[#CBD5E1] font-semibold cursor-pointer ${buttonRadiusClass}`}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className={`min-h-[34px] px-3.5 bg-[#DC2626] text-white font-bold cursor-pointer ${buttonRadiusClass}`}
              >
                نعم، حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Page View Modal for [ عرض الكل ] */}
      {fullViewModal && (
        <div
          onClick={() => setFullViewModal(null)}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-4xl max-h-[88vh] overflow-y-auto bg-white border border-[#E2E8F0] shadow-2xl ${buttonRadiusClass}`}
          >
            <div className="px-5 py-3.5 bg-[#0F172A] text-white flex items-center justify-between">
              <span className="font-editorial text-base font-bold">
                {fullViewModal === 'assigned'
                  ? 'العرض الكامل: المواد / الجلسات المخصصة'
                  : fullViewModal === 'logs'
                  ? 'العرض الكامل: سجل الجلسات والمعاملات'
                  : 'العرض الكامل: ملخص الحضور والالتزام'}
              </span>
              <button
                type="button"
                onClick={() => setFullViewModal(null)}
                className="p-1.5 rounded-lg bg-[#1E293B] text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {fullViewModal === 'assigned' && (
                <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">نوع الجلسة</th>
                        <th className="py-2.5 px-3">الكود</th>
                        <th className="py-2.5 px-3">الهدف</th>
                        <th className="py-2.5 px-3">عدد الجلسات</th>
                        <th className="py-2.5 px-3">الحالة</th>
                        <th className="py-2.5 px-3">الأولوية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {assignedSessions.map((item, idx) => (
                        <tr key={item.id} className="even:bg-[#F8FAFC]">
                          <td className="py-2 px-3 font-bold tabular-nums-ar">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold">{item.sessionType}</td>
                          <td className="py-2 px-3">{item.code}</td>
                          <td className="py-2 px-3">{item.goal}</td>
                          <td className="py-2 px-3 tabular-nums-ar">{item.sessionsCount}</td>
                          <td className="py-2 px-3 font-bold">{item.status}</td>
                          <td className="py-2 px-3">{item.priority}</td>
                        </tr>
                      ))}
                      {assignedSessions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-[#64748B]">
                            لا توجد بيانات مضافة حتى الآن.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {fullViewModal === 'logs' && (
                <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#EFF6FF] text-[#1E3A8A] border-b border-[#BFDBFE]">
                        <th className="py-2.5 px-3">رقم الجلسة</th>
                        <th className="py-2.5 px-3">النوع</th>
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">تم / لم يتم</th>
                        <th className="py-2.5 px-3">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {sessionLogs.map((log) => (
                        <tr key={log.id} className="even:bg-[#F8FAFC]">
                          <td className="py-2 px-3 font-bold tabular-nums-ar">#{log.sessionNumber}</td>
                          <td className="py-2 px-3 font-semibold">{log.sessionType}</td>
                          <td className="py-2 px-3 tabular-nums-ar">{log.date}</td>
                          <td className="py-2 px-3 font-bold">{log.attendance}</td>
                          <td className="py-2 px-3">{log.notes}</td>
                        </tr>
                      ))}
                      {sessionLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#64748B]">
                            لا توجد جلسات مسجلة حتى الآن.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {fullViewModal === 'attendance' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-center">
                      <div className="text-[#1E3A8A] font-bold">إجمالي السجل</div>
                      <div className="text-xl font-bold mt-1 tabular-nums-ar">{totalLogs}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-center">
                      <div className="text-[#065F46] font-bold">تم الحضور</div>
                      <div className="text-xl font-bold text-[#047857] mt-1 tabular-nums-ar">{doneCount}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-center">
                      <div className="text-[#991B1B] font-bold">لم يتم</div>
                      <div className="text-xl font-bold text-[#DC2626] mt-1 tabular-nums-ar">{missedCount}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-center">
                      <div className="text-[#92400E] font-bold">مؤجل</div>
                      <div className="text-xl font-bold text-[#B45309] mt-1 tabular-nums-ar">{postponedCount}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
