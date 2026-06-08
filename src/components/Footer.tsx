import React from "react";
import { Laptop, Phone, Mail, MapPin } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/50 mt-20 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-gray-100 pb-12 mb-8">
        
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-white shadow-md shadow-teal-500/10">
              <Laptop className="h-4 w-4" />
            </div>
            <strong className="font-sans font-extrabold text-lg text-gray-900 tracking-tight">
              SKBcomputer
            </strong>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            Premium motherboard diagnoses, MacBook repair work, Annual Maintenance Contracts, and certified server troubleshooting systems.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-teal-600 font-bold">Contact Desk</h4>
          <ul className="space-y-3.5 text-sm text-gray-600">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-teal-500" />
              <a href="tel:+919876543210" className="hover:text-teal-600 transition-colors">+91 98765 43210</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-teal-500" />
              <a href="mailto:support@skbcomputerservices.in" className="hover:text-teal-600 transition-colors">support@skbcomputerservices.in</a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-teal-500 mt-0.5" />
              <span>123 Premium Plaza, MG Road, New Delhi, India</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-teal-600 font-bold">Technical Certifications</h4>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold bg-white border border-gray-100 text-gray-500 px-2.5 py-1 rounded-md">Genuine Parts API</span>
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold bg-white border border-gray-100 text-gray-500 px-2.5 py-1 rounded-md">Apple Certified Desk</span>
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold bg-white border border-gray-100 text-gray-500 px-2.5 py-1 rounded-md">24/7 AMC SLA</span>
          </div>
        </div>

      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <p>© 2026 SKB Computer Services. All rights reserved. Admin Panel access only.</p>
        <p className="font-mono">PWA Native Standard Interface</p>
      </div>
    </footer>
  );
};
