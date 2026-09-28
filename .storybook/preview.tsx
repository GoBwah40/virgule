import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import { fontVariables } from "../src/app/fonts";
import { Toaster } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import messages from "../messages/fr.json";

import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i } },
    // Mobile d'abord : les stories s'ouvrent à la largeur d'un téléphone.
    viewport: { defaultViewport: "mobile1" },
    a11y: { test: "error" },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="fr" messages={messages} timeZone="Europe/Paris">
        <TooltipProvider>
          <div className={`${fontVariables} font-sans text-foreground`}>
            <Story />
          </div>
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;
