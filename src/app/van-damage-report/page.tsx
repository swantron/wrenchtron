import { A, GuidePage, guideMetadata, H1, H2, List } from "@/components/marketing/GuidePage";

export const metadata = guideMetadata(
  "/van-damage-report",
  "Van damage reports with photos for delivery fleets — Wrenchtron",
  "Log van damage from a phone with photos, take the van out of service until it's fixed, and keep the report on the van's history. For delivery fleets.",
);

export default function Page() {
  return (
    <GuidePage>
      <H1>Van damage reports with photos</H1>
      <p>
        On a delivery fleet, damage is weekly, not rare: mirrors, bumpers, side doors, a corner clipped at a dock.
        The cost isn&apos;t only the repair. It&apos;s the van that went out anyway, the argument about when it
        happened, and the report that lived in someone&apos;s text messages.
      </p>

      <H2>What a good damage report has</H2>
      <List>
        <li>The van, the date and the mileage.</li>
        <li>Photos of the damage, taken when it&apos;s reported.</li>
        <li>A short note: what&apos;s damaged and whether the van is safe to run.</li>
        <li>Who reported it.</li>
        <li>The repair, logged on the same van when it&apos;s done, with its own photos.</li>
      </List>

      <H2>How it works in Wrenchtron</H2>
      <p>
        A tech or manager opens the van on their phone and logs a damage report with photos. If the van shouldn&apos;t
        run, it&apos;s marked down with the note, and it shows at the top of the fleet board until someone fixes it.
        If a report was logged by mistake, deleting it puts the van&apos;s status back the way it was.
      </p>
      <p>
        Because the report sits in the van&apos;s history next to its oil changes and tire work, you can see the
        whole story of a van in one place. That helps when a lease ends, a claim is filed, or you&apos;re deciding
        whether a van is worth keeping.
      </p>

      <H2>Part of the maintenance log</H2>
      <p>
        Damage reports are one piece of <A href="/van-fleet-maintenance">maintenance tracking for a delivery fleet</A>.
        Open the <A href="/demo/fleet">fleet demo</A> to see a van that&apos;s down with a damage report.
      </p>
    </GuidePage>
  );
}
