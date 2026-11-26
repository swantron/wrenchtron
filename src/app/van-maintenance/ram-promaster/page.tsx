import { guideMetadata } from "@/components/marketing/GuidePage";
import { VAN_GUIDES, VanSchedule } from "@/components/marketing/VanSchedule";

const guide = VAN_GUIDES.find((g) => g.slug === "ram-promaster")!;

export const metadata = guideMetadata("/van-maintenance/ram-promaster", guide.title, guide.description);

export default function Page() {
  return <VanSchedule guide={guide} />;
}
