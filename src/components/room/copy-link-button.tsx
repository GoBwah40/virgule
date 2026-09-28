"use client";

import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyLinkButton({ slug }: { slug: string }) {
  const t = useTranslations("room");

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/r/${slug}`);
        toast.success(t("linkCopied"));
      }}
    >
      <Link2 data-icon="inline-start" />
      {t("copyLink")}
    </Button>
  );
}
