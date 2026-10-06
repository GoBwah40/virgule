"use client";

import { Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Comment = {
  id: string;
  content: string;
  /** Written by the current participant (never whose it is otherwise). */
  isMine: boolean;
  /** Their own comment, or anyone's for the person hosting. */
  canDelete: boolean;
};

type Labels = {
  /** Accessible name of the list. */
  list: string;
  /** Badge on one's own comments ("Your comment"). */
  mine: string;
  /** Shown when there is no comment yet (optional). */
  empty?: string;
  /** Removing one's own comment. */
  remove?: string;
  /** Removing someone else's comment (moderation): asked first. */
  moderate?: { button: string; title: string; description?: string };
};

type Form = {
  label: string;
  placeholder: string;
  submit: string;
  maxLength: number;
  pending: boolean;
  /** Set when no more comment can be added: the input is disabled and this says why. */
  disabledReason?: string;
  onSubmit: (content: string, reset: () => void) => void;
};

type Props = {
  comments: Comment[];
  labels: Labels;
  /** Without it, the list is read-only. */
  onDelete?: (commentId: string) => void;
  /** Without it, no input. */
  form?: Form;
  className?: string;
};

/** Short anonymous comments under an idea, with an optional one-line input to add one. */
export function CommentThread({ comments, labels, onDelete, form, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      {comments.length > 0 ? (
        <ul aria-label={labels.list} className="space-y-1.5">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex items-start gap-2 rounded-lg bg-card/70 px-3 py-2 text-sm motion-safe:animate-in motion-safe:fade-in"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="wrap-anywhere">{comment.content}</p>
                {comment.isMine && <Badge className="bg-highlight-soft text-highlight-foreground">{labels.mine}</Badge>}
              </div>
              {onDelete && comment.canDelete && <RemoveComment comment={comment} labels={labels} onDelete={onDelete} />}
            </li>
          ))}
        </ul>
      ) : (
        labels.empty && <p className="text-sm text-muted-foreground">{labels.empty}</p>
      )}
      {form && <CommentForm form={form} />}
    </div>
  );
}

function RemoveComment({ comment, labels, onDelete }: { comment: Comment; labels: Labels; onDelete: (id: string) => void }) {
  // Small next to the text, 44 px to tap.
  const common = { variant: "ghost", size: "icon-xs", className: "touch-target shrink-0" } as const;
  if (comment.isMine) {
    return (
      labels.remove && (
        <Button {...common} aria-label={labels.remove} title={labels.remove} onClick={() => onDelete(comment.id)}>
          <Trash2 />
        </Button>
      )
    );
  }
  return (
    labels.moderate && (
      <ConfirmButton
        {...common}
        aria-label={labels.moderate.button}
        title={labels.moderate.title}
        description={labels.moderate.description}
        confirmLabel={labels.moderate.button}
        destructive
        onConfirm={() => onDelete(comment.id)}
      >
        <Trash2 />
      </ConfirmButton>
    )
  );
}

function CommentForm({ form }: { form: Form }) {
  const [content, setContent] = useState("");
  const id = useId();
  const disabled = form.disabledReason !== undefined;
  const submit = () => {
    if (!content.trim() || form.pending || disabled) return;
    form.onSubmit(content, () => setContent(""));
  };
  return (
    <div className="space-y-1.5">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          id={id}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-label={form.label}
          aria-describedby={disabled ? `${id}-reason` : undefined}
          placeholder={form.placeholder}
          maxLength={form.maxLength}
          disabled={disabled}
          autoComplete="off"
          className="h-11 min-w-0 flex-1"
        />
        <Button type="submit" variant="outline" className="h-11" disabled={disabled || form.pending || !content.trim()}>
          {form.submit}
        </Button>
      </form>
      {disabled && (
        <p id={`${id}-reason`} className="text-sm text-muted-foreground">
          {form.disabledReason}
        </p>
      )}
    </div>
  );
}
