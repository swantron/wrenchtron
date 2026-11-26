import { A, GuidePage, guideMetadata, H1, H2, List } from "@/components/marketing/GuidePage";

export const metadata = guideMetadata(
  "/van-fleet-maintenance",
  "Maintenance tracking for delivery van fleets — Wrenchtron",
  "Track maintenance across a fleet of delivery vans: what's due, which vans are down, and photo proof of every repair. Built for last-mile delivery companies.",
);

export default function Page() {
  return (
    <GuidePage>
      <H1>Maintenance tracking for delivery van fleets</H1>
      <p>
        A delivery company with 20, 50 or 100 vans has the same three questions every morning. Which vans can run
        today? Which ones are due? And was the work we paid for actually done? Wrenchtron answers all three from one
        screen, on a phone or a laptop.
      </p>

      <H2>Every van on one board</H2>
      <p>
        Each van shows as in service, down, overdue or due soon. The ones that need you come first. Filter by site if
        you run more than one station.
      </p>

      <H2>Photo proof of the work</H2>
      <p>
        Whoever does the work, whether that&apos;s your own tech in the yard, a partner shop or a mobile mechanic,
        logs it from their phone. They snap the odometer, the part and the invoice. You can see what was done to any
        van, and when, without chasing paperwork.
      </p>

      <H2>A schedule from the VIN</H2>
      <p>
        Paste your VINs and each van gets a severe-duty schedule for its powertrain: gas vans get oil, tires and
        inspections, and electric vans skip the oil. See the starting schedules for the{" "}
        <A href="/van-maintenance/ford-transit">Ford Transit</A>,{" "}
        <A href="/van-maintenance/ram-promaster">Ram ProMaster</A>,{" "}
        <A href="/van-maintenance/mercedes-sprinter">Mercedes Sprinter</A> and{" "}
        <A href="/van-maintenance/rivian-edv">Rivian EDV</A>.
      </p>

      <H2>Damage reports that put the van down</H2>
      <p>
        When a driver brings a van back with a cracked mirror, the report and photos go on that van, and it&apos;s
        marked down with a note, so nobody sends it out. More on{" "}
        <A href="/van-damage-report">van damage reports</A>.
      </p>

      <H2>What you get</H2>
      <List>
        <li>Owners and managers run the fleet. Techs log the work from their phones.</li>
        <li>Invite your team by link. Sign in is with Google or an emailed link, with no passwords to manage.</li>
        <li>Download every van and every visit as a spreadsheet whenever you want. It&apos;s your data.</li>
        <li>It installs to the phone&apos;s home screen and opens like an app, even in a yard with bad signal.</li>
      </List>
    </GuidePage>
  );
}
