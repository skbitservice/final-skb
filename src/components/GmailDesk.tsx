import React, { useState, useEffect } from "react";
import { auth, db, handleFirestoreError, getCachedAccessToken, setCachedAccessToken } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { OperationType, SupportTicket } from "../types";
import { 
  Inbox, 
  Send, 
  Mail, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  ExternalLink, 
  Lock, 
  ArrowLeft, 
  User, 
  FileText, 
  PlusSquare,
  Sparkles,
  Link2
} from "lucide-react";

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  unread: boolean;
  rawPayload: any;
}

export const GmailDesk: React.FC = () => {
  const [token, setToken] = useState<string | null>(getCachedAccessToken());
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  
  // Loading & UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeView, setActiveView] = useState<"inbox" | "compose">("inbox");
  const [linkedTickets, setLinkedTickets] = useState<SupportTicket[]>([]);
  const [searchingTickets, setSearchingTickets] = useState(false);

  // Compose State
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Automatically load emails when token is available
  useEffect(() => {
    if (token) {
      loadInbox();
    }
  }, [token]);

  // Read linked tickets when selected email changes
  useEffect(() => {
    if (selectedMessage) {
      searchCustomerTickets(extractEmail(selectedMessage.from));
    } else {
      setLinkedTickets([]);
    }
  }, [selectedMessage]);

  const extractEmail = (fromStr: string): string => {
    const match = fromStr.match(/<([^>]+)>/);
    if (match) return match[1].toLowerCase().trim();
    return fromStr.toLowerCase().trim();
  };

  const handleGmailOAuth = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
    provider.addScope("https://www.googleapis.com/auth/gmail.send");
    provider.addScope("https://www.googleapis.com/auth/gmail.modify");

    try {
      const cred = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(cred);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setToken(credential.accessToken);
        setSuccessMsg("Google Gmail integration authorized successfully!");
      } else {
        throw new Error("Unable to fetch OAuth credentials from sign-in payload.");
      }
    } catch (err: any) {
      console.error("Gmail authorization failure:", err);
      setErrorMsg(err.message || "Failed to establish single sign-on link with Gmail scopes.");
    } finally {
      setLoading(false);
    }
  };

  const disconnectGmail = () => {
    setCachedAccessToken(null);
    setToken(null);
    setMessages([]);
    setSelectedMessage(null);
    setErrorMsg("");
    setSuccessMsg("Gmail link severed safely.");
  };

  // Decode Gmail raw API base64 structures gracefully
  const decodeBase64 = (base64String: string): string => {
    try {
      const cleaned = base64String.replace(/-/g, "+").replace(/_/g, "/");
      return decodeURIComponent(
        atob(cleaned)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch (err) {
      try {
        return atob(base64String.replace(/-/g, "+").replace(/_/g, "/"));
      } catch {
        return "";
      }
    }
  };

  const getBodyText = (payload: any): string => {
    if (!payload) return "";
    if (payload.body && payload.body.data) {
      return decodeBase64(payload.body.data);
    }
    if (payload.parts) {
      // Look for plain-text part first
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body && part.body.data) {
          return decodeBase64(part.body.data);
        }
      }
      // Look for HTML part if no plain-text
      for (const part of payload.parts) {
        if (part.mimeType === "text/html" && part.body && part.body.data) {
          return decodeBase64(part.body.data);
        }
      }
      // Deep level fallbacks
      for (const part of payload.parts) {
        if (part.body && part.body.data) {
          return decodeBase64(part.body.data);
        }
        if (part.parts) {
          const nested = getBodyText(part);
          if (nested) return nested;
        }
      }
    }
    return "";
  };

  const loadInbox = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Fetch recent list of user's thread messages
      const listResponse = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=12",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!listResponse.ok) {
        const errorDetail = await listResponse.json();
        if (listResponse.status === 401) {
          disconnectGmail();
          throw new Error("Local access credentials expired. Please re-authenticate your mailbox.");
        }
        throw new Error(errorDetail?.error?.message || "Internal API query disallowed.");
      }

      const listData = await listResponse.json();
      if (!listData.messages || listData.messages.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // 2. Fetch structural details for each message in parallel
      const detailedMessages = await Promise.all(
        listData.messages.map(async (msgStub: { id: string }) => {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgStub.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!detailRes.ok) return null;
          const details = await detailRes.json();

          const headers = details.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

          return {
            id: details.id,
            threadId: details.threadId,
            subject: getHeader("Subject") || "(No Subject)",
            from: getHeader("From") || "Unknown Sender",
            to: getHeader("To") || "Unknown Recipient",
            date: getHeader("Date") || "",
            snippet: details.snippet || "",
            body: getBodyText(details.payload),
            unread: details.labelIds?.includes("UNREAD") || false,
            rawPayload: details,
          } as GmailMessage;
        })
      );

      setMessages(detailedMessages.filter((m) => m !== null) as GmailMessage[]);
    } catch (err: any) {
      console.error("Inboxes sync error:", err);
      setErrorMsg(err.message || "Failed to contact Gmail service endpoints.");
    } finally {
      setLoading(false);
    }
  };

  const searchCustomerTickets = async (email: string) => {
    if (!email) return;
    setSearchingTickets(true);
    try {
      const q = query(collection(db, "tickets"), where("customerEmail", "==", email.toLowerCase().trim()));
      const snap = await getDocs(q);
      const ticketsList: SupportTicket[] = [];
      snap.forEach((d) => {
        ticketsList.push({ id: d.id, ...d.data() } as any);
      });
      setLinkedTickets(ticketsList);
    } catch (err) {
      console.warn("Failed syncing customer repair history tickets:", err);
    } finally {
      setSearchingTickets(false);
    }
  };

  const createSupportTicketFromEmail = async (emailMsg: GmailMessage) => {
    if (!confirm("Do you want to register an official support repair ticket for this sender?")) return;
    setSearchingTickets(true);
    setErrorMsg("");
    setSuccessMsg("");

    const customerEmail = extractEmail(emailMsg.from);
    const customerName = emailMsg.from.split("<")[0].trim() || customerEmail.split("@")[0];

    try {
      const pinCode = "SKB-" + Math.floor(100000 + Math.random() * 900000).toString();
      const payload = {
        id: pinCode,
        customerName: customerName,
        customerMobile: "7011396007", // Fallback mobile
        customerEmail: customerEmail.toLowerCase(),
        deviceBrand: "Microchip Level Diagnostic Required",
        deviceModel: "Extracted via Email Inbox",
        issueDescription: `Email Inquiry Thread Subject: "${emailMsg.subject}"\n---\nEmail Text Content:\n${emailMsg.body || emailMsg.snippet}`,
        status: "Open",
        responseMessage: "",
        createdAt: new Date().toISOString(),
        userId: auth.currentUser?.uid || "admin-system",
      };

      await addDoc(collection(db, "tickets"), payload);
      setSuccessMsg(`Official Ticket Reference ${pinCode} created successfully! Link coordinates synchronized.`);
      searchCustomerTickets(customerEmail);
    } catch (err: any) {
      console.error("Failed making email ticket:", err);
      setErrorMsg("Failed creating structured ticket in support database coordinates.");
    } finally {
      setSearchingTickets(false);
    }
  };

  // Helper to compose RFC 2822 compliancy block safely
  const makeBase64Email = (to: string, from: string, subject: string, bodyText: string): string => {
    const lines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      ``,
      bodyText,
    ];
    const emailString = lines.join("\n");
    // URL-safe base64 encoding
    return btoa(unescape(encodeURIComponent(emailString)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) {
      setErrorMsg("Please complete all fields in the message compose frame.");
      return;
    }

    if (!confirm(`Confirm outbound sending of this message to ${composeTo}?`)) return;

    setSendingEmail(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const base64Raw = makeBase64Email(
        composeTo.trim(),
        auth.currentUser?.email || "me",
        composeSubject.trim(),
        composeBody
      );

      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: base64Raw }),
        }
      );

      if (!res.ok) {
        const errDetail = await res.json();
        throw new Error(errDetail?.error?.message || "Failed sending message payload via Google Servers.");
      }

      setSuccessMsg(`Outbound message sent successfully to ${composeTo}!`);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setActiveView("inbox");
      loadInbox();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Outbound communication delivery failure.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText) return;

    if (!confirm(`Send support agent reply to ${extractEmail(selectedMessage.from)}?`)) return;

    setSendingReply(true);
    let originalId = selectedMessage.id;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const fromEmail = auth.currentUser?.email || "me";
      const subjectLine = selectedMessage.subject.toLowerCase().startsWith("re:")
        ? selectedMessage.subject
        : `Re: ${selectedMessage.subject}`;
      
      const rfcMime = [
        `To: ${extractEmail(selectedMessage.from)}`,
        `Subject: ${subjectLine}`,
        `In-Reply-To: ${selectedMessage.rawPayload?.payload?.headers?.find((h: any) => h.name.toLowerCase() === "message-id")?.value || originalId}`,
        `References: ${selectedMessage.rawPayload?.payload?.headers?.find((h: any) => h.name.toLowerCase() === "message-id")?.value || originalId}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ``,
        `${replyText}\n\n---\nIn Response to:\n> ${selectedMessage.snippet}`,
      ].join("\n");

      const base64Raw = btoa(unescape(encodeURIComponent(rfcMime)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            raw: base64Raw,
            threadId: selectedMessage.threadId
          }),
        }
      );

      if (!res.ok) {
        const errDetail = await res.json();
        throw new Error(errDetail?.error?.message || "Failed sending response via Gmail API.");
      }

      setSuccessMsg(`Reply delivered successfully with thread references.`);
      setReplyText("");
      
      // Mark as read (removing UNREAD tag)
      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${originalId}/batchModify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            removeLabelIds: ["UNREAD"]
          }),
        }
      );

      loadInbox();
      setSelectedMessage(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed conveying response block to SMTP Gmail gateways.");
    } finally {
      setSendingReply(false);
    }
  };

  const handleArchiveEmail = async (id: string) => {
    if (!confirm("Are you sure you want to remove INBOX label from this message? (Archive)")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/batchModify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            removeLabelIds: ["INBOX"]
          }),
        }
      );

      if (!res.ok) throw new Error("Failed batchModify.");
      setSuccessMsg("Inquiry archived safely out of current view.");
      setSelectedMessage(null);
      loadInbox();
    } catch (err: any) {
      setErrorMsg("Failed modifying message labels.");
    }
  };

  // Render Authorization trigger screen if token is empty
  if (!token) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-2xl mx-auto shadow-xs">
        <div className="mx-auto w-16 h-16 bg-teal-50 border border-teal-100/60 rounded-2xl flex items-center justify-center text-teal-600">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-teal-600 tracking-wider">SKB Enterprise Workspace</span>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Connect Administrator Gmail Desk
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Link your authorized corporate repair account safely to view pending diagnostic mail, dispatch technician answers, and auto-convert emails to support database coordinates.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 text-xs font-semibold text-red-800 bg-red-50 border border-red-100 rounded-xl max-w-md mx-auto">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleGmailOAuth}
          disabled={loading}
          className="gsi-material-button mx-auto max-w-xs flex justify-center items-center cursor-pointer select-none active:scale-98 transition-all hover:bg-gray-50"
          style={{ width: "240px", height: "46px" }}
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper">
            <div className="gsi-material-button-icon">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents" style={{ fontSize: "13px" }}>Connect Gmail Desk</span>
          </div>
        </button>

        <p className="text-[10px] text-gray-400">
          Uses secure, sandboxed Workspace OAuth 2.0. No credentials are saved in telemetry databases.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden animate-fade-in text-left">
      
      {/* Top dashboard control rail */}
      <div className="border-b border-gray-100 p-5.5 bg-gray-50/50 flex flex-wrap justify-between items-center gap-4.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-teal-100 border border-teal-200 rounded-xl flex items-center justify-center text-teal-700">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              SKB Workspace Gmail Desk
              <span className="bg-teal-100 text-teal-800 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">CONNECTIVITY LIVE</span>
            </h3>
            <p className="text-[10px] text-gray-400">
              Active Session: {auth.currentUser?.email || "Authenticated Support Office"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeView === "inbox" ? (
            <button
              onClick={() => setActiveView("compose")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer inline-flex items-center gap-1.5 transition-all"
            >
              <PlusSquare className="h-3.5 w-3.5" />
              Compose Mail
            </button>
          ) : (
            <button
              onClick={() => { setActiveView("inbox"); setErrorMsg(""); setSuccessMsg(""); }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-150 text-gray-600 cursor-pointer inline-flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Inbox
            </button>
          )}

          <button
            onClick={loadInbox}
            disabled={loading}
            className="p-2 bg-white border border-gray-100 text-gray-500 hover:text-teal-600 hover:bg-teal-50/20 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
            title="Reload mailbox"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>

          <button
            onClick={disconnectGmail}
            className="px-3.5 py-2 border border-red-100 hover:bg-red-50 text-red-500 hover:text-red-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Sever Gmail
          </button>
        </div>
      </div>

      {/* Advisory feedback blocks */}
      {(errorMsg || successMsg) && (
        <div className="px-5.5 pt-4.5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-teal-50 text-teal-800 border border-teal-100 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Inbox view split-panel or Compose View */}
      {activeView === "compose" ? (
        <div className="p-5.5 sm:p-7 max-w-3xl mx-auto space-y-6">
          <h4 className="text-base font-bold text-gray-800 pr-1">New Message</h4>
          <form onSubmit={handleSendCompose} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-gray-600 pl-1">To Email Address *</span>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-gray-600 pl-1">Message Subject *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. LAPTOP DIagnostic Report #SKB-553"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-600 pl-1 flex items-center gap-1.5">
                Message Body (Plain Text) *
                <span className="text-[10px] text-gray-400 font-normal">Sent directly via Gmail</span>
              </span>
              <textarea
                rows={10}
                required
                placeholder="Write your email details here..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-100 bg-gray-50/30 px-4 py-3 font-sans transition-all focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={sendingEmail}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6 py-3 cursor-pointer disabled:opacity-50 select-none transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              {sendingEmail ? "Dispatching Message..." : "Send Message"}
            </button>
          </form>
        </div>
      ) : (
        /* SPLIT SCREEN WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-160">
          
          {/* LEFT COLUMN: Messages list stub */}
          <div className="lg:col-span-5 border-r border-gray-100 overflow-y-auto max-h-180">
            <div className="p-4 bg-gray-50/20 border-b border-gray-50 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-600 flex items-center gap-2">
                <Inbox className="h-4 w-4 text-teal-600" />
                Support Mailbox ({messages.length})
              </span>
            </div>

            {loading && messages.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 font-mono space-y-1.5 animate-pulse">
                <RefreshCw className="h-5 w-5 text-teal-500 animate-spin mx-auto" />
                <p>Syncing Gmail Server Threads...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 italic font-mono space-y-1 h-full flex flex-col justify-center max-w-sm mx-auto">
                <Mail className="h-5 w-5 text-gray-300 mx-auto" />
                <p>Your Workspace Inbox is completely clean.</p>
                <p className="text-[10px] text-gray-400 font-sans not-italic leading-relaxed">Ensure mail exists on the linked account, or try composing a new diagnostic email above.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => { setSelectedMessage(msg); setErrorMsg(""); setSuccessMsg(""); }}
                    className={`w-full text-left p-4.5 block transition-all duration-100 hover:bg-gray-50/60 leading-normal relative select-none cursor-pointer ${
                      selectedMessage?.id === msg.id ? "bg-teal-50/15 border-l-3 border-teal-500" : ""
                    } ${msg.unread ? "font-semibold" : ""}`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <strong className="text-xs text-gray-800 block truncate max-w-44 sm:max-w-64">
                        {msg.from.split("<")[0] || extractEmail(msg.from)}
                      </strong>
                      <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">
                        {msg.date.replace(/^[a-zA-Z]+,\s/, "").split(/\s\+/)[0].slice(0, 11)}
                      </span>
                    </div>

                    <h4 className="text-[11px] text-gray-700 font-bold truncate mb-1">
                      {msg.subject}
                    </h4>

                    <p className="text-[10px] text-gray-400 font-sans line-clamp-2 leading-relaxed">
                      {msg.snippet}
                    </p>

                    {msg.unread && (
                      <span className="absolute top-4.5 right-4 h-1.5 w-1.5 bg-teal-600 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Thread Details & reply frame */}
          <div className="lg:col-span-7 bg-white overflow-y-auto max-h-180">
            {selectedMessage ? (
              <div className="p-5 sm:p-6 space-y-6">
                
                {/* Header coordinates */}
                <div className="border-b border-gray-100 pb-4.5 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900 leading-normal font-sans pr-1">
                      {selectedMessage.subject}
                    </h3>
                    <div className="text-[11px] text-gray-500 font-sans flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-normal">
                      <span>From: <strong className="text-gray-700 font-bold">{selectedMessage.from}</strong></span>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <span>Date: {selectedMessage.date}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleArchiveEmail(selectedMessage.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-neutral-50 rounded-xl transition-all cursor-pointer"
                    title="Archive this email message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Email Content Body */}
                <div className="p-4 bg-gray-50/50 border border-gray-50 rounded-2xl">
                  <header className="text-[9px] text-gray-400 font-mono uppercase mb-2 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Gmail Thread Message Segment
                  </header>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-sans font-normal max-h-80 overflow-y-auto pr-1">
                    {selectedMessage.body || selectedMessage.snippet}
                  </p>
                </div>

                {/* Direct Database Support Sync link-frame */}
                <div className="p-4 bg-teal-50/15 border border-teal-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-teal-800 inline-flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5 text-teal-600" />
                      Connected Diagnostics Database Link
                    </h4>
                    {searchingTickets && (
                      <span className="text-[9px] font-mono text-teal-600 animate-pulse">Syncing tickets...</span>
                    )}
                  </div>

                  {linkedTickets.length === 0 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
                      <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                        Sender has no active motherboard diagnostic tickets in our support database. You can auto-generate a structured SLA record from this thread.
                      </p>
                      <button
                        onClick={() => createSupportTicketFromEmail(selectedMessage)}
                        disabled={searchingTickets}
                        className="px-3.5 py-2 whitespace-nowrap bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 transition-all disabled:opacity-50"
                      >
                        <PlusSquare className="h-3 w-3" />
                        Generate Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 font-sans pl-1">
                        We found matched support ticket coordinates for this sender email:
                      </p>
                      {linkedTickets.map((tk) => (
                        <div key={tk.id} className="flex justify-between items-center p-2.5 bg-white border border-teal-100/65 rounded-xl text-[10px]">
                          <div>
                            <span className="font-bold text-teal-800">REF: {tk.id}</span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="text-gray-500 capitalize">{tk.deviceBrand} {tk.deviceModel}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                            tk.status === "Open" 
                              ? "bg-amber-100 text-amber-800" 
                              : tk.status === "Closed"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-purple-100 text-purple-800"
                          }`}>
                            {tk.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <div className="border-t border-gray-100 pt-5 space-y-3.5">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-teal-600" />
                    Compose support representative reply
                  </span>

                  <form onSubmit={handleSendReply} className="space-y-3">
                    <textarea
                      rows={5}
                      required
                      placeholder={`Write your customer reply message here... (Will deliver under In-Reply-To constraints)`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-100 bg-gray-50/20 px-4 py-3 font-sans transition-all focus:bg-white"
                    />

                    <button
                      type="submit"
                      disabled={sendingReply}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 py-2.5 cursor-pointer disabled:opacity-50 select-none transition-all"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {sendingReply ? "Transmitting Reply..." : "Send Reply Message"}
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 italic text-xs h-full flex flex-col justify-center items-center space-y-3.5 min-h-120">
                <div className="p-4 bg-gray-50 rounded-2xl text-gray-350">
                  <Inbox className="h-9 w-9 text-gray-300" />
                </div>
                <div>
                  <p className="font-sans font-bold text-gray-700 not-italic">No message selected</p>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed mt-1">Select an email thread in the left panel to review message content, link support tickets, or dispatch technician replies.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
export default GmailDesk;
