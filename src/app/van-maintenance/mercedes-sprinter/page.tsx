import { guideMetadata } from "@/components/marketing/GuidePage";
import { VAN_GUIDES, VanSchedule } from "@/components/marketing/VanSchedule";

const guide = VAN_GUIDES.find((g) => g.slug === "mercedes-sprinter")!;

export const metadata = guideMetadata("/van-maintenance/mercedes-sprinter", guide.title, guide.description);

export default function Page() {
  return <VanSchedule guide={guide} />;
}
