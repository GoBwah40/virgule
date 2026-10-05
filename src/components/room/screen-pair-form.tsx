"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { pairScreen } from "@/lib/actions";

/** On the TV or the projector: the code from the host's phone shows the session on this screen. */
export function ScreenPairForm() {
  const t = useTranslations("pair");
  const [code, setCode] = useState("");
  const [pending, run] = useAction();

  return (
    <Card className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => pairScreen({ code }));
        }}
        className="flex flex-col gap-5"
      >
        <CardHeader className="gap-3">
          <CardTitle>
            <h1 className="font-heading text-2xl leading-tight font-extrabold">{t("title")}</h1>
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormField id="screen-code" label={t("code")}>
            <Input
              id="screen-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={9}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="h-14 text-center font-mono text-3xl tracking-[0.18em] uppercase"
              required
              autoFocus
            />
          </FormField>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full" disabled={pending || !code.trim()}>
            {t("submit")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
