"use client";

import { useEffect } from "react";

const isField = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && (el.matches("input, textarea, select") || el.isContentEditable);

/**
 * On phones, the keyboard can cover the field being typed in (in-app browsers such as
 * Instagram's ignore the viewport setting). When the visible area shrinks, or a field gets
 * focus while the keyboard is open, the field is scrolled back above the keyboard.
 */
export function KeepFocusVisible() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    let frame = 0;
    const reveal = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const field = document.activeElement;
        if (!isField(field)) return;
        const { top, bottom } = field.getBoundingClientRect();
        const visibleTop = viewport.offsetTop;
        const visibleBottom = viewport.offsetTop + viewport.height;
        if (top >= visibleTop && bottom <= visibleBottom) return;
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        field.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
      });
    };
    // The keyboard opens a moment after the focus: wait for the resize it causes.
    const onFocus = (e: FocusEvent) => isField(e.target as Element) && setTimeout(reveal, 300);

    viewport.addEventListener("resize", reveal);
    document.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", reveal);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);

  return null;
}
