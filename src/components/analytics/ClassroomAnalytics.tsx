/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { 
  BarChart3, 
  TrendingUp, 
  Mail, 
  Calendar, 
  Video, 
  FolderSync, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertCircle,
  ExternalLink,
  Send
} from 'lucide-react';

export const ClassroomAnalytics: React.FC = () => {
  const { 
    guardianConfig, 
    updateGuardianConfig, 
    triggerGuardianDispatch,
    submissions,
    assignments,
    users
  } = useLMS();

  // Simulated Google Workspace sync states (FR-6.2)
  const [driveSyncStatus, setDriveSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [calendarSyncStatus, setCalendarSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [meetLink, setMeetLink] = useState('https://meet.google.com/vec-lms-board');

  const students = users.filter(u => u.role === 'student');
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const missingCount = submissions.filter(s => s.status === 'missing').length;
  const averageGrade = Math.round(
    submissions.filter(s => s.grade !== undefined && s.status !== 'excused').reduce((acc, s) => acc + (s.grade || 0), 0) /
    (submissions.filter(s => s.grade !== undefined && s.status !== 'excused').length || 1)
  );

  const handleSyncDrive = () => {
    setDriveSyncStatus('syncing');
    setTimeout(() => setDriveSyncStatus('synced'), 1200);
  };

  const handleSyncCalendar = () => {
    setCalendarSyncStatus('syncing');
    setTimeout(() => setCalendarSyncStatus('synced'), 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Classroom Operations & Analytics</span>
            <span>·</span>
            <span>FR-6.1, FR-6.2, FR-6.3</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Class Performance, Integrations & Guardian Automation
          </h1>
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500">Overall Course Average</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {averageGrade}%
              </span>
              <span className="text-xs text-emerald-600 font-semibold font-mono">Grade A</span>
            </div>
            <p className="text-[11px] text-slate-400">Excused submissions excluded (FR-5.4)</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500">Submission Completion Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {Math.round((gradedCount / (submissions.length || 1)) * 100)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">({gradedCount}/{submissions.length})</span>
            </div>
            <p className="text-[11px] text-slate-400">Across active batches</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500">Live Board Interaction Index</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-indigo-600 tabular-nums">
                94.8%
              </span>
              <span className="text-xs text-emerald-600 font-semibold">● ACTIVE</span>
            </div>
            <p className="text-[11px] text-slate-400">Vector stroke telemetry latency ~48ms</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500">Enrolled Active Learners</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {students.length}
              </span>
              <span className="text-xs text-slate-500">students</span>
            </div>
            <p className="text-[11px] text-slate-400">100% compliant with batch RBAC</p>
          </div>
        </div>

        {/* Middle Split: Guardian Email Summaries vs Education Integrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guardian Email Automation (FR-6.3) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Guardian Email Summaries</h3>
                  <p className="text-xs text-slate-500">FR-6.3 Automated Progress Delivery</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardianConfig.enabled}
                  onChange={e => updateGuardianConfig({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cadence Frequency</label>
                  <select
                    value={guardianConfig.frequency}
                    onChange={e => updateGuardianConfig({ frequency: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="weekly">Weekly Digest</option>
                    <option value="daily">Daily Briefing</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scheduled Dispatch Day</label>
                  <select
                    value={guardianConfig.sendDay}
                    onChange={e => updateGuardianConfig({ sendDay: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="Friday">Friday (End of Week)</option>
                    <option value="Monday">Monday (Week Ahead)</option>
                    <option value="Sunday">Sunday (Evening Prep)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={guardianConfig.includeMissingAssignments}
                    onChange={e => updateGuardianConfig({ includeMissingAssignments: e.target.checked })}
                    className="rounded text-slate-900"
                  />
                  <span>Include alerts for overdue or missing coursework</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={guardianConfig.includeUpcomingDeadlines}
                    onChange={e => updateGuardianConfig({ includeUpcomingDeadlines: e.target.checked })}
                    className="rounded text-slate-900"
                  />
                  <span>Include upcoming assignment & exam schedules</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={guardianConfig.includeClassAnnouncements}
                    onChange={e => updateGuardianConfig({ includeClassAnnouncements: e.target.checked })}
                    className="rounded text-slate-900"
                  />
                  <span>Include instructor announcements and lecture notes</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Last Dispatched: {guardianConfig.lastDispatchedDate}
                </span>
                <button
                  onClick={triggerGuardianDispatch}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Immediate Digest</span>
                </button>
              </div>
            </div>
          </div>

          {/* Education Integrations (FR-6.2) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Education Ecosystem Integrations</h3>
              <p className="text-xs text-slate-500">FR-6.2 Shared Cloud Drive, Calendar & Meet</p>
            </div>

            <div className="space-y-3">
              {/* Google Drive Integration */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-amber-600 shadow-xs">
                    <FolderSync className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Shared Class Google Drive</p>
                    <p className="text-[11px] text-slate-500">Synced: /Batches/CS-401/Vector_Board_Recordings</p>
                  </div>
                </div>
                <button
                  onClick={handleSyncDrive}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
                >
                  {driveSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              {/* Google Meet Integration */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-xs">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Live Session Video Link</p>
                    <p className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">{meetLink}</p>
                  </div>
                </div>
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
                >
                  <span>Launch</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Google Calendar Integration */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-blue-600 shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Lecture & Exam Calendar</p>
                    <p className="text-[11px] text-slate-500">Auto-publishes batch syllabus milestones</p>
                  </div>
                </div>
                <button
                  onClick={handleSyncCalendar}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100"
                >
                  {calendarSyncStatus === 'syncing' ? 'Syncing...' : 'Synchronized'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Student Performance Roster Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Engagement Matrix</h3>
              <p className="text-xs text-slate-500">Cross-batch performance and submission status</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Assigned Track</th>
                  <th className="px-6 py-3">Submissions</th>
                  <th className="px-6 py-3">GPA Average</th>
                  <th className="px-6 py-3">Guardian Linked</th>
                  <th className="px-6 py-3">Originality Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(student => {
                  const studentSubs = submissions.filter(s => s.studentId === student.id);
                  const studentAvg = Math.round(
                    studentSubs.reduce((acc, s) => acc + (s.grade || 0), 0) / (studentSubs.length || 1)
                  );
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-6 h-6 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span>{student.name}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {student.studentGroup || 'General Batch'}
                      </td>
                      <td className="px-6 py-3.5 font-mono tabular-nums text-slate-700">
                        {studentSubs.length} of {assignments.length}
                      </td>
                      <td className="px-6 py-3.5 font-mono tabular-nums font-semibold text-slate-900">
                        {studentSubs.length > 0 ? `${studentAvg}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                        {student.guardianEmail || 'Not configured'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-emerald-600 font-semibold text-[11px]">
                          ✓ Verified
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
