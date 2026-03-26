"use client";

import { useState, useMemo } from 'react';
import { TrendingUp, Plus, Calendar, Search, Trash2, Loader2, Edit3, BarChart2, Activity, Filter, DollarSign, Target, ShoppingCart, Info, ListPlus, PieChart as PieIcon } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from '@/convex/_generated/dataModel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis, ComposedChart, PieChart, Pie } from 'recharts';

export default function DailyReportClient() {
  const products = useQuery(api.products.getProducts);
  const dailySpends = useQuery(api.reports.getDailySpends);
  const leads = useQuery(api.leads.getLeads);
  const sourcings = useQuery(api.sourcing.getSourcings);

  const addSpendMutation = useMutation(api.reports.addDailySpend);
  const deleteSpendMutation = useMutation(api.reports.deleteDailySpend);

  const [activeTab, setActiveTab] = useState('Daily'); 
  const [isPending, setIsPending] = useState(false); 
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [productId, setProductId] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [spend, setSpend] = useState('');
  const [leadsAd, setLeadsAd] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [note, setNote] = useState('');

  const [weeklyStartDate, setWeeklyStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0];
  });
  const [weeklyEndDate, setWeeklyEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualCash, setManualCash] = useState<Record<string, string>>({});
  
  const [monthlyPeriods, setMonthlyPeriods] = useState([
    { id: '1', start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] }
  ]);
  const [monthlyInputs, setMonthlyInputs] = useState<Record<string, any>>({});

  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  // ================= CALCULATIONS (L-FOUQ 9BEL RETURN) =================
  const productCostMap = useMemo(() => {
    const map = new Map();
    if (!products || !sourcings) return map; // ✅ Guard
    products.forEach((p: any) => {
      const pSourcings = sourcings.filter((s: any) => s.productId === p._id);
      let totalAmount = 0, totalReceivedQty = 0;
      pSourcings.forEach((s: any) => {
        totalAmount += (s.amount || 0);
        totalReceivedQty += ((s.qtyReceived && s.qtyReceived > 0) ? s.qtyReceived : (s.quantity || 0)); 
      });
      map.set(p._id, totalReceivedQty > 0 ? (totalAmount / totalReceivedQty) : 0);
    });
    return map;
  }, [products, sourcings]);

  const weeklyData = useMemo(() => {
    if (!products || !dailySpends || !leads) {
      return { data: [], totals: { spend: 0, leads: 0, cpl: 0, shipping: 0, sales: 0, sold: 0, cash: 0, expenses: 0, net: 0, profitOrder: 0, roas: 0 } };
    }

    const productMap = new Map();
    const start = new Date(weeklyStartDate); const end = new Date(weeklyEndDate); end.setHours(23, 59, 59, 999);
    
    products.forEach((p: any) => { 
      productMap.set(p._id, { id: p._id, name: p.name, cost: productCostMap.get(p._id) || 0, spend: 0, leadsAds: 0, leadsSystem: 0, confirmed: 0, nbrSales: 0, nbrSold: 0 }); 
    });
    
    dailySpends.forEach((s: any) => { 
      const d = new Date(s.date); 
      if (d >= start && d <= end && productMap.has(s.productId)) { 
        const p = productMap.get(s.productId); p.spend += s.spend; p.leadsAds += s.leads; 
      } 
    });
    
    leads.forEach((l: any) => { 
      const d = new Date(l._creationTime); 
      if (d >= start && d <= end && productMap.has(l.productId)) { 
        const p = productMap.get(l.productId); p.leadsSystem += 1; 
        const status = l.status?.toLowerCase() || ''; 
        if (status.includes('confirm') || status.includes('ship') || status.includes('deliver')) p.confirmed += 1; 
        if (status.includes('deliver')) { p.nbrSales += 1; p.nbrSold += (l.quantity || 1); } 
      } 
    });
    
    let tSpend = 0, tLeadsAd = 0, tSH = 0, tSales = 0, tSold = 0, tCash = 0, tExp = 0, tNet = 0;
    const result = Array.from(productMap.values()).filter(p => p.spend > 0 || p.leadsSystem > 0).map(p => {
      const cash = parseFloat(manualCash[p.id]) || 0; 
      const sellPrice = p.nbrSales > 0 ? (cash / p.nbrSales) : 0; 
      const cpl = p.leadsAds > 0 ? (p.spend / p.leadsAds) : 0; 
      const cpDelv = p.nbrSales > 0 ? (p.spend / p.nbrSales) : 0; 
      const shFee = p.nbrSales * 9.00; 
      const totalCogs = p.nbrSold * p.cost; 
      const totalExp = totalCogs + shFee + p.spend; 
      const netProfit = cash - totalExp; 
      const profitPerOrder = p.nbrSales > 0 ? (netProfit / p.nbrSales) : 0; 
      const roas = p.spend > 0 ? (cash / p.spend) : 0;
      tSpend += p.spend; tLeadsAd += p.leadsAds; tSH += shFee; tSales += p.nbrSales; tSold += p.nbrSold; tCash += cash; tExp += totalExp; tNet += netProfit;
      return { ...p, cash, sellPrice, cpl, cpDelv, shFee, totalExp, netProfit, profitPerOrder, roas };
    });
    return { data: result, totals: { spend: tSpend, leads: tLeadsAd, cpl: tLeadsAd > 0 ? tSpend/tLeadsAd : 0, shipping: tSH, sales: tSales, sold: tSold, cash: tCash, expenses: tExp, net: tNet, profitOrder: tSales > 0 ? tNet/tSales : 0, roas: tSpend > 0 ? (tCash / tSpend) : 0 } };
  }, [products, dailySpends, leads, productCostMap, weeklyStartDate, weeklyEndDate, manualCash]);

  const monthlyData = useMemo(() => {
    let grandTotals = { leads: 0, conf: 0, delv: 0, qty: 0, cash: 0, sh: 0, sal: 0, comm: 0, tr: 0, exp: 0, fees: 0, spend: 0, cogs: 0, totalExp: 0, net: 0 };
    
    if (!products || !dailySpends || !leads || !sourcings) {
      return { rows: [], totals: grandTotals, pieData: [] };
    }

    const rows = monthlyPeriods.map((period, index) => {
      const start = new Date(period.start); const end = new Date(period.end); end.setHours(23, 59, 59, 999);
      const periodLabel = period.start ? `${new Date(period.start).getDate()}/${new Date(period.start).getMonth()+1}` : `P${index+1}`;
      let pLeads = 0, pConfirmed = 0, pDelivered = 0, pQty = 0, pSpend = 0, pCogs = 0;

      if (period.start && period.end) {
        dailySpends.forEach((s: any) => { const d = new Date(s.date); if (d >= start && d <= end) pSpend += s.spend; });
        leads.forEach((l: any) => {
          const d = new Date(l._creationTime);
          if (d >= start && d <= end) {
            pLeads++;
            const status = l.status?.toLowerCase() || '';
            if (status.includes('confirm') || status.includes('ship') || status.includes('deliver')) pConfirmed++;
            if (status.includes('deliver')) { pDelivered++; const qty = l.quantity || 1; pQty += qty; pCogs += (productCostMap.get(l.productId) || 0) * qty; }
          }
        });
      }

      const inputs = monthlyInputs[period.id] || {};
      const cash = parseFloat(inputs.cash) || 0;
      const shipping = inputs.shipping !== undefined ? parseFloat(inputs.shipping) : (pDelivered * 9);
      const salary = parseFloat(inputs.salary) || 0;
      const commission = inputs.commission !== undefined ? parseFloat(inputs.commission) : (pDelivered * 0.5);
      const transFee = parseFloat(inputs.transFee) || 0;
      const expenses = parseFloat(inputs.expenses) || 0;

      const totalFees = shipping + salary + commission + transFee + expenses;
      const totalExp = totalFees + pSpend + pCogs;
      const netProfit = cash - totalExp;
      const roas = pSpend > 0 ? (cash / pSpend) : 0;

      grandTotals.leads += pLeads; grandTotals.conf += pConfirmed; grandTotals.delv += pDelivered; grandTotals.qty += pQty; grandTotals.cash += cash;
      grandTotals.sh += shipping; grandTotals.sal += salary; grandTotals.comm += commission; grandTotals.tr += transFee;
      grandTotals.exp += expenses; grandTotals.fees += totalFees; grandTotals.spend += pSpend; grandTotals.cogs += pCogs;
      grandTotals.totalExp += totalExp; grandTotals.net += netProfit;

      return { ...period, periodLabel, leads: pLeads, confirmed: pConfirmed, delivered: pDelivered, qty: pQty, cash, shipping, salary, commission, transFee, expenses, totalFees, spend: pSpend, cogs: pCogs, totalExp, netProfit, roas };
    });

    const pieData = [
      { name: 'Ads Spend', value: grandTotals.spend, color: '#f43f5e' },
      { name: 'Shipping', value: grandTotals.sh, color: '#8b5cf6' },
      { name: 'COGS', value: grandTotals.cogs, color: '#0ea5e9' },
      { name: 'Salaries & Comm', value: grandTotals.sal + grandTotals.comm, color: '#f59e0b' },
      { name: 'Other Fees', value: grandTotals.tr + grandTotals.exp, color: '#64748b' }
    ].filter(d => d.value > 0);

    return { rows, totals: grandTotals, pieData };
  }, [monthlyPeriods, monthlyInputs, dailySpends, leads, productCostMap]);

  // ✅ LOADING HNA L-TE7T (B3d l-Hooks kamlin)
  if (products === undefined || dailySpends === undefined || leads === undefined || sourcings === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9b00ff]" />
      </div>
    );
  }

  // ================= ACTIONS =================
  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return alert("Please select a product!");
    setIsPending(true);
    try {
      await addSpendMutation({
        date, 
        productId: productId as Id<"products">, 
        advertiser,
        spend: parseFloat(spend), 
        leads: parseInt(leadsAd), 
        maxCost: parseFloat(maxCost), 
        note
      });
      setSpend(''); setLeadsAd(''); setNote('');
    } catch(err) {
      console.error(err);
      alert("Error saving data.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id: Id<"dailyAdSpends">) => {
    if(confirm("Are you sure you want to delete this?")) {
      setIsPending(true);
      try {
        await deleteSpendMutation({ id });
      } catch(e) {
         console.error(e);
      } finally {
        setIsPending(false);
      }
    }
  };

  const addMonthlyPeriod = () => setMonthlyPeriods([...monthlyPeriods, { id: Date.now().toString(), start: '', end: '' }]);


  return (
    <div className="space-y-6 pb-12">
      {/* ================= TABS NAVIGATION ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-[#9b00ff]/10 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-[#9b00ff]" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Ads Performance & Cash Flow</h1>
        </div>
        <div className="flex items-center bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('Daily')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Daily' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Daily Tracker</button>
          <button onClick={() => setActiveTab('Weekly')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Weekly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Weekly Analytics</button>
          <button onClick={() => setActiveTab('Monthly')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'Monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Monthly P&L</button>
        </div>
      </div>

      {/* ================= 1. DAILY TAB ================= */}
      {activeTab === 'Daily' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#9b00ff]" /> Add Daily Spend</h3>
            <form onSubmit={handleAddReport} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
              <div className="lg:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Date</label><input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff]" /></div>
              <div className="lg:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Product</label><select required value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff]"><option value="">Select Product...</option>{products.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
              <div className="lg:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Advertiser</label><input type="text" required placeholder="e.g. TikTok" value={advertiser} onChange={(e) => setAdvertiser(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff]" /></div>
              <div className="lg:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Spend ($)</label><input type="number" step="0.01" required value={spend} onChange={(e) => setSpend(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff]" /></div>
              <div className="lg:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Leads</label><input type="number" required value={leadsAd} onChange={(e) => setLeadsAd(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff]" /></div>
              <div className="lg:col-span-1"><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Max Cost</label><input type="number" step="0.01" required value={maxCost} onChange={(e) => setMaxCost(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#9b00ff]" /></div>
              <div className="lg:col-span-1"><button type="submit" disabled={isPending} className="w-full py-2 bg-[#9b00ff] hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2">{isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</button></div>
            </form>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50"><h3 className="text-md font-bold text-gray-800">Daily Performance Tracking</h3></div>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-[11px] font-black tracking-wider"><tr><th className="py-3 px-4">Date</th><th className="py-3 px-4">Product</th><th className="py-3 px-4">Advertiser</th><th className="py-3 px-4 text-center">Leads</th><th className="py-3 px-4 text-right">Spend</th><th className="py-3 px-4 text-right">CPL</th><th className="py-3 px-4 text-center">Status</th><th className="py-3 px-4 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {dailySpends.length === 0 ? (<tr><td colSpan={8} className="text-center py-8 text-gray-400">No daily spend records found.</td></tr>) : (
                  dailySpends.map((r: any) => {
                    const cpl = r.leads > 0 ? (r.spend / r.leads) : r.spend; const isOverBudget = cpl > r.maxCost;
                    return (<tr key={r._id} className="hover:bg-gray-50"><td className="py-3 px-4">{new Date(r.date).toLocaleDateString('en-GB')}</td><td className="py-3 px-4 font-bold text-gray-800">{r.product?.name || 'Unknown'}</td><td className="py-3 px-4 text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold border border-gray-200">{r.advertiser}</span></td><td className="py-3 px-4 text-center font-bold text-gray-800">{r.leads}</td><td className="py-3 px-4 text-right font-medium text-gray-600">${r.spend.toFixed(2)}</td><td className={`py-3 px-4 text-right font-black ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>${cpl.toFixed(2)}</td><td className="py-3 px-4 text-center">{isOverBudget ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Exceeded</span> : <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">Good</span>}</td><td className="py-3 px-4 text-right"><button onClick={() => handleDelete(r._id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4 inline-block" /></button></td></tr>);
                  })
                )}
              </tbody></table>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. WEEKLY TAB ================= */}
      {activeTab === 'Weekly' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between bg-gray-50 gap-4">
              <h3 className="text-md font-bold text-gray-800">Weekly Product Analysis</h3>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-1.5 shadow-sm">
                <Calendar className="w-4 h-4 text-[#9b00ff]" />
                <input type="date" value={weeklyStartDate} onChange={(e) => setWeeklyStartDate(e.target.value)} className="bg-transparent text-sm font-bold text-gray-700 outline-none" />
                <span className="text-gray-400">to</span>
                <input type="date" value={weeklyEndDate} onChange={(e) => setWeeklyEndDate(e.target.value)} className="bg-transparent text-sm font-bold text-gray-700 outline-none" />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-center text-[13px] whitespace-nowrap">
                <thead>
                  <tr className="text-white font-bold tracking-wide"><th className="bg-[#a3e635] text-gray-800 py-2 border-r border-gray-200">PRODUCTS</th><th colSpan={2} className="bg-[#86efac] text-gray-800 py-2 border-r border-gray-200">DATA PRODUCTS</th><th colSpan={4} className="bg-[#93c5fd] text-gray-800 py-2 border-r border-gray-200">MONEY SPENT ON ADS</th><th className="bg-[#fca5a5] text-gray-800 py-2 border-r border-gray-200">SERVICE</th><th colSpan={2} className="bg-[#c4b5fd] text-gray-800 py-2 border-r border-gray-200">DATA SALES</th><th className="bg-[#10b981] text-white py-2 border-r border-emerald-600">INVOICE</th><th colSpan={4} className="bg-[#fdb462] text-gray-800 py-2">CALCULATE PROFIT</th></tr>
                  <tr className="bg-gray-100 text-gray-600 font-bold border-b-2 border-gray-200">
                    <th className="py-2 px-3 text-left border-r">Product Name</th><th className="py-2 px-3 border-r">Sell Price</th><th className="py-2 px-3 border-r">Cost</th><th className="py-2 px-3 border-r">Spend</th><th className="py-2 px-3 border-r">Leads</th><th className="py-2 px-3 border-r">CPL</th><th className="py-2 px-3 border-r">CP Delv</th><th className="py-2 px-3 border-r">SH (Fee)</th><th className="py-2 px-3 border-r">Nbr Sales</th><th className="py-2 px-3 border-r">Nbr Sold</th><th className="py-2 px-3 border-r bg-emerald-50 text-emerald-700">Cash ($)</th><th className="py-2 px-3 border-r text-red-600">Total Exp</th><th className="py-2 px-3 border-r">Net Profit</th><th className="py-2 px-3 border-r text-blue-600">ROAS</th><th className="py-2 px-3">Profit / Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {weeklyData.data.length === 0 ? (<tr><td colSpan={15} className="py-8 text-gray-400">No data for selected period.</td></tr>) : (
                    weeklyData.data.map((w, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 text-left font-bold text-gray-800 border-r">{w.name}</td><td className="py-2.5 px-3 border-r font-medium">${w.sellPrice.toFixed(2)}</td><td className="py-2.5 px-3 border-r font-medium">${w.cost.toFixed(2)}</td><td className="py-2.5 px-3 border-r">${w.spend.toFixed(2)}</td><td className="py-2.5 px-3 border-r font-bold">{w.leadsAds}</td><td className={`py-2.5 px-3 border-r font-bold ${w.cpl > 5 ? 'bg-red-500 text-white' : 'text-emerald-600'}`}>${w.cpl.toFixed(2)}</td><td className={`py-2.5 px-3 border-r font-bold ${w.cpDelv > 10 ? 'bg-red-500 text-white' : 'text-emerald-600'}`}>${w.cpDelv.toFixed(2)}</td><td className="py-2.5 px-3 border-r">${w.shFee.toFixed(2)}</td><td className="py-2.5 px-3 border-r font-bold text-blue-600">{w.nbrSales}</td><td className="py-2.5 px-3 border-r font-bold">{w.nbrSold}</td>
                        <td className="py-1.5 px-3 border-r bg-emerald-50/50"><input type="number" step="0.01" placeholder="0.00" value={manualCash[w.id] !== undefined ? manualCash[w.id] : ''} onChange={(e) => setManualCash({...manualCash, [w.id]: e.target.value})} className="w-20 bg-white border border-emerald-300 text-emerald-800 font-bold text-center rounded-md px-1 py-1 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" /></td>
                        <td className="py-2.5 px-3 border-r font-bold text-gray-500">${w.totalExp.toFixed(2)}</td><td className={`py-2.5 px-3 border-r font-black ${w.netProfit < 0 ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'}`}>${w.netProfit.toFixed(2)}</td><td className={`py-2.5 px-3 border-r font-black ${w.roas < 2 ? 'text-red-500' : 'text-blue-600'}`}>{w.roas.toFixed(2)}x</td><td className={`py-2.5 px-3 font-black ${w.profitPerOrder < 0 ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'}`}>${w.profitPerOrder.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHARTS WEEKLY */}
          {weeklyData.data.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-[#9b00ff]" /> Revenue vs Expenses vs Profit</h3>
                  <button onMouseEnter={() => setActiveInfo('w1')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-[#9b00ff]"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'w1' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">كيعطيك vision واضحة شكون المنتج لي رابح وشكون لي خاسر من خلال مقارنة المداخيل مع المصاريف.</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Legend wrapperStyle={{fontSize: '11px'}} />
                    <Bar dataKey="cash" name="Revenue ($)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="totalExp" name="Expenses ($)" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="netProfit" name="Profit ($)" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" /> ROAS (Return on Ad Spend) 👑</h3>
                  <button onMouseEnter={() => setActiveInfo('w2')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-amber-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'w2' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">هذا هو الملك 👑 ديال القرار: كيبين شحال كيرجع ليك ديال الفلوس على كل دولار خسرتيه فـ Ads.</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Line type="monotone" dataKey="roas" name="ROAS" stroke="#f59e0b" strokeWidth={3} dot={{r: 5, fill: '#f59e0b'}} activeDot={{r: 8}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Filter className="w-4 h-4 text-purple-500" /> Leads Funnel (Conversion)</h3>
                  <button onMouseEnter={() => setActiveInfo('w3')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-purple-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'w3' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">قمع المبيعات: باش تشوف Confirmation Rate و Delivery Rate.</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Legend wrapperStyle={{fontSize: '11px'}} />
                    <Bar dataKey="leadsSystem" name="Total Leads" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="confirmed" name="Confirmed" fill="#a855f7" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="nbrSales" name="Delivered" fill="#14b8a6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><DollarSign className="w-4 h-4 text-rose-500" /> CPL vs CP Delivery</h3>
                  <button onMouseEnter={() => setActiveInfo('w4')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-rose-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'w4' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">مقارنة بين تكلفة المبيعة فـ Ads (CPL) وتكلفة المبيعة الحقيقية بعد التوصيل (CP Delv).</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Legend wrapperStyle={{fontSize: '11px'}} />
                    <Bar dataKey="cpl" name="CPL ($)" fill="#fb923c" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="cpDelv" name="CP Delivery ($)" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Profit per Product</h3>
                  <button onMouseEnter={() => setActiveInfo('w5')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-emerald-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'w5' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">باش تعرف بسرعة شكون المنتجات الرابحة (Top winners) والخاسرة (Losers).</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={weeklyData.data} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis type="number" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} width={80} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Bar dataKey="netProfit" name="Net Profit ($)" radius={[0, 4, 4, 0]}>
                      {weeklyData.data.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.netProfit >= 0 ? '#10b981' : '#ef4444'} /> ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-pink-500" /> Volume vs Revenue</h3>
                  <button onMouseEnter={() => setActiveInfo('w6')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-pink-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'w6' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">واش هاد المنتج كيدخل الفلوس (الخط) حيت كتبيع منو حبات بزاف (الأعمدة)، ولا حيت الـ Margin ديالو عالي؟</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklyData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Legend wrapperStyle={{fontSize: '11px'}} />
                    <Bar yAxisId="left" dataKey="nbrSold" name="Volume (Nbr Sold)" fill="#f472b6" radius={[2, 2, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="cash" name="Revenue ($)" stroke="#be185d" strokeWidth={3} dot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ================= 3. MONTHLY P&L TAB ================= */}
      {activeTab === 'Monthly' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between bg-gray-50 gap-4">
              <div><h3 className="text-md font-bold text-gray-800">Monthly Profit & Loss (P&L)</h3><p className="text-xs text-gray-500 mt-1">Create custom date periods to aggregate your financials.</p></div>
              <button onClick={addMonthlyPeriod} className="flex items-center gap-2 bg-[#9b00ff] hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"><ListPlus className="w-4 h-4" /> Add Period Row</button>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-center text-[12px] whitespace-nowrap">
                <thead>
                  <tr className="text-white font-bold tracking-wide"><th className="bg-[#65a30d] py-2 border-r border-gray-200 min-w-[200px]">PERIOD RANGE</th><th colSpan={3} className="bg-[#3b82f6] py-2 border-r border-gray-200">DATA FROM SERVICE</th><th className="bg-[#10b981] py-2 border-r border-gray-200">CASH</th><th colSpan={5} className="bg-[#a855f7] py-2 border-r border-gray-200">TEAM & FEES (Manual Inputs)</th><th colSpan={2} className="bg-[#0ea5e9] py-2 border-r border-gray-200">ADS & COGS</th><th colSpan={2} className="bg-[#ef4444] py-2">CALCULATE PROFIT</th></tr>
                  <tr className="bg-gray-100 text-gray-600 font-bold border-b-2 border-gray-200 text-[11px]">
                    <th className="py-3 px-2 border-r text-left">Start Date to End Date</th><th className="py-3 px-2 border-r">Leads</th><th className="py-3 px-2 border-r">Delv.</th><th className="py-3 px-2 border-r">Stock Unites</th>
                    <th className="py-3 px-2 border-r bg-emerald-50 text-emerald-800"><Edit3 className="w-3 h-3 inline mr-1"/> Cash</th>
                    <th className="py-3 px-2 border-r bg-purple-50 text-purple-800"><Edit3 className="w-3 h-3 inline mr-1"/> Shipping</th><th className="py-3 px-2 border-r bg-purple-50 text-purple-800"><Edit3 className="w-3 h-3 inline mr-1"/> Salary</th><th className="py-3 px-2 border-r bg-purple-50 text-purple-800"><Edit3 className="w-3 h-3 inline mr-1"/> Comm.</th><th className="py-3 px-2 border-r bg-purple-50 text-purple-800"><Edit3 className="w-3 h-3 inline mr-1"/> Trans Fee</th><th className="py-3 px-2 border-r bg-purple-50 text-purple-800"><Edit3 className="w-3 h-3 inline mr-1"/> Expenses</th>
                    <th className="py-3 px-2 border-r text-gray-800">Total Spend</th><th className="py-3 px-2 border-r text-gray-800">Total COGS</th>
                    <th className="py-3 px-2 border-r text-red-600 bg-red-50">Total Expenses</th><th className="py-3 px-2 border-r text-emerald-600 bg-emerald-50 font-black text-[13px]">NET PROFIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyData.rows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-2 border-r flex items-center gap-1 justify-center">
                        <input type="date" value={monthlyPeriods[idx].start} onChange={(e) => { const newP = [...monthlyPeriods]; newP[idx].start = e.target.value; setMonthlyPeriods(newP); }} className="w-[110px] text-[10px] bg-white border border-gray-200 rounded px-1 py-1 outline-none" /> <span className="text-gray-400 text-[10px] font-bold">TO</span> <input type="date" value={monthlyPeriods[idx].end} onChange={(e) => { const newP = [...monthlyPeriods]; newP[idx].end = e.target.value; setMonthlyPeriods(newP); }} className="w-[110px] text-[10px] bg-white border border-gray-200 rounded px-1 py-1 outline-none" />
                      </td>
                      <td className="py-2.5 px-2 border-r font-medium text-gray-700">{row.leads}</td><td className="py-2.5 px-2 border-r font-bold text-blue-600">{row.delivered}</td><td className="py-2.5 px-2 border-r font-medium text-gray-700">{row.qty}</td>
                      <td className="py-1.5 px-2 border-r bg-emerald-50/50"><input type="number" step="0.01" placeholder="0" value={monthlyInputs[row.id]?.cash !== undefined ? monthlyInputs[row.id].cash : ''} onChange={(e) => setMonthlyInputs({...monthlyInputs, [row.id]: { ...monthlyInputs[row.id], cash: e.target.value }})} className="w-20 bg-white border border-emerald-300 text-emerald-700 font-bold text-center rounded px-1 py-1 outline-none" /></td>
                      <td className="py-1.5 px-2 border-r bg-purple-50/50"><input type="number" step="0.01" placeholder={row.shipping.toFixed(0)} value={monthlyInputs[row.id]?.shipping !== undefined ? monthlyInputs[row.id].shipping : ''} onChange={(e) => setMonthlyInputs({...monthlyInputs, [row.id]: { ...monthlyInputs[row.id], shipping: e.target.value }})} className="w-16 bg-white border border-purple-200 text-purple-700 text-center rounded px-1 py-1 outline-none" title={`Auto: $${row.delivered * 9}`} /></td>
                      <td className="py-1.5 px-2 border-r bg-purple-50/50"><input type="number" step="0.01" placeholder="0" value={monthlyInputs[row.id]?.salary !== undefined ? monthlyInputs[row.id].salary : ''} onChange={(e) => setMonthlyInputs({...monthlyInputs, [row.id]: { ...monthlyInputs[row.id], salary: e.target.value }})} className="w-16 bg-white border border-purple-200 text-purple-700 text-center rounded px-1 py-1 outline-none" /></td>
                      <td className="py-1.5 px-2 border-r bg-purple-50/50"><input type="number" step="0.01" placeholder={row.commission.toFixed(1)} value={monthlyInputs[row.id]?.commission !== undefined ? monthlyInputs[row.id].commission : ''} onChange={(e) => setMonthlyInputs({...monthlyInputs, [row.id]: { ...monthlyInputs[row.id], commission: e.target.value }})} className="w-16 bg-white border border-purple-200 text-purple-700 text-center rounded px-1 py-1 outline-none" title={`Auto: $${row.delivered * 0.5}`} /></td>
                      <td className="py-1.5 px-2 border-r bg-purple-50/50"><input type="number" step="0.01" placeholder="0" value={monthlyInputs[row.id]?.transFee !== undefined ? monthlyInputs[row.id].transFee : ''} onChange={(e) => setMonthlyInputs({...monthlyInputs, [row.id]: { ...monthlyInputs[row.id], transFee: e.target.value }})} className="w-16 bg-white border border-purple-200 text-purple-700 text-center rounded px-1 py-1 outline-none" /></td>
                      <td className="py-1.5 px-2 border-r bg-purple-50/50"><input type="number" step="0.01" placeholder="0" value={monthlyInputs[row.id]?.expenses !== undefined ? monthlyInputs[row.id].expenses : ''} onChange={(e) => setMonthlyInputs({...monthlyInputs, [row.id]: { ...monthlyInputs[row.id], expenses: e.target.value }})} className="w-16 bg-white border border-purple-200 text-purple-700 text-center rounded px-1 py-1 outline-none" /></td>
                      <td className="py-2.5 px-2 border-r font-bold text-gray-800">${row.spend.toFixed(2)}</td><td className="py-2.5 px-2 border-r font-bold text-gray-800">${row.cogs.toFixed(2)}</td>
                      <td className="py-2.5 px-2 border-r font-bold text-red-600 bg-red-50/30">${row.totalExp.toFixed(2)}</td>
                      <td className={`py-2.5 px-2 border-r font-black text-[13px] ${row.netProfit < 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>${row.netProfit.toFixed(2)}</td>
                    </tr>
                  ))}
                  
                  {/* GRAND TOTAL ROW */}
                  <tr className="bg-[#a3e635]/20 font-black border-t-2 border-gray-300 text-[12px]">
                    <td className="py-3 px-2 border-r uppercase text-left">GRAND TOTAL</td>
                    <td className="py-3 px-2 border-r">{monthlyData.totals.leads}</td><td className="py-3 px-2 border-r text-blue-700">{monthlyData.totals.delv}</td><td className="py-3 px-2 border-r">{monthlyData.totals.qty}</td>
                    <td className="py-3 px-2 border-r text-emerald-700">${monthlyData.totals.cash.toFixed(2)}</td>
                    <td className="py-3 px-2 border-r text-purple-800">${monthlyData.totals.sh.toFixed(2)}</td><td className="py-3 px-2 border-r text-purple-800">${monthlyData.totals.sal.toFixed(2)}</td><td className="py-3 px-2 border-r text-purple-800">${monthlyData.totals.comm.toFixed(2)}</td><td className="py-3 px-2 border-r text-purple-800">${monthlyData.totals.tr.toFixed(2)}</td><td className="py-3 px-2 border-r text-purple-800">${monthlyData.totals.exp.toFixed(2)}</td>
                    <td className="py-3 px-2 border-r text-gray-800">${monthlyData.totals.spend.toFixed(2)}</td><td className="py-3 px-2 border-r text-gray-800">${monthlyData.totals.cogs.toFixed(2)}</td>
                    <td className="py-3 px-2 border-r text-red-600">${monthlyData.totals.totalExp.toFixed(2)}</td>
                    <td className={`py-3 px-2 border-r text-white text-[14px] ${monthlyData.totals.net < 0 ? 'bg-red-600' : 'bg-emerald-600'}`}>${monthlyData.totals.net.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CHARTS MONTHLY */}
          {monthlyData.rows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-[#9b00ff]" /> Monthly Profit Overview</h3>
                  <button onMouseEnter={() => setActiveInfo('m1')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-[#9b00ff]"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'm1' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">أول سؤال: واش الشهر رابح ولا خاسر؟ نظرة عامة على المداخيل والمصاريف والأرباح لكل فترة.</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData.rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="periodLabel" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Legend wrapperStyle={{fontSize: '11px'}} />
                    <Bar dataKey="cash" name="Revenue ($)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="totalExp" name="Expenses ($)" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="netProfit" name="Net Profit ($)" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Profit Trend</h3>
                  <button onMouseEnter={() => setActiveInfo('m2')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-emerald-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'm2' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">فين طحت؟ وفين طلعتي؟ مسار الأرباح خلال فترات الشهر.</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData.rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="periodLabel" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Line type="monotone" dataKey="netProfit" name="Net Profit ($)" stroke="#10b981" strokeWidth={3} dot={{r: 5, fill: '#10b981'}} activeDot={{r: 8}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" /> ROAS Trend</h3>
                  <button onMouseEnter={() => setActiveInfo('m3')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-amber-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'm3' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">واش Account stable ولا fluctuating؟ واش Scaling فـ Ads كان صحيح ولا لا؟</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData.rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="periodLabel" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Line type="monotone" dataKey="roas" name="ROAS" stroke="#f59e0b" strokeWidth={3} dot={{r: 5, fill: '#f59e0b'}} activeDot={{r: 8}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Filter className="w-4 h-4 text-purple-500" /> Full Funnel Conversion</h3>
                  <button onMouseEnter={() => setActiveInfo('m4')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-purple-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'm4' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">قمع المبيعات: باش تعرف المشكل واش فـ Ads (Leads)؟ ولا Call Center (Confirmed)؟ ولا Delivery؟</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData.rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="periodLabel" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Legend wrapperStyle={{fontSize: '11px'}} />
                    <Bar dataKey="leads" name="Leads" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="confirmed" name="Confirmed" fill="#a855f7" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="delivered" name="Delivered" fill="#14b8a6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" /> Spend vs Profit (Scaling)</h3>
                  <button onMouseEnter={() => setActiveInfo('m5')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-indigo-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'm5' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">واش Scaling عطاك Profit ولا غير كتزيد تصرف الفلوس بلا فايدة؟</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis type="number" dataKey="spend" name="Spend" unit="$" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis type="number" dataKey="netProfit" name="Profit" unit="$" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <ZAxis type="category" dataKey="periodLabel" name="Period" />
                    <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Scatter name="Periods" data={monthlyData.rows} fill="#6366f1" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-pink-500" /> Volume vs Revenue</h3>
                  <button onMouseEnter={() => setActiveInfo('m6')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-pink-500"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'm6' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">واش كتربح حيت كتبيع بزاف (Volume بالأعمدة) ولا حيت Margin عالي (الخط)؟</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData.rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="periodLabel" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                    <Legend wrapperStyle={{fontSize: '11px'}} />
                    <Bar yAxisId="left" dataKey="qty" name="Units Sold" fill="#f472b6" radius={[2, 2, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="cash" name="Revenue ($)" stroke="#be185d" strokeWidth={3} dot={{r: 4}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-80 relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><PieIcon className="w-4 h-4 text-gray-600" /> Expense Breakdown</h3>
                  <button onMouseEnter={() => setActiveInfo('m7')} onMouseLeave={() => setActiveInfo(null)} className="text-gray-400 hover:text-gray-600"><Info className="w-4 h-4" /></button>
                  {activeInfo === 'm7' && (<div className="absolute top-10 right-4 w-56 p-3 bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xl z-50">مهم بزاف باش تعرف فين كيمشيو الفلوس بالضبط ديال هاد الشهر (الاعلانات، التوصيل، السلعة...).</div>)}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={monthlyData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {monthlyData.pieData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                    </Pie>
                        <RechartsTooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} contentStyle={{borderRadius: '8px'}} />
                      <Legend wrapperStyle={{fontSize: '11px'}} />
                   </PieChart>
                </ResponsiveContainer>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}