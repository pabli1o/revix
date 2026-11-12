"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={loading}>
      {loading ? t.nav.signOut.loading : t.nav.signOut.idle}
    </Button>
  );
}
