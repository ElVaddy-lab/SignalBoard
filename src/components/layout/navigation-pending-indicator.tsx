"use client";

import { useLinkStatus } from "next/link";

export function NavigationPendingIndicator() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className="navigation-pending-indicator" data-pending={pending || undefined} />;
}
