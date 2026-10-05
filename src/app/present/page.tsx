import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ScreenPairForm } from "@/components/room/screen-pair-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("pair"))("title"), robots: { index: false } };
}

/** Opened on the TV or the projector: the code from the host's phone pairs it with the session. */
export default function PairScreenPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
      <ScreenPairForm />
    </main>
  );
}
