"use client";

import { useState } from 'react';
import { Plus, Copy, Trash2, Download, X, FileSpreadsheet } from 'lucide-react';

// Data wehmiya dyal l'Tableau
const initialSheets = [
  { id: '1', name: 'SalesLB-Brahim', sheetName: 'Orders', status: 'Active', createdAt: '2025-11-21 12:50' },
];

export default function SheetsPage() {
  const [sheets, setSheets] = useState(initialSheets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State dyal l'Formulaire
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [name, setName] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fonction bach n-copiyiw l'Email dyal Service Account
  const handleCopyEmail = () => {
    navigator.clipboard.writeText("5543837549-compute@developer.gserviceaccount.com");
    alert("Email copied to clipboard!"); // T9der tbdelha b Toast notification mn b3d
  };

  // Fonction bach nzidou Sheet jdid f l'Tableau
  const handleAddSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sheetName) return;

    const newSheet = {
      id: Date.now().toString(),
      name: name,
      sheetName: sheetName,
      status: isActive ? 'Active' : 'Inactive',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    setSheets([newSheet, ...sheets]);
    setIsModalOpen(false);
    setName('');
    setSheetName('');
    setSpreadsheetId('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#2a3c5a]">Sheets</h1>
          <span className="bg-blue-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
            {sheets.length}
          </span>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Spreadsheet</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Sheet Name</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Status</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500">Created At</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sheets.length > 0 ? (
                sheets.map((sheet) => (
                  <tr key={sheet.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-700">{sheet.name}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{sheet.sheetName}</td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                        sheet.status === 'Active' ? 'bg-[#e6f7f4] text-[#0d9488]' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {sheet.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">{sheet.createdAt}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-gray-400 hover:text-gray-700 transition-colors" title="Copy ID">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="text-red-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500 text-sm">
                    No sheets connected yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Bhal dyal LeadsBounty) */}
        <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-white text-sm">
          <p className="text-gray-500">Page <span className="font-bold text-gray-900">1</span> of <span className="font-bold text-gray-900">1</span></p>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-400 bg-gray-50 rounded-md cursor-not-allowed">
              <span className="text-xs">‹</span> Previous
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-400 bg-gray-50 rounded-md cursor-not-allowed">
              Next <span className="text-xs">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* === MODAL: ADD NEW SHEET === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#2a3c5a]">New</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddSheet} className="p-6 space-y-6">
              
              {/* Service Account Box */}
              <div className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-600">
                <span className="truncate pr-4">5543837549-compute@developer.gserviceaccount.com</span>
                <button type="button" onClick={handleCopyEmail} className="text-gray-500 hover:text-gray-800 shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Download Example Sheet */}
              <button type="button" className="flex items-center justify-between w-full px-4 py-3 border border-blue-200 bg-blue-50/50 rounded-md text-sm text-blue-500 hover:bg-blue-50 transition-colors">
                <span>Download example sheet</span>
                <Download className="w-4 h-4" />
              </button>

              {/* Input: Spreadsheet ID */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Spreadsheet ID</label>
                <input 
                  type="text" 
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="Spreadsheet ID" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm" 
                />
              </div>

              {/* Input: Name & Sheet Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Sheet Name</label>
                  <input 
                    type="text" 
                    required
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="Sheet Name" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm" 
                  />
                </div>
              </div>

              {/* Toggle: Status */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Status</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isActive}
                    onChange={() => setIsActive(!isActive)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#60a5fa]"></div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-[#93c5fd] hover:bg-[#60a5fa] text-white font-bold rounded-md shadow-sm text-sm transition-colors"
                >
                  Add
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}