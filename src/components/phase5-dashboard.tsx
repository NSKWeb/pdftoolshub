'use client';

import React, { useState, useEffect } from 'react';

export const Phase5Dashboard = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // In a real app, we would fetch from /api/v5/*
    setMetrics({
      quantum: { speedup: '1000x', active: true },
      blockchain: { status: 'Verified', network: 'Polygon' },
      autonomous: { health: 98, selfHealing: 'Active' },
      global: { languages: 105, regions: 12 },
      ipo: { readiness: '95%', targetDate: 'Q4 2024' }
    });
  }, []);

  if (!metrics) return <div>Loading Phase 5 Metrics...</div>;

  return (
    <div className="p-6 bg-slate-900 text-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold mb-6 text-blue-400">Phase 5: Global Dominance Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          title="Quantum Processing" 
          value={metrics.quantum.speedup} 
          status="Optimized" 
          color="text-purple-400"
        />
        <MetricCard 
          title="Blockchain Verification" 
          value={metrics.blockchain.network} 
          status={metrics.blockchain.status} 
          color="text-green-400"
        />
        <MetricCard 
          title="Autonomous Systems" 
          value={`${metrics.autonomous.health}%`} 
          status={metrics.autonomous.selfHealing} 
          color="text-blue-400"
        />
        <MetricCard 
          title="Global Expansion" 
          value={`${metrics.global.languages} Languages`} 
          status={`${metrics.global.regions} Regions`} 
          color="text-yellow-400"
        />
        <MetricCard 
          title="IPO Readiness" 
          value={metrics.ipo.readiness} 
          status={metrics.ipo.targetDate} 
          color="text-red-400"
        />
        <MetricCard 
          title="Market Dominance" 
          value="45.2%" 
          status="Market Leader" 
          color="text-cyan-400"
        />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, status, color }: any) => (
  <div className="p-4 bg-slate-800 rounded border border-slate-700">
    <h3 className="text-sm uppercase tracking-wider text-slate-400">{title}</h3>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    <p className="text-xs mt-2 text-slate-500 font-medium">{status}</p>
  </div>
);
