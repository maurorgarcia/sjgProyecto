"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TimeErrorTable from "@/components/TimeErrorTable";

const LAST_ACTIVE_KEY = "sjg-last-active";
const MAX_IDLE_MS = 30 * 60 * 1000; // 30 minutos

export default function Home() {
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(LAST_ACTIVE_KEY);
        const last = raw ? Number(raw) : 0;
        const now = Date.now();
        if (last && now - last > MAX_IDLE_MS) {
          await supabase.auth.signOut();
          if (!cancelled) router.replace("/login");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) router.replace("/login");
      } else {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
        }
        if (!cancelled) setChecked(true);
      }
    }

    checkSession();

    let activityHandler: () => void;
    if (typeof window !== "undefined") {
      activityHandler = () => {
        window.localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
      };
      window.addEventListener("click", activityHandler);
      window.addEventListener("keydown", activityHandler);
      window.addEventListener("focus", activityHandler);
    }

    return () => {
      cancelled = true;
      if (typeof window !== "undefined" && activityHandler) {
        window.removeEventListener("click", activityHandler);
        window.removeEventListener("keydown", activityHandler);
        window.removeEventListener("focus", activityHandler);
      }
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg)" }}>
        <div
          className="rounded-full border-2 border-[var(--accent)] border-t-transparent"
          style={{ width: 32, height: 32, animation: "spin 0.8s linear infinite" }}
        />
      </div>
    );
  }

  return <TimeErrorTable />;
}
