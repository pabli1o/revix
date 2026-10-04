"use client";

import { useState } from "react";
import Link from "next/link";

type IntentLinkProps = Omit<
  React.ComponentProps<typeof Link>,
  "prefetch" | "onMouseEnter" | "onTouchStart"
>;

/**
 * A <Link> for items in a dynamic, potentially long list — matière/
 * chapitre/fiche tiles (TileGrid), planning tasks (TaskRow). Eagerly
 * prefetching every visible one (prefetch={true}) would fire a full
 * server render per visible card the moment the list is in the
 * viewport — Next's own prefetching guide names this exact "grid of
 * cards" shape as the case to avoid it for (see "Preventing too many
 * prefetches" in the Next.js docs), unlike the small, fixed set of links
 * in the main nav/sidebar where prefetch={true} is applied directly.
 *
 * Starts with prefetching off, then switches to a full prefetch (data
 * included, not just the shared layout shell — every route here reads
 * cookies() and is therefore "dynamic", so the default viewport prefetch
 * wouldn't include the data anyway) the moment the user shows real
 * intent to click: hover on desktop, touchstart on mobile. Touch has no
 * hover, so the lead time before the actual tap is much shorter there —
 * still strictly better than no prefetch, just a smaller win than on
 * desktop.
 */
export function IntentLink({ href, ...rest }: IntentLinkProps) {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      {...rest}
      href={href}
      prefetch={intent ? true : false}
      onMouseEnter={() => setIntent(true)}
      onTouchStart={() => setIntent(true)}
    />
  );
}
