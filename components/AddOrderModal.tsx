"use client";

import { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from '@/convex/_generated/dataModel';

export default function AddOrderModal({ products }: { products: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🪄 Convex Mutation
  const createOrder = useMutation(api.leads.createManualOrder);

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      await createOrder({
        fullName: formData.get("fullName") as string,
        phone: formData.get("phone") as string,
        country: formData.get("country") as string,
        quantity: Number(formData.get("quantity")),
        price: Number(formData.get("price")),
        status: formData.get("status") as string,
        productId: formData.get("productId") as Id<"products">, // 🚨 Rdha Id d Convex
      });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to add order.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 transition-colors">
        <Plus className="w-4 h-4" /> Add Order
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Manual Order</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Full Name</label>
                  <input type="text" name="fullName" required placeholder="e.g. حسن عويد" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-right" dir="auto" />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Phone Number</label>
                  <input type="tel" name="phone" required placeholder="+961 71 123 456" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500" dir="ltr" />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Select Product</label>
                  <select name="productId" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500">
                    <option value="">-- Choose a product --</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}> {/* 🚨 _id */}
                        {product.name} (SKU: {product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Country</label>
                  <select name="country" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500">
                    <option value="LB">Lebanon 🇱🇧</option>
                    <option value="EG">Egypt 🇪🇬</option>
                    <option value="MA">Morocco 🇲🇦</option>
                    <option value="SA">Saudi Arabia 🇸🇦</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Initial Status</label>
                  <select name="status" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500">
                    <option value="New">New</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Quantity</label>
                  <input type="number" name="quantity" min="1" defaultValue="1" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Selling Price ($)</label>
                  <input type="number" name="price" step="0.01" required placeholder="29.99" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                </div>

              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Order'}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}
    </>
  );
}