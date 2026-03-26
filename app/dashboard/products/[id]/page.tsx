"use client";

import { useState } from 'react';
import { Phone, Truck, Heart, ArrowLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-[#2a3c5a]">Product Details</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* Section 1: Image Gallery (N9asna f size hna) */}
          <div className="w-full lg:w-[400px] space-y-4 shrink-0">
            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=1000&auto=format&fit=crop" 
                alt="Product" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Thumbnail */}
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg border-2 border-blue-500 overflow-hidden p-1 bg-white cursor-pointer">
                <img src="https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover rounded-md" />
              </div>
            </div>
          </div>

          {/* Section 2: Info & Stats */}
          <div className="flex-1 space-y-8 w-full">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-[#2a3c5a]">Smart Fitness</h2>
                <p className="text-gray-500 text-sm mt-1">Home & Fitness Equipment</p>
              </div>
              <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Top Cards (Confirmation & Delivery) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Confirmation Rate</p>
                  <p className="text-xl font-bold text-[#2a3c5a]">80%</p>
                </div>
              </div>
              
              <div className="bg-teal-50/50 p-5 rounded-xl border border-teal-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-teal-700 font-medium">Delivery Rate</p>
                  <p className="text-xl font-bold text-[#2a3c5a]">13%</p>
                </div>
              </div>
            </div>

            {/* Variations Table */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-500 border-b-2 border-blue-500 inline-block pb-1">Variations</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4 uppercase text-[11px] tracking-wider">SKU</th>
                      <th className="py-3 px-4 uppercase text-[11px] tracking-wider text-center">Country</th>
                      <th className="py-3 px-4 uppercase text-[11px] tracking-wider text-center">Price Product</th>
                      <th className="py-3 px-4 uppercase text-[11px] tracking-wider text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">LBRJMT01</td>
                      <td className="py-4 px-4 text-lg text-center">🇱🇧</td>
                      <td className="py-4 px-4 text-center text-[#2a3c5a] font-bold">8.24$</td>
                      <td className="py-4 px-4 text-center text-gray-500 font-bold">
                        <span className="text-blue-600">6</span>/50
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}