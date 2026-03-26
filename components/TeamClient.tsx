"use client";

import { useState, useEffect } from 'react';
import { Shield, UserPlus, Check, X, Edit, Trash2, Mail, User, Key, Loader2, UserCog } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from '@/convex/_generated/dataModel';

const AVAILABLE_PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'leads', label: 'Leads Management' },
  { id: 'products', label: 'Products Catalog' },
  { id: 'sourcing', label: 'Sourcing & Inventory' },
  { id: 'invoices', label: 'Invoices & Billing' },
  { id: 'simulator', label: 'ROI Simulator' },
  { id: 'reports', label: 'Analytics & Reports' },
];

export default function TeamClient() {
  const users = useQuery(api.users.getUsers);
  const addUserMutation = useMutation(api.users.addUser);
  const updateUserMutation = useMutation(api.users.updateUserAccess);
  const deleteUserMutation = useMutation(api.users.deleteUser);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isPending, setIsPending] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [role, setRole] = useState('AGENT'); // ✅ ZEDNA L-ROLE HNA
  const [selectedPages, setSelectedPages] = useState<string[]>(['leads']);
  const [status, setStatus] = useState('Active');

  // ✅ S-S7er: Ila bddel l-Role l-ADMIN, cocher kolchi aoutomatiqument
  useEffect(() => {
    if (role === 'ADMIN') {
      setSelectedPages(AVAILABLE_PAGES.map(p => p.id));
    } else if (role === 'AGENT' && selectedPages.length === AVAILABLE_PAGES.length && !editingUser) {
       // Ila rj3ha AGENT w kano kamlin mkhtarin (w machi f wqt l-edit), rj3 ghir leads par defaut
       setSelectedPages(['leads']);
    }
  }, [role, editingUser]); // eslint-disable-line

  if (users === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName(''); setEmail(''); setPassword(''); setStatus('Active'); setRole('AGENT');
    setSelectedPages(['leads']); 
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); 
    setStatus(user.status || 'Active');
    setRole(user.role || 'AGENT');
    setSelectedPages(user.accessPages === 'all' || user.role === 'ADMIN' ? AVAILABLE_PAGES.map(p => p.id) : user.accessPages?.split(',').filter(Boolean) || []);
    setIsModalOpen(true);
  };

  const togglePageAccess = (pageId: string) => {
    // ✅ N-mn3ou l-Admin y-7iyed les accès dyalo
    if (role === 'ADMIN') return; 

    if (selectedPages.includes(pageId)) {
      setSelectedPages(selectedPages.filter(id => id !== pageId));
    } else {
      setSelectedPages([...selectedPages, pageId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    
    // ✅ Ila kan Admin, dima nsiftou "all" f blast l-pages
    const accessString = role === 'ADMIN' ? 'all' : selectedPages.join(',');

    try {
      if (editingUser) {
        // L-Role kay-t-beddel f Update ghir f l-Logic dyalna l-te7t, walakin Backend ma-3tinahch y-beddel l-role f Update.
        // Ila bghiti 7tta l-role y-tbeddel f Edit, khassk t-zidha f updateUserAccess f convex/users.ts. 
        // L-daba, ghan-khelliwhom y-beddlou ghir l-Access w Status f Edit.
        await updateUserMutation({ 
          id: editingUser._id, 
          accessPages: accessString, 
          status 
        });
      } else {
        await addUserMutation({ 
          name, 
          email, 
          password, 
          role, // ✅ DABA KAY-SSIFET L-ROLE L-MKHTAR
          accessPages: accessString,
          status: 'Active'
        });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || "Wqe3 mochkil, 3awd jreb.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id: Id<"users">) => {
    if (confirm('Are you sure you want to remove this user?')) {
      setIsPending(true);
      try {
        await deleteUserMutation({ id });
      } catch(e) {
        console.error(e);
      } finally {
        setIsPending(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-[#1e1b4b] flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" /> Access Control & Team
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage who has access to your CRM pages.</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md">
          <UserPlus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
              <th className="py-4 px-6 font-semibold">User</th>
              <th className="py-4 px-6 font-semibold">Role</th>
              <th className="py-4 px-6 font-semibold w-64">Access (Pages)</th>
              <th className="py-4 px-6 font-semibold text-center">Status</th>
              <th className="py-4 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">No team members found.</td></tr>
            )}
            {users.map((user: any) => (
              <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6">
                  {user.role === 'ADMIN' || user.accessPages === 'all' ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Full Access</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {user.accessPages?.split(',').filter(Boolean).map((p: string) => (
                        <span key={p} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                   <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                     {user.status || 'Active'}
                   </span>
                </td>
                <td className="py-4 px-6 text-right">
                  {user.role !== 'ADMIN' && (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenEdit(user)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(user._id)} disabled={isPending} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in duration-200">
            
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editingUser ? 'Edit Member Access' : 'Add New Member'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              
              <div className="space-y-4">
                
                {/* ✅ ZEDNA L-CHOIX DYAL ROLE HNA (Yban ghir f Add wla ila knti k-t-edit Agent machi Admin) */}
                {(!editingUser || editingUser?.role !== 'ADMIN') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">User Role</label>
                    <div className="relative">
                      <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select 
                        disabled={!!editingUser} // Man3tiwhch y-beddel l-role f Edit 7it ma-ssybnahash f l-Backend
                        value={role} 
                        onChange={e => setRole(e.target.value)} 
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 font-bold text-gray-800 disabled:opacity-60"
                      >
                        <option value="AGENT">AGENT (Limited Access)</option>
                        <option value="ADMIN">ADMIN (Full Access)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" disabled={!!editingUser} value={name} onChange={e => setName(e.target.value)} required className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 disabled:opacity-60" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" disabled={!!editingUser} value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 disabled:opacity-60" />
                  </div>
                </div>
                
                {!editingUser && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Temporary Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={password} onChange={e => setPassword(e.target.value)} required placeholder="e.g. Agent123!" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                    </div>
                  </div>
                )}
                
                {editingUser && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Account Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 font-semibold">
                      <option value="Active">Active (Can Login)</option>
                      <option value="Suspended">Suspended (Blocked)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Page Permissions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_PAGES.map(page => {
                    const isChecked = selectedPages.includes(page.id);
                    const isDisabled = role === 'ADMIN'; // ✅ Ila kan Admin, checkboxes kay-t-blokaw

                    return (
                      <div 
                        key={page.id} 
                        onClick={() => !isDisabled && togglePageAccess(page.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all 
                          ${isDisabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-70' : 'cursor-pointer'}
                          ${isChecked && !isDisabled ? 'bg-blue-50/50 border-blue-200' : ''}
                          ${!isChecked && !isDisabled ? 'bg-white border-gray-100 hover:border-blue-100' : ''}
                        `}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors 
                          ${isChecked ? (isDisabled ? 'bg-gray-400 text-white' : 'bg-blue-500 text-white') : 'bg-gray-100 border border-gray-200'}
                        `}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-sm font-medium ${isChecked ? (isDisabled ? 'text-gray-600' : 'text-blue-900') : 'text-gray-600'}`}>{page.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={isPending || selectedPages.length === 0} className="w-full py-3 bg-[#3b82f6] hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50">
                  {isPending ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}