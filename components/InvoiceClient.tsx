"use client";

import { useState, useMemo, useEffect } from 'react';
import { FileText, Printer, Download, Plus, Filter, ArrowLeft, X, CheckCircle2, Edit, Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from '@/convex/_generated/dataModel';

export default function InvoiceClient() {
  // 🪄 Convex Queries & Mutations
  const dbInvoices = useQuery(api.invoices.getInvoices);
  const leads = useQuery(api.leads.getLeads);
  const products = useQuery(api.products.getProducts); // ✅ ZEDNA PRODUCTS HNA
  
  const addInvoiceMutation = useMutation(api.invoices.addInvoice);
  const updateInvoiceMutation = useMutation(api.invoices.updateInvoice);
  const markPaidMutation = useMutation(api.invoices.markAsPaid);
  const deleteInvoiceMutation = useMutation(api.invoices.deleteInvoice);

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPending, setIsPending] = useState(false);
  const [editingId, setEditingId] = useState<Id<"invoices"> | null>(null); 

  const availableCountries = useMemo(() => {
    if (!leads) return ['LB', 'KSA', 'UAE', 'QA', 'OM', 'KW'];
    const countries = leads.map(l => l.country).filter(Boolean);
    const uniqueCountries = Array.from(new Set(countries));
    return uniqueCountries.length > 0 ? uniqueCountries : ['LB', 'KSA', 'UAE', 'QA', 'OM', 'KW'];
  }, [leads]);

  const [country, setCountry] = useState('LB');
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('USDT');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [deliveryCompanyFees, setDeliveryCompanyFees] = useState(''); 
  const [preSentMoney, setPreSentMoney] = useState('');

  useEffect(() => {
    if (availableCountries.length > 0 && country === 'LB' && !availableCountries.includes('LB')) {
      setCountry(availableCountries[0] || 'LB');
    }
  }, [availableCountries, country]);

  // ✅ ZEDNA PRODUCTS F L-LOADING GUARD
  if (dbInvoices === undefined || leads === undefined || products === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9b00ff]" />
      </div>
    );
  }

  // ================= ACTIONS =================
  const openInvoice = (inv: any) => {
    setSelectedInvoice(inv);
    setView('detail');
  };

  const handleOpenCreateModal = () => {
    setEditingId(null); 
    setCountry(availableCountries[0] || 'LB');
    setPaymentMethod('USDT'); setPaymentDetails(''); setDeliveryCompanyFees(''); setPreSentMoney('');
    setShowModal(true);
  };

  const setupEditForm = (inv: any) => {
    const invData = inv.details || inv;
    setEditingId(inv._id);
    setCountry(inv.country || invData.country);
    setStartDate(invData.startDate ? new Date(invData.startDate).toISOString().split('T')[0] : '');
    setEndDate(invData.endDate ? new Date(invData.endDate).toISOString().split('T')[0] : '');
    setPaymentMethod(invData.paymentMethod || 'USDT');
    setPaymentDetails(invData.paymentDetails || '');
    setDeliveryCompanyFees(invData.deliveryCompanyFees?.toString() || '');
    setPreSentMoney(invData.preSentMoney?.toString() || '');
  };

  const handleOpenEditModal = () => {
    if (!selectedInvoice) return;
    setupEditForm(selectedInvoice);
    setShowModal(true);
  };

  const handleEditClick = (e: React.MouseEvent, inv: any) => {
    e.stopPropagation(); 
    setSelectedInvoice(inv);
    setupEditForm(inv);
    setShowModal(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: Id<"invoices">) => {
    e.stopPropagation(); 
    if (confirm('Are you sure you want to delete this invoice?')) {
      setIsPending(true);
      try {
        await deleteInvoiceMutation({ id });
      } catch (err) {
        console.error(err);
      } finally {
        setIsPending(false);
      }
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    
    const isDuplicate = dbInvoices.some(inv => {
      const invData = inv.details || inv;
      const invC = inv.country || invData.country;
      const invS = invData.startDate ? new Date(invData.startDate).toISOString().split('T')[0] : '';
      const invE = invData.endDate ? new Date(invData.endDate).toISOString().split('T')[0] : '';
      if (editingId && inv._id === editingId) return false; 
      return invC === country && invS === startDate && invE === endDate;
    });

    if (isDuplicate) {
      setIsPending(false);
      return alert(`An invoice for ${country} between ${startDate} and ${endDate} already exists!`);
    }

    const sDate = new Date(startDate).getTime();
    const eDate = new Date(endDate); 
    eDate.setHours(23, 59, 59, 999);
    const endDateTime = eDate.getTime();

    const periodLeads = leads.filter((l: any) => {
      const d = l._creationTime;
      return l.country === country && 
             (l.status?.toLowerCase().includes('deliver')) && 
             d >= sDate && d <= endDateTime;
    });

    if (periodLeads.length === 0) {
      setIsPending(false);
      return alert(`No DELIVERED leads found for ${country} between these dates!`);
    }

    let totalLeadsCount = 0;
    let subtotal = 0;
    const itemsList: any[] = [];
    const prodMap = new Map(); 

periodLeads.forEach((l: any, index: number) => {
       const qty = l.quantity || 1;
       totalLeadsCount += 1; 
       
       // ✅ N-QELLBOU 3LA S-SMIYA F PRODUCTS
       const matchedProduct = products.find((p: any) => p._id === l.productId);
       const pName = matchedProduct?.name || 'Unknown Product';
       
       // ❌ 7IYEDNA matchedProduct?.price MN HNA 7IT MS7NAHA MN DB
       const sellPrice = Number(l.sellingPrice) || Number(l.price) || 0; 
       
       const itemTotal = sellPrice * qty;
       subtotal += itemTotal;

       if(prodMap.has(pName)) {
          prodMap.get(pName).qty += 1; 
          prodMap.get(pName).amount += itemTotal;
       } else {
          prodMap.set(pName, { name: pName, qty: 1, amount: itemTotal });
       }

       itemsList.push({
         leadId: l._id,
         name: pName,
         price: sellPrice,
         qty: qty
       });
    });

    const productsSnapshot = { 
      summary: Array.from(prodMap.values()), 
      items: itemsList 
    };

    const aymanFeesAuto = totalLeadsCount * 9.00;
    const eFeesAuto = paymentMethod === 'USDT' ? (subtotal * 0.03) : 0;
    const dFees = parseFloat(deliveryCompanyFees) || 0;
    const pMoney = parseFloat(preSentMoney) || 0;

    const finalAmount = subtotal - aymanFeesAuto - dFees - pMoney - eFeesAuto;

    const detailsObject = {
      country, startDate, endDate, paymentMethod, paymentDetails,
      leadsCount: totalLeadsCount, amount: finalAmount, subtotal,
      aymanFees: aymanFeesAuto, exchangeFees: eFeesAuto, deliveryCompanyFees: dFees, preSentMoney: pMoney,
      productsSnapshot
    };

    try {
      if (editingId) {
         await updateInvoiceMutation({
            id: editingId,
            amount: finalAmount,
            country,
            details: detailsObject
         });
         setSelectedInvoice({ ...selectedInvoice, amount: finalAmount, country, details: detailsObject });
      } else {
         const invoiceNoStr = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
         await addInvoiceMutation({
            invoiceNo: invoiceNoStr,
            country,
            clientName: "Ayman",
            amount: finalAmount,
            status: "Pending",
            date: new Date().toISOString(),
            type: "Leads Output",
            details: detailsObject
         });
      }
      setShowModal(false);
    } catch(err) {
      console.error(err);
      alert("Failed to save invoice!");
    } finally {
      setIsPending(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedInvoice) return;
    setIsPending(true);
    try {
      await markPaidMutation({ id: selectedInvoice._id });
      setSelectedInvoice({ ...selectedInvoice, status: 'Paid', paidAt: Date.now() });
    } catch(err) {
       alert("Error marking as paid!");
    } finally {
      setIsPending(false);
    }
  };

  // ================= HELPERS =================
  const getInvData = (inv: any) => inv.details || inv; 

  const formatDate = (dateString: any) => {
    if (!dateString) return '---';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getProductsList = (inv: any) => {
    if (!inv) return [];
    const data = inv.details || inv;
    let snap = data.productsSnapshot;
    if (!snap) return [];
    if (typeof snap === 'string') { try { snap = JSON.parse(snap); } catch(e) { return []; } }
    if (snap.items && Array.isArray(snap.items)) return snap.items;
    if (Array.isArray(snap)) return snap;
    return [];
  };

  const getProductsSummary = (inv: any) => {
    if (!inv) return [];
    const data = inv.details || inv;
    let snap = data.productsSnapshot;
    if (!snap) return [];
    if (typeof snap === 'string') { try { snap = JSON.parse(snap); } catch(e) { return []; } }
    if (snap.summary && Array.isArray(snap.summary)) return snap.summary;
    return [];
  };

  const formatLeadId = (id: string) => {
    if (!id) return '---';
    return id.toString().slice(-6).toUpperCase();
  };

  // ================= VIEWS =================
  const GenerationModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Invoice' : 'Generate Invoice'}</h2>
          <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleGenerateInvoice} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Country *</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff] focus:ring-1 focus:ring-[#9b00ff]">
              {availableCountries.map((c: any) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Start Date *</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff] focus:ring-1 focus:ring-[#9b00ff]" /></div>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">End Date *</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff] focus:ring-1 focus:ring-[#9b00ff]" /></div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Payment Method *</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff] focus:ring-1 focus:ring-[#9b00ff]">
              <option value="USDT">USDT (Crypto)</option><option value="Wise">Wise</option><option value="Western Union">Western Union</option><option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div><label className="block text-xs font-bold text-gray-600 mb-1">Payment Details <span className="text-gray-400 font-normal">(Optional)</span></label><textarea value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} placeholder="e.g. Wallet address, Bank Account details..." rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff] focus:ring-1 focus:ring-[#9b00ff] resize-none" /></div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-[#9b00ff] mb-3 uppercase tracking-wider">Other Deductions (Optional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Delivery Company Fees</label>
                <input type="number" step="0.01" value={deliveryCompanyFees} onChange={(e) => setDeliveryCompanyFees(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff] focus:ring-1 focus:ring-[#9b00ff]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Pre-sent Money</label>
                <input type="number" step="0.01" value={preSentMoney} onChange={(e) => setPreSentMoney(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff] focus:ring-1 focus:ring-[#9b00ff]" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 italic">* Ayman's Fees ($9/order) and USDT Exchange Fees (3%) will be calculated automatically.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-[#9b00ff] hover:bg-purple-700 text-white font-bold rounded-lg text-sm transition-colors shadow-md">{isPending ? 'Saving...' : (editingId ? 'Update Invoice' : 'Generate')}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-12 bg-gray-50">
      
      <style dangerouslySetInnerHTML={{__html: ` 
        @page { margin: 0; size: auto; } 
        @media print { 
          body * { visibility: hidden; } 
          #printable-invoice, #printable-invoice * { visibility: visible; } 
          #printable-invoice { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            margin: 0; 
            padding: 20mm !important; 
            background: white; 
            box-shadow: none !important; 
          } 
        } 
      `}} />
      
      {showModal && <GenerationModal />}

      {/* ================= VIEW 1: INVOICES LIST ================= */}
      {view === 'list' && (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#1e1b4b]">Invoices</h1>
              <span className="bg-[#3b82f6] text-white text-xs font-bold px-2 py-0.5 rounded-full">{dbInvoices.length}</span>
            </div>
            <button onClick={handleOpenCreateModal} className="flex items-center gap-2 bg-[#9b00ff] hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Generate Invoice
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                  <th className="py-4 px-6">#</th>
                  <th className="py-4 px-6 text-center">Leads</th>
                  <th className="py-4 px-6 text-center">Amount</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Issued At</th>
                  <th className="py-4 px-6 text-center">Paid At</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dbInvoices.length === 0 && (<tr><td colSpan={7} className="py-8 text-center text-gray-400">No invoices generated yet.</td></tr>)}
                {dbInvoices.map((inv: any) => (
                  <tr key={inv._id} onClick={() => openInvoice(inv)} className="hover:bg-gray-50/80 transition-colors cursor-pointer group">
                    <td className="py-4 px-6 text-gray-500 font-medium flex items-center gap-2">
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-[#9b00ff] transition-colors" /> {inv.invoiceNo || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-center text-gray-600 font-medium">{getInvData(inv).leadsCount || 0}</td>
                    <td className="py-4 px-6 text-center font-bold text-[#10b981]">{inv.amount?.toFixed(2)}$</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-md text-[11px] font-bold tracking-wide ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>{inv.status}</span>
                    </td>
                    <td className="py-4 px-6 text-center text-gray-500 font-medium">
                      {inv._creationTime ? new Date(inv._creationTime).toISOString().replace('T', ' ').substring(0, 16) : '---'}
                    </td>
                    <td className="py-4 px-6 text-center text-gray-500 font-medium">
                      {inv.paidAt ? new Date(inv.paidAt).toISOString().replace('T', ' ').substring(0, 16) : '---'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'Paid' && (
                          <button onClick={(e) => handleEditClick(e, inv)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button disabled={isPending} onClick={(e) => handleDeleteClick(e, inv._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: INVOICE DETAIL ================= */}
      {view === 'detail' && selectedInvoice && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden max-w-5xl mx-auto mt-6">
            <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-500 hover:text-[#9b00ff] font-bold text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Invoices
            </button>
            <div className="flex gap-3">
              {selectedInvoice.status !== 'Paid' && (
                <button onClick={handleOpenEditModal} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-bold transition-all">
                  <Edit className="w-4 h-4" /> Edit
                </button>
              )}
              {selectedInvoice.status !== 'Paid' && (
                <button onClick={handleMarkAsPaid} disabled={isPending} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4" /> {isPending ? 'Marking...' : 'Mark as Paid'}
                </button>
              )}
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8 flex justify-center print:p-0 print:m-0">
            <div id="printable-invoice" className="bg-white w-full max-w-[210mm] min-h-[297mm] p-10 sm:p-14 shadow-2xl relative print:shadow-none print:max-w-none text-gray-800 font-sans">
              
              <div className="absolute top-0 left-0 w-full h-[6px] bg-[#3b82f6]"></div>

              <div className="flex justify-between items-start mb-12 mt-4">
                <div className="flex items-center gap-2 text-2xl font-bold text-[#3b82f6] tracking-wide">
                  <FileText className="w-6 h-6" /> ECOMLB
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">INVOICE</h2>
                  <p className="text-gray-600 font-medium">#{selectedInvoice.invoiceNo || 'N/A'}</p>
                </div>
              </div>

              <div className="mb-12 flex justify-between items-start">
                <div className="w-1/2">
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                    <span className="font-bold text-gray-800">To</span><span className="text-gray-600">{selectedInvoice.clientName || 'Ayman'}</span>
                    <span className="font-bold text-gray-800">Date Issued</span><span className="text-gray-600">{formatDate(selectedInvoice._creationTime)}</span>
                    <span className="font-bold text-gray-800">Date Range</span><span className="text-gray-600 uppercase text-xs">{formatDate(getInvData(selectedInvoice).startDate)} <span className="mx-2 text-gray-400">TO</span> {formatDate(getInvData(selectedInvoice).endDate)}</span>
                    <span className="font-bold text-gray-800">Country</span><span className="text-gray-600">{selectedInvoice.country || getInvData(selectedInvoice).country}</span>
                    <span className="font-bold text-gray-800">Leads</span><span className="text-gray-600">{getInvData(selectedInvoice).leadsCount}</span>
                    <span className="font-bold text-gray-800">Amount Due</span><span className="font-bold text-[#10b981]">{selectedInvoice.amount?.toFixed(2)}$</span>
                  </div>
                </div>
                <div className="w-1/2 text-right">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-1 inline-block">Products Summary</h4>
                  <div className="space-y-2 text-sm">
                    {getProductsSummary(selectedInvoice).map((prod: any, idx: number) => (
                      <div key={idx} className="flex justify-end gap-6 text-gray-600">
                        <span className="font-medium text-gray-800">{prod.name}</span>
                        <span className="bg-gray-100 text-gray-800 px-2 rounded font-bold">{prod.qty} orders</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-12">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-800 text-gray-900">
                      <th className="py-2 font-bold w-28"># (Lead ID)</th>
                      <th className="py-2 font-bold">Product</th>
                      <th className="py-2 font-bold text-center">Status</th>
                      <th className="py-2 font-bold text-right">Selling Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {getProductsList(selectedInvoice).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-3 text-gray-800 font-bold tracking-wider">{formatLeadId(item.leadId || `LD-${140040 + idx}`)}</td>
                        <td className="py-3 text-gray-800">{item.name || 'Unknown'}</td>
                        <td className="py-3 text-center">
                          <span className="bg-[#a855f7] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Delivered</span>
                        </td>
                        <td className="py-3 text-right text-gray-800">
                          {item.price ? Number(item.price).toFixed(2) : (item.amount ? Number(item.amount).toFixed(2) : '0.00')}$
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mt-16 break-inside-avoid text-sm">
                
                <div className="flex-1 max-w-sm">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Instructions</h4>
                  <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                    <p><span className="font-bold">Method:</span> {getInvData(selectedInvoice).paymentMethod}</p>
                    {getInvData(selectedInvoice).paymentDetails && (
                      <p className="mt-1 whitespace-pre-wrap"><span className="font-bold">Details:</span><br/>{getInvData(selectedInvoice).paymentDetails}</p>
                    )}
                  </div>
                </div>

                <div className="w-[300px]">
                  <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                    <span>Subtotal</span>
                    <span className="text-gray-800">{getInvData(selectedInvoice).subtotal?.toFixed(2)}$</span>
                  </div>

                  {getInvData(selectedInvoice).aymanFees > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                      <span>Ayman's Fees</span>
                      <span className="text-gray-800">-{getInvData(selectedInvoice).aymanFees?.toFixed(2)}$</span>
                    </div>
                  )}
                  
                  {getInvData(selectedInvoice).exchangeFees > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                      <span>USDT Exchange Fee</span>
                      <span className="text-gray-800">-{getInvData(selectedInvoice).exchangeFees?.toFixed(2)}$</span>
                    </div>
                  )}

                  {getInvData(selectedInvoice).deliveryCompanyFees > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                      <span>Delivery Fees</span>
                      <span className="text-gray-800">-{getInvData(selectedInvoice).deliveryCompanyFees?.toFixed(2)}$</span>
                    </div>
                  )}

                  {getInvData(selectedInvoice).preSentMoney > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                      <span>Pre-sent Money</span>
                      <span className="text-gray-800">-{getInvData(selectedInvoice).preSentMoney?.toFixed(2)}$</span>
                    </div>
                  )}

                  <div className="flex justify-between py-4 text-base font-bold text-gray-900">
                    <span>Total Due</span>
                    <span className="text-[#10b981]">{selectedInvoice.amount?.toFixed(2)}$</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 right-10 text-xs text-gray-400 font-medium print:block">
                Page 1 of 1
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}