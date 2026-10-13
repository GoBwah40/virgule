"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { FeedbackDialog } from "@/components/feedback-dialog";
import { useAction } from "@/hooks/use-action";
import { sendFeedback } from "@/lib/actions";
import { LIMITS } from "@/lib/config";

const MAX_LENGTH = { title: LIMITS.feedbackTitle, description: LIMITS.feedbackDescription };

/** Footer: an idea or a bug report, sent to the team as a GitHub issue. */
export function FeedbackButton({ className }: { className?: string }) {
  const t = useTranslations("feedback");
  const tCommon = useTranslations("common");
  const [pending, run] = useAction();

  return (
    <FeedbackDialog
      maxLength={MAX_LENGTH}
      labels={{
        trigger: t("trigger"),
        title: t("title"),
        description: t("description"),
        kind: t("kind"),
        idea: t("idea"),
        bug: t("bug"),
        titleField: t("titleField"),
        descriptionField: t("descriptionField"),
        details: t("details"),
        detailsHint: t("detailsHint"),
        submit: t("submit"),
        close: tCommon("close"),
      }}
      pending={pending}
      onSubmit={({ kind, title, description, includeDetails, website }, done) =>
        run(
          () => sendFeedback({ kind, title, description, website, path: includeDetails ? window.location.pathname : null }),
          () => {
            done();
            toast.success(t("sent"));
          },
        )
      }
      className={className}
    />
  );
}
