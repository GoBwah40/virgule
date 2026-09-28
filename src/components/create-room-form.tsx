"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "@/hooks/use-action";
import { createRoom } from "@/lib/actions";
import { LIMITS } from "@/lib/config";

export function CreateRoomForm() {
  const t = useTranslations("home");
  const [name, setName] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [pending, run] = useAction();

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createRoom({ name, pseudo }));
        }}
        className="flex flex-col gap-6"
      >
        <CardHeader>
          <CardTitle>{t("submit")}</CardTitle>
          <CardDescription>{t("hostHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">{t("roomName")}</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("roomNamePlaceholder")}
              maxLength={LIMITS.roomName}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pseudo">{t("pseudo")}</Label>
            <Input
              id="pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder={t("pseudoPlaceholder")}
              maxLength={LIMITS.pseudo}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full" disabled={pending || !name.trim() || !pseudo.trim()}>
            {t("submit")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
