"use client";

import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Package, CheckCircle, Clock, XCircle, Truck, RefreshCw, Box, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DashboardClient() {
  // 🪄 Convex Queries
  const leads = useQuery(api.leads.getLeads);
  const products = useQuery(api.products.getProducts);
  const sourcings = useQuery(api.sourcing.getSourcings); 

  const [timeFilter, setTimeFilter] = useState('All Time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [globalProductId, setGlobalProductId] = useState('all'); 

  // 🧠 1. Filtrage dyal l-Waqt w l-Produits
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - (7 * 86400000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let result = leads;

    // 🎯 Product Filter
    if (globalProductId !== 'all') {
      result = result.filter((l: any) => l.productId === globalProductId);
    }

    // ⏳ Time Filter
    return result.filter((lead: any) => {
      const leadTime = lead._creationTime;
      switch (timeFilter) {
        case 'Today': return leadTime >= today;
        case 'Yesterday': return leadTime >= yesterday && leadTime < today;
        case 'Last 7 days': return leadTime >= sevenDaysAgo;
        case 'This month': return leadTime >= firstDayOfMonth;
        case 'Custom date':
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate).getTime();
            const end = new Date(customEndDate).getTime() + 86399999; // End of day
            return leadTime >= start && leadTime <= end;
          }
          return true; 
        default: return true; 
      }
    });
  }, [leads, timeFilter, customStartDate, customEndDate, globalProductId]);

  // 🧠 2. Calcul dyal l-KPIs w Net Profit w Products
  const stats = useMemo(() => {
    if (!filteredLeads || !products) return null;

    let confirmed = 0, pending = 0, cancelled = 0, delivered = 0, returned = 0;
    
    // Net Profit Variables
    let totalIncome = 0;
    let totalPrdCost = 0;
    let totalServiceFees = 0;

    const timelineDataMap: Record<string, { date: string, leads: number, confirmed: number, delivered: number, returned: number }> = {};
    const productStatsMap: Record<string, any> = {};

    filteredLeads.forEach((lead: any) => {
      const s = lead.status?.toLowerCase() || 'new';
      const qty = lead.quantity || 1;
      
      // 📊 Status Count
      if (['confirmed', 'shipped', 'delivered'].includes(s)) confirmed++;
      if (['new', 'no answer', 'pending'].includes(s)) pending++;
      if (['canceled', 'cancelled'].includes(s)) cancelled++;
      if (s === 'delivered') delivered++;
      if (['returned', 'rto'].includes(s)) returned++;

      // 📦 Product Table & Pie Chart Data
      const pId = lead.productId;
      if (pId) {
        if (!productStatsMap[pId]) {
          const prodInfo = products.find((p: any) => p._id === pId);
          productStatsMap[pId] = { 
            id: pId, 
            name: prodInfo?.name || 'Unknown', 
            image: prodInfo?.image || '',
            ordered: 0, 
            confirmed: 0, 
            delivered: 0,
            sold: 0 // ✅ ZEDNA L-QUANTITE LI T-BA3AT HNA
          };
        }
        productStatsMap[pId].ordered++;
        if (['confirmed', 'shipped', 'delivered'].includes(s)) productStatsMap[pId].confirmed++;
        if (s === 'delivered') {
          productStatsMap[pId].delivered++;
          productStatsMap[pId].sold += qty; // ✅ HNA KAN-ZIDOU L-QUANTITE D'BESSA7
        }
      }

      // 💰 Net Profit (Ghir Delivered)
      if (s === 'delivered') {
        const incomePerItem = Number(lead.sellingPrice) || Number(lead.price) || 0;
        totalIncome += incomePerItem * qty;

        totalServiceFees += 9.00; // 9$ l-kol commande fixe kima m-tafqin

        let prdCostPerItem = 0;
        if (sourcings && pId) {
          const productSourcings = sourcings
            .filter((src: any) => src.productId === pId && src.status === 'Delivered')
            .sort((a: any, b: any) => b._creationTime - a._creationTime);
          
          if (productSourcings.length > 0) {
            prdCostPerItem = Number(productSourcings[0].costPrice) || 0;
          }
        }
        // if (prdCostPerItem === 0) {
        //    const product = products.find((p: any) => p._id === pId);
        //    prdCostPerItem = Number(product?.price) || 0;
        // }

        totalPrdCost += prdCostPerItem * qty;
      }

      // 📈 Timeline Data
      const dateStr = new Date(lead._creationTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (!timelineDataMap[dateStr]) timelineDataMap[dateStr] = { date: dateStr, leads: 0, confirmed: 0, delivered: 0, returned: 0 };
      timelineDataMap[dateStr].leads++;
      if (['confirmed', 'shipped', 'delivered'].includes(s)) timelineDataMap[dateStr].confirmed++;
      if (s === 'delivered') timelineDataMap[dateStr].delivered++;
      if (['returned', 'rto'].includes(s)) timelineDataMap[dateStr].returned++;
    });

    const total = filteredLeads.length;
    const getPercent = (count: number) => total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
    
    const netProfit = totalIncome - totalPrdCost - totalServiceFees;

    const topProducts = Object.values(productStatsMap)
      .map((p: any) => ({
        ...p,
        confRate: p.ordered > 0 ? ((p.confirmed / p.ordered) * 100).toFixed(2) : "0.00",
        delvRate: p.ordered > 0 ? ((p.delivered / p.ordered) * 100).toFixed(2) : "0.00",
      }))
      .sort((a, b) => b.ordered - a.ordered); 

    const globalConfRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    const globalDelvRate = total > 0 ? Math.round((delivered / total) * 100) : 0; 

    return {
      total,
      confirmed: { count: confirmed, pct: getPercent(confirmed) },
      pending: { count: pending, pct: getPercent(pending) },
      cancelled: { count: cancelled, pct: getPercent(cancelled) },
      delivered: { count: delivered, pct: getPercent(delivered) },
      returned: { count: returned, pct: getPercent(returned) },
      netProfit, totalIncome, totalPrdCost, totalServiceFees,
      timelineData: Object.values(timelineDataMap),
      topProducts,
      globalConfRate,
      globalDelvRate
    };
  }, [filteredLeads, products, sourcings]);

  if (leads === undefined || products === undefined || sourcings === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filters = ['Today', 'Yesterday', 'Last 7 days', 'This month', 'All Time', 'Custom date'];
  const PIE_COLORS = ['#fb923c', '#34d399', '#f43f5e', '#60a5fa', '#a78bfa', '#fcd34d'];

  return (
    <div className="space-y-6 bg-gray-50/30 p-2 sm:p-4 rounded-xl">
      
      {/* 1. Header Filters (Dates & Global Product) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        
        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                timeFilter === f 
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f}
            </button>
          ))}

          {/* Custom Date Picker Fields */}
          {timeFilter === 'Custom date' && (
            <div className="flex items-center gap-2 animate-in fade-in ml-2">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs px-3 py-2 border border-blue-200 rounded-lg text-gray-600 bg-blue-50/50 outline-none"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs px-3 py-2 border border-blue-200 rounded-lg text-gray-600 bg-blue-50/50 outline-none"
              />
            </div>
          )}
        </div>

        {/* Global Product Filter */}
        <div className="w-full lg:w-64">
          <select 
            value={globalProductId}
            onChange={(e) => setGlobalProductId(e.target.value)}
            className="w-full px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg bg-gray-50 text-gray-700 outline-none focus:border-blue-500 shadow-sm"
          >
            <option value="all">📦 All Products Overview</option>
            {products.map((p: any) => (
              <option key={p._id} value={p._id}>{p.name} (sku: {p.sku.slice(-4)})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-blue-800">Leads</p>
            <h3 className="text-2xl font-black text-gray-900">{stats?.total || 0}</h3>
          </div>
          <div className="bg-blue-500 p-2.5 rounded-full text-white shadow-sm shadow-blue-200"><Package className="w-5 h-5" /></div>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-indigo-800 flex items-center gap-2">Confirmed <span className="text-[10px] text-indigo-500 font-bold bg-white px-1.5 py-0.5 rounded-md">({stats?.confirmed.pct}%)</span></p>
            <h3 className="text-2xl font-black text-gray-900">{stats?.confirmed.count || 0}</h3>
          </div>
          <div className="bg-indigo-500 p-2.5 rounded-full text-white shadow-sm shadow-indigo-200"><CheckCircle className="w-5 h-5" /></div>
        </div>

        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-orange-800 flex items-center gap-2">In Process <span className="text-[10px] text-orange-500 font-bold bg-white px-1.5 py-0.5 rounded-md">({stats?.pending.pct}%)</span></p>
            <h3 className="text-2xl font-black text-gray-900">{stats?.pending.count || 0}</h3>
          </div>
          <div className="bg-orange-500 p-2.5 rounded-full text-white shadow-sm shadow-orange-200"><Clock className="w-5 h-5" /></div>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">Delivered <span className="text-[10px] text-emerald-600 font-bold bg-white px-1.5 py-0.5 rounded-md">({stats?.delivered.pct}%)</span></p>
            <h3 className="text-2xl font-black text-gray-900">{stats?.delivered.count || 0}</h3>
          </div>
          <div className="bg-emerald-500 p-2.5 rounded-full text-white shadow-sm shadow-emerald-200"><Truck className="w-5 h-5" /></div>
        </div>

        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-red-800">Not Confirmed</p>
            <p className="text-[11px] text-red-500 font-bold mt-1">Canceled: {stats?.cancelled.count}</p>
          </div>
          <div className="bg-red-500 p-2.5 rounded-full text-white shadow-sm shadow-red-200"><XCircle className="w-5 h-5" /></div>
        </div>

        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-rose-800 flex items-center gap-2">Return <span className="text-[10px] text-rose-500 font-bold bg-white px-1.5 py-0.5 rounded-md">({stats?.returned.pct}%)</span></p>
            <h3 className="text-2xl font-black text-gray-900">{stats?.returned.count || 0}</h3>
          </div>
          <div className="bg-rose-500 p-2.5 rounded-full text-white shadow-sm shadow-rose-200"><RefreshCw className="w-5 h-5" /></div>
        </div>
      </div>

      {/* 3. Middle Section: Products Table & Net Profit/Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Products Table */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800">Products Performance</h3>
          <p className="text-xs text-gray-400 mb-6">Detailed view of your products' conversion</p>
          
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[11px] font-bold text-blue-500/70 uppercase border-b border-gray-100 sticky top-0 bg-white z-10">
                <tr>
                  <th className="py-3 px-2">Products</th>
                  <th className="py-3 px-2 text-center">Ordered</th>
                  <th className="py-3 px-2 text-center">Confirmed</th>
                  <th className="py-3 px-2 text-center">Delivered</th>
                  <th className="py-3 px-2 text-center text-teal-600">Sold</th>{/* ✅ ZEDNA L-ENTETE HNA */}
                  <th className="py-3 px-2 text-center">Delivery Rate</th>
                  <th className="py-3 px-2 text-center">Confirmation Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats?.topProducts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                        {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <Box className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-[13px] whitespace-normal line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-gray-400">sku: {p.id.slice(-6)}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-blue-400">{p.ordered}</td>
                    <td className="py-3 px-2 text-center font-bold text-indigo-400">{p.confirmed}</td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-400">{p.delivered}</td>
                    <td className="py-3 px-2 text-center font-bold text-teal-600">{p.sold}</td>{/* ✅ ZEDNA L-DATA HNA */}
                    <td className="py-3 px-2 text-center">
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-[11px]">{p.delvRate}%</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded text-[11px]">{p.confRate}%</span>
                    </td>
                  </tr>
                ))}
                {stats?.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">No data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Profit & Orders Rates */}
        <div className="space-y-4">
          
          {/* Net Profit Card */}
          <div className="bg-[#eaf4aa] p-5 rounded-xl border border-[#d6e27a] shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#6a7a10]">Net Profit :</h3>
                <p className="text-xs text-[#7d8e20]">(Delivered Orders {stats?.delivered.count})</p>
              </div>
              <h2 className="text-2xl font-black text-gray-900">{stats?.netProfit.toFixed(2)}$</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-2 border-t border-[#d6e27a]/50 pt-3">
              <div>
                <p className="text-[10px] text-[#7d8e20] font-bold">Total Income</p>
                <p className="text-[13px] font-bold text-gray-800">{stats?.totalIncome.toFixed(2)}$</p>
              </div>
              <div>
                <p className="text-[10px] text-[#7d8e20] font-bold">Total Service Fees</p>
                <p className="text-[13px] font-bold text-gray-800">{stats?.totalServiceFees.toFixed(2)}$</p>
              </div>
              <div>
                <p className="text-[10px] text-[#7d8e20] font-bold">Total Prd Cost</p>
                <p className="text-[13px] font-bold text-gray-800">{stats?.totalPrdCost.toFixed(2)}$</p>
              </div>
            </div>
          </div>

          {/* Orders Rates (Radial Semi-Circles) */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-800 w-full text-left mb-2">Orders Rates</h3>
            
            {/* Confirmation Rate Semi-Circle */}
            <div className="relative w-full h-[120px] flex justify-center overflow-hidden">
               <ResponsiveContainer width="100%" height="200%">
                <PieChart>
                  <Pie data={[{value: stats?.globalConfRate}, {value: 100 - (stats?.globalConfRate || 0)}]} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={75} dataKey="value" stroke="none">
                    <Cell fill="#e11d48" /> 
                    <Cell fill="#f1f5f9" /> 
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-2 flex flex-col items-center">
                <span className="text-2xl font-black text-gray-900">{stats?.globalConfRate}%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Confirmation Rate</span>
              </div>
            </div>

            {/* Delivery Rate Semi-Circle */}
            <div className="relative w-full h-[120px] flex justify-center overflow-hidden mt-2 border-t border-gray-50 pt-4">
               <ResponsiveContainer width="100%" height="200%">
                <PieChart>
                  <Pie data={[{value: stats?.globalDelvRate}, {value: 100 - (stats?.globalDelvRate || 0)}]} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={75} dataKey="value" stroke="none">
                    <Cell fill="#1e1b4b" /> 
                    <Cell fill="#f1f5f9" /> 
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-2 flex flex-col items-center">
                <span className="text-2xl font-black text-gray-900">{stats?.globalDelvRate}%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Delivery Rate</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Leads Timeline & Best Selling PieChart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leads Timeline (BarChart) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-md font-bold text-gray-800 mb-6">Leads timeline</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                <YAxis tick={{fontSize: 11, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                
                <Bar dataKey="leads" name="Leads" fill="#a78bfa" radius={[2, 2, 0, 0]} barSize={8} />
                <Bar dataKey="confirmed" name="Confirmed" fill="#fbbf24" radius={[2, 2, 0, 0]} barSize={8} />
                <Bar dataKey="delivered" name="Delivered" fill="#34d399" radius={[2, 2, 0, 0]} barSize={8} />
                <Bar dataKey="returned" name="Returned" fill="#f87171" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Selling Products (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
          <h3 className="text-md font-bold text-gray-800 w-full text-left mb-4">Best Selling Overview</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.topProducts.slice(0, 6)} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="sold" nameKey="name"> {/* ✅ ZEDNA HNA 'sold' f blast 'delivered' bach chart i-koun d9i9 */}
                  {stats?.topProducts.slice(0, 6).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full flex flex-col gap-2 mt-2">
            {stats?.topProducts.slice(0, 6).map((p: any, index: number) => (
              <div key={p.id} className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                  <span className="truncate max-w-[150px]">{p.name}</span>
                </div>
                <span>{p.sold} Sold</span> {/* ✅ ZEDNA HNA 'Sold' */}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}