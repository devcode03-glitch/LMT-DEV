/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import { UserCheck, ChevronDown, Check } from 'lucide-react';

interface HeaderProps {
  activeTab: 'board' | 'coursework' | 'exams' | 'grading' | 'analytics' | 'admin' | 'media';
  setActiveTab: (tab: 'board' | 'coursework' | 'exams' | 'grading' | 'analytics' | 'admin' | 'media') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, users, switchUser } = useLMS();
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPersonaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a 
          href="#board" 
          onClick={(e) => { e.preventDefault(); setActiveTab('board'); }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          VectorLMS
        </a>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">v2.6-spec</span>
      </div>

      {/* Zone 2: Single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('board')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'board' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
          }`}
        >
          PDF Vector Board
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'exams' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
          }`}
        >
          MCQ Exam Engine
        </button>
        <button
          onClick={() => setActiveTab('coursework')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'coursework' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
          }`}
        >
          Coursework & Video
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'grading' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
          }`}
        >
          Grading & Rubrics
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'analytics' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
          }`}
        >
          Class Analytics
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'media' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
          }`}
        >
          Media Studio
        </button>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'admin' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
            }`}
          >
            Admin & RBAC
          </button>
        )}
      </nav>

      {/* Zone 3: 1 Primary Action (Fast Role & Persona Switcher) */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setIsPersonaOpen(!isPersonaOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 border border-slate-200"
          title="Switch User Role to test RBAC and live collaboration"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-5 h-5 rounded-full object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
          <span className="font-semibold text-slate-900">{currentUser.name}</span>
          <span className="text-slate-500 uppercase text-[10px] tracking-wide">
            ({currentUser.role})
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {isPersonaOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-900">Active Persona & Role</p>
              <p className="text-[11px] text-slate-500">Switch user to test role-based access & permissions</p>
            </div>
            <div className="py-1 max-h-80 overflow-y-auto">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u.id);
                    setIsPersonaOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    u.id === currentUser.id ? 'bg-slate-50 font-medium' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-slate-900 font-medium truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {u.role.toUpperCase()} {u.studentGroup ? `· ${u.studentGroup}` : ''}
                      </p>
                    </div>
                  </div>
                  {u.id === currentUser.id && (
                    <Check className="w-4 h-4 text-slate-900 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
