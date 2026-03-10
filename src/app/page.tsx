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
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return <TimeErrorTable />;
}
