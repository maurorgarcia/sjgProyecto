"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TimeErrorTable from "@/components/TimeErrorTable";

export default function Home() {
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    });
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
