import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { TooltipProvider } from "@/components/ui/tooltip";
import messages from "../../messages/en.json";

/** Renders with the same providers as the app (translations, tooltips). */
export function renderUi(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="Europe/Paris">
      <TooltipProvider>{ui}</TooltipProvider>
    </NextIntlClientProvider>,
  );
}
