/**
 * Keyboard and focus behaviour for every `[role="dialog"]` on the page.
 *
 * The 18 dialogs open and close by toggling a class in many places across
 * main.ts. Rather than touch each call site, this watches the dialogs
 * themselves and, whenever one becomes visible:
 *
 *  - remembers what had focus and moves focus inside (to `[data-autofocus]`,
 *    else the first control that isn't the close button);
 *  - keeps Tab and Shift+Tab inside it;
 *  - lets Escape click its own close control, so closing runs the same code
 *    as clicking ✕. A dialog that needs a decision opts out with
 *    `data-dialog-required`;
 *
 * and when it closes, returns focus to where it was.
 */

/** Controls that close a dialog, in the forms the HTML already uses. */
export const CLOSE_CONTROL_SELECTOR =
  '[data-dialog-close], [aria-label="Close"], [id$="-close"], [id$="-cancel"]';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Where Tab should land next inside a dialog with `count` focusable controls.
 * `index` is the currently focused control, or -1 if focus is outside it.
 * Wraps at both ends. Returns -1 when there is nothing to focus.
 */
export function wrapFocusIndex(index: number, count: number, backwards: boolean): number {
  if (count <= 0) return -1;
  if (index < 0) return backwards ? count - 1 : 0;
  return backwards ? (index - 1 + count) % count : (index + 1) % count;
}

function isShown(el: HTMLElement): boolean {
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
}

function focusables(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isShown);
}

/** Starts watching every dialog on the page. Call once, after the DOM exists. */
export function initDialogs(): void {
  const open: HTMLElement[] = [];
  const returnTo = new Map<HTMLElement, Element | null>();

  const onOpen = (dialog: HTMLElement) => {
    open.push(dialog);
    returnTo.set(dialog, document.activeElement);
    // Wait a frame: the dialog's contents are often rendered right after it opens.
    requestAnimationFrame(() => {
      const items = focusables(dialog);
      const target =
        dialog.querySelector<HTMLElement>("[data-autofocus]") ??
        items.find((el) => !el.matches(CLOSE_CONTROL_SELECTOR)) ??
        items[0];
      if (target) target.focus();
      else { dialog.tabIndex = -1; dialog.focus(); }
    });
  };

  const onClose = (dialog: HTMLElement) => {
    open.splice(open.indexOf(dialog), 1);
    const back = returnTo.get(dialog);
    returnTo.delete(dialog);
    if (back instanceof HTMLElement && back.isConnected) back.focus();
  };

  const sync = (dialog: HTMLElement) => {
    const shown = isShown(dialog);
    const tracked = open.includes(dialog);
    if (shown && !tracked) onOpen(dialog);
    else if (!shown && tracked) onClose(dialog);
  };

  const observer = new MutationObserver((records) => {
    for (const r of records) sync(r.target as HTMLElement);
  });
  document.querySelectorAll<HTMLElement>('[role="dialog"]').forEach((dialog) => {
    observer.observe(dialog, { attributes: true, attributeFilter: ["class", "hidden", "style"] });
    sync(dialog);
  });

  document.addEventListener("keydown", (e) => {
    const top = open[open.length - 1];
    if (!top) return;
    if (e.key === "Escape") {
      if (top.hasAttribute("data-dialog-required")) return;
      const close = top.querySelector<HTMLElement>(CLOSE_CONTROL_SELECTOR);
      if (close) { e.preventDefault(); close.click(); }
    } else if (e.key === "Tab") {
      const items = focusables(top);
      const next = wrapFocusIndex(items.indexOf(document.activeElement as HTMLElement), items.length, e.shiftKey);
      e.preventDefault();
      if (next >= 0) items[next].focus();
    }
  });
}
