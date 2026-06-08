import React from "react";
import { ArrowRight, Laptop, ShieldCheck, Cpu } from "lucide-react";

interface HeroSectionProps {
  onActionClick: (tab: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onActionClick }) => {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      
      {/* Copy content */}
      <div className="lg:col-span-7 space-y-7 text-left animate-fade-up">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700">
          <span className="flex h-1.8 w-1.8 rounded-full bg-teal-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
            Mint Luxe Premium IT Support
          </span>
        </div>

        <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.05]">
          Premium Laptop Repair and <span className="text-teal-600">Enterprise Support</span>
        </h1>
        
        <p className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-xl">
          Elegant diagnostics, lightning turnaround, and trusted support for motherboards, MacBooks, system networking, business AMC contracts, and component delivery.
        </p>

        <div className="flex flex-wrap gap-3.5">
          <button
            onClick={() => onActionClick("support")}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all focus:outline-none"
          >
            Create Support Ticket
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onActionClick("products")}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white border border-gray-100 text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer shadow-sm focus:outline-none"
          >
            Shop Premium Parts
          </button>
        </div>

      </div>

      {/* Floating Glass Stats Panel */}
      <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "0.15s" }}>
        
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                <Laptop className="h-5 w-5" />
              </div>
              <div className="text-left">
                <header className="text-xs text-gray-400 font-medium">Auto Ticket Engine</header>
                <strong className="text-sm font-bold text-gray-800">24x7 SLA support</strong>
              </div>
            </div>
            <span className="flex h-3 w-3 rounded-full bg-teal-500 animate-ping" />
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-gray-100/60 py-5">
            <div className="text-left">
              <p className="text-xs text-gray-400 font-medium">Total Tickets Resolved</p>
              <strong className="text-2xl sm:text-3xl font-extrabold text-teal-700">4,800+</strong>
            </div>
            <div className="text-left border-l border-gray-100 pl-4">
              <p className="text-xs text-gray-400 font-medium">Fastest SLA Response</p>
              <strong className="text-2xl sm:text-3xl font-extrabold text-purple-700">2.5 hrs</strong>
            </div>
          </div>

          <div className="space-y-4">
            
            <div className="flex items-start gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mt-1 flex-shrink-0">
                <Cpu className="h-4.5 w-4.5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Certified Micro-chip Repair</strong>
                <p className="text-[11px] text-gray-500">Dedicated cleanroom workbench for logic board micro-soldering and restoration.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 mt-1 flex-shrink-0">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <strong className="text-xs font-bold text-gray-800 block">Genuine OEM Spares Only</strong>
                <p className="text-[11px] text-gray-500">Every replacement is guaranteed to be a certified brand OEM component.</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
