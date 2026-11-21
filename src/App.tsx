/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LMSProvider, useLMS } from './context/LMSContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { SessionBanner } from './components/common/SessionBanner';
import { CollaborativeBoard } from './components/board/CollaborativeBoard';
import { CourseworkManager } from './components/coursework/CourseworkManager';
import { GradingRubricView } from './components/grading/GradingRubricView';
import { ClassroomAnalytics } from './components/analytics/ClassroomAnalytics';
import { AdminUserManagement } from './components/admin/AdminUserManagement';
import { MediaRecordingStudio } from './components/media/MediaRecordingStudio';
import { MCQExamWorkspace } from './components/exam/MCQExamWorkspace';

type ActiveTab = 'board' | 'exams' | 'coursework' | 'grading' | 'analytics' | 'admin' | 'media';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('board'); // Default to Collaborative PDF Board
  const { currentUser } = useLMS();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Bar (adheres to 3-zone contract) */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Real-time Session Invalidation and Dispatch Banner */}
      <SessionBanner />

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'board' && (
          <div className="flex-1 flex w-full overflow-hidden">
            <Sidebar onSelectLecture={() => setActiveTab('board')} />
            <CollaborativeBoard />
          </div>
        )}

        {activeTab === 'exams' && <MCQExamWorkspace />}

        {activeTab === 'coursework' && <CourseworkManager />}

        {activeTab === 'grading' && <GradingRubricView />}

        {activeTab === 'analytics' && <ClassroomAnalytics />}

        {activeTab === 'media' && <MediaRecordingStudio />}

        {activeTab === 'admin' && currentUser.role === 'admin' && (
          <AdminUserManagement />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LMSProvider>
      <MainApp />
    </LMSProvider>
  );
}
