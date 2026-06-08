import React, { useState } from "react";
import { auth, db, handleFirestoreError } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";
import { User, LogIn, Key, Mail, Shield, Check, Phone } from "lucide-react";
import { OperationType } from "../types";

interface AuthInterfaceProps {
  onSuccess: (user: { email: string; name: string; role: "customer" | "admin" }) => void;
}

export const AuthInterface: React.FC<AuthInterfaceProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMessage] = useState("");

  // Email login inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup inputs
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupMobile, setSignupMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const syncUserProfile = async (uid: string, email: string, name: string, phone: string = "") => {
    // Check if user document already exists in firestore
    const userRef = doc(db, "users", uid);
    
    // Auto-grant administrator privileges if standard email corresponds to skbitservice@gmail.com
    const roleValue = email.toLowerCase() === "skbitservice@gmail.com" ? "admin" : "customer";

    const payload = {
      id: uid,
      name,
      email: email.toLowerCase(),
      mobile: phone || "9876543210",
      address: "123 Premium Plaza, MG Road, New Delhi",
      role: roleValue,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(userRef, payload, { merge: true });
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMessage("Please provide your login credentials.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const cred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword.trim());
      
      // Sync or fetch profile role
      const profile = await syncUserProfile(
        cred.user.uid,
        cred.user.email || loginEmail,
        cred.user.displayName || loginEmail.split("@")[0]
      );

      onSuccess({
        email: profile.email,
        name: profile.name,
        role: profile.role as "customer" | "admin",
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Authentications failed. Please verify email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      setErrorMessage("Please complete all registration files.");
      return;
    }

    if (signupPassword !== signupConfirm) {
      setErrorMessage("Password key coordinates do not match confirm codes.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const cred = await createUserWithEmailAndPassword(auth, signupEmail.trim(), signupPassword.trim());
      
      const profile = await syncUserProfile(
        cred.user.uid,
        signupEmail.toLowerCase().trim(),
        signupName,
        signupMobile
      );

      onSuccess({
        email: profile.email,
        name: profile.name,
        role: profile.role as "customer" | "admin",
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Registration failed. Try an alternate email keyset.");
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePopupAuth = async () => {
    setLoading(true);
    setErrorMessage("");
    const provider = new GoogleAuthProvider();

    try {
      const cred = await signInWithPopup(auth, provider);
      if (cred.user?.email) {
        const profile = await syncUserProfile(
          cred.user.uid,
          cred.user.email || "",
          cred.user.displayName || cred.user.email.split("@")[0]
        );

        onSuccess({
          email: profile.email,
          name: profile.name,
          role: profile.role as "customer" | "admin",
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Google single sign-on failed. Choose email logins instead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 sm:px-6 py-16 animate-fade-up text-left">
      
      <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 space-y-7 shadow-xs">
        
        {/* Toggle navigation */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setIsLogin(true); setErrorMessage(""); }}
            className={`flex-1 pb-3 text-sm font-bold cursor-pointer focus:outline-none transition-colors ${
              isLogin ? "text-teal-600 border-b-2 border-teal-500" : "text-gray-400"
            }`}
          >
            Account Login
          </button>
          
          <button
            onClick={() => { setIsLogin(false); setErrorMessage(""); }}
            className={`flex-1 pb-3 text-sm font-bold cursor-pointer focus:outline-none transition-colors ${
              !isLogin ? "text-teal-600 border-b-2 border-teal-500" : "text-gray-400"
            }`}
          >
            Register Account
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100/70 text-center animate-pulse">
            {errorMsg}
          </p>
        )}

        {isLogin ? (
          /* LOGIN FORM LAYOUT */
          <form onSubmit={handleEmailLogin} className="space-y-4.5">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 pl-1 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-teal-500" />
                Email Address
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 pl-1 flex items-center gap-1">
                <Key className="h-3.5 w-3.5 text-teal-500" />
                Password Key
              </span>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 text-sm cursor-pointer shadow-md shadow-teal-500/10 disabled:opacity-50"
            >
              <LogIn className="h-4.5 w-4.5" />
              {loading ? "Approving permissions..." : "Sign in Securely"}
            </button>
          </form>
        ) : (
          /* SIGNUP FORM LAYOUT */
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 pl-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-teal-500" />
                Full Name
              </span>
              <input
                type="text"
                required
                placeholder="e.g. Liam Smith"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 pl-1 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-teal-500" />
                Email Address
              </span>
              <input
                type="email"
                required
                placeholder="liam@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 pl-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-teal-500" />
                Mobile Contact
              </span>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={signupMobile}
                onChange={(e) => setSignupMobile(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-gray-500 pl-1">Create Password</span>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-gray-500 pl-1">Confirm</span>
                <input
                  type="password"
                  required
                  placeholder="Confirm"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 text-sm cursor-pointer shadow-md"
            >
              <Check className="h-4.5 w-4.5" />
              {loading ? "Registering profile..." : "Create Free Account"}
            </button>
          </form>
        )}

        {/* Separator / Google Login */}
        <div className="space-y-4">
          <div className="relative flex items-center justify-center">
            <span className="absolute inset-x-0 h-px bg-gray-100" />
            <span className="relative bg-white px-3 font-mono text-[10px] uppercase text-gray-400">Or single sign-on</span>
          </div>

          <button
            onClick={handleGooglePopupAuth}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 text-xs cursor-pointer shadow-xs duration-150"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A6.29 6.29 0 017.7 12.24a6.29 6.29 0 016.29-6.29c2.343 0 4.398 1.278 5.498 3.176l3.766-3.766C20.6 2.34 16.9 0 13.99 0 7.37 0 2.01 5.37 2.01 11.99s5.36 12 11.98 12c6.62 0 11.23-4.85 11.23-11.43 0-.79-.08-1.55-.24-2.275H12.24z"
              />
            </svg>
            Continue with Google Sign-In
          </button>
        </div>

        {/* Admin credential advisory note block */}
        <div className="pt-2 border-t border-gray-150/40 text-[10px] text-gray-400 flex items-start gap-1 leading-normal font-sans">
          <Shield className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>Note: Standard administrators sign in via standard email skbitservice@gmail.com to directly unlock management desk systems.</span>
        </div>

      </div>

    </section>
  );
};
export default AuthInterface;
