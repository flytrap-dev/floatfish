import { useState } from "react";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";

export default function Root() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onSignIn={setUser} />;
  }
  return <Dashboard user={user} onSignOut={() => setUser(null)} />;
}
