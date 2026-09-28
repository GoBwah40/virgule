import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/button";
import { ROOM_TTL_DAYS } from "@/lib/config";

export async function RoomExpired() {
  const t = await getTranslations("expired");
  return (
    <StatusPage title={t("title")} body={t("body", { days: ROOM_TTL_DAYS })}>
      <Button nativeButton={false} render={<Link href="/" />}>
        {t("cta")}
      </Button>
    </StatusPage>
  );
}
