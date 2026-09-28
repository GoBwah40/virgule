import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <StatusPage title={t("title")} body={t("body")}>
      <Button nativeButton={false} render={<Link href="/" />}>
        {t("cta")}
      </Button>
    </StatusPage>
  );
}
