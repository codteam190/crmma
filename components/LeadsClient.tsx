"use client";

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, Filter, Eye, ChevronDown, X, User, ExternalLink, Edit, Save, Lock, Phone, Package, DollarSign, Loader2 } from 'lucide-react';
import AddOrderModal from '@/components/AddOrderModal';
import { Id } from '@/convex/_generated/dataModel';

// ==========================================
// BADGE STYLING
// ==========================================
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Delivered': return 'bg-teal-100 text-teal-700';
    case 'Confirmed': return 'bg-emerald-100 text-emerald-700'; 
    case 'Invalid': return 'bg-red-100 text-red-700';
    case 'In Transit': return 'bg-blue-100 text-blue-700';
    case 'Wrong Number': return 'bg-rose-100 text-rose-700';
    case 'No Answer': return 'bg-orange-100 text-orange-700';
    case 'Canceled': return 'bg-red-100 text-red-700';
    case 'New': return 'bg-blue-50 text-blue-600';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// ==========================================
// LEAD ROW COMPONENT
// ==========================================
const LeadRow = ({ lead, products, history, onEdit }: { lead: any, products: any[], history: any[], onEdit: () => void }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const product = products?.find(p => p._id === lead.productId);
  const leadHistory = history?.filter(h => h.leadId === lead._id) || [];

  const updateStatusMutation = useMutation(api.leads.updateLeadStatus);
  const availableStatuses = ['New', 'Confirmed', 'Delivered', 'In Transit', 'No Answer', 'Wrong Number', 'Canceled', 'Invalid'];

  const formattedDate = new Date(lead._creationTime).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const handleStatusChange = async (newStatus: string) => {
    setIsDropdownOpen(false); 
    try {
      await updateStatusMutation({ id: lead._id, newStatus }); 
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
        <td className="py-4 px-4 text-sm text-gray-700 uppercase">{lead._id.slice(-6)}</td>
        <td className="py-4 px-4 text-sm text-gray-700">{product?.name || '-'}</td>
        <td className="py-4 px-4 text-sm text-gray-700">{product?.sku || '-'}</td>
        <td className="py-4 px-4 text-sm text-gray-700">{lead.fullName}</td>
        <td className="py-4 px-4 text-sm text-gray-700">{lead.phone || '-'}</td>
        <td className="py-4 px-4 text-sm text-gray-700">
          {lead.country === 'LB' ? 'Lebanon' : lead.country === 'EG' ? 'Egypt' : lead.country === 'MA' ? 'Morocco' : lead.country === 'SA' ? 'Saudi Arabia' : lead.country || '-'}
        </td>
        <td className="py-4 px-4 text-sm text-gray-700 text-center font-bold text-teal-600">{lead.quantity}</td>
        <td className="py-4 px-4 text-sm text-gray-700 text-right">{lead.price ? `${lead.price} $` : '-'}</td>
        
        <td className={`py-4 px-4 relative pl-6 ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
          {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>}
          
          <div className="flex items-center gap-2">
            <div className={`relative ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-all hover:brightness-95 border border-transparent shadow-sm ${getStatusBadge(lead.status)}`}>
                {lead.status} <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {availableStatuses.map((s) => (
                    <div key={s} onClick={() => handleStatusChange(s)} className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                      <span className={`w-2 h-2 rounded-full ${getStatusBadge(s).split(' ')[0]}`}></span>{s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lead.url && (
              <a href={lead.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors relative z-10" title="Open Landing Page">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </td>
        
        <td className="py-4 px-4 text-sm text-gray-700">{formattedDate}</td>
        
        <td className="py-4 px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setIsHistoryModalOpen(true)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="View History">
              <Eye className="w-4 h-4 mx-auto" />
            </button>
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="Edit Lead & Upsell">
              <Edit className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </td>
      </tr>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2a3c5a]">Status history</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex border-b border-gray-200 mb-8 gap-6">
              <button className="pb-3 border-b-2 border-[#00a3ff] text-[#00a3ff] font-bold text-[15px] flex items-center gap-2">Order status</button>
            </div>
            
            <div className="relative border-l border-[#cde0f5] ml-4 space-y-8 pb-4 max-h-[60vh] overflow-y-auto">
              {[
                { status: 'New', _creationTime: lead._creationTime }, 
                ...leadHistory
              ]
              .sort((a, b) => b._creationTime - a._creationTime)
              .map((item: any, index: number) => {
                const itemDate = new Date(item._creationTime).toLocaleString('en-GB', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                return (
                  <div key={index} className="relative pl-8">
                    <div className="absolute -left-[18px] top-0 bg-[#e8f0fe] rounded-full w-9 h-9 flex items-center justify-center border-4 border-white">
                      <User className="w-4 h-4 text-[#8ba3b8]" />
                    </div>
                    <div>
                      <h4 className="text-[#2a3c5a] font-bold text-[15px] uppercase">{item.status}</h4>
                      <p className="text-[13px] text-[#9ba9b9] mt-1 font-medium">At {itemDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 pt-4 border-t border-gray-100">
              <button onClick={() => setIsHistoryModalOpen(false)} className="px-6 py-2 border border-[#b8c6d4] text-[#3e5b82] font-bold rounded-md hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


// ==========================================
// MAIN COMPONENT
// ==========================================
export default function LeadsClient() {
  const leads = useQuery(api.leads.getLeads);
  const products = useQuery(api.products.getProducts);
  const history = useQuery(api.leads.getLeadHistory); 
  const updateLeadMutation = useMutation(api.leads.updateLead);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🎯 ACTIVE FILTERS
  const [activeCountry, setActiveCountry] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [activeProduct, setActiveProduct] = useState('All'); // ✅ ZEDNA L-PRODUCT HNA

  // 📝 DRAFT FILTERS (For the modal)
  const [draftCountry, setDraftCountry] = useState('All');
  const [draftStatus, setDraftStatus] = useState('All');
  const [draftProduct, setDraftProduct] = useState('All'); // ✅ ZEDNA L-PRODUCT DRAFT HNA

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Loading state
  if (leads === undefined || products === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const toggleFilter = () => {
    if (!isFilterOpen) {
      setDraftCountry(activeCountry);
      setDraftStatus(activeStatus);
      setDraftProduct(activeProduct); // ✅ N-SAJJLOU L-PRODUCT F DRAFT
    }
    setIsFilterOpen(!isFilterOpen);
  };

  const hasChanges = draftCountry !== activeCountry || draftStatus !== activeStatus || draftProduct !== activeProduct;

  const handleApply = () => {
    setActiveCountry(draftCountry);
    setActiveStatus(draftStatus);
    setActiveProduct(draftProduct); // ✅ N-APPLIQUER L-PRODUCT L-JDID
    setIsFilterOpen(false); 
    setCurrentPage(1); 
  };

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      lead._id.toLowerCase().includes(searchLower) ||
      lead.fullName.toLowerCase().includes(searchLower) ||
      (lead.phone && lead.phone.includes(searchQuery));

    const matchesCountry = activeCountry === 'All' || lead.country === activeCountry;
    const matchesStatus = activeStatus === 'All' || lead.status === activeStatus;
    const matchesProduct = activeProduct === 'All' || lead.productId === activeProduct; // ✅ L-FILTER D'BESSA7

    return matchesSearch && matchesCountry && matchesStatus && matchesProduct;
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  // ================= ACTIONS =================
  const handleOpenEdit = (lead: any) => {
    setEditingLead({ 
      ...lead, 
      quantity: lead.quantity || 1, 
      price: lead.price || 0 
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateLeadMutation({
        id: editingLead._id,
        fullName: editingLead.fullName,
        phone: editingLead.phone,
        country: editingLead.country,
        status: editingLead.status,
        quantity: parseInt(editingLead.quantity) || 1,
        price: parseFloat(editingLead.price) || 0,
      });
      setIsEditModalOpen(false);
      setEditingLead(null);
    } catch (error) {
      console.error(error);
      alert("Failed to update lead.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 relative">
      
      {/* Edit Modal */}
      {isEditModalOpen && editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSaving && setIsEditModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in zoom-in duration-200">
            
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-[#3b82f6]" /> Edit Lead #{editingLead._id.slice(-6).toUpperCase()}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Update customer details or order quantity (Upsell).</p>
              </div>
              <button disabled={isSaving} onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gray-200 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <Lock className="w-3 h-3" /> SYSTEM DATA
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Order ID</label>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{editingLead._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Created At</label>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{new Date(editingLead._creationTime).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Product</label>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{products?.find(p => p._id === editingLead.productId)?.name || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#1e1b4b] mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Phone className="w-4 h-4 text-blue-500" /> Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                    <input type="text" value={editingLead.fullName} onChange={(e) => setEditingLead({...editingLead, fullName: e.target.value})} required className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-[#3b82f6] outline-none shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label>
                    <input type="text" value={editingLead.phone || ''} onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})} required className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-[#3b82f6] outline-none shadow-sm" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Country</label>
                    <select value={editingLead.country || 'LB'} onChange={(e) => setEditingLead({...editingLead, country: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:border-[#3b82f6] outline-none shadow-sm">
                      <option value="MA">Morocco 🇲🇦</option>
                      <option value="EG">Egypt 🇪🇬</option>
                      <option value="LB">Lebanon 🇱🇧</option>
                      <option value="SA">Saudi Arabia 🇸🇦</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                    <select value={editingLead.status} onChange={(e) => setEditingLead({...editingLead, status: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold focus:border-[#3b82f6] outline-none shadow-sm">
                      <option value="New">New</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Delivered">Delivered</option>
                      <option value="In Transit">In Transit</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Wrong Number">Wrong Number</option>
                      <option value="Canceled">Canceled</option>
                      <option value="Invalid">Invalid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Order Value & Upsell
                </h3>
                <div className="grid grid-cols-2 gap-5 bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Quantity</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input type="number" min="1" step="1" value={editingLead.quantity} onChange={(e) => setEditingLead({...editingLead, quantity: parseInt(e.target.value) || 1})} required className="w-full pl-9 pr-3 py-2.5 bg-white border border-emerald-200 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none shadow-sm text-emerald-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Selling Price (Total)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input type="number" min="0" step="0.01" value={editingLead.price} onChange={(e) => setEditingLead({...editingLead, price: parseFloat(e.target.value) || 0})} required className="w-full pl-9 pr-3 py-2.5 bg-white border border-emerald-200 rounded-lg text-sm font-bold focus:border-emerald-500 outline-none shadow-sm text-emerald-900" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex gap-3 bg-white">
                <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSaving} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-[#3b82f6] hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}


      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">Leads</h1>
          <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{filteredLeads.length}</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AddOrderModal products={products || []} />
          
          <div className="relative w-full sm:w-auto">
            <button onClick={toggleFilter} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-md shadow-sm text-sm font-medium hover:bg-slate-600 transition-colors">
              <Filter className="w-4 h-4" /> Filter
              {(activeCountry !== 'All' || activeStatus !== 'All' || activeProduct !== 'All') && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-5 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    
                    {/* ✅ ZEDNA L-FILTER DYAL PRODUCTS HNA */}
                    <div>
                      <label className="block text-[13px] font-bold text-[#2a3c5a] mb-1.5">Product</label>
                      <div className="relative">
                        <select value={draftProduct} onChange={(e) => setDraftProduct(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 text-sm text-gray-700 appearance-none cursor-pointer">
                          <option value="All">All Products</option>
                          {products.map((p: any) => (
                            <option key={p._id} value={p._id}>{p.name} (SKU: {p.sku.slice(-4)})</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-[#2a3c5a] mb-1.5">Country</label>
                      <div className="relative">
                        <select value={draftCountry} onChange={(e) => setDraftCountry(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 text-sm text-gray-700 appearance-none cursor-pointer">
                          <option value="All">All</option>
                          <option value="MA">Morocco 🇲🇦</option>
                          <option value="EG">Egypt 🇪🇬</option>
                          <option value="LB">Lebanon 🇱🇧</option>
                          <option value="SA">Saudi Arabia 🇸🇦</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[13px] font-bold text-[#2a3c5a] mb-1.5">Status</label>
                      <div className="relative">
                        <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 text-sm text-gray-700 appearance-none cursor-pointer">
                          <option value="All">All</option>
                          <option value="New">New</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Delivered">Delivered</option>
                          <option value="In Transit">In Transit</option>
                          <option value="No Answer">No Answer</option>
                          <option value="Wrong Number">Wrong Number</option>
                          <option value="Canceled">Canceled</option>
                          <option value="Invalid">Invalid</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <button onClick={handleApply} disabled={!hasChanges} className={`w-full font-bold py-2.5 rounded-md transition-all text-sm ${hasChanges ? 'bg-[#8ab4f8] hover:bg-[#6ba0f6] text-white cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        Apply Filters
                      </button>
                    </div>

                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full sm:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); 
              }} 
              placeholder="Search by ID, Name or Phone..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400" 
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Quantity</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Selling Price</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-6">Status</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentLeads.length > 0 ? (
                currentLeads.map((lead) => (
                  <LeadRow key={lead._id} lead={lead} products={products} history={history || []} onEdit={() => handleOpenEdit(lead)} />
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-sm text-gray-500">
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-white">
          <p className="text-sm text-gray-500">
            Showing <span className="font-bold text-gray-900">{filteredLeads.length === 0 ? 0 : indexOfFirstItem + 1}</span> to <span className="font-bold text-gray-900">{Math.min(indexOfLastItem, filteredLeads.length)}</span> of <span className="font-bold text-gray-900">{filteredLeads.length}</span> entries
          </p>
          <div className="flex gap-2">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className={`flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md transition-colors ${currentPage === 1 ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>
              <span className="text-lg leading-none">‹</span> Previous
            </button>
            <button onClick={handleNextPage} disabled={currentPage === totalPages || filteredLeads.length === 0} className={`flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md transition-colors ${currentPage === totalPages || filteredLeads.length === 0 ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>
              Next <span className="text-lg leading-none">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}