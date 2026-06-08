import React, { useState } from "react";
import { db, handleFirestoreError } from "../firebase";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { OperationType, SupportTicket } from "../types";
import { ArrowUpRight, HelpCircle, Ticket, Compass, Lock, Search, FileText } from "lucide-react";

interface SupportCenterProps {
  user: { email: string; name: string; role: "customer" | "admin" } | null;
  onNavigateToDashboard: () => void;
}

export const SupportCenter: React.FC<SupportCenterProps> = ({ user, onNavigateToDashboard }) => {
  // Raised state
  const [formData, setFormData] = useState({
    subject: "",
    priority: "Normal" as "Normal" | "High" | "Urgent",
    message: "",
    phone: "",
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Tracker state
  const [trackId, setTrackId] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<SupportTicket | null>(null);
  const [trackMessage, setTrackMessage] = useState("");

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    const customerName = user ? user.name : formData.name;
    const customerEmail = user ? user.email : formData.email;
    const phone = formData.phone;

    if (!customerName || !customerEmail || !phone || !formData.subject || !formData.message) {
      alert("Please fill in all required ticket details.");
      return;
    }

    setLoading(true);
    setSuccessId(null);

    const ticketId = `SKB-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const payload = {
        id: ticketId,
        userId: user ? user.email : "guest",
        customerName,
        customerEmail,
        phone,
        subject: formData.subject,
        message: formData.message,
        status: "Open",
        priority: formData.priority,
        reply: "Helpdesk support engineers will draft a diagnosis reply within 2.5 hours.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "tickets"), payload);
      setSuccessId(ticketId);
      setFormData({
        subject: "",
        priority: "Normal",
        message: "",
        phone: "",
        name: "",
        email: "",
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId || !trackEmail) {
      setTrackMessage("Please provide both your Ticket ID and Email.");
      return;
    }

    setTrackingLoading(true);
    setTrackResult(null);
    setTrackMessage("");

    try {
      const q = query(
        collection(db, "tickets"),
        where("id", "==", trackId.trim().toUpperCase()),
        where("customerEmail", "==", trackEmail.trim().toLowerCase())
      );
      const snap = await getDocs(q);
      
      const found = snap.docs.map((d) => d.data()) as SupportTicket[];
      const matched = found.find(
        (t) => t.customerEmail.toLowerCase() === trackEmail.trim().toLowerCase()
      );

      if (matched) {
        setTrackResult(matched);
      } else {
        setTrackMessage("No ticket found with matching Ticket ID and active email. Please try again.");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "tickets");
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 text-left border-t border-gray-100 animate-fade-up">
      
      {/* Raising side */}
      <div className="lg:col-span-7 bg-white/85 border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-teal-600">Auto Helpdesk</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
              Raise a Support Ticket
            </h2>
          </div>
        </div>

        <form onSubmit={handleCreateTicket} className="space-y-4.5">
          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-gray-600 pl-1">Full Name *</span>
                <input
                  type="text"
                  placeholder="e.g. Liam Smith"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm rounded-xl border border-gray-100 px-4 py-3 text-gray-800 bg-gray-50/50 focus:bg-white"
                />
              </label>
              
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-gray-600 pl-1">Email Address *</span>
                <input
                  type="email"
                  placeholder="e.g. liam@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm rounded-xl border border-gray-100 px-4 py-3 text-gray-800 bg-gray-50/50 focus:bg-white"
                />
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-600 pl-1">Phone Mobile Number *</span>
              <input
                type="tel"
                placeholder="e.g. +91 91234 56789"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-sm rounded-xl border border-gray-100 px-4 py-3 text-gray-800 bg-gray-50/50 focus:bg-white"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-600 pl-1">Device Priority Level</span>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full text-sm rounded-xl border border-gray-100 px-4 py-3 text-gray-500 bg-gray-50/50 focus:bg-white cursor-pointer"
              >
                <option value="Normal">Normal Support (Laptop repair / screens)</option>
                <option value="High">High (Logical errors / water spills)</option>
                <option value="Urgent">Urgent SLA (Business networking criticals)</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-gray-600 pl-1">Device model & brief subject *</span>
            <input
              type="text"
              placeholder="e.g. MacBook Pro logic failure / DELL screen replacement"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full text-sm rounded-xl border border-gray-100 px-4 py-3 text-gray-800 bg-gray-50/50 focus:bg-white"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-gray-600 pl-1">Detailed problem description *</span>
            <textarea
              rows={4}
              placeholder="Describe what occurs, when it began, and specific symptoms..."
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full text-sm rounded-xl border border-gray-100 px-4 py-3 text-gray-800 bg-gray-50/50 focus:bg-white transition-all focus:outline-none"
            />
          </label>

          {successId && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-150 text-teal-800 text-xs">
              <strong className="block text-sm">Success! Ticket created successfully.</strong>
              <p className="mt-1">
                Your ticket reference identifier is <strong className="font-mono text-teal-900 font-extrabold">{successId}</strong>. 
                Keep this code handy! You can run manual status tracking using the tracker console, or view updates on your personal profile dashboard.
              </p>
              {user && (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  View on My Account Dashboard
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 tracking-wide text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? "Registering service ticket..." : "Submit Support Ticket"}
          </button>
        </form>
      </div>

      {/* Tracking side */}
      <div className="lg:col-span-5 space-y-6">
        
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-6.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 text-sm">
              <Search className="h-4.5 w-4.5" />
            </div>
            <strong className="text-gray-800 font-bold">Track Ticket Status</strong>
          </div>

          <form onSubmit={handleTrackTicket} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-600 pl-1">Ticket Reference ID</span>
              <input
                type="text"
                placeholder="e.g. SKB-1234"
                required
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-100 px-3.5 py-3 text-gray-800"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-600 pl-1">Associated Email Address</span>
              <input
                type="email"
                placeholder="e.g. customer@example.com"
                required
                value={trackEmail}
                onChange={(e) => setTrackEmail(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-100 px-3.5 py-3 text-gray-800"
              />
            </label>

            {trackMessage && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                {trackMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={trackingLoading}
              className="w-full inline-flex items-center justify-center rounded-xl bg-gray-900 hover:bg-black text-white font-bold py-3 text-xs cursor-pointer duration-150"
            >
              {trackingLoading ? "Tracking database..." : "Track Ticket Status"}
            </button>
          </form>

          {/* Tracking Result Box */}
          {trackResult && (
            <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-100/50 space-y-3.5 text-left animate-fade-up">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-teal-600">{trackResult.id}</span>
                  <p className="text-xs font-bold text-gray-800 line-clamp-1">{trackResult.subject}</p>
                </div>
                <span className={`text-[10px] font-mono tracking-wide uppercase font-bold px-2 py-0.8 rounded ${
                  trackResult.status === "Open" ? "bg-amber-100 text-amber-800" :
                  trackResult.status === "Pending" ? "bg-blue-100 text-blue-800" :
                  trackResult.status === "Resolved" ? "bg-emerald-100 text-emerald-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {trackResult.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600">
                <p><strong>Priority:</strong> {trackResult.priority}</p>
                <p><strong>Raised on:</strong> {new Date(trackResult.createdAt).toLocaleDateString()}</p>
                <p className="bg-white/80 p-2.5 rounded-lg border border-gray-50/50 leading-relaxed max-h-24 overflow-y-auto">
                  <strong>Issue description:</strong><br />
                  {trackResult.message}
                </p>
              </div>

              <div className="bg-white/90 p-4 border border-teal-100 rounded-xl space-y-1">
                <strong className="block text-xs font-sans text-teal-800 font-extrabold flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Engineering Lab Reply:
                </strong>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {trackResult.reply}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </section>
  );
};
