import { useEffect, useState } from "react";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import { getSession, signOut } from "./auth.js";

export default function Root() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  // Rehydrate: if a valid fls cookie exists, skip login.
  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (s) setUser({ discord: s.username, email: "", id: s.id });
      setChecked(true);
    })();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  if (!checked) {
    return <div className="min-h-screen bg-white dark:bg-[#0e0e0e]" />;
  }
  if (!user) {
    return <Login onSignIn={setUser} />;
  }
  return <Dashboard user={user} onSignOut={handleSignOut} />;
}
