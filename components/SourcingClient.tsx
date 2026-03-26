"use client";

import { useState } from 'react';
import { Plus, X, Package, Eye, Calendar, DollarSign, Truck, ClipboardList, Edit, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from '@/convex/_generated/dataModel';

export default function SourcingClient() {
  const sourcings = useQuery(api.sourcing.getSourcings);
  const products = useQuery(api.products.getProducts);
  
  // 🪄 Mutations
  const addSourcingMutation = useMutation(api.sourcing.addSourcing);
  const updateSourcingMutation = useMutation(api.sourcing.updateSourcing); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSourcing, setSelectedSourcing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<Id<"sourcings"> | null>(null);

  const defaultForm = {
    productId: '', productLink: '', supplier: 'Alibaba - Evelyn',
    paymentStatus: 'Fully Paid', paymentMethod: 'Wise',
    sourcingCountry: 'China', destination: 'Lebanon',
    shippingMethod: 'Air', shippingCompany: '', trackingNumber: '', // ✅ Kayna hna
    quantity: '', qtyReceived: '', costPrice: '', amount: '', weight: '',
    status: 'InProgress', orderDate: new Date().toISOString().split('T')[0],
    shippedDate: '', receivedDate: '', note: '',
  };
  
  const [formData, setFormData] = useState(defaultForm);

  if (sourcings === undefined || products === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Shipped': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Canceled': return 'bg-red-100 text-red-700 border border-red-200';
      case 'InProgress': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateShippingTime = (shipped: number | undefined, received: number | undefined) => {
    if (!shipped || !received) return "N/A";
    const diffDays = Math.ceil(Math.abs(received - shipped) / (1000 * 60 * 60 * 24));
    return `${diffDays} Days`;
  };

  const openDetails = (sourcing: any) => {
    setSelectedSourcing(sourcing);
    setIsDetailsOpen(true);
  };

  const openEdit = (sourcing: any) => {
    const formatDate = (timestamp?: number) => timestamp ? new Date(timestamp).toISOString().split('T')[0] : '';
    
    setFormData({
      ...sourcing,
      quantity: sourcing.quantity.toString(),
      qtyReceived: sourcing.qtyReceived ? sourcing.qtyReceived.toString() : '',
      costPrice: sourcing.costPrice.toString(),
      amount: sourcing.amount.toString(),
      weight: sourcing.weight ? sourcing.weight.toString() : '',
      trackingNumber: sourcing.trackingNumber || '', // ✅ T2ekkedna mnha hna
      orderDate: formatDate(sourcing.orderDate),
      shippedDate: formatDate(sourcing.shippedDate),
      receivedDate: formatDate(sourcing.receivedDate),
      note: sourcing.note || '',
    });
    setEditingId(sourcing._id);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) return alert("Please select a product!");
    
    setIsLoading(true);

    const payload = {
      productId: formData.productId as Id<"products">,
      productLink: formData.productLink,
      supplier: formData.supplier,
      paymentStatus: formData.paymentStatus,
      paymentMethod: formData.paymentMethod,
      sourcingCountry: formData.sourcingCountry,
      destination: formData.destination,
      shippingMethod: formData.shippingMethod,
      shippingCompany: formData.shippingCompany,
      trackingNumber: formData.trackingNumber, // ✅ Kat-ssifet hna
      quantity: Number(formData.quantity),
      qtyReceived: formData.qtyReceived ? Number(formData.qtyReceived) : undefined,
      costPrice: Number(formData.costPrice),
      amount: Number(formData.amount),
      weight: formData.weight ? Number(formData.weight) : undefined,
      status: formData.status,
      orderDate: new Date(formData.orderDate).getTime(),
      shippedDate: formData.shippedDate ? new Date(formData.shippedDate).getTime() : undefined,
      receivedDate: formData.receivedDate ? new Date(formData.receivedDate).getTime() : undefined,
      note: formData.note,
    };

    try {
      if (editingId) {
        await updateSourcingMutation({ id: editingId, ...payload });
      } else {
        await addSourcingMutation(payload);
      }
      setIsModalOpen(false);
      setFormData(defaultForm);
    } catch (error) {
      console.error(error);
      alert("Error saving sourcing entry.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPricePerUnit = (sourcing: any) => {
    if (!sourcing) return "0.00";
    const divisor = sourcing.qtyReceived && sourcing.qtyReceived > 0 ? sourcing.qtyReceived : sourcing.quantity;
    return (sourcing.amount / divisor).toFixed(2);
  };

  // ✅ Zidna njibou Smiyat d-produit bach t-ban f t-tabel
  const getProductName = (pId: string) => {
     const p = products.find((prod: any) => prod._id === pId);
     return p ? p.name : 'Unknown Product';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">Sourcing Data Entry</h1>
          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">{sourcings.length} Orders</span>
        </div>
        <button 
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#9b00ff] hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Sourcing Order
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="py-4 px-4 font-semibold">Product</th>
                <th className="py-4 px-4 font-semibold">Destination</th>
                <th className="py-4 px-4 font-semibold">Supplier</th>
                <th className="py-4 px-4 font-semibold">Freight</th>
                <th className="py-4 px-4 font-semibold">Qty</th>
                <th className="py-4 px-4 font-semibold">Amount</th>
                <th className="py-4 px-4 font-semibold">Order Date</th>
                <th className="py-4 px-4 font-semibold">Status</th>
                <th className="py-4 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sourcings.map((s: any) => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-800">{getProductName(s.productId)}</td>
                  <td className="py-3 px-4 text-gray-600">{s.destination}</td>
                  <td className="py-3 px-4 text-gray-600">{s.supplier}</td>
                  <td className="py-3 px-4 text-gray-600 font-medium">{s.shippingMethod}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">{s.quantity}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">${s.amount}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(s.orderDate).toLocaleDateString('en-GB')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${getStatusBadge(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-all" title="Edit">
                        <Edit className="w-4 h-4 mx-auto" />
                      </button>
                      <button onClick={() => openDetails(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="Details">
                        <Eye className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sourcings.length === 0 && (
                <tr><td colSpan={9} className="py-10 text-center text-gray-500">No sourcing data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 relative my-auto animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
              <Package className="w-5 h-5 text-purple-600" /> 
              {editingId ? "Update Sourcing Status" : "Create New Sourcing Order"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Product <span className="text-red-500">*</span></label>
                  <select required value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none">
                    <option value="">Select a product...</option>
                    {products.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Destination</label>
                  <input type="text" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier</label>
                  <input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className={`w-full px-3 py-2 border border-gray-200 rounded-lg outline-none font-bold ${formData.status === 'Delivered' ? 'text-emerald-600' : formData.status === 'Shipped' ? 'text-blue-600' : 'text-yellow-600'}`}>
                    <option value="InProgress">InProgress</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Order Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={formData.orderDate} onChange={(e) => setFormData({...formData, orderDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Shipped Date</label>
                  <input type="date" value={formData.shippedDate} onChange={(e) => setFormData({...formData, shippedDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Received Date</label>
                  <input type="date" value={formData.receivedDate} onChange={(e) => setFormData({...formData, receivedDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Freight (Method)</label>
                  <select value={formData.shippingMethod} onChange={(e) => setFormData({...formData, shippingMethod: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none">
                    <option value="Air">Air</option>
                    <option value="Sea">Sea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Shipping Company</label>
                  <input type="text" value={formData.shippingCompany} onChange={(e) => setFormData({...formData, shippingCompany: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                
                {/* ✅ ZEDNA TRACKING NUMBER HNA */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tracking Number</label>
                  <input type="text" placeholder="e.g. YT12345..." value={formData.trackingNumber} onChange={(e) => setFormData({...formData, trackingNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity Ordered <span className="text-red-500">*</span></label>
                  <input type="number" min="1" required value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Qty Received</label>
                  <input type="number" min="0" value={formData.qtyReceived} onChange={(e) => setFormData({...formData, qtyReceived: e.target.value})} placeholder="After check" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cost Price ($) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" required value={formData.costPrice} onChange={(e) => setFormData({...formData, costPrice: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Total Amount ($) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-emerald-50 text-emerald-700 font-bold" />
                </div>
                <div className="md:col-span-3 border-t border-gray-100 pt-4 mt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Remarks</label>
                  <textarea 
                    value={formData.note} 
                    onChange={(e) => setFormData({...formData, note: e.target.value})} 
                    rows={3} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none resize-none bg-yellow-50/30"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-6 py-2.5 text-white bg-[#9b00ff] rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center gap-2">
                  {isLoading ? 'Saving...' : editingId ? 'Update Order' : 'Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS EYE MODAL */}
      {isDetailsOpen && selectedSourcing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#1a1d2d] p-5 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ClipboardList className="w-5 h-5" /> Sourcing Full Details
              </h2>
              <button onClick={() => setIsDetailsOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Product</p>
                  <p className="font-semibold text-gray-800">{getProductName(selectedSourcing.productId)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status</p>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusBadge(selectedSourcing.status)}`}>
                    {selectedSourcing.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Quantities</p>
                  <p className="text-sm text-gray-800"><span className="font-semibold">Ordered:</span> {selectedSourcing.quantity}</p>
                  <p className="text-sm text-gray-800 mt-1"><span className="font-semibold">Received:</span> {selectedSourcing.qtyReceived || 'Not yet'}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Financials</p>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-gray-800"><span className="font-semibold">Cost Price:</span> ${selectedSourcing.costPrice}</p>
                    <p className="text-sm text-gray-800 font-bold"><span className="text-gray-600 font-normal">Total Amount:</span> ${selectedSourcing.amount}</p>
                    <div className="mt-1 pt-1 border-t border-gray-100">
                      <p className="text-sm text-[#9b00ff] font-bold"><span className="text-gray-600 font-normal">Price / Unit:</span> ${getPricePerUnit(selectedSourcing)} <span className="text-[10px] text-gray-400 font-normal">{!selectedSourcing.qtyReceived ? '(Est)' : ''}</span></p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Truck className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-800">Shipping Info ({selectedSourcing.shippingMethod})</p>
                      <p className="text-xs text-gray-500 mt-0.5">{selectedSourcing.shippingCompany || 'Unknown Company'} | Trk: {selectedSourcing.trackingNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold uppercase">Shipping Time</p>
                    <p className="text-lg font-black text-[#9b00ff]">{calculateShippingTime(selectedSourcing.shippedDate, selectedSourcing.receivedDate)}</p>
                  </div>
                </div>

                <div className="col-span-2 relative pt-4 pb-2">
                  <div className="absolute top-[34px] left-[15%] right-[15%] h-[3px] bg-gray-200 z-0 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${selectedSourcing.receivedDate ? 'bg-emerald-400 w-full' : selectedSourcing.shippedDate ? 'bg-blue-400 w-1/2' : 'w-0'}`}></div>
                  </div>

                  <div className="flex justify-between text-center relative z-10">
                    <div className="flex flex-col items-center bg-white px-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border-[3px] border-white flex items-center justify-center mb-2 shadow-sm">
                        <Calendar className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Order Date</p>
                      <p className="text-sm font-semibold text-gray-800">{new Date(selectedSourcing.orderDate).toLocaleDateString('en-GB')}</p>
                    </div>

                    <div className="flex flex-col items-center bg-white px-4">
                      <div className={`w-10 h-10 rounded-full ${selectedSourcing.shippedDate ? 'bg-blue-100' : 'bg-gray-50'} border-[3px] border-white flex items-center justify-center mb-2 shadow-sm transition-colors`}>
                        <Truck className={`w-4 h-4 ${selectedSourcing.shippedDate ? 'text-blue-600' : 'text-gray-300'}`} />
                      </div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Shipped</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedSourcing.shippedDate ? new Date(selectedSourcing.shippedDate).toLocaleDateString('en-GB') : '-'}</p>
                    </div>

                    <div className="flex flex-col items-center bg-white px-4">
                      <div className={`w-10 h-10 rounded-full ${selectedSourcing.receivedDate ? 'bg-emerald-100' : 'bg-gray-50'} border-[3px] border-white flex items-center justify-center mb-2 shadow-sm transition-colors`}>
                        <Package className={`w-4 h-4 ${selectedSourcing.receivedDate ? 'text-emerald-600' : 'text-gray-300'}`} />
                      </div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Received</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedSourcing.receivedDate ? new Date(selectedSourcing.receivedDate).toLocaleDateString('en-GB') : '-'}</p>
                    </div>
                  </div>
                </div>
                {selectedSourcing.note && (
                  <div className="col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-100 mt-2">
                    <p className="text-xs text-yellow-800 font-bold uppercase tracking-wider mb-1">Notes & Remarks</p>
                    <p className="text-sm text-yellow-900 whitespace-pre-wrap">{selectedSourcing.note}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-right">
              <button onClick={() => setIsDetailsOpen(false)} className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-md hover:bg-gray-100 transition-colors shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}