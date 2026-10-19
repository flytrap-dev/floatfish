import { useEffect, useState } from "react";
import LinearProgress from "./LinearProgress.jsx";

const GLogo = () => (
  <svg viewBox="0 0 48 48" width="28" height="28" aria-label="Google">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const Icon = ({ d, size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={`fill-current ${className}`}>
    <path d={d} />
  </svg>
);
const ICONS = {
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  check: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  eyeoff: "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z",
  key: "m21 10-2 2-1.5-1.5L19 9l-4-4-1.5 1.5L12 5l2-2 7 7zM5.5 20.5l5-5 2 2-5 5-2-2zm2.98-6.98-3.46 3.46L2 13.46l3.46-3.46 2.98 3.52zm9.52-5.52L13 13l-2-2 5-5 2 2z",
  plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  dollar: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
  activity: "M19 3H5c-1.11 0-2 .89-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm-5.04 14H7v-2h6.96v2zm3.04-4H7v-2h10v2zm0-4H7V7h10v2z",
  settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
  signout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  arrowup: "M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z",
  warn: "M12 5.99 19.53 19H4.47L12 5.99M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v5h2v-5z",
};

function mask(key) {
  return key.slice(0, 7) + "•".repeat(24) + key.slice(-4);
}

const API_KEYS = [
  { id: "key_1", name: "Production", key: "sk-prod-7c4a9e3b1d0f8a2b6e5c9d1a4f7b2e8c3a", created: "Sep 12, 2026", lastUsed: "2 minutes ago", usage: 1248.72 },
  { id: "key_2", name: "Staging", key: "sk-stag-1f8e2d3c4b5a6978e2d3c4b5a6978e2d3c", created: "Oct 03, 2026", lastUsed: "1 hour ago", usage: 128.14 },
  { id: "key_3", name: "Local dev", key: "sk-dev-9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e", created: "Oct 11, 2026", lastUsed: "3 days ago", usage: 4.90 },
];

const USAGE_7D = [12, 24, 18, 41, 33, 52, 47];

function Chip({ children, tone = "default" }) {
  const tones = {
    default: "bg-[#e8f0fe] text-[#174ea6] dark:bg-[#1f3a60] dark:text-[#a8c7fa]",
    good: "bg-[#e6f4ea] text-[#137333] dark:bg-[#1f3a2a] dark:text-[#81c995]",
    warn: "bg-[#fef7e0] text-[#b06000] dark:bg-[#3d2e00] dark:text-[#fdd663]",
  };
  return <span className={`inline-flex items-center gap-1 h-6 px-2 rounded-full text-[12px] font-medium ${tones[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-[#1b1b1b] rounded-[20px] border border-[#e8eaed] dark:border-[#2d2e30] ${className}`}>
      {children}
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#2d2e30] text-[#5f6368] dark:text-[#9aa0a6]"
      title={copied ? "Copied" : "Copy"}
    >
      <Icon d={copied ? ICONS.check : ICONS.copy} size={18} />
    </button>
  );
}

function KeyRow({ k }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="grid grid-cols-[1.2fr_2.2fr_1fr_1fr_0.8fr_auto] gap-4 items-center px-6 py-4 border-b border-[#e8eaed] dark:border-[#2d2e30] last:border-b-0">
      <div>
        <div className="text-[14px] font-medium">{k.name}</div>
        <div className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">{k.id}</div>
      </div>
      <div className="flex items-center gap-2">
        <code className="text-[13px] font-mono text-[#1f1f1f] dark:text-[#e3e3e3] truncate">
          {revealed ? k.key : mask(k.key)}
        </code>
        <button
          onClick={() => setRevealed((v) => !v)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#2d2e30] text-[#5f6368] dark:text-[#9aa0a6] shrink-0"
          title={revealed ? "Hide" : "Reveal"}
        >
          <Icon d={revealed ? ICONS.eyeoff : ICONS.eye} size={18} />
        </button>
        <CopyBtn text={k.key} />
      </div>
      <div className="text-[14px] text-[#5f6368] dark:text-[#9aa0a6]">{k.created}</div>
      <div className="text-[14px] text-[#5f6368] dark:text-[#9aa0a6]">{k.lastUsed}</div>
      <div className="text-[14px] font-medium tabular-nums">${k.usage.toFixed(2)}</div>
      <button className="text-[14px] font-medium text-[#0b57d0] dark:text-[#a8c7fa] px-3 py-2 rounded-full hover:bg-[rgba(11,87,208,0.08)] dark:hover:bg-[rgba(168,199,250,0.08)]">
        Manage
      </button>
    </div>
  );
}

function Sparkline({ data }) {
  const w = 220, h = 60, max = Math.max(...data), min = Math.min(...data);
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / (max - min || 1)) * (h - 8) - 4}`).join(" ");
  const area = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
      <polygon points={area} className="fill-[#0b57d0]/10 dark:fill-[#a8c7fa]/15" />
      <polyline points={points} fill="none" strokeWidth="2" className="stroke-[#0b57d0] dark:stroke-[#a8c7fa]" />
    </svg>
  );
}

function DashboardSkeleton() {
  const card = "bg-white dark:bg-[#1b1b1b] rounded-[20px] border border-[#e8eaed] dark:border-[#2d2e30]";
  return (
    <div aria-hidden="true" className="fade-in">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="skeleton h-9 w-64" />
          <div className="skeleton h-4 w-80 mt-3" />
        </div>
        <div className="skeleton h-10 w-40 !rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`${card} md:col-span-2 p-6`}>
          <div className="skeleton h-4 w-36" />
          <div className="skeleton h-12 w-52 mt-4" />
          <div className="skeleton h-5 w-72 mt-3" />
          <div className="mt-6 pt-4 border-t border-[#e8eaed] dark:border-[#2d2e30] grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-5 w-20 mt-2" />
              </div>
            ))}
          </div>
        </div>
        <div className={`${card} p-6`}>
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-9 w-28 mt-3" />
          <div className="skeleton h-14 w-full mt-4" />
        </div>
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="px-6 py-4 border-b border-[#e8eaed] dark:border-[#2d2e30]">
          <div className="skeleton h-5 w-40" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid grid-cols-[1.2fr_2.2fr_1fr_1fr_0.8fr] gap-4 items-center px-6 py-5 border-b border-[#e8eaed] dark:border-[#2d2e30] last:border-b-0">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SignedInSnackbar({ email, onClose }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 5000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onClose, 180);
    return () => clearTimeout(t);
  }, [leaving, onClose]);
  return (
    <div
      role="status"
      className={`${leaving ? "snack-out" : "snack-in"} fixed bottom-6 left-6 z-50 flex items-center gap-3 min-h-12 pl-4 pr-2 py-1.5 rounded-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.3)] bg-[#303030] text-[#f2f2f2] dark:bg-[#e3e3e3] dark:text-[#1f1f1f] text-[14px]`}
    >
      <span className="w-6 h-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[12px] font-medium uppercase shrink-0">
        {email.trim()[0] || "u"}
      </span>
      <span>
        Signed in as <span className="font-medium">{email}</span>
      </span>
      <button
        onClick={() => setLeaving(true)}
        className="ml-2 h-9 px-3 rounded-[4px] text-[14px] font-medium text-[#a8c7fa] dark:text-[#0b57d0] hover:bg-white/10 dark:hover:bg-black/5"
      >
        Dismiss
      </button>
    </div>
  );
}

export default function Dashboard({ user, onSignOut }) {
  const [phase, setPhase] = useState("boot");
  const [toast, setToast] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("skeleton"), 700);
    const t2 = setTimeout(() => {
      setPhase("ready");
      setToast(true);
    }, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const balance = 128.47;
  const monthToDate = USAGE_7D.reduce((a, b) => a + b, 0) * 1.42;
  const initial = (user.email.trim()[0] || "u").toUpperCase();

  if (phase === "boot") {
    return (
      <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#0e0e0e] cursor-wait">
        <LinearProgress className="fixed top-0 inset-x-0 z-50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#0e0e0e] font-google text-[#1f1f1f] dark:text-[#e3e3e3]">
      {/* Top bar */}
      <header className="fade-in h-16 bg-white dark:bg-[#1b1b1b] border-b border-[#e8eaed] dark:border-[#2d2e30] flex items-center px-4 md:px-6 sticky top-0 z-10">
        <button className="w-10 h-10 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#2d2e30] flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] md:hidden">
          <Icon d={ICONS.menu} />
        </button>
        <div className="flex items-center gap-2 ml-1">
          <GLogo />
          <span className="text-[20px] text-[#5f6368] dark:text-[#9aa0a6] font-google">API Console</span>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[14px] font-medium"
          >
            {initial}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#2d2e30] rounded-[12px] shadow-lg border border-[#e8eaed] dark:border-[#3c4043] py-2 z-20">
                <div className="px-4 py-3 border-b border-[#e8eaed] dark:border-[#3c4043]">
                  <div className="text-[14px] font-medium">{user.email}</div>
                  <div className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">
                    {user.discord ? `@${user.discord} · Google Account` : "Google Account"}
                  </div>
                </div>
                <button className="w-full text-left px-4 py-2 text-[14px] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center gap-3">
                  <Icon d={ICONS.settings} size={18} className="text-[#5f6368] dark:text-[#9aa0a6]" />
                  Account settings
                </button>
                <button
                  onClick={onSignOut}
                  className="w-full text-left px-4 py-2 text-[14px] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] flex items-center gap-3"
                >
                  <Icon d={ICONS.signout} size={18} className="text-[#5f6368] dark:text-[#9aa0a6]" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
        {phase !== "ready" && <LinearProgress className="absolute bottom-0 inset-x-0 translate-y-full" />}
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {phase !== "ready" ? (
          <DashboardSkeleton />
        ) : (
        <div className="dash-in">
        {/* Title row */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-[28px] md:text-[32px] leading-[40px] font-normal">API dashboard</h1>
            <p className="text-[14px] text-[#5f6368] dark:text-[#9aa0a6] mt-1">
              Manage your API keys, usage and billing.
            </p>
          </div>
          <button className="h-10 px-6 rounded-full bg-[#0b57d0] hover:bg-[#0a4bb8] text-white dark:bg-[#a8c7fa] dark:text-[#062e6f] dark:hover:bg-[#c2d7fc] text-[14px] font-medium inline-flex items-center gap-2">
            <Icon d={ICONS.plus} size={18} />
            Create API key
          </button>
        </div>

        {/* Top stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Balance */}
          <Card className="md:col-span-2 p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-[13px] text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">
                  <Icon d={ICONS.dollar} size={16} />
                  Account balance
                </div>
                <div className="mt-2 text-[48px] leading-[56px] font-normal tabular-nums">
                  ${balance.toFixed(2)}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Chip tone="good">Auto-recharge on</Chip>
                  <span className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6]">
                    Tops up $50 when below $10
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button className="h-10 px-5 rounded-full bg-[#0b57d0] hover:bg-[#0a4bb8] text-white dark:bg-[#a8c7fa] dark:text-[#062e6f] dark:hover:bg-[#c2d7fc] text-[14px] font-medium">
                  Add credits
                </button>
                <button className="h-10 px-5 rounded-full border border-[#dadce0] dark:border-[#5f6368] text-[#0b57d0] dark:text-[#a8c7fa] hover:bg-[rgba(11,87,208,0.08)] dark:hover:bg-[rgba(168,199,250,0.08)] text-[14px] font-medium">
                  Billing settings
                </button>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#e8eaed] dark:border-[#2d2e30] grid grid-cols-3 gap-4">
              <div>
                <div className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Month to date</div>
                <div className="text-[18px] font-medium tabular-nums mt-1">${monthToDate.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Last invoice</div>
                <div className="text-[18px] font-medium tabular-nums mt-1">$214.08</div>
              </div>
              <div>
                <div className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Payment method</div>
                <div className="text-[14px] mt-1">Visa •••• 4242</div>
              </div>
            </div>
          </Card>

          {/* Usage sparkline */}
          <Card className="p-6">
            <div className="flex items-center gap-2 text-[13px] text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wide">
              <Icon d={ICONS.activity} size={16} />
              Requests (7d)
            </div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-[32px] leading-[40px] font-normal tabular-nums">
                {USAGE_7D.reduce((a, b) => a + b, 0).toLocaleString()}k
              </div>
              <div className="pb-2 text-[12px] text-[#137333] dark:text-[#81c995] font-medium flex items-center">
                <Icon d={ICONS.arrowup} size={14} />
                12%
              </div>
            </div>
            <Sparkline data={USAGE_7D} />
            <div className="flex justify-between text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-1">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </Card>
        </div>

        {/* API keys */}
        <Card className="mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8eaed] dark:border-[#2d2e30]">
            <div className="flex items-center gap-2">
              <Icon d={ICONS.key} size={18} className="text-[#5f6368] dark:text-[#9aa0a6]" />
              <h2 className="text-[16px] font-medium">API keys</h2>
              <Chip>{API_KEYS.length} active</Chip>
            </div>
            <button className="text-[14px] font-medium text-[#0b57d0] dark:text-[#a8c7fa] px-3 py-2 rounded-full hover:bg-[rgba(11,87,208,0.08)] dark:hover:bg-[rgba(168,199,250,0.08)] inline-flex items-center gap-1">
              <Icon d={ICONS.plus} size={16} />
              New key
            </button>
          </div>
          <div className="grid grid-cols-[1.2fr_2.2fr_1fr_1fr_0.8fr_auto] gap-4 px-6 py-3 text-[12px] uppercase tracking-wide text-[#5f6368] dark:text-[#9aa0a6] border-b border-[#e8eaed] dark:border-[#2d2e30]">
            <div>Name</div>
            <div>Key</div>
            <div>Created</div>
            <div>Last used</div>
            <div>Usage</div>
            <div></div>
          </div>
          {API_KEYS.map((k) => (
            <KeyRow key={k.id} k={k} />
          ))}
        </Card>

        {/* Alert banner */}
        <Card className="p-4 flex items-start gap-3 mb-6 border-[#fde293] dark:border-[#3d2e00] bg-[#fef7e0] dark:bg-[#2a2200]">
          <Icon d={ICONS.warn} className="text-[#b06000] dark:text-[#fdd663] mt-0.5" />
          <div className="flex-1">
            <div className="text-[14px] font-medium">Rate limit at 72% of tier maximum</div>
            <div className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
              You're approaching your Tier 2 limit of 3,500 requests per minute. Upgrade to raise the ceiling.
            </div>
          </div>
          <button className="text-[14px] font-medium text-[#0b57d0] dark:text-[#a8c7fa] px-3 py-2 rounded-full hover:bg-[rgba(11,87,208,0.08)] dark:hover:bg-[rgba(168,199,250,0.08)]">
            Upgrade tier
          </button>
        </Card>

        {/* Recent activity */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8eaed] dark:border-[#2d2e30]">
            <h2 className="text-[16px] font-medium">Recent activity</h2>
            <button className="text-[14px] font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:underline">View all</button>
          </div>
          {[
            { t: "2 min ago", k: "Production", event: "POST /v1/chat/completions", cost: 0.013 },
            { t: "14 min ago", k: "Production", event: "POST /v1/chat/completions", cost: 0.021 },
            { t: "1 h ago", k: "Staging", event: "POST /v1/embeddings", cost: 0.002 },
            { t: "3 h ago", k: "Production", event: "GET /v1/models", cost: 0.0 },
            { t: "Yesterday", k: "Local dev", event: "POST /v1/images/generations", cost: 0.04 },
          ].map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_2fr_1fr_auto] gap-4 items-center px-6 py-3 border-b border-[#e8eaed] dark:border-[#2d2e30] last:border-b-0 text-[14px]"
            >
              <div className="text-[#5f6368] dark:text-[#9aa0a6]">{r.t}</div>
              <code className="font-mono text-[13px] truncate">{r.event}</code>
              <div>
                <Chip>{r.k}</Chip>
              </div>
              <div className="text-right tabular-nums">${r.cost.toFixed(3)}</div>
            </div>
          ))}
        </Card>

        <footer className="mt-12 mb-6 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">
          <span>© 2026 API Console</span>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">Docs</a>
            <a href="#" className="hover:underline">Status</a>
            <a href="#" className="hover:underline">Help</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </footer>
        </div>
        )}
      </main>
      {toast && <SignedInSnackbar email={user.email} onClose={() => setToast(false)} />}
    </div>
  );
}
