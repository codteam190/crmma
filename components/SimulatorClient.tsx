"use client";

import { useState } from 'react';
import { Calculator, Settings, Box, TrendingUp, PieChart, FileText, Target } from 'lucide-react';

export default function SimulatorClient() {
  // ================= STATES (L-Modkhalat) =================
  const [country, setCountry] = useState<string>('MA_NORMAL'); // MA_NORMAL awla MA_SPACE

  const [leads, setLeads] = useState<number>(100);
  const [confirmedRate, setConfirmedRate] = useState<number>(60);
  const [deliveredRate, setDeliveredRate] = useState<number>(60);
  const [productCost, setProductCost] = useState<number>(3);
  const [cpl, setCpl] = useState<number>(3); 
  const [sellingPrice, setSellingPrice] = useState<number>(29.99);
  const [exchangeRate, setExchangeRate] = useState<number>(10); 

  // Morocco Normal Specific
  const [deliveryCostMAD, setDeliveryCostMAD] = useState<number>(35); 
  const [callCenterMAD, setCallCenterMAD] = useState<number>(15);
  const [fulfillmentMAD, setFulfillmentMAD] = useState<number>(10);

  // Morocco Space Seller Specific
  const [callCenterPerLeadMAD, setCallCenterPerLeadMAD] = useState<number>(2); 
  const [spaceSellerFeeMAD, setSpaceSellerFeeMAD] = useState<number>(63); 

  // ================= CALCULATIONS (L-Math) =================
  const confirmedLeads = Math.round(leads * (confirmedRate / 100));
  const deliveredOrders = Math.round(confirmedLeads * (deliveredRate / 100));

  const totalRevenue = deliveredOrders * sellingPrice;
  const adSpend = leads * cpl;
  const totalProductCost = deliveredOrders * productCost;
  
  // 🧠 L-Math dyal Fees
  const safeExchangeRate = exchangeRate > 0 ? exchangeRate : 1;
  let totalDeliveryUSD = 0; 
  let callCenterUSD = 0;
  let fulfillmentUSD = 0;

  if (country === 'MA_NORMAL') {
    totalDeliveryUSD = deliveredOrders * (deliveryCostMAD / safeExchangeRate);
    callCenterUSD = deliveredOrders * (callCenterMAD / safeExchangeRate);
    fulfillmentUSD = deliveredOrders * (fulfillmentMAD / safeExchangeRate);
  } else if (country === 'MA_SPACE') {
    totalDeliveryUSD = deliveredOrders * (spaceSellerFeeMAD / safeExchangeRate); 
    callCenterUSD = leads * (callCenterPerLeadMAD / safeExchangeRate);
    fulfillmentUSD = 0; 
  }

  const otherFeesTotal = callCenterUSD + fulfillmentUSD;
  const totalCosts = adSpend + totalProductCost + totalDeliveryUSD + otherFeesTotal;
  const netProfit = totalRevenue - totalCosts;
  
  const profitPerOrder = deliveredOrders > 0 ? netProfit / deliveredOrders : 0;
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
  
  // 🎯 L-MOKH JDID: Cost Per Delivered (CPA Delivered)
  const costPerDelivered = deliveredOrders > 0 ? (adSpend / deliveredOrders) : 0;

  // ================= DONUT CHART LOGIC =================
  const safeTotalCosts = totalCosts > 0 ? totalCosts : 1;
  const p1 = (adSpend / safeTotalCosts) * 100;
  const p2 = p1 + ((totalProductCost / safeTotalCosts) * 100);
  const p3 = p2 + ((totalDeliveryUSD / safeTotalCosts) * 100);
  
  let p4 = p3 + ((callCenterUSD / safeTotalCosts) * 100);
  let p5 = p4;

  let donutBackground = "";
  if (country === 'MA_NORMAL') {
    p5 = p4 + ((fulfillmentUSD / safeTotalCosts) * 100);
    donutBackground = `conic-gradient(#ef4444 0% ${p1}%, #10b981 ${p1}% ${p2}%, #3b82f6 ${p2}% ${p3}%, #8b5cf6 ${p3}% ${p4}%, #06b6d4 ${p4}% ${p5}%)`;
  } else {
    donutBackground = `conic-gradient(#ef4444 0% ${p1}%, #10b981 ${p1}% ${p2}%, #3b82f6 ${p2}% ${p3}%, #8b5cf6 ${p3}% ${p4}%)`;
  }

  const resetDefaults = () => {
    setLeads(100); setConfirmedRate(60); setDeliveredRate(60);
    setProductCost(3); setCpl(3); setSellingPrice(29.99); setExchangeRate(10);
    setDeliveryCostMAD(35); setCallCenterMAD(15); setFulfillmentMAD(10);
    setCallCenterPerLeadMAD(2); setSpaceSellerFeeMAD(63);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <FileText className="w-8 h-8 text-[#3b82f6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e1b4b]">Simulator</h1>
            <p className="text-sm text-gray-500">Analyze your e-commerce unit economics with precision.</p>
          </div>
        </div>
        
        {/* Dropdown & Reset */}
        <div className="flex items-center gap-3">
          <select 
            value={country} 
            onChange={(e) => setCountry(e.target.value)} 
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-800 outline-none shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <option value="MA_NORMAL">MA Morocco (Normal)</option>
            <option value="MA_SPACE">MA Morocco (SpaceSeller)</option>
          </select>
          <button onClick={resetDefaults} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            Reset Defaults
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT COLUMN: PARAMETERS ================= */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-1">
              <Settings className="w-5 h-5 text-blue-500" /> Selling Parameters
            </h2>
            <p className="text-xs text-gray-500 mb-6">Configure your funnel metrics.</p>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-bold text-gray-700">Total Leads</label>
                  <span className="text-sm text-gray-500">{leads}</span>
                </div>
                <input type="number" min="0" value={leads} onChange={(e) => setLeads(Number(e.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-colors" />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-bold text-gray-700">Confirmed Rate</label>
                  <span className="text-sm font-bold text-blue-500">{confirmedRate}%</span>
                </div>
                <input type="range" min="0" max="100" value={confirmedRate} onChange={(e) => setConfirmedRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-bold text-gray-700">Delivered Rate</label>
                  <span className="text-sm font-bold text-blue-500">{deliveredRate}%</span>
                </div>
                <input type="range" min="0" max="100" value={deliveredRate} onChange={(e) => setDeliveredRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              {/* Exchange Rate */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Exchange Rate (1 USD = ? MAD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">MAD</span>
                  <input type="number" min="0.1" step="0.1" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value))} className="w-full pl-12 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Product Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input type="number" min="0" step="0.01" value={productCost} onChange={(e) => setProductCost(Number(e.target.value))} className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Ad Cost / Lead</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input type="number" min="0" step="0.01" value={cpl} onChange={(e) => setCpl(Number(e.target.value))} className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Selling Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: RESULTS ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Logistics & Fees Row */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[140px]">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-1">
              <Box className="w-5 h-5 text-blue-500" /> Logistics & Fees
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Shipping and processing costs. <span className="font-bold text-[#10b981]">(In MAD)</span>
            </p>
            
            {/* Morocco Normal Inputs */}
            {country === 'MA_NORMAL' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in zoom-in duration-300">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase">Delivery Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">MAD</span>
                    <input type="number" min="0" step="1" value={deliveryCostMAD} onChange={(e) => setDeliveryCostMAD(Number(e.target.value))} className="w-full pl-11 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase">Call Center (Per Delivered)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">MAD</span>
                    <input type="number" min="0" step="1" value={callCenterMAD} onChange={(e) => setCallCenterMAD(Number(e.target.value))} className="w-full pl-11 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase">Fulfillment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">MAD</span>
                    <input type="number" min="0" step="1" value={fulfillmentMAD} onChange={(e) => setFulfillmentMAD(Number(e.target.value))} className="w-full pl-11 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                </div>
              </div>
            )}

            {/* Morocco SpaceSeller Inputs */}
            {country === 'MA_SPACE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in zoom-in duration-300">
                <div>
                  <label className="block text-[11px] font-bold text-[#8b5cf6] mb-1.5 uppercase">Leads Entered (Call Center)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b5cf6] font-bold text-xs">MAD</span>
                    <input type="number" min="0" step="1" value={callCenterPerLeadMAD} onChange={(e) => setCallCenterPerLeadMAD(Number(e.target.value))} className="w-full pl-11 pr-3 py-2 bg-[#f5f3ff] border border-[#ddd6fe] rounded-lg text-sm font-bold text-[#6d28d9] outline-none focus:border-[#8b5cf6] transition-colors" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 mt-1">Calculated on Total Leads: {leads}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#3b82f6] mb-1.5 uppercase">Space Seller Fees</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3b82f6] font-bold text-xs">MAD</span>
                    <input type="number" min="0" step="1" value={spaceSellerFeeMAD} onChange={(e) => setSpaceSellerFeeMAD(Number(e.target.value))} className="w-full pl-11 pr-3 py-2 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg text-sm font-bold text-[#1d4ed8] outline-none focus:border-[#3b82f6] transition-colors" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 mt-1">Calculated on Delivered: {deliveredOrders}</p>
                </div>
              </div>
            )}
          </div>

          {/* ================= KPI CARDS (DABA FIHOM 4 DYAL L-KARTAT) ================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#3b82f6] rounded-2xl p-5 shadow-md text-white relative overflow-hidden col-span-2 sm:col-span-1">
              <div className="absolute -right-4 -bottom-4 opacity-10"><Calculator className="w-32 h-32" /></div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-90">Net Profit</p>
              <h3 className="text-2xl lg:text-3xl font-black">${netProfit.toFixed(2)}</h3>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Profit / Order</p>
              <h3 className={`text-2xl lg:text-3xl font-black text-center ${profitPerOrder >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                ${profitPerOrder.toFixed(2)}
              </h3>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">ROI</p>
              <h3 className={`text-2xl lg:text-3xl font-black text-center ${roi >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>
                {roi.toFixed(1)}%
              </h3>
            </div>

            {/* 🎯 BITAQA JDIDA: Cost Per Delivered */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-center border-b-4 border-b-orange-400 relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-20"><Target className="w-8 h-8 text-orange-500" /></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cost / Delivered</p>
              <h3 className="text-2xl lg:text-3xl font-black text-gray-800">
                ${costPerDelivered.toFixed(2)}
              </h3>
            </div>
          </div>

          {/* Charts & Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Cost Breakdown (Donut Chart) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative">
              <h3 className="w-full text-sm font-bold text-gray-800 flex items-center gap-2 mb-6">
                <PieChart className="w-4 h-4 text-blue-500" /> Cost Breakdown
              </h3>
              
              <div className="relative w-48 h-48 rounded-full mb-6 shadow-sm transition-all duration-500" style={{
                background: donutBackground
              }}>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-xl font-black text-gray-800">${totalCosts.toFixed(0)}</span>
                </div>
              </div>

              {/* Legend: Updated dynamically */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-bold text-gray-600">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>Ad Spend</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span>Product Cost</div>
                
                {country === 'MA_NORMAL' ? (
                  <>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>Delivery</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#8b5cf6]"></span>Call Center</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#06b6d4]"></span>Fulfillment</div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>Space Seller</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#8b5cf6]"></span>Call Center (Leads)</div>
                  </>
                )}
              </div>
            </div>

            {/* Financial Summary Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Financial Summary
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between font-bold text-gray-800 pb-2 border-b border-gray-100">
                  <span>Total Revenue</span>
                  <span>${totalRevenue.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-500">
                  <span>Confirmed Leads ({confirmedRate}%)</span>
                  <span className="font-bold text-gray-700">{confirmedLeads}</span>
                </div>
                <div className="flex justify-between text-gray-500 pb-3 border-b border-gray-100">
                  <span>Delivered Orders ({deliveredRate}%)</span>
                  <span className="font-bold text-gray-700">{deliveredOrders}</span>
                </div>

                <div className="flex justify-between text-[#ef4444]">
                  <span>Ad Spend</span>
                  <span>-${adSpend.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#ef4444]">
                  <span>Product Cost</span>
                  <span>-${totalProductCost.toFixed(2)}</span>
                </div>
                
                {/* Dynamically show fees based on Country */}
                {country === 'MA_NORMAL' ? (
                  <>
                    <div className="flex justify-between text-[#ef4444]">
                      <span>Delivery Fees</span>
                      <span>-${totalDeliveryUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#ef4444]">
                      <span>Call Center Fees</span>
                      <span>-${callCenterUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#ef4444] pb-3 border-b border-gray-100">
                      <span>Fulfillment Fees</span>
                      <span>-${fulfillmentUSD.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-[#3b82f6]">
                      <span>Space Seller Fees</span>
                      <span>-${totalDeliveryUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#8b5cf6] pb-3 border-b border-gray-100">
                      <span>Call Center (Per Lead)</span>
                      <span>-${callCenterUSD.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-lg font-black text-gray-900 pt-1">
                  <span>Total Costs</span>
                  <span className="text-[#ef4444]">${totalCosts.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}