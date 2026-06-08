import React from "react";
import { Laptop, Cpu, Smartphone, Layout, Settings, Network, ShieldCheck, HeartHandshake, Eye, Clock, Star } from "lucide-react";

export const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: <Laptop className="h-6 w-6 text-teal-600" />,
      title: "Laptop Repair",
      desc: "Instant Dell, Lenovo, HP screen swaps, keyboard replacements, and power circuits.",
    },
    {
      icon: <Cpu className="h-6 w-6 text-teal-600" />,
      title: "Motherboard Diagnostics",
      desc: "Expert chip-level oscilloscope diagnosis, logic power failures, micro-soldering.",
    },
    {
      icon: <Smartphone className="h-6 w-6 text-teal-600" />,
      title: "MacBook Logic Boards",
      desc: "Apple logic-board liquid damage restoration, diagnostic bypasses, high quality repairs.",
    },
    {
      icon: <Layout className="h-6 w-6 text-teal-600" />,
      title: "AMC Maintenance",
      desc: "Corporate IT Support Agreements and SLAs keeping client offices up 24/7.",
    },
    {
      icon: <Network className="h-6 w-6 text-teal-600" />,
      title: "Enterprises LAN Networks",
      desc: "Corporate Wi-Fi arrays, firewall rules, routing setups, active CCTV security panels.",
    },
    {
      icon: <Settings className="h-6 w-6 text-teal-600" />,
      title: "Data Recoveries",
      desc: "Cleanroom recoveries for water-damaged solid-state disks and physical high-RPM drives.",
    },
  ];

  const features = [
    {
      icon: <ShieldCheck className="h-5 w-5 text-teal-600" />,
      title: "Certified Engineers Only",
      desc: "Technical experts with extensive certifications in major client hardware.",
    },
    {
      icon: <HeartHandshake className="h-5 w-5 text-teal-600" />,
      title: "Pan India AMC Deliveries",
      desc: "Dedicated support centers spanning major economic active zones.",
    },
    {
      icon: <Clock className="h-5 w-5 text-teal-600" />,
      title: "2.5-Hour Turning Targets",
      desc: "We keep diagnostics synchronous and direct to prevent unnecessary delays.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 space-y-20 border-t border-gray-100">
      
      {/* Section header */}
      <div className="text-center max-w-xl mx-auto space-y-3.5">
        <span className="font-mono text-xs uppercase tracking-wider text-teal-600 font-bold block animate-fade-up">Enterprise SLA Deliveries</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-none animate-fade-up">
          Comprehensive Repairs & IT Services
        </h2>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed animate-fade-up" style={{ animationDelay: "0.1s" }}>
          From single laptop screens to full-scale managed enterprise architectures.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((svc, i) => (
          <div
            key={svc.title}
            className="glass-panel p-6 rounded-2xl flex flex-col justify-between text-left group hover:scale-[1.01] hover:shadow-lg transition-all animate-fade-up"
            style={{ animationDelay: `${0.05 * i}s` }}
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-6 group-hover:bg-teal-500 group-hover:text-white transition-colors duration-250">
                {svc.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{svc.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{svc.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Why Choose Us */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-teal-50/20 rounded-3xl p-6 sm:p-10 text-left">
        <div className="lg:col-span-5 space-y-5">
          <span className="font-mono text-xs uppercase tracking-wider text-teal-600 font-bold block">Trusted Performance</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
            Why tech departments choose SKBcomputer
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Over the last 20 years, we have built a reputation for speed, engineering skill, and using only components certified by primary parts manufacturers.
          </p>
        </div>
        <div className="lg:col-span-7 space-y-4">
          {features.map((feat) => (
            <div key={feat.title} className="bg-white/80 border border-gray-100 rounded-2xl p-5 flex items-start gap-4">
              <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                {feat.icon}
              </div>
              <div>
                <strong className="block text-sm font-bold text-gray-800 mb-0.5">{feat.title}</strong>
                <p className="text-xs text-gray-500">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="space-y-10">
        <div className="text-center">
          <span className="text-xs font-mono font-bold uppercase text-teal-600 tracking-widest bg-teal-50 px-3 py-1 rounded-full">Client Words</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2.5">What our users say</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl text-left space-y-4">
            <div className="flex text-amber-400 gap-1"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div>
            <p className="text-sm text-gray-500 italic leading-relaxed">"SKB repaired my elite MacBook logic board liquid damage inside 48 hours when other repair shops said standard replacements were required. Excellent diagnostics!"</p>
            <div>
              <strong className="block text-xs font-bold text-gray-800">Rohit Sharma</strong>
              <span className="text-[10px] text-gray-400 font-mono">Delhi Service Hub</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-left space-y-4">
            <div className="flex text-amber-400 gap-1"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div>
            <p className="text-sm text-gray-500 italic leading-relaxed">"We have contracted SKB Computer Services for our corporate IT AMC services for 3 years. Network and desktop up-times have been perfect!"</p>
            <div>
              <strong className="block text-xs font-bold text-gray-800">Ayesha Mehta</strong>
              <span className="text-[10px] text-gray-400 font-mono">Bangalore Office site</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-left space-y-4">
            <div className="flex text-amber-400 gap-1"><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /></div>
            <p className="text-sm text-gray-500 italic leading-relaxed">"Sourced an original heavy-duty 4-cell replacement battery for our HP workstation, shipped promptly, came in high-grade packaging. Perfect stock."</p>
            <div>
              <strong className="block text-xs font-bold text-gray-800">Vikram Singh</strong>
              <span className="text-[10px] text-gray-400 font-mono">Mumbai Client</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
