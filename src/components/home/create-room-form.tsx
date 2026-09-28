"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        className="flex flex-col gap-5"
      >
        <CardHeader>
          <CardTitle className="font-heading text-xl font-bold">{t("formTitle")}</CardTitle>
          <CardDescription>{t("formHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField id="room-name" label={t("roomName")}>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("roomNamePlaceholder")}
              maxLength={LIMITS.roomName}
              required
            />
          </FormField>
          <FormField id="pseudo" label={t("pseudo")}>
            <Input
              id="pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder={t("pseudoPlaceholder")}
              maxLength={LIMITS.pseudo}
              autoComplete="given-name"
              required
            />
          </FormField>
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
