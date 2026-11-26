import { A, GuidePage, guideMetadata, H1, H2, List } from "@/components/marketing/GuidePage";
import { VAN_GUIDES } from "@/components/marketing/VanSchedule";

export const metadata = guideMetadata(
  "/van-maintenance",
  "Delivery van maintenance schedules: Transit, ProMaster, Sprinter, Rivian — Wrenchtron",
  "Severe-duty maintenance schedules for the vans delivery fleets run: Ford Transit, Ram ProMaster, Mercedes Sprinter and Rivian EDV.",
);

export default function Page() {
  return (
    <GuidePage>
      <H1>Delivery van maintenance schedules</H1>
      <p>
        Delivery is severe duty: idling, short hops, a door opening every few minutes, and a full load all day. The
        normal schedule in the owner&apos;s guide assumes much easier miles. These pages cover what to track on the
        vans most delivery fleets run, and a starting schedule for each.
      </p>
      <List>
        {VAN_GUIDES.map((g) => (
          <li key={g.slug}>
            <A href={`/van-maintenance/${g.slug}`}>{g.name}</A>: {g.intro.split(". ")[0]}.
          </li>
        ))}
      </List>
      <H2>Same schedule, every van</H2>
      <p>
        Most fleets don&apos;t fail on the schedule. They fail on knowing which of 40 or 80 vans are behind it.{" "}
        <A href="/fleet-maintenance-log">A shared fleet maintenance log</A> puts every van, every visit and the
        photos in one place.
      </p>
    </GuidePage>
  );
}
