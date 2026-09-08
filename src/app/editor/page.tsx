"use client";

import { useState } from "react";

export default function AdvancedEditor() {
  const [layers, setLayers] = useState([{ id: 1, name: "Base PDF", visible: true }]);
  const [elements, setElements] = useState<any[]>([]);

  const addField = (type: string) => {
    setElements([...elements, { id: Date.now(), type, x: 50, y: 50, label: `New ${type}` }]);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar - Tools */}
      <div className="w-64 border-r border-slate-700 p-4 flex flex-col gap-4">
        <h2 className="font-bold text-lg mb-4">Form Builder</h2>
        <button onClick={() => addField("text")} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-left">
          + Text Field
        </button>
        <button onClick={() => addField("checkbox")} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-left">
          + Checkbox
        </button>
        <button onClick={() => addField("signature")} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-left">
          + Signature Area
        </button>

        <h2 className="font-bold text-lg mt-8 mb-4">Layers</h2>
        <div className="space-y-2">
          {layers.map(layer => (
            <div key={layer.id} className="flex items-center justify-between p-2 bg-slate-800 rounded">
              <span>{layer.name}</span>
              <input type="checkbox" checked={layer.visible} readOnly />
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-auto relative p-8 flex justify-center bg-slate-950">
        <div className="w-[600px] h-[800px] bg-white text-black relative shadow-2xl">
          <div className="absolute inset-0 border-2 border-dashed border-slate-300 pointer-events-none flex items-center justify-center text-slate-300">
            PDF Page Content Area
          </div>
          {elements.map(el => (
            <div
              key={el.id}
              className="absolute p-2 border border-accent bg-accent/10 cursor-move"
              style={{ left: el.x, top: el.y }}
            >
              {el.label}
            </div>
          ))}
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-64 border-l border-slate-700 p-4">
        <h2 className="font-bold text-lg mb-4">Properties</h2>
        <p className="text-slate-500 text-sm">Select an element to edit properties.</p>
        
        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase text-slate-500 mb-2">Collaboration</h3>
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center text-xs">JD</div>
            <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center text-xs">AS</div>
            <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-slate-900 flex items-center justify-center text-xs">+1</div>
          </div>
          <p className="text-xs mt-2 text-green-400">3 users editing now</p>
        </div>

        <button className="w-full mt-12 py-3 bg-accent text-slate-900 font-bold rounded-lg hover:bg-accent/90">
          Save Changes
        </button>
      </div>
    </div>
  );
}
