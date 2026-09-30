"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { joinRoom } from "@/lib/actions";
import { LIMITS, MAX_PARTICIPANTS } from "@/lib/config";

type Props = {
  slug: string;
  roomName: string;
  hostName: string;
  seats: number;
  full: boolean;
  closed: boolean;
  /** Row of seats, rendered by the layout. */
  seatRow: React.ReactNode;
};

export function JoinForm({ slug, roomName, hostName, seats, full, closed, seatRow }: Props) {
  const t = useTranslations("join");
  const [pseudo, setPseudo] = useState("");
  const [pending, run] = useAction();
  const blocked = full || closed;

  return (
    <Card className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => joinRoom(slug, { pseudo }));
        }}
        className="flex flex-col gap-5"
      >
        <CardHeader className="gap-3">
          <CardTitle className="font-heading text-2xl leading-tight font-extrabold">
            {t("title", { host: hostName, name: roomName })}
          </CardTitle>
          {seatRow}
          <CardDescription>{t("seats", { count: seats, max: MAX_PARTICIPANTS })}</CardDescription>
        </CardHeader>
        <CardContent>
          {blocked ? (
            <Alert variant="destructive">
              <AlertDescription>
                {closed ? t("closed") : t("full", { max: MAX_PARTICIPANTS, host: hostName })}
              </AlertDescription>
            </Alert>
          ) : (
            <FormField id="pseudo" label={t("subtitle")}>
              <Input
                id="pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder={t("pseudo")}
                maxLength={LIMITS.pseudo}
                autoComplete="given-name"
                required
                autoFocus
              />
            </FormField>
          )}
        </CardContent>
        {!blocked && (
          <CardFooter>
            <Button type="submit" size="lg" className="w-full" disabled={pending || !pseudo.trim()}>
              {t("submit")}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
