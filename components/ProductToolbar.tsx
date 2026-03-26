"use client";

import { Search, ArrowDownUp, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ProductToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State bach n-gérer chno mktoub / mkhtar
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');

  // Kolma tbedlat chi 7aja, kan-updatiw l'URL bach l'Server y-jib ddata jdida
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (sort) params.set('sort', sort);
    if (country) params.set('country', country);

    router.push(`/dashboard/products?${params.toString()}`, { scroll: false });
  }, [search, sort, country, router]);

  return (
    <div className="bg-white p-4 rounded-t-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
      
      {/* 1. Search Bar */}
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
        
        {/* 2. Sort Button (Stock) */}
        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors w-full sm:w-auto">
          <ArrowDownUp className="absolute left-3 w-4 h-4 text-gray-500" />
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full sm:w-auto bg-transparent pl-9 pr-8 py-2.5 text-sm font-medium text-gray-700 outline-none appearance-none cursor-pointer"
          >
            <option value="">Sort by: Latest</option>
            <option value="desc">Stock: Highest to Lowest</option>
            <option value="asc">Stock: Lowest to Highest</option>
          </select>
        </div>

        {/* 3. Filter Button (Country) */}
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
          </select>
        </div>

      </div>
    </div>
  );
}