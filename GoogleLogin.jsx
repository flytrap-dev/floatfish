import { useState } from "react";

const GoogleLogo = () => (
  <svg viewBox="0 0 75 24" width="75" height="24" aria-label="Google">
    <g>
      <path fill="#4285F4" d="M14.11 14.5v-2.66H7.02v2.66h4.08c-.17 1.05-1.3 3.08-4.08 3.08-2.45 0-4.46-2.03-4.46-4.54S4.57 8.5 7.02 8.5c1.4 0 2.33.6 2.86 1.1l1.95-1.88C10.57 6.57 8.95 5.84 7.02 5.84 3.14 5.84 0 8.98 0 12.84s3.14 7 7.02 7c4.05 0 6.73-2.85 6.73-6.86 0-.46-.05-.82-.11-1.18l-6.62.7z"/>
      <path fill="#EA4335" d="M22.98 10.38c-2.5 0-4.54 1.9-4.54 4.52 0 2.6 2.04 4.52 4.54 4.52s4.54-1.92 4.54-4.52c0-2.62-2.04-4.52-4.54-4.52zm0 7.26c-1.37 0-2.55-1.13-2.55-2.74 0-1.63 1.18-2.74 2.55-2.74s2.55 1.11 2.55 2.74c0 1.61-1.18 2.74-2.55 2.74z"/>
      <path fill="#FBBC05" d="M32.85 10.38c-2.5 0-4.54 1.9-4.54 4.52 0 2.6 2.04 4.52 4.54 4.52s4.54-1.92 4.54-4.52c0-2.62-2.04-4.52-4.54-4.52zm0 7.26c-1.37 0-2.55-1.13-2.55-2.74 0-1.63 1.18-2.74 2.55-2.74s2.55 1.11 2.55 2.74c0 1.61-1.18 2.74-2.55 2.74z"/>
      <path fill="#4285F4" d="M46.93 10.65v.73h-.07c-.44-.53-1.3-1-2.38-1-2.26 0-4.33 1.98-4.33 4.54 0 2.54 2.07 4.5 4.33 4.5 1.08 0 1.94-.48 2.38-1.03h.07v.63c0 1.73-.93 2.66-2.42 2.66-1.22 0-1.97-.87-2.28-1.6l-1.73.72c.5 1.2 1.82 2.68 4.01 2.68 2.33 0 4.3-1.37 4.3-4.71v-8.12h-1.88zm-2.28 7c-1.37 0-2.52-1.15-2.52-2.73 0-1.6 1.15-2.76 2.52-2.76 1.35 0 2.42 1.17 2.42 2.76 0 1.58-1.07 2.73-2.42 2.73z"/>
      <path fill="#34A853" d="M51.5 5.84v13.6h1.98V5.84H51.5z"/>
      <path fill="#EA4335" d="M59.46 17.64c-1.02 0-1.74-.47-2.21-1.38l6.09-2.52-.21-.52c-.38-1.02-1.54-2.9-3.9-2.9-2.33 0-4.28 1.84-4.28 4.52 0 2.52 1.92 4.52 4.5 4.52 2.08 0 3.28-1.27 3.78-2.01l-1.55-1.03c-.52.75-1.22 1.32-2.23 1.32zm-.14-5.56c.81 0 1.5.42 1.73.99l-4.13 1.71c0-1.93 1.37-2.7 2.4-2.7z"/>
      <path fill="#4285F4" d="M69.76 19.44V5.84h-1.98v13.6h1.98zm3.5-8.79l-1.73-1.73-5.9 5.9 1.72 1.74 5.9-5.9z"/>
    </g>
  </svg>
);

export default function GoogleLogin() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!email.trim()) {
      setError("Enter an email or phone number");
      return;
    }
    setError("");
    setStep("password");
  };

  const handleSignIn = () => {
    if (!password) {
      setError("Enter a password");
      return;
    }
    setError("");
    alert(`Signing in as ${email}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white sm:bg-[#f0f4f9] px-4 font-['Roboto','Arial',sans-serif]">
      <div className="w-full max-w-[450px] sm:border sm:border-[#dadce0] sm:rounded-[28px] bg-white px-6 sm:px-10 py-8 sm:py-10">
        <div className="flex flex-col items-center sm:items-start">
          <GoogleLogo />
        </div>

        {step === "email" ? (
          <>
            <h1 className="text-[2rem] leading-[2.5rem] text-[#1f1f1f] mt-4 font-normal text-center sm:text-left">
              Sign in
            </h1>
            <p className="text-base text-[#1f1f1f] mt-2 mb-8 text-center sm:text-left">
              Use your Google Account
            </p>

            <div className="relative">
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                className={`peer w-full h-14 px-4 pt-3 border rounded-[4px] text-base text-[#1f1f1f] outline-none transition-colors ${
                  error
                    ? "border-[#d93025] focus:border-[#d93025] focus:ring-1 focus:ring-[#d93025]"
                    : "border-[#747775] focus:border-[#1a73e8] focus:border-2"
                }`}
                placeholder=" "
                autoFocus
              />
              <label
                htmlFor="email"
                className={`absolute left-3 px-1 bg-white transition-all pointer-events-none ${
                  email
                    ? "top-0 -translate-y-1/2 text-xs"
                    : "top-1/2 -translate-y-1/2 text-base peer-focus:top-0 peer-focus:text-xs"
                } ${error ? "text-[#d93025]" : "text-[#5e5e5e] peer-focus:text-[#1a73e8]"}`}
              >
                Email or phone
              </label>
            </div>
            {error && (
              <p className="mt-1 text-xs text-[#d93025] flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-[#d93025] text-[10px]">!</span>
                {error}
              </p>
            )}

            <button className="mt-3 text-sm font-medium text-[#0b57d0] hover:bg-[#f0f7ff] px-2 py-1 -ml-2 rounded">
              Forgot email?
            </button>

            <p className="text-sm text-[#1f1f1f] mt-10">
              Not your computer? Use Guest mode to sign in privately.{" "}
              <a href="#" className="text-[#0b57d0] font-medium hover:underline">
                Learn more about using Guest mode
              </a>
            </p>

            <div className="flex items-center justify-between mt-14">
              <button className="text-sm font-medium text-[#0b57d0] hover:bg-[#f0f7ff] px-3 py-2 rounded-full">
                Create account
              </button>
              <button
                onClick={handleNext}
                className="bg-[#0b57d0] hover:bg-[#0a4bb8] text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[2rem] leading-[2.5rem] text-[#1f1f1f] mt-4 font-normal text-center sm:text-left">
              Welcome
            </h1>
            <button
              onClick={() => {
                setStep("email");
                setPassword("");
                setError("");
              }}
              className="mt-3 inline-flex items-center gap-2 border border-[#dadce0] rounded-full px-2 py-1 hover:bg-[#f8f9fa] text-sm text-[#1f1f1f]"
            >
              <span className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-medium">
                {email.charAt(0).toUpperCase() || "U"}
              </span>
              <span className="pr-2">{email}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            <div className="mt-8 relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                className={`peer w-full h-14 px-4 pt-3 border rounded-[4px] text-base text-[#1f1f1f] outline-none transition-colors ${
                  error
                    ? "border-[#d93025] focus:border-[#d93025] focus:ring-1 focus:ring-[#d93025]"
                    : "border-[#747775] focus:border-[#1a73e8] focus:border-2"
                }`}
                placeholder=" "
                autoFocus
              />
              <label
                htmlFor="password"
                className={`absolute left-3 px-1 bg-white transition-all pointer-events-none ${
                  password
                    ? "top-0 -translate-y-1/2 text-xs"
                    : "top-1/2 -translate-y-1/2 text-base peer-focus:top-0 peer-focus:text-xs"
                } ${error ? "text-[#d93025]" : "text-[#5e5e5e] peer-focus:text-[#1a73e8]"}`}
              >
                Enter your password
              </label>
            </div>
            {error && (
              <p className="mt-1 text-xs text-[#d93025] flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-[#d93025] text-[10px]">!</span>
                {error}
              </p>
            )}

            <label className="flex items-center gap-3 mt-5 text-sm text-[#1f1f1f] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-[18px] h-[18px] accent-[#0b57d0]"
              />
              Show password
            </label>

            <div className="flex items-center justify-between mt-14">
              <button className="text-sm font-medium text-[#0b57d0] hover:bg-[#f0f7ff] px-3 py-2 rounded-full">
                Forgot password?
              </button>
              <button
                onClick={handleSignIn}
                className="bg-[#0b57d0] hover:bg-[#0a4bb8] text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="hidden sm:flex fixed bottom-0 left-0 right-0 px-6 py-4 text-sm text-[#444746] justify-between">
        <select className="bg-transparent outline-none">
          <option>English (United States)</option>
        </select>
        <div className="flex gap-6">
          <a href="#" className="hover:underline">Help</a>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
        </div>
      </footer>
    </div>
  );
}
