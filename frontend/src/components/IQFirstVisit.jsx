import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import IQTest from "./IQTest";

const KEY = "rr_iq_seen";
const HIDE_ROUTES = ["/admin/login", "/admin", "/finance", "/tests", "/submit", "/profile"];

export default function IQFirstVisit() {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Skip on admin routes and during auth callback
    if (hash?.includes("session_id=")) return;
    if (HIDE_ROUTES.some((p) => pathname.startsWith(p))) return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch { return; }
    const t = setTimeout(() => setOpen(true), 6000);
    return () => clearTimeout(t);
  }, [pathname, hash]);

  const handleOpenChange = (v) => {
    setOpen(v);
    if (!v) {
      try { localStorage.setItem(KEY, "1"); } catch {}
    }
  };

  return <IQTest open={open} onOpenChange={handleOpenChange} />;
}
