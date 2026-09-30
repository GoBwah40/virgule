import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import { fontVariables } from "../src/app/fonts";
import { Toaster } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import messages from "../messages/en.json";

import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i } },
    // Mobile first: stories open at phone width.
    viewport: { defaultViewport: "mobile1" },
    a11y: { test: "error" },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={messages} timeZone="Europe/Paris">
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
