import { SearchX } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tApp = await getTranslations("app");
  return (
    <StatusPage title={t("title")} body={t("body")} icon={SearchX}>
      {/* No metadata on not-found pages: React puts this <title> in the <head>. */}
      <title>{`${t("title")} · ${tApp("name")}`}</title>
      <Button nativeButton={false} render={<Link href="/" />}>
        {t("cta")}
      </Button>
    </StatusPage>
  );
}
