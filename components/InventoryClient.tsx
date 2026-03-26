"use client";

import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Boxes, AlertTriangle, Search, Plus, PackageOpen, DollarSign, Clock, TrendingUp, Skull, Loader2, Info, X, HelpCircle, Activity, Box } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine, LineChart, Line, AreaChart, Area } from 'recharts';

export default function InventoryClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // 🪄 Convex Queries
  const products = useQuery(api.products.getProducts);
  const sourcings = useQuery(api.sourcing.getSourcings);
  const leads = useQuery(api.leads.getLeads);

  // 🧠 L-Mokh: L-Calcule dyal l-Inventory Real-Time
  const inventory = useMemo(() => {
    if (!products || !sourcings || !leads) return [];

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    return products.map((product: any) => {
      // 1. Sourcing (In)
      const pSourcings = sourcings.filter((s: any) => s.productId === product._id);
      const totalIn = pSourcings.filter((s: any) => s.status === 'Delivered').reduce((sum: number, s: any) => sum + (s.qtyReceived || 0), 0);
      
      // 2. Leads (Out)
      const pLeads = leads.filter((l: any) => l.productId === product._id && l.status === 'Delivered');
      const totalOut = pLeads.reduce((sum: number, l: any) => sum + (l.quantity || 1), 0);
      
      // 3. Current Stock
      const currentStock = totalIn - totalOut;

      // 4. VELOCITY (Avg Daily Sold) & DAYS LEFT
      const recentLeads = pLeads.filter((l: any) => l._creationTime > thirtyDaysAgo);
      const recentSalesQty = recentLeads.reduce((sum: number, l: any) => sum + (l.quantity || 1), 0);
      const avgDailySales = Number((recentSalesQty / 30).toFixed(2));
      
      const daysLeft = avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : (currentStock > 0 ? 999 : 0);

      // 5. STOCK VALUE (Floussk l-Mjemda) - ✅ SUPER LANDED COST CALCULATION
      const latestSourcing = pSourcings.sort((a: any, b: any) => b._creationTime - a._creationTime)[0];
      
      let truePricePerUnit = 0;
      if (latestSourcing) {
        const sData = latestSourcing as any; // 🤫 Sktna TypeScript
        
        if (sData.pricePerUnit) {
          truePricePerUnit = sData.pricePerUnit;
        } else {
          // N-jbdou l-Arkam mn Sourcing b ay smiya momkina (Fallback Strategy)
          const orderedQty = sData.orderedQty || sData.orderedQuantity || sData.quantity || sData.qtyOrdered || sData.qtyReceived || 0;
          const shipping = sData.shippingCost || sData.shippingFee || sData.shippingPrice || 0;
          const customs = sData.customsFee || sData.customsCost || sData.customs || 0;
          
          // N-7awlou n-lqaw Total Amount awla N-7esbouh b yedna (Cost * Ordered + Shipping + Customs)
          const rawTotalAmount = sData.totalAmount || sData.totalCost || sData.totalPrice || sData.amount;
          const calculatedTotal = (sData.costPrice * orderedQty) + shipping + customs;
          
          const finalTotalAmount = rawTotalAmount || calculatedTotal;
          const qtyReceived = sData.qtyReceived || sData.receivedQty || sData.received || 1;

          if (finalTotalAmount > 0 && qtyReceived > 0) {
            truePricePerUnit = finalTotalAmount / qtyReceived;
          } else {
            // I7tiyat lakher ga3
            truePricePerUnit = sData.costPrice || 0;
          }
        }
      }

      const costPrice = truePricePerUnit; 
      const stockValue = currentStock * costPrice;

      // 6. AUTO STATUS (Game Changer 🔥)
      let stockStatus = 'Healthy';
      if (currentStock <= 0) stockStatus = 'Out of Stock';
      else if (daysLeft < 7) stockStatus = 'Low (Restock)';
      else if (daysLeft <= 14) stockStatus = 'Medium';
      else if (daysLeft === 999 && currentStock > 30) stockStatus = 'Dead Stock 💀';
      else stockStatus = 'Healthy';

      return {
        id: product._id,
        name: product.name,
        sku: product.sku,
        country: product.country,
        totalIn,
        totalOut,
        currentStock,
        avgDailySales,
        daysLeft,
        costPrice,
        stockValue,
        stockStatus
      };
    });
  }, [products, sourcings, leads]);

  // Loading State
  if (products === undefined || sourcings === undefined || leads === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9b00ff]" />
      </div>
    );
  }

  // N-filtriw l-Inventory
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 📈 KPIs
  const needsRestockCount = inventory.filter(i => i.stockStatus === 'Low (Restock)' || i.stockStatus === 'Out of Stock').length;
  const totalStockValue = inventory.reduce((sum, i) => sum + i.stockValue, 0);
  const totalDeadStockValue = inventory.filter(i => i.stockStatus === 'Dead Stock 💀').reduce((sum, i) => sum + i.stockValue, 0);

  // 📊 Charts Data
  const velocityData = [...inventory].sort((a, b) => b.avgDailySales - a.avgDailySales).slice(0, 10);
  const restockAlertData = [...inventory].filter(i => i.daysLeft > 0 && i.daysLeft < 999).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 10);
  const valueData = [...inventory].sort((a, b) => b.stockValue - a.stockValue).slice(0, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Low (Restock)': return 'bg-red-100 text-red-700 border border-red-200 animate-pulse';
      case 'Out of Stock': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Dead Stock 💀': return 'bg-purple-100 text-purple-700 border border-purple-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* ================= MODAL DYAL GUIDE (DARIJA) ================= */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsGuideOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#1e1b4b] p-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-[#9b00ff]" /> Kifach n-qra Inventory Ledger?
              </h2>
              <button onClick={() => setIsGuideOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 p-3 rounded-lg text-blue-600 mt-1"><Box className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Current Stock (L-Makhzoun l-7ali)</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Hada sahel, howa ch7al dyal l-piassat bqaw 3ndk physically f l-makhzan (wla 3nd l-fulfillment wajdin l-bi3). K-y-t-7seb mn (Sourcing Li Dkhl) - (Mabi3at li t-Livraw).
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 mt-1"><TrendingUp className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Velocity (Daily) (Sor3at l-Mabi3at)</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Hada howa l-Moteur! Kay-3ni ch7al mn piasa k-t-bi3 f n-nhar f l-moyenne (s-System kay-7sebha 3la akher 30 youm). Matalan <strong>4.63 /day</strong> kat3ni k-t-kherrej tqriban 5 d-l-biassat kol nhar.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-orange-100 p-3 rounded-lg text-orange-600 mt-1"><Clock className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Days Left (L-Iyam l-Moutabaqqiya)</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Hada howa l-Mokh dyal l-Inventory! Kay-jweb 3la sou2al: <span className="italic text-gray-500">"Ila bqit k-n-bi3 b nafs s-Sor3a, ch7al mn nhar bqa liya bach t-tsala liya s-sel3a?"</span> <br/>
                    Kay-3tik l-waqt l-kafi bach t-kellef b r-restock (t-cheri sel3a jdida) bla ma t-zreb wla t-7bess les Ads.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-purple-100 p-3 rounded-lg text-purple-600 mt-1"><DollarSign className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Stock Value (Rass l-Mal l-Mjmed)</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Kay-goul lik ch7al dyal l-flouss chraiti bihom had s-sel3a lli baqa na3ssa f l-makhzan. L-Cost hna m-7ssoub b <strong>Price / Unit</strong> dyal Sourcing (Sel3a + Shipping + Diwana).
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-gray-100 pt-6">
                <div className="bg-gray-100 p-3 rounded-lg text-gray-600 mt-1"><Activity className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Smart Status (L-7ala d-Dakiya)</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    Hada howa l-"Tbib" dyal s-System. Kay-chouf l-Arkam l-fouq w kay-3tik l-Khoulassa b loun:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> <strong>Healthy:</strong> Sel3a kat-t-mchha mzyan w stock kafik.</li>
                    <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> <strong>Low (Restock):</strong> Khatar! Stock ghay-tsala f 9el mn 7 iyam.</li>
                    <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> <strong>Dead Stock 💀:</strong> Sel3a ma-kat-tba3ch (Velocity = 0) w m-khabbi fiha floussek. Nwed dir chi Promo awla thnna mnha!</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setIsGuideOpen(false)} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors">
                Fhamt, Chokran!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header & Alerts */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-[#9b00ff]/10 p-2 rounded-lg">
            <Boxes className="w-5 h-5 text-[#9b00ff]" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Advanced Inventory & Velocity</h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {needsRestockCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-bold border border-red-100 shadow-sm animate-pulse">
              <AlertTriangle className="w-4 h-4" /> {needsRestockCount} Items Critical
            </div>
          )}
          <Link href="/dashboard/sourcing/data-entry" className="flex items-center gap-2 bg-[#9b00ff] hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" /> Restock Order
          </Link>
        </div>
      </div>

      {/* 2. Top Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Products</p>
            <h3 className="text-2xl font-black text-gray-800">{inventory.length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Stock Value (Frozen)</p>
            <h3 className="text-2xl font-black text-gray-800">${totalStockValue.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <Skull className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Dead Stock Value</p>
            <h3 className="text-2xl font-black text-purple-600">${totalDeadStockValue.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Daily Output Avg</p>
            <h3 className="text-2xl font-black text-gray-800">
              {inventory.reduce((sum, i) => sum + i.avgDailySales, 0).toFixed(1)} <span className="text-sm font-medium text-gray-400">units/day</span>
            </h3>
          </div>
        </div>
      </div>

      {/* 3. The GAME CHANGER CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Restock Alert (Days Left) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-red-500" />
            <h3 className="text-md font-bold text-gray-800">Days of Inventory Left (Restock Alert)</h3>
          </div>
          <p className="text-[11px] text-gray-500 mb-4 flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5" /> Shows how many days your current stock will last based on the last 30 days of sales.
          </p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restockAlertData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#4b5563'}} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <ReferenceLine x={7} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '7 Days (Danger)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                <Bar dataKey="daysLeft" name="Days Left" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={15}>
                  {restockAlertData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.daysLeft < 7 ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Velocity (Top Selling) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-md font-bold text-gray-800">Product Velocity (Avg Daily Sales)</h3>
          </div>
          <p className="text-[11px] text-gray-500 mb-4 flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5" /> Identifies your fastest-moving products. Higher velocity means higher daily sales demand.
          </p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="avgDailySales" name="Daily Sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVelocity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Value in Stock */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-blue-500" />
            <h3 className="text-md font-bold text-gray-800">Capital Frozen in Stock (Top 10 Products by Value)</h3>
          </div>
          <p className="text-[11px] text-gray-500 mb-4 flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5" /> Shows the total monetary value of your unsold inventory (Current Stock × Cost Price). Helps identify sleeping capital.
          </p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="stockValue" name="Total Value ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. The Smart Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <h3 className="text-md font-bold text-gray-800">Inventory Ledger</h3>
            <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
              <HelpCircle className="w-4 h-4" /> Kifach n-qra had l-Jadwal?
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search product..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9b00ff] focus:border-[#9b00ff]" 
            />
          </div>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-4 px-6">Product Details</th>
                <th className="py-4 px-6 text-center">In / Out</th>
                <th className="py-4 px-6 text-center bg-blue-50/50">Velocity (Daily)</th>
                <th className="py-4 px-6 text-center bg-orange-50/50">Days Left</th>
                <th className="py-4 px-6 text-center">Current Stock</th>
                <th className="py-4 px-6 text-center">Stock Value</th>
                <th className="py-4 px-6 text-center">Smart Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-gray-800 text-[14px]">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</p>
                  </td>
                  
                  <td className="py-4 px-6 text-center">
                    <div className="flex flex-col items-center gap-1 text-[11px] font-bold">
                       <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">+{item.totalIn}</span>
                       <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">-{item.totalOut}</span>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-center bg-blue-50/20">
                    <span className="font-bold text-gray-800">{item.avgDailySales}</span> <span className="text-[10px] text-gray-400">/day</span>
                  </td>

                  <td className="py-4 px-6 text-center bg-orange-50/20">
                    <span className={`font-black ${item.daysLeft < 7 ? 'text-red-600' : item.daysLeft === 999 ? 'text-purple-600' : 'text-gray-800'}`}>
                      {item.daysLeft === 999 ? '∞' : item.daysLeft}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <span className={`text-xl font-black ${item.currentStock <= 0 ? 'text-gray-400' : 'text-gray-800'}`}>
                      {item.currentStock}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <p className="font-bold text-emerald-600">${item.stockValue.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Cost: ${item.costPrice.toFixed(2)}</p>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider shadow-sm ${getStatusBadge(item.stockStatus)}`}>
                      {item.stockStatus}
                    </span>
                  </td>
                </tr>
              ))}
              
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                    No products found in inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}