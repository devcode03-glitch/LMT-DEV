/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { User, Role } from '../../types/lms';
import { 
  Users, 
  ShieldAlert, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  Ban, 
  RefreshCw, 
  KeyRound, 
  Layers,
  ArrowRight
} from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const { 
    currentUser, 
    users, 
    updateUserStatus, 
    reassignUserBatches, 
    registerUser,
    batches
  } = useLMS();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  
  // Registration modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<Role>('student');
  const [regGroup, setRegGroup] = useState('Core Studio');
  const [regBatch, setRegBatch] = useState('batch-cs401');

  // Reassignment Modal State
  const [reassigningUser, setReassigningUser] = useState<User | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenReassign = (user: User) => {
    setReassigningUser(user);
    setSelectedBatchIds([...user.assignedBatches]);
  };

  const handleCommitReassignment = () => {
    if (!reassigningUser) return;
    reassignUserBatches(reassigningUser.id, selectedBatchIds);
    setReassigningUser(null);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) return;

    registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
      status: 'active',
      assignedBatches: [regBatch],
      studentGroup: regRole === 'student' ? regGroup : undefined
    });

    setRegName('');
    setRegEmail('');
    setIsRegisterOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-50 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>System Administrator Console</span>
              <span>·</span>
              <span>FR-1.1, FR-1.2, FR-1.3, FR-1.4</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              User Management & Dynamic RBAC Engine
            </h1>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Account</span>
          </button>
        </div>

        {/* Security & Token Invalidation Architecture Callout */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-slate-600">
            <p className="font-bold text-slate-900">
              Real-Time Session Invalidation Invariant (FR-1.4)
            </p>
            <p className="leading-relaxed">
              When an administrator reassigns a user's batch enrollments or suspends an account, active JWT access tokens stored in HTTP-only cookies are revoked in Redis within &lt;1000ms. Connected WebSocket presentation sockets are automatically notified to drop unauthorized channels immediately.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Role Filter Tabs (Functional segmented buttons) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(['all', 'admin', 'instructor', 'student', 'guardian'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-md transition-colors capitalize ${
                  roleFilter === r
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* High-Density Users Table (FR-1.2) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-6 py-3">User & Email</th>
                  <th className="px-6 py-3">Role & Track</th>
                  <th className="px-6 py-3">Assigned Batches (RBAC)</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Active</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => {
                  const isBanned = user.status === 'banned';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-slate-800 capitalize">{user.role}</span>
                        {user.studentGroup && (
                          <span className="text-slate-500 text-[11px] block">{user.studentGroup}</span>
                        )}
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {user.assignedBatches.map(bId => {
                            const b = batches.find(item => item.id === bId);
                            return (
                              <span
                                key={bId}
                                className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                              >
                                {b?.code || bId}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                          isBanned ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isBanned ? 'bg-red-600' : 'bg-emerald-600'}`} />
                          {user.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                        {user.lastActive}
                      </td>

                      <td className="px-6 py-3.5 text-right space-x-2">
                        {/* Reassign Batches Button (FR-1.3) */}
                        <button
                          onClick={() => handleOpenReassign(user)}
                          className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                          title="Reassign Courses / Batches"
                        >
                          Reassign
                        </button>

                        {/* Ban / Activate Toggle (FR-1.2) */}
                        <button
                          onClick={() => updateUserStatus(user.id, isBanned ? 'active' : 'banned')}
                          className={`px-2.5 py-1 rounded font-medium transition-colors ${
                            isBanned
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {isBanned ? 'Unban' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BATCH REASSIGNMENT MODAL (FR-1.3 & FR-1.4) */}
      {reassigningUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reassign Course Batches</h3>
                <p className="text-xs text-slate-500">FR-1.3 & FR-1.4 Immediate Invalidation</p>
              </div>
              <button onClick={() => setReassigningUser(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Modifying batch enrollments for <strong>{reassigningUser.name}</strong> will revoke active session tokens in Redis within 1 second and re-authenticate WebSocket channels.
            </p>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-700 block">Select Enrolled Batches</label>
              {batches.map(batch => {
                const isSelected = selectedBatchIds.includes(batch.id);
                return (
                  <label
                    key={batch.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{batch.code} · {batch.name}</p>
                      <p className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{batch.term}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedBatchIds(prev => [...prev, batch.id]);
                        } else {
                          setSelectedBatchIds(prev => prev.filter(id => id !== batch.id));
                        }
                      }}
                      className="rounded text-slate-900"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReassigningUser(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitReassignment}
                className="px-4 py-2 text-xs bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-xs"
              >
                Trigger Invalidation & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER ACCOUNT MODAL (FR-1.2) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register New LMS Account</h3>
                <p className="text-xs text-slate-500">FR-1.2 User Administration</p>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="m.lin@vectorlms.edu"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">User Role</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrator</option>
                    <option value="guardian">Guardian</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Batch</label>
                  <select
                    value={regBatch}
                    onChange={e => setRegBatch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {regRole === 'student' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student Group / Track</label>
                  <select
                    value={regGroup}
                    onChange={e => setRegGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="Honors Track">Honors Track</option>
                    <option value="Core Studio">Core Studio</option>
                    <option value="Lab Alpha">Lab Alpha</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
