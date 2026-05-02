import { redirect } from "next/navigation";

// Marketplace removed from product surface. Agents are added via the
// "+ Add agent" modal on the Agents page (or by Fern on the back end).
// This redirect prevents stale links from 404'ing.
export default function MarketplaceRedirect() {
  redirect("/console");
}
