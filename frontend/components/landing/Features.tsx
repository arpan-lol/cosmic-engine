import React from 'react';
import { FileText, FileImage, Database, FileSpreadsheet, Presentation, Globe, MousePointerClick, Library, Activity } from 'lucide-react';

export function Features() {
  const formats = [
    { icon: <FileText className="w-4 h-4" />, label: "PDF" },
    { icon: <FileText className="w-4 h-4" />, label: "DOCX" },
    { icon: <FileSpreadsheet className="w-4 h-4" />, label: "XLSX" },
    { icon: <Presentation className="w-4 h-4" />, label: "PPTX" },
    { icon: <Globe className="w-4 h-4" />, label: "HTML" },
    { icon: <FileImage className="w-4 h-4" />, label: "Images" },
  ];

  return (
    <section className="bg-[#1a1a1c] text-white w-full py-24 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Card 1 */}
          <div className="p-8 rounded-md bg-[#252527] border border-gray-700 shadow-inner group hover:border-gray-500 transition-colors flex flex-col h-full hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-primary" />
              <h4 className="text-xl font-bold text-white tracking-tight">Broad Ingestion</h4>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-6 tracking-wide flex-grow leading-relaxed">
              Natively process a wide array of document types mapping directly to Markdown using advanced multimodality logic via MarkItDown.
            </p>
            <div className="flex flex-wrap gap-3 mt-auto">
              {formats.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1c] border border-gray-600 rounded-md text-xs font-semibold text-gray-300 shadow-sm border-b-2 border-b-gray-800">
                  {f.icon} {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-md bg-[#252527] border border-gray-700 shadow-inner group hover:border-gray-500 transition-colors flex flex-col h-full hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Library className="w-6 h-6 text-primary" />
              <h4 className="text-xl font-bold text-white tracking-tight">Interactive Citations</h4>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-6 tracking-wide flex-grow leading-relaxed">
              Clickable, line-level source attribution tying LLM responses directly back to the original documents with an integrated file viewer.
            </p>
            <div className="mt-auto h-24 w-full rounded-md border border-gray-600 bg-[#1a1a1c] relative overflow-hidden flex flex-col p-4 justify-center gap-3 shadow-inner">
               <div className="h-2 w-3/4 bg-gray-700 rounded-full" />
               <div className="h-2 w-1/2 bg-gray-700 rounded-full" />
               <div className="ml-auto mt-2 flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-sm border border-primary/30 pointer-events-none shadow-sm">
                  <MousePointerClick className="w-3 h-3" /> [Source: layout.pdf]
               </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-md bg-[#252527] border border-gray-700 shadow-inner group hover:border-gray-500 transition-colors flex flex-col h-full hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-primary" />
              <h4 className="text-xl font-bold text-white tracking-tight">Performance Explorer</h4>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-6 tracking-wide flex-grow leading-relaxed">
              Granular analytics for every request. Trace millisecond-level timings for semantic splitting, chunk extraction, and generation.
            </p>
            <div className="mt-auto flex flex-col gap-3">
               <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="font-medium">Vector Search</span> <span className="text-white font-mono">85ms</span>
               </div>
               <div className="w-full bg-[#1a1a1c] h-2 rounded-full overflow-hidden shadow-inner border border-gray-800">
                  <div className="bg-primary/80 w-[65%] h-full rounded-full" /> 
               </div>
               <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                  <span className="font-medium">LLM Token Gen</span> <span className="text-white font-mono">840ms</span>
               </div>
               <div className="w-full bg-[#1a1a1c] h-2 rounded-full overflow-hidden shadow-inner border border-gray-800">
                  <div className="bg-primary w-[95%] h-full rounded-full" />    
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}