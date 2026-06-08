import React, { useState } from "react";
import { auth, db, handleFirestoreError, setCachedAccessToken } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Shield, Sparkles } from "lucide-react";
import { OperationType } from "../types";

interface AuthInterfaceProps {
  onSuccess: (user: { email: string; name: string; role: "customer" | "admin"; photoURL?: string }) => void;
}

export const AuthInterface: React.FC<AuthInterfaceProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMessage] = useState("");

  const syncUserProfile = async (uid: string, email: string, name: string, photoURL: string = "") => {
    const userRef = doc(db, "users", uid);
    
    // Auto-grant administrator privileges if standard email corresponds to skbitservice@gmail.com
    const roleValue = email.toLowerCase() === "skbitservice@gmail.com" ? "admin" : "customer";

    const payload = {
      id: uid,
      name,
      email: email.toLowerCase(),
      mobile: "7011396007", // Default placeholder for OAuth registrations
      address: "Nehru Place, New Delhi",
      role: roleValue,
      status: "Active",
      createdAt: new Date().toISOString(),
      photoURL,
    };

    try {
      await setDoc(userRef, payload, { merge: true });
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  };

  const handleGooglePopupAuth = async () => {
    setLoading(true);
    setErrorMessage("");
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
    provider.addScope("https://www.googleapis.com/auth/gmail.send");
    provider.addScope("https://www.googleapis.com/auth/gmail.modify");

    try {
      const cred = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(cred);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }

      if (cred.user?.email) {
        const photo = cred.user.photoURL || "";
        const profile = await syncUserProfile(
          cred.user.uid,
          cred.user.email || "",
          cred.user.displayName || cred.user.email.split("@")[0],
          photo
        );

        if (profile) {
          onSuccess({
            email: profile.email,
            name: profile.name,
            role: profile.role as "customer" | "admin",
            photoURL: profile.photoURL,
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Google single sign-on failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 sm:px-6 py-20 animate-fade-up text-center">
      <div className="bg-white border border-gray-150 rounded-3xl p-8 sm:p-10 space-y-8 shadow-xs">
        
        {/* Brand Header */}
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Welcome to SKB Repairs</h2>
            <p className="text-xs text-gray-500 mt-1">
              Access your service panel, repair requests, and AMCs instantly.
            </p>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100/70 text-center animate-pulse">
            {errorMsg}
          </p>
        )}

        {/* Central Clean Action Container */}
        <div className="py-2">
          <button
            onClick={handleGooglePopupAuth}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/10 text-gray-700 font-bold py-4 px-6 text-sm cursor-pointer shadow-xs transition-all duration-200 focus:outline-none disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A6.29 6.29 0 017.7 12.24a6.29 6.29 0 016.29-6.29c2.343 0 4.398 1.278 5.498 3.176l3.766-3.766C20.6 2.34 16.9 0 13.99 0 7.37 0 2.01 5.37 2.01 11.99s5.36 12 11.98 12c6.62 0 11.23-4.85 11.23-11.43 0-.79-.08-1.55-.24-2.275H12.24z"
              />
            </svg>
            {loading ? "Authenticating with Google..." : "Continue with Google (Gmail)"}
          </button>
          
          <p className="text-[10px] text-gray-400 mt-3">
            Secure connection managed by Google OAuth identity provider
          </p>
        </div>

        {/* Admin credential advisory note block */}
        <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-450 flex items-start gap-2 text-left leading-normal">
          <Shield className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Project Owner Note:</strong> Use your Google / Gmail account linked as 
            <span className="font-mono text-xs text-teal-700 font-semibold bg-teal-50/50 px-1 rounded ml-1">skbitservice@gmail.com</span> to automatically access administrative consoles and ticket controls.
          </span>
        </div>

      </div>
    </section>
  );
};

export default AuthInterface;
