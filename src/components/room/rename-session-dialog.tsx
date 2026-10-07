"use client";

import { useTranslations } from "next-intl";

import { RenameDialog } from "@/components/rename-dialog";
import { useAction } from "@/hooks/use-action";
import { renameRoom } from "@/lib/actions";
import { LIMITS } from "@/lib/config";

type Props = { slug: string; name: string; className?: string };

/** Host: renames the session from its header; everyone sees the new name. */
export function RenameSessionDialog({ slug, name, className }: Props) {
  const t = useTranslations("room.rename");
  const tCommon = useTranslations("common");
  const [pending, run] = useAction();
  return (
    <RenameDialog
      className={className}
      value={name}
      maxLength={LIMITS.roomName}
      pending={pending}
      labels={{
        trigger: t("open"),
        title: t("title"),
        description: t("description"),
        field: t("field"),
        submit: t("submit"),
        close: tCommon("close"),
      }}
      onSubmit={(value, done) => run(() => renameRoom(slug, value), done)}
    />
  );
}
