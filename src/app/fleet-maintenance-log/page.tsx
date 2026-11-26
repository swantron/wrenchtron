import { A, GuidePage, guideMetadata, H1, H2, List } from "@/components/marketing/GuidePage";

export const metadata = guideMetadata(
  "/fleet-maintenance-log",
  "Fleet maintenance log: a spreadsheet alternative for van fleets — Wrenchtron",
  "Outgrown the fleet maintenance spreadsheet? Keep every van's service history in one shared log, with photos, due dates, and a CSV export when you want it.",
);

export default function Page() {
  return (
    <GuidePage>
      <H1>A fleet maintenance log that isn&apos;t a spreadsheet</H1>
      <p>
        Most small fleets start with a spreadsheet: one row per van, a column for the last oil change, and a tab
        nobody updates. It works at 10 vans. By 40 it&apos;s out of date the day after someone fills it in, and
        there&apos;s no proof behind any of the cells.
      </p>

      <H2>What a fleet maintenance log needs</H2>
      <List>
        <li>Every van, with its VIN, plate, mileage and site.</li>
        <li>Every visit: what was done, when, at what mileage, and who did it.</li>
        <li>Photos of the odometer, the part and the invoice, so the record can be trusted.</li>
        <li>What&apos;s due next, worked out for you, not a column you have to remember to update.</li>
        <li>Which vans are down, and why.</li>
      </List>

      <H2>Moving off the spreadsheet</H2>
      <p>
        In Wrenchtron you paste your list of vans to start, and each one gets a{" "}
        <A href="/van-maintenance">severe-duty schedule</A> from its VIN. From then on the people doing the work log
        it from their phones, and the log stays current on its own. When you want the spreadsheet back, for an
        audit, an insurer or a buyer, export every van and every visit as a CSV.
      </p>

      <H2>Free to try</H2>
      <p>
        The <A href="/demo/fleet">fleet demo</A> is a full sample log with vans that are down, overdue and due soon.
        Look around, then start your own fleet. There&apos;s no sales call.
      </p>
    </GuidePage>
  );
}
