import React, { useState } from "react";
import { db, handleFirestoreError } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { OperationType } from "../types";
import { Mail, Phone, MapPin, Send, HelpCircle } from "lucide-react";

export const AboutContact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const journey = [
    { year: "2004", text: "Founded as a single workbench workshop focused primarily on motherboard logic level repairs." },
    { year: "2010", text: "Expanded footprint to complete corporate AMC contracts, office setups, and local desktop diagnostic service." },
    { year: "2018", text: "Launched dedicated premium product stock for laptops, MacBook logic spares, batteries, and chargers." },
    { year: "2024", text: "Unified customer service system with 24/7 ticket SLAs and direct web support operations." },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.mobile || !formData.message) {
      alert("Please fill in all contact field requirements.");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        message: formData.message,
        responded: false,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "contacts"), payload);
      setSuccess(true);
      setFormData({ name: "", email: "", mobile: "", message: "" });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "contacts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 space-y-20 border-t border-gray-100 animate-fade-up">
      
      {/* Split layout: About Us and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
        
        <div className="lg:col-span-7 space-y-6">
          <span className="text-xs font-mono font-bold uppercase text-teal-600 tracking-wider">SKB Services</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
            Corporate Profile & Mission
          </h2>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
            SKB Computer Services has delivered premium level laptop repairs, logic support diagnostics, and server installations to enterprises and individual consumers across India. We center our focus on repair speed, parts source verification, and transparent prices.
          </p>
          <div className="grid grid-cols-2 gap-6 bg-teal-50/15 p-6 rounded-2xl border border-teal-100/40">
            <div>
              <strong className="block text-sm font-bold text-teal-800 mb-1">Our Corporate Vision</strong>
              <p className="text-xs text-gray-500 leading-relaxed">To remain India's leading microchip level diagnostic hub serving modern organizations and individuals.</p>
            </div>
            <div>
              <strong className="block text-sm font-bold text-teal-800 mb-1">Our Corporate Mission</strong>
              <p className="text-xs text-gray-500 leading-relaxed">Ensure rapid computer services, original parts sourcing, and stellar, stress-free customer care.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-lg font-bold text-gray-800 font-sans pl-1">The Journey</h3>
          <div className="space-y-4">
            {journey.map((item) => (
              <div key={item.year} className="bg-white border border-gray-100 rounded-2xl p-4.5 flex gap-4">
                <span className="font-mono text-sm font-extrabold text-teal-600 bg-teal-50 h-fit px-2.5 py-1 rounded-lg">
                  {item.year}
                </span>
                <p className="text-xs text-gray-500 leading-relaxed leading-[1.6]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid: Contact Info and Email Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left pt-12 border-t border-gray-100/60">
        
        {/* Info card */}
        <div className="lg:col-span-5 space-y-6">
          <span className="text-xs font-mono font-bold uppercase text-teal-600 tracking-wider">Get in Touch</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Headquarters & Desk Links
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">
            Have questions about system repair pricing, spare motherboard stock availability, or need corporate SLAs? Submit instructions directly.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 border border-gray-50 rounded-2xl bg-white/70">
              <Mail className="h-5 w-5 text-teal-500 flex-shrink-0" />
              <div>
                <header className="text-xs font-mono font-bold uppercase text-teal-600">Administrative Email</header>
                <a href="mailto:support@skbcomputerservices.in" className="text-sm text-gray-700 hover:text-teal-600">support@skbcomputerservices.in</a>
              </div>
            </div>

            <div className="flex gap-4 p-4 border border-gray-50 rounded-2xl bg-white/70">
              <Phone className="h-5 w-5 text-teal-500 flex-shrink-0" />
              <div>
                <header className="text-xs font-mono font-bold uppercase text-teal-600">Hotline Phone</header>
                <a href="tel:+919876543210" className="text-sm text-gray-700 hover:text-teal-600">+91 98765 43210</a>
              </div>
            </div>

            <div className="flex gap-4 p-4 border border-gray-50 rounded-2xl bg-white/70">
              <MapPin className="h-5 w-5 text-teal-500 flex-shrink-0" />
              <div>
                <header className="text-xs font-mono font-bold uppercase text-teal-600">Delhi Desk</header>
                <span className="text-sm text-gray-800">123 Premium Plaza, MG Road, New Delhi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="lg:col-span-7 bg-white/80 border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold text-gray-800 pl-1">Drop a Message</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5 text-left">
                <span className="text-xs font-semibold text-gray-600 pl-1">Your Full Name *</span>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm rounded-xl border border-gray-100 bg-white px-4 py-3 text-gray-800"
                />
              </label>

              <label className="block space-y-1.5 text-left">
                <span className="text-xs font-semibold text-gray-600 pl-1">Email Address *</span>
                <input
                  type="email"
                  placeholder="e.g. you@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm rounded-xl border border-gray-100 bg-white px-4 py-3 text-gray-800"
                />
              </label>
            </div>

            <label className="block space-y-1.5 text-left">
              <span className="text-xs font-semibold text-gray-600 pl-1">Mobile Contact Number *</span>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full text-sm rounded-xl border border-gray-100 bg-white px-4 py-3 text-gray-800"
              />
            </label>

            <label className="block space-y-1.5 text-left">
              <span className="text-xs font-semibold text-gray-600 pl-1">Inquiry details *</span>
              <textarea
                rows={4}
                placeholder="Describe your device repair needs or required AMC pricing..."
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full text-sm rounded-xl border border-gray-100 bg-white px-4 py-3 text-gray-800 transition-all focus:outline-none"
              />
            </label>

            {success && (
              <div className="p-3 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-100 rounded-xl text-center">
                Success! Thanks for submitting. Our desk will contact you within 2.5 hours.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-1.5 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3.5 shadow-md shadow-teal-500/10 cursor-pointer disabled:opacity-50 select-none duration-150"
            >
              <Send className="h-4 w-4" />
              {loading ? "Sending inquiries..." : "Send Message"}
            </button>
          </form>
        </div>

      </div>

    </section>
  );
};
