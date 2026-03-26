"use client";

import { useMemo, useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DollarSign, Package, Clock, Truck, TrendingUp, CalendarDays, Filter, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

export default function SourcingDashboardClient() {
  // 🪄 Convex Query
  const sourcings = useQuery(api.sourcing.getSourcings);

  // 🎛️ States dyal l'Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');

  // 🧠 L'Mokh dyal l'7ssab (✅ TLE3NAH L-FOUQ 9BEL L-LOADING)
  const stats = useMemo(() => {
    // 🚨 GUARD: Ila kant d-data baqa ma-jatsh, red hssab khawi bach useMemo ma-ybkich
    if (!sourcings) {
      return { requests: 0, totalCost: '0.00', totalQty: 0, avgProcessing: 0, avgShipping: 0, chartData: [], productBreakdown: [] };
    }

    let totalCost = 0;
    let totalQty = 0;
    let totalProcessingDays = 0;
    let processingCount = 0;
    let totalShippingDays = 0;
    let shippingCount = 0;
    
    const chartData: any[] = [];
    const productStatsMap = new Map(); 

    const filteredSourcings = sourcings.filter((s: any) => {
      let match = true;
      if (dateFrom && s.orderDate < new Date(dateFrom).getTime()) match = false;
      if (dateTo && s.orderDate > new Date(dateTo).getTime()) match = false;
      if (selectedCountry && s.destination !== selectedCountry) match = false;
      if (selectedProduct && s.productId !== selectedProduct) match = false;
      if (selectedSupplier && s.supplier !== selectedSupplier) match = false;
      if (selectedPayment && s.paymentStatus !== selectedPayment) match = false;
      if (selectedMethod && s.shippingMethod !== selectedMethod) match = false;
      return match;
    });

    filteredSourcings.forEach((s: any) => {
      totalCost += s.amount || 0;
      totalQty += s.quantity || 0;

      let pTime = null;
      let sTime = null;

      if (s.orderDate && s.shippedDate) {
        const days = Math.max(0, Math.ceil((s.shippedDate - s.orderDate) / (1000 * 60 * 60 * 24)));
        totalProcessingDays += days;
        processingCount++;
        pTime = days;
      }

      if (s.shippedDate && s.receivedDate) {
        const days = Math.max(0, Math.ceil((s.receivedDate - s.shippedDate) / (1000 * 60 * 60 * 24)));
        totalShippingDays += days;
        shippingCount++;
        sTime = days;
      }

      const isSea = s.shippingMethod === 'Sea';
      const targetDays = isSea ? 60 : 15;
      const worstCaseDays = isSea ? 75 : 25; 

      chartData.push({
        name: s.productName || 'Unknown',
        date: new Date(s.orderDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        ProcessingTime: pTime,
        ShippingTime: sTime,
        TargetShipping: targetDays,
        WorstCase: worstCaseDays,
        Method: s.shippingMethod
      });

      const pName = s.productName || 'Unknown';
      if (!productStatsMap.has(pName)) {
        productStatsMap.set(pName, { name: pName, totalQty: 0, totalCost: 0 });
      }
      const pData = productStatsMap.get(pName);
      pData.totalQty += s.quantity || 0;
      pData.totalCost += s.amount || 0;
    });

    const productBreakdown = Array.from(productStatsMap.values()).sort((a, b) => b.totalQty - a.totalQty);

    return {
      requests: filteredSourcings.length,
      totalCost: totalCost.toFixed(2),
      totalQty,
      avgProcessing: processingCount > 0 ? (totalProcessingDays / processingCount).toFixed(1) : 0,
      avgShipping: shippingCount > 0 ? (totalShippingDays / shippingCount).toFixed(1) : 0,
      chartData,
      productBreakdown
    };
  }, [sourcings, dateFrom, dateTo, selectedCountry, selectedProduct, selectedSupplier, selectedPayment, selectedMethod]);

  // ✅ L-LOADING Hbet l-te7t (Ta7t ga3 l-Hooks)
  if (sourcings === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const countries = Array.from(new Set(sourcings.map((s: any) => s.destination).filter(Boolean)));
  const products = Array.from(new Map(sourcings.map((s: any) => [s.productId, s.productName])).entries());
  const suppliers = Array.from(new Set(sourcings.map((s: any) => s.supplier).filter(Boolean)));
  const paymentStatuses = Array.from(new Set(sourcings.map((s: any) => s.paymentStatus).filter(Boolean)));
  const sourcingMethods = Array.from(new Set(sourcings.map((s: any) => s.shippingMethod).filter(Boolean)));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="bg-[#1a1d2d] p-2 rounded-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Sourcing Dashboard & Analytics</h1>
      </div>

      {/* 🎛️ Horizontal Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-purple-600" />
          <span className="font-bold text-gray-700 text-sm">Filter Analytics</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 h-9">
            <span className="text-xs font-semibold text-gray-500">From</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent text-sm outline-none text-gray-700 w-28" />
            <span className="text-xs font-semibold text-gray-300">|</span>
            <span className="text-xs font-semibold text-gray-500">To</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent text-sm outline-none text-gray-700 w-28" />
          </div>

          <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-purple-400">
            <option value="">All Countries</option>
            {countries.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-purple-400 max-w-[150px]">
            <option value="">All Products</option>
            {products.map(([id, name]: any) => <option key={id} value={id}>{name}</option>)}
          </select>

          <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-purple-400">
            <option value="">All Suppliers</option>
            {suppliers.map((s: any) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-purple-400">
            <option value="">All Payment Status</option>
            {paymentStatuses.map((p: any) => <option key={p} value={p}>{p}</option>)}
          </select>

          <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-purple-400">
            <option value="">All Methods (Freight)</option>
            {sourcingMethods.map((m: any) => <option key={m} value={m}>{m}</option>)}
          </select>

          <button 
            onClick={() => { setDateFrom(''); setDateTo(''); setSelectedCountry(''); setSelectedProduct(''); setSelectedSupplier(''); setSelectedPayment(''); setSelectedMethod(''); }}
            className="h-9 px-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg text-sm font-bold transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 📊 Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#eff6ff] border border-[#bfdbfe] text-blue-900 p-5 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md">
          <CalendarDays className="absolute -right-4 -bottom-4 w-20 h-20 text-[#bfdbfe] opacity-50" />
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Requests</p>
          <h3 className="text-3xl font-black relative z-10">{stats.requests}</h3>
        </div>
        <div className="bg-[#eff6ff] border border-[#bfdbfe] text-blue-900 p-5 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md">
          <Package className="absolute -right-4 -bottom-4 w-20 h-20 text-[#bfdbfe] opacity-50" />
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Quantity</p>
          <h3 className="text-3xl font-black relative z-10">{stats.totalQty}</h3>
        </div>
        <div className="bg-[#eff6ff] border border-[#bfdbfe] text-blue-900 p-5 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md">
          <DollarSign className="absolute -right-4 -bottom-4 w-20 h-20 text-[#bfdbfe] opacity-50" />
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Total Cost</p>
          <h3 className="text-3xl font-black relative z-10">${stats.totalCost}</h3>
        </div>
        <div className="bg-[#eff6ff] border border-[#bfdbfe] text-blue-900 p-5 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md">
          <Clock className="absolute -right-4 -bottom-4 w-20 h-20 text-[#bfdbfe] opacity-50" />
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Processing Time</p>
          <div className="flex items-baseline gap-1 relative z-10">
            <h3 className="text-3xl font-black">{stats.avgProcessing}</h3>
            <span className="text-xs text-blue-500 font-bold">Days</span>
          </div>
        </div>
        <div className="bg-[#eff6ff] border border-[#bfdbfe] text-blue-900 p-5 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-md">
          <Truck className="absolute -right-4 -bottom-4 w-20 h-20 text-[#bfdbfe] opacity-50" />
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1 relative z-10">Shipping Time</p>
          <div className="flex items-baseline gap-1 relative z-10">
            <h3 className="text-3xl font-black">{stats.avgShipping}</h3>
            <span className="text-xs text-blue-500 font-bold">Days</span>
          </div>
        </div>
      </div>

      {/* Charts Area 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Time vs Target */}
        <div className="bg-[#2a2d3e] p-5 rounded-xl border border-gray-800 shadow-lg">
          <h3 className="text-md font-bold text-gray-200 mb-6 text-center tracking-wider">SHIPPING TIME - TARGET VS REAL</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
                <XAxis dataKey="date" tick={{fontSize: 11, fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 11, fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#fff', borderRadius: '8px'}} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                <Line type="step" dataKey="TargetShipping" name="Target Days" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="step" dataKey="WorstCase" name="Worst Case (Limit)" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                <Line type="monotone" dataKey="ShippingTime" name="Real Shipping Days" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Time Evolution */}
        <div className="bg-[#2a2d3e] p-5 rounded-xl border border-gray-800 shadow-lg">
          <h3 className="text-md font-bold text-gray-200 mb-6 text-center tracking-wider">PROCESSING TIME EVOLUTION</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProcess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
                <XAxis dataKey="date" tick={{fontSize: 11, fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 11, fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#fff', borderRadius: '8px'}} />
                <Area type="monotone" dataKey="ProcessingTime" name="Processing Days" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorProcess)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Area 2 */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-md font-bold text-gray-800 mb-6">FILTERED PRODUCTS BREAKDOWN (QTY & COST)</h3>
        <div className="h-[300px] w-full">
          {stats.productBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.productBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="totalQty" name="Total Quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar yAxisId="right" dataKey="totalCost" name="Total Cost ($)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex h-full items-center justify-center text-gray-400 text-sm font-medium">
               No product data found for selected filters.
             </div>
          )}
        </div>
      </div>

    </div>
  );
}