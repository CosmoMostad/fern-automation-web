import ComingSoon from "@/components/console/ComingSoon";
import { getHeaderData } from "@/lib/db/header";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const h = await getHeaderData();
  return (
    <ComingSoon
      title="Voice"
      description="Upload past customer emails, the voice engine learns your business's tone, and every agent that drafts text imitates it. Sits underneath the existing Examples tab on each agent — this page will manage profiles globally."
      business={h.business}
      user={h.user}
    />
  );
}
