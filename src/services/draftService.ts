import { AttendanceRecord, SessionType, normalizeSession } from '../types';

export interface AttendanceDraft {
  classId: string;
  date: string;
  session: SessionType;
  records: AttendanceRecord[];
  notes?: string;
  savedAt: string;
}

const DRAFT_STORAGE_PREFIX = 'thcs_banbo_attendance_draft_';

export const draftService = {
  getDraftKey(classId: string, date: string, session: SessionType = 'MORNING'): string {
    return `${DRAFT_STORAGE_PREFIX}${classId}_${date}_${normalizeSession(session)}`;
  },

  saveDraft(
    classId: string,
    date: string,
    session: SessionType,
    records: AttendanceRecord[],
    notes?: string
  ): void {
    try {
      const key = this.getDraftKey(classId, date, session);
      const draft: AttendanceDraft = {
        classId,
        date,
        session,
        records,
        notes,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(draft));
    } catch {
      // Storage error silent fallback
    }
  },

  getDraft(classId: string, date: string, session: SessionType = 'morning'): AttendanceDraft | null {
    try {
      const key = this.getDraftKey(classId, date, session);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clearDraft(classId: string, date: string, session: SessionType = 'morning'): void {
    try {
      const key = this.getDraftKey(classId, date, session);
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};
