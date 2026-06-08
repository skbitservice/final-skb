import React, { useState, useEffect } from "react";
import { auth, db, getCachedAccessToken, setCachedAccessToken } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  PlusSquare, 
  Search, 
  Users, 
  Settings, 
  Sparkles, 
  BellRing, 
  Radio, 
  HelpCircle,
  Hash,
  Terminal,
  Activity,
  User,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useNotifications } from "./NotificationsContext";

interface ChatSpace {
  name: string;
  displayName: string;
  type: string;
  singleUserBotDm?: boolean;
}

interface ApiTelemetryLog {
  timestamp: string;
  method: string;
  url: string;
  payload: any;
  status: "success" | "error" | "pending";
  response?: any;
}

export const GoogleChatDesk: React.FC = () => {
  const { triggerNotification } = useNotifications();
  const [token, setToken] = useState<string | null>(getCachedAccessToken());
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ChatSpace | null>(null);
  
  // UI and loading states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // New Space Form State
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceType, setNewSpaceType] = useState<"SPACE" | "GROUP_CHAT">("SPACE");

  // Message Form State
  const [messageText, setMessageText] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("normal");
  const [isAlertNotification, setIsAlertNotification] = useState(false);

  // Auto Routing Active state
  const [isAutoRoutingEnabled, setIsAutoRoutingEnabled] = useState(() => {
    return localStorage.getItem("skb-chat-autoroute") === "true";
  });

  // Simulator fallbacks
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);
  const [simulatorLog, setSimulatorLog] = useState<string[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiTelemetryLog[]>([]);

  // Realistic mock lists for the simulator setup
  const mockSpaces: ChatSpace[] = [
    { name: "spaces/mock-skb-alerts-101", displayName: "🚨 skb-emergency-support-alerts", type: "SPACE" },
    { name: "spaces/mock-tech-dispatch-90", displayName: "🛠️ hardware-repairs-dispatch", type: "SPACE" },
    { name: "spaces/mock-client-relations-34", displayName: "🤝 skb-customer-care-room", type: "SPACE" },
    { name: "spaces/mock-general-chat-01", displayName: "⛺ skb-general", type: "SPACE" }
  ];

  useEffect(() => {
    if (token) {
      loadSpaces();
    } else {
      // Prompt user to link account, or pre-enable simulator so they have an active viewport instantly
      setIsSimulatorMode(true);
      addLogEntry("System pre-selected simulator sandbox mode. Authenticate with Google Workspace and add 'chat' scopes to fetch live enterprise spaces.");
    }
  }, [token]);

  const addLogEntry = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSimulatorLog((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const addTelemetryLog = (method: string, url: string, payload: any, status: "success" | "error" | "pending", response?: any) => {
    const log: ApiTelemetryLog = {
      timestamp: new Date().toLocaleTimeString(),
      method,
      url,
      payload,
      status,
      response
    };
    setApiLogs((prev) => [log, ...prev.slice(0, 19)]);
  };

  const loadSpaces = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    addLogEntry("Fetching workspaces list via chat.googleapis.com API...");
    addTelemetryLog("GET", "https://chat.googleapis.com/v1/spaces", null, "pending");

    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      const loadedSpaces: ChatSpace[] = data.spaces || [];
      
      setSpaces(loadedSpaces);
      addTelemetryLog("GET", "https://chat.googleapis.com/v1/spaces", null, "success", data);
      addLogEntry(`Successfully fetched ${loadedSpaces.length} live workspace spaces.`);

      if (loadedSpaces.length === 0) {
        setIsSimulatorMode(true);
        addLogEntry("No live enterprise spaces found. Activating Sandbox mode so dashboard is interactive.");
      } else {
        setIsSimulatorMode(false);
        if (!selectedSpace && loadedSpaces.length > 0) {
          setSelectedSpace(loadedSpaces[0]);
        }
      }
    } catch (err: any) {
      console.warn("Failed to fetch live Chat spaces:", err);
      setErrorMsg(err.message || "Domain restricts access to Chat APIs or scopes are missing. Sandbox simulator activated.");
      setIsSimulatorMode(true);
      setSpaces(mockSpaces);
      setSelectedSpace(mockSpaces[0]);
      addTelemetryLog("GET", "https://chat.googleapis.com/v1/spaces", null, "error", { error: err.message });
      addLogEntry(`Error fetching spaces: ${err.message || "Failed request"}. Displaying interactive simulated environments.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLink = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
    provider.addScope("https://www.googleapis.com/auth/gmail.send");
    provider.addScope("https://www.googleapis.com/auth/gmail.modify");
    provider.addScope("https://www.googleapis.com/auth/chat"); // Crucial Chat scope

    try {
      addLogEntry("Initiating Google Single Sign-On pop-up authorization flow...");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setToken(credential.accessToken);
        setCachedAccessToken(credential.accessToken);
        setSuccessMsg("Google Chat and Gmail integration linked successfully!");
        addLogEntry(`Linked OAuth user: ${result.user?.email || "Authenticated Domain User"}`);
        setIsSimulatorMode(false);
      } else {
        throw new Error("Unable to capture Google OAuth token from popup response.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Authorization failed. Simulator sandbox mode remains active.");
      addLogEntry(`Authorization Error: ${err.message || "Popup cancelled/blocked"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    setCreatingSpace(true);
    setErrorMsg("");
    setSuccessMsg("");

    const parsedPayload = {
      spaceType: newSpaceType,
      displayName: newSpaceName.trim()
    };

    addLogEntry(`Attempting to provision space room: "${newSpaceName}"`);
    addTelemetryLog("POST", "https://chat.googleapis.com/v1/spaces", parsedPayload, "pending");

    if (isSimulatorMode) {
      // Act in simulator
      setTimeout(() => {
        const mockName = `spaces/mock-custom-${Date.now().toString().slice(-4)}`;
        const newlyCreated: ChatSpace = {
          name: mockName,
          displayName: `🌟 ${newSpaceName.trim()}`,
          type: newSpaceType
        };
        const updated = [newlyCreated, ...spaces];
        setSpaces(updated);
        setSelectedSpace(newlyCreated);
        setNewSpaceName("");
        setCreatingSpace(false);
        setSuccessMsg(`Simulated space "${newSpaceName}" provisioned inside sandbox successfully!`);
        addTelemetryLog("POST", "https://chat.googleapis.com/v1/spaces", parsedPayload, "success", { name: mockName, ...parsedPayload });
        addLogEntry(`Sandbox provision request succeeded: Created ${mockName}`);
        triggerNotification(
          "💬 Simulated Space Provisioned",
          `Google Chat channel "${newSpaceName}" has been safely configured in Sandbox.`,
          "system"
        );
      }, 800);
      return;
    }

    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedPayload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error ${res.status}`);
      }

      const createdObj = await res.json();
      addTelemetryLog("POST", "https://chat.googleapis.com/v1/spaces", parsedPayload, "success", createdObj);
      addLogEntry(`Success! Google Workspace returned API object: ${createdObj.name}`);
      
      const newlyCreated: ChatSpace = {
        name: createdObj.name,
        displayName: createdObj.displayName || newSpaceName,
        type: createdObj.spaceType || newSpaceType
      };

      setSpaces((prev) => [newlyCreated, ...prev]);
      setSelectedSpace(newlyCreated);
      setNewSpaceName("");
      setSuccessMsg(`Google Chat space "${newlyCreated.displayName}" provisioned successfully!`);
      triggerNotification("💬 Chat Space Provisioned", `Your new space ${newlyCreated.displayName} was successfully configured.`, "system");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`API error: ${err.message}. Showing simulation fallback.`);
      addTelemetryLog("POST", "https://chat.googleapis.com/v1/spaces", parsedPayload, "error", { error: err.message });
      addLogEntry(`Provision API failed: ${err.message}. Try sandbox mode directly.`);
    } finally {
      setCreatingSpace(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !messageText.trim()) return;

    setSendingMessage(true);
    setErrorMsg("");
    setSuccessMsg("");

    let finalizedBody = messageText.trim();
    if (isAlertNotification) {
      finalizedBody = `⚠️ *SKB SERVICE NOTIFICATION* ⚠️\n---------------------------------------\n${finalizedBody}\n---------------------------------------\n⚡ *Priority*: URGENT • Dispatch Desk India`;
    }

    const payload = {
      text: finalizedBody
    };

    const targetUrl = `https://chat.googleapis.com/v1/${selectedSpace.name}/messages`;
    addLogEntry(`Posting dispatch message to space: ${selectedSpace.displayName}`);
    addTelemetryLog("POST", targetUrl, payload, "pending");

    if (isSimulatorMode) {
      setTimeout(() => {
        setSendingMessage(false);
        setMessageText("");
        setSuccessMsg("Simulated message sent successfully to Google Chat room!");
        addTelemetryLog("POST", targetUrl, payload, "success", {
          name: `${selectedSpace.name}/messages/msg-${Date.now()}`,
          text: finalizedBody,
          createTime: new Date().toISOString()
        });
        addLogEntry(`Sandbox delivery report: Delivery confirmed to ${selectedSpace.name}`);
        triggerNotification(
          "💬 Sandbox Chat Dispatched",
          `Message safely dispatched to simulated workspace ${selectedSpace.displayName}.`,
          "system"
        );
      }, 700);
      return;
    }

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error ${res.status}`);
      }

      const responseObj = await res.json();
      addTelemetryLog("POST", targetUrl, payload, "success", responseObj);
      addLogEntry("Delivery acknowledged by Google APIs. Message matches REST receipt.");
      
      setMessageText("");
      setSuccessMsg("Message sent and delivered successfully to Google Chat space!");
      triggerNotification("💬 Msg Sent to Workspace", `Support router dispatched updates successfully.`, "system");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to deliver message: ${err.message}.`);
      addTelemetryLog("POST", targetUrl, payload, "error", { error: err.message });
      addLogEntry(`Message post failed: ${err.message}. If domain restricts bots, try sandbox simulation.`);
    } finally {
      setSendingMessage(false);
    }
  };

  const applyTemplate = (templateType: string) => {
    setMessageTemplate(templateType);
    let sample = "";
    switch (templateType) {
      case "alert":
        sample = "🚨 EMERGENCY HARDWARE FAULT 🚨\nTicket ID: SKB-T-7892\nIssue: Dual core Xeon processor heating above critical limits in Nehru Place mainframe.\nAssigned to: Lead Engineer (Brad)\nStatus: Dispatching emergency cooling sparing.";
        setIsAlertNotification(true);
        break;
      case "spares":
        sample = "📦 SPARES REPLENISHMENT REPORT\nInventory update: Standard laptop motherboard replacement parts for HP, Lenovo Thinkpad and Dell Inspiron have been safely restocked at general depot.\nReady for immediate assembly.";
        setIsAlertNotification(false);
        break;
      case "system":
        sample = "ℹ️ SKB CORE KEEPALIVE CHECK\nNetwork Router State: STABLE\nActive Support Load: 3 Pending repairing tickets\nAdmin Port Gateway: 3000 Running normally.";
        setIsAlertNotification(false);
        break;
      default:
        sample = "";
        setIsAlertNotification(false);
        break;
    }
    setMessageText(sample);
  };

  const handleToggleAutoRouting = () => {
    const nextState = !isAutoRoutingEnabled;
    setIsAutoRoutingEnabled(nextState);
    localStorage.setItem("skb-chat-autoroute", nextState ? "true" : "false");
    
    if (nextState && selectedSpace) {
      localStorage.setItem("skb-chat-autoroute-space", JSON.stringify(selectedSpace));
      addLogEntry(`Auto-Routing turned ON. New tickets will automatically post logs to: ${selectedSpace.displayName}`);
      triggerNotification("⚙️ Support Auto-routing Active", `Chat router will forward ticket dispatches to ${selectedSpace.displayName}`, "system");
    } else {
      localStorage.removeItem("skb-chat-autoroute-space");
      addLogEntry("Auto-Routing turned OFF.");
    }
  };

  const filteredSpaces = spaces.filter((s) => 
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Brand Header Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-[10px] font-bold tracking-widest font-mono text-teal-400 uppercase bg-teal-500/10 py-1.5 px-3 rounded-xl border border-teal-500/20 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              SKB Workspace Integrations
            </span>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${token ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="text-xs font-mono font-medium text-slate-300">
                {token ? "Google Chat Connected" : "Local Sandbox/Credentials Mode"}
              </span>
            </div>
          </div>

          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-teal-400" />
              Google Chat Support Desk
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Bridge your repair center workflows directly with corporate team chat. Route ticket notifications, 
              broadcast spare parts replenishment requests, and link enterprise Google Workspace rooms instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!token ? (
              <button
                onClick={handleOAuthLink}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-slate-950 font-bold py-3 px-5 text-xs rounded-xl cursor-pointer transition-all shadow-lg"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Authorize Enterprise API Credentials
              </button>
            ) : (
              <button
                onClick={loadSpaces}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2.5 px-4 text-xs rounded-xl cursor-pointer transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Re-scan Workspace Rooms
              </button>
            )}

            <button
              onClick={() => {
                setIsSimulatorMode(!isSimulatorMode);
                if (!isSimulatorMode) {
                  setSpaces(mockSpaces);
                  setSelectedSpace(mockSpaces[0]);
                  addLogEntry("Switched manually to Simulator Sandbox Mode.");
                } else if (token) {
                  loadSpaces();
                } else {
                  addLogEntry("Simulator cannot turn off if Google Account isn't authenticated yet.");
                }
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                isSimulatorMode 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isSimulatorMode ? "Mode: Sandbox Simulator Enabled" : "Switch to Simulator"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column - Space Explorer list & Create */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Space settings */}
          {selectedSpace && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pl-0.5">
                <Settings className="h-4.5 w-4.5 text-teal-600" />
                Active Forwarding Settings
              </h3>
              
              <div className="bg-white border rounded-2xl p-4 space-y-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block">SELECTED CHANNEL</span>
                  <strong className="text-sm text-slate-800 font-extrabold flex items-center gap-1.5 mt-0.5">
                    <Hash className="h-4 w-4 text-slate-400" />
                    {selectedSpace.displayName}
                  </strong>
                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5 truncate">{selectedSpace.name}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="space-y-0.5 pr-4.5">
                    <strong className="text-xs text-slate-800 font-extrabold">Instant Ticket Alerts</strong>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Post notifications to this Chat room automatically whenever a customer submits a support ticket file.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAutoRouting}
                    className={`h-6 w-11 rounded-full p-0.5 transition-all outline-none focus:ring-1 focus:ring-teal-500 flex-shrink-0 cursor-pointer ${
                      isAutoRoutingEnabled ? "bg-teal-600" : "bg-slate-200"
                    }`}
                  >
                    <div className={`h-5 w-5 bg-white rounded-full shadow-lg transition-transform ${isAutoRoutingEnabled ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List and search Rooms */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6.5 space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-sm font-extrabold text-gray-800 pl-0.5">
                Channel Registry ({spaces.length})
              </h3>
              {isSimulatorMode && (
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Simulated Listing
                </span>
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-100 pl-10 pr-4 py-3 bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* Rooms List view */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-teal-600 space-y-2">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <span className="text-xs font-semibold">Scanning Google Workspace...</span>
                </div>
              ) : filteredSpaces.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-150 rounded-2xl bg-gray-50/25">
                  <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 italic">No matches. Change filter or provision new room below.</p>
                </div>
              ) : (
                filteredSpaces.map((s) => {
                  const isSelected = selectedSpace?.name === s.name;
                  return (
                    <button
                      key={s.name}
                      onClick={() => setSelectedSpace(s)}
                      className={`w-full flex items-center justify-between p-3.5 border rounded-2xl text-left cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-teal-50/35 border-teal-500/40 shadow-xs" 
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="space-y-1 pr-4 truncate">
                        <strong className={`block text-xs font-bold truncate ${isSelected ? "text-teal-950" : "text-gray-800"}`}>
                          {s.displayName}
                        </strong>
                        <span className="block text-[10px] text-gray-400 font-mono truncate">{s.name}</span>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <span className="text-[9px] font-mono tracking-wider font-semibold uppercase bg-gray-50 text-gray-500 border rounded px-1.5 py-0.5">
                          {s.type}
                        </span>
                        {isSelected && <ChevronRight className="h-4 w-4 text-teal-600" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            
            {/* Direct creation section */}
            <div className="border-t pt-5.5 space-y-4">
              <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1 pl-0.5">
                <PlusSquare className="h-4 w-4 text-slate-500" />
                Trigger New Room Provision
              </h4>

              <form onSubmit={handleCreateSpace} className="space-y-3">
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Room name (e.g. general-it-support)"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    className="col-span-8 text-xs rounded-xl border border-gray-100 px-4 py-3 bg-gray-50/50 focus:bg-white"
                  />
                  <select
                    value={newSpaceType}
                    onChange={(e) => setNewSpaceType(e.target.value as any)}
                    className="col-span-4 text-xs rounded-xl border border-gray-100 px-2 py-3 bg-gray-50/50"
                  >
                    <option value="SPACE">Private Room</option>
                    <option value="GROUP_CHAT">General</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={creatingSpace || !newSpaceName.trim()}
                  className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-2.5 text-xs rounded-xl cursor-pointer transition-all border shadow-sm"
                >
                  {creatingSpace ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    "Create Workspace Channel"
                  )}
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* Right column - Console Composer, Messaging & Telemetry logs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main message Composer */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6.5 space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 pl-0.5">
                  Space Message Composer console
                </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Select a channel from the left registry to send updates instantly.
                  </p>
              </div>
              <MessageSquare className="h-5 w-5 text-teal-600" />
            </div>

            {selectedSpace ? (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                      POSTING TARGET: <strong className="text-slate-700 font-sans font-bold">{selectedSpace.displayName}</strong>
                    </span>
                    
                    {/* Quick Templates */}
                    <div className="flex items-center gap-1 bg-white border border-slate-200/65 rounded-lg p-0.5">
                      <span className="text-[9px] font-semibold text-slate-400 px-1.5 font-mono">Quick Template:</span>
                      {["normal", "alert", "spares", "system"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => applyTemplate(t)}
                          className={`text-[9px] font-mono px-2 py-0.5 rounded cursor-pointer transition-all font-bold ${
                            messageTemplate === t 
                              ? "bg-slate-900 text-white" 
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    required
                    rows={5}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write announcements or diagnostics here..."
                    className="w-full text-xs font-mono rounded-xl border border-slate-150 p-4 bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAlertNotification}
                        onChange={(e) => setIsAlertNotification(e.target.checked)}
                        className="rounded border-gray-350 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 font-semibold">
                        Add Emergency Warning Accent Wrapper
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={sendingMessage || !messageText.trim()}
                      className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-bold py-2.5 px-6 text-xs rounded-xl cursor-pointer transition-all shadow-sm"
                    >
                      {sendingMessage ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send to Chat Room
                    </button>
                  </div>
                </div>

                {successMsg && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/80 p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-fade-in relative z-10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <strong className="block font-bold">Successfully Dispatched!</strong>
                      <p className="text-[11px] text-emerald-700 mt-0.5">{successMsg}</p>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-red-50 text-red-800 border border-red-100/80 p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-fade-in relative z-10">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <strong className="block font-bold">Workspace Routing Interrupted</strong>
                      <p className="text-[11px] text-red-700 mt-0.5">{errorMsg}</p>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-150 rounded-2xl bg-gray-50/30">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400 italic">No workspace channels are currently selected.</p>
                <p className="text-[11px] text-gray-400 mt-1">Please configure or link a space on the left registry panel first.</p>
              </div>
            )}
          </div>

          {/* Telemetry and Activity Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Real REST API Telemetry Logs */}
            <div className="bg-slate-900 border border-slate-950 rounded-3xl p-5.5 text-slate-300 shadow-lg font-mono text-[10px] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5 text-[10px]">
                  <Terminal className="h-4 w-4" />
                  REST API Telemetry Logs
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                  JSON HEADERS
                </span>
              </div>

              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                {apiLogs.length === 0 ? (
                  <p className="text-slate-500 italic py-10 text-center">No workspace requests dispatched yet to chat.googleapis.com</p>
                ) : (
                  apiLogs.map((log, idx) => (
                    <div key={idx} className="border-l border-slate-700 pl-3.5 py-1 space-y-1.5">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-slate-500 font-bold">{log.timestamp}</span>
                        <span className={`font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          log.status === "success" 
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900" 
                            : log.status === "error" 
                            ? "bg-red-950/50 text-red-400 border border-red-900/50" 
                            : "bg-slate-800 text-amber-400 border border-slate-700 animate-pulse"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="font-bold flex items-center gap-1">
                        <span className="text-teal-400">{log.method}</span>
                        <span className="text-slate-200 break-all">{log.url}</span>
                      </div>
                      
                      {log.payload && (
                        <div className="bg-slate-950 border border-slate-800 p-2 rounded text-[8px] text-slate-400 overflow-x-auto max-w-full">
                          <code className="block whitespace-pre">
                            Payload: {JSON.stringify(log.payload, null, 2)}
                          </code>
                        </div>
                      )}

                      {log.response && (
                        <details className="cursor-pointer group">
                          <summary className="text-slate-500 group-hover:text-slate-300 transition-colors list-none select-none flex items-center gap-1 focus:outline-none">
                            <span className="inline-block transition-transform group-open:rotate-90">▶</span>
                            <span>See API JSON Response</span>
                          </summary>
                          <div className="bg-slate-950 border border-slate-800 p-2 rounded text-[8px] text-teal-500/95 overflow-x-auto max-w-full mt-1.5 leading-relaxed">
                            <code className="block whitespace-pre">
                              {JSON.stringify(log.response, null, 2)}
                            </code>
                          </div>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sandbox Operations Log */}
            <div className="bg-slate-50 border border-slate-250/60 rounded-3xl p-5.5 text-slate-700 shadow-sm font-mono text-[10px] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <span className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 text-[10px]">
                  <Activity className="h-4 w-4 text-slate-400" />
                  Router Diagnostics Log
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Live Stream
                </span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {simulatorLog.length === 0 ? (
                  <p className="text-slate-400 italic py-10 text-center">Diagnostics stream initialized. Logs will flow here.</p>
                ) : (
                  simulatorLog.map((log, idx) => (
                    <p key={idx} className="text-slate-600 text-left leading-normal border-b border-dashed border-slate-200/50 pb-2">
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
