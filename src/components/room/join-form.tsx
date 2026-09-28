"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "@/hooks/use-action";
import { joinRoom } from "@/lib/actions";
import { LIMITS, MAX_PARTICIPANTS } from "@/lib/config";

type Props = { slug: string; roomName: string; seats: number; full: boolean; closed: boolean };

export function JoinForm({ slug, roomName, seats, full, closed }: Props) {
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
        className="flex flex-col gap-6"
      >
        <CardHeader>
          <CardTitle>{t("title", { name: roomName })}</CardTitle>
          <CardDescription>
            {t("subtitle")} · {t("seats", { count: seats, max: MAX_PARTICIPANTS })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocked ? (
            <Alert variant="destructive">
              <AlertDescription>{closed ? t("closed") : t("full", { max: MAX_PARTICIPANTS })}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pseudo">{t("pseudo")}</Label>
              <Input
                id="pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                maxLength={LIMITS.pseudo}
                required
                autoFocus
              />
            </div>
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
