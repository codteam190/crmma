"use client";

import { useState } from 'react';
import { Search, Filter, Box , ExternalLink, Loader2 } from 'lucide-react';
import ProductActions from '@/components/ProductActions';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ProductsClient() {
  // ==========================================
  // 🪄 CONVEX QUERY (Real-time data)
  // ==========================================
  const products = useQuery(api.products.getProducts);

  // States dyal Search w Country (7iydna Sort)
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');

  // Loading State
  if (products === undefined) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Logic dyal Filtrage
  let filteredProducts = [...products];

  // A. Search
  if (search) {
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(search.toLowerCase()) || 
      product.sku.toLowerCase().includes(search.toLowerCase())
    );
  }

  // B. Country Filter
  if (country) {
    filteredProducts = filteredProducts.filter(product => product.country === country);
  }

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Filter Button */}
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors w-full sm:w-auto">
            <Filter className="absolute left-3 w-4 h-4 text-gray-500" />
            <select 
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full sm:w-auto bg-transparent pl-9 pr-8 py-2.5 text-sm font-medium text-gray-700 outline-none appearance-none cursor-pointer"
            >
              <option value="">All Countries</option>
              <option value="LB">Lebanon 🇱🇧</option>
              <option value="EG">Egypt 🇪🇬</option>
              <option value="MA">Morocco 🇲🇦</option>
              <option value="SA">Saudi Arabia 🇸🇦</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border-x border-b border-gray-100 rounded-b-xl shadow-sm overflow-x-auto -mt-6">
        <table className="w-full text-left border-collapse mt-6">
          <thead>
            {/* 🚨 Hna 9addina l-Headers bach y-b9aw ghir 4 */}
            <tr className="bg-gray-50 border-y border-gray-100">
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Info</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Country</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <Box className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {product.url && (
                          <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors" title="Open Landing Page">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-lg">
                    {product.country === 'LB' ? '🇱🇧' : product.country === 'EG' ? '🇪🇬' : product.country === 'SA' ? '🇸🇦' : '🇲🇦'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{product.sku}</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <ProductActions product={product} />
                </td>
              </tr>
            )) : (
              <tr>
                {/* 🚨 9addina l-colSpan l-4 */}
                <td colSpan={4} className="py-10 text-center text-gray-500">No products match your search or filters.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-white rounded-b-xl">
          <p className="text-sm text-gray-500">Showing <span className="font-medium text-gray-900">{filteredProducts.length}</span> products</p>
        </div>
      </div>
    </div>
  );
}