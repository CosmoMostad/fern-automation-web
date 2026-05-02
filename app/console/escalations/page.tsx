import { redirect } from "next/navigation";

// Escalations folded into the unified Inbox view. Keep this redirect so
// any old links / bookmarks land in the right place.
export default function EscalationsRedirect() {
  redirect("/console/inbox");
}
