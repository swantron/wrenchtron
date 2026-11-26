import { ELECTRIC_VAN, GAS_SEVERE, type FleetSchedulePreset } from "@/data/fleetSchedules";
import { A, GuidePage, H1, H2, List } from "./GuidePage";

export interface VanGuide {
  slug: string;
  name: string;
  title: string;
  description: string;
  intro: string;
  /** What's particular to this van, beyond the general schedule. */
  notes: string[];
  electric?: { name: string; note: string };
  electricOnly?: boolean;
}

export const VAN_GUIDES: VanGuide[] = [
  {
    slug: "ford-transit",
    name: "Ford Transit",
    title: "Ford Transit maintenance schedule for delivery fleets — Wrenchtron",
    description:
      "What to track on a Ford Transit running delivery routes: oil, tires, brakes and inspections on a severe-duty schedule, logged with photos.",
    intro:
      "The Transit is the most common van in last-mile delivery. On a route it idles, stops and starts all day, and that wears it faster than the mileage alone suggests.",
    notes: [
      "Gas Transits have Ford's oil-life monitor, which puts a message on the dash when oil is due. Log every change anyway, and don't let a van run past the severe-duty interval.",
      "Ford's scheduled maintenance guide has a separate list for special operating conditions, like long idling and frequent short trips. Delivery work almost always belongs there.",
      "Rotate tires at every oil change. Loaded rear axles and curb strikes wear them unevenly.",
      "Sliding side doors, hinges and the rear door checks take a beating from hundreds of cycles a day. Add them to the inspection.",
    ],
    electric: {
      name: "E-Transit",
      note: "The electric E-Transit drops the oil change. Tires, brakes, the cabin filter and the inspection stay.",
    },
  },
  {
    slug: "ram-promaster",
    name: "Ram ProMaster",
    title: "Ram ProMaster maintenance schedule for delivery fleets — Wrenchtron",
    description:
      "What to track on a Ram ProMaster in delivery service: oil, front tires, brakes and inspections on a severe-duty schedule, with photo proof.",
    intro:
      "The ProMaster is front-wheel drive, so the front axle steers, drives and carries the engine. On a delivery route that shows up first in the front tires and brakes.",
    notes: [
      "Gas ProMasters have an oil-change indicator on the dash. Stop-and-go delivery is severe duty, so don't let the indicator be the only reminder. Log each change and keep to the shorter interval.",
      "Front tires wear much faster than the rears. Rotate on schedule and record tread depth, so you can see which vans are eating tires.",
      "Front brakes do most of the stopping. Check pads at every inspection, not just when they squeal.",
      "The tall, wide body catches mirrors, corners and roof edges at docks. Damage reports with photos settle who did what.",
    ],
    electric: {
      name: "ProMaster EV",
      note: "The electric ProMaster drops the oil change. Tires, brakes, the cabin filter and the inspection stay.",
    },
  },
  {
    slug: "mercedes-sprinter",
    name: "Mercedes-Benz Sprinter",
    title: "Mercedes Sprinter maintenance schedule for delivery fleets — Wrenchtron",
    description:
      "What to track on a Mercedes-Benz Sprinter in delivery service: Service A and B, DEF on diesels, tires, brakes and inspections, logged with photos.",
    intro:
      "Sprinters show their service on the dash as Service A and Service B, alternating. Delivery routes run them harder than the indicator assumes, so a fleet log matters.",
    notes: [
      "Log each Service A and Service B as its own visit, with the odometer photo, so the next one is easy to predict across the whole fleet.",
      "Diesel Sprinters need diesel exhaust fluid (DEF). Track top-ups, since a van that runs out of DEF can be limited until it's refilled.",
      "Short routes with lots of idling are hard on diesel emissions systems. Note warning lights in the visit, so a pattern shows up before a van goes down.",
      "Tires, brakes and the sliding door get the same delivery wear as any other van. Keep them on the six-month inspection.",
    ],
    electric: {
      name: "eSprinter",
      note: "The electric eSprinter drops oil and DEF. Tires, brakes, the cabin filter and the inspection stay.",
    },
  },
  {
    slug: "rivian-edv",
    name: "Rivian EDV",
    title: "Rivian EDV (electric delivery van) maintenance schedule — Wrenchtron",
    description:
      "What to track on a Rivian electric delivery van: tires, brakes, cabin filter and inspections. No oil changes, but plenty to log, with photos.",
    intro:
      "The Rivian EDV is electric, so there are no oil changes. That doesn't mean there's nothing to track. EVs are heavy and quick off the line, and delivery work finds every weak spot.",
    notes: [
      "Tires are the big one. Battery weight and instant torque wear them faster than on a gas van. Rotate on schedule and record tread depth.",
      "Regenerative braking means pads last longer, but calipers and slides still need checking, especially where roads are salted.",
      "Replace the cabin air filter yearly. Drivers spend the whole shift in that cab with the door opening constantly.",
      "Log warning messages and software updates in the visit notes, so you can tell a one-off from a pattern across the fleet.",
    ],
    electricOnly: true,
  },
];

function describe(preset: FleetSchedulePreset) {
  return preset.intervals.map((i) => {
    const parts = [
      i.mileageInterval && `every ${i.mileageInterval.toLocaleString("en-US")} miles`,
      i.timeIntervalMonths && `every ${i.timeIntervalMonths} months`,
    ].filter(Boolean);
    return { name: i.name, when: parts.length > 1 ? `${parts.join(" or ")}, whichever comes first` : parts[0], note: i.notes };
  });
}

function ScheduleTable({ preset }: { preset: FleetSchedulePreset }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-base">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="py-2 pr-4 font-semibold text-gray-900 dark:text-white">Service</th>
            <th className="py-2 font-semibold text-gray-900 dark:text-white">When</th>
          </tr>
        </thead>
        <tbody>
          {describe(preset).map((row) => (
            <tr key={row.name} className="border-b border-gray-100 align-top dark:border-gray-800/60">
              <td className="py-2 pr-4">{row.name}</td>
              <td className="py-2">
                {row.when}
                {row.note && <span className="block text-sm text-gray-500">{row.note}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VanSchedule({ guide }: { guide: VanGuide }) {
  const others = VAN_GUIDES.filter((g) => g.slug !== guide.slug);
  return (
    <GuidePage>
      <H1>{guide.name} maintenance schedule for delivery fleets</H1>
      <p>{guide.intro}</p>

      <H2>{guide.electricOnly ? "A starting schedule" : "A starting schedule for gas vans on delivery routes"}</H2>
      <p>
        This is the severe-duty schedule Wrenchtron gives a {guide.electricOnly ? "" : "gas "}
        {guide.name} when you add it to a fleet. Your owner&apos;s guide and the van&apos;s own service
        reminder come first. Use this as the floor, and change the intervals to match your shop.
      </p>
      <ScheduleTable preset={guide.electricOnly ? ELECTRIC_VAN : GAS_SEVERE} />

      {guide.electric && (
        <>
          <H2>{guide.electric.name}</H2>
          <p>{guide.electric.note}</p>
          <ScheduleTable preset={ELECTRIC_VAN} />
        </>
      )}

      <H2>What to watch on a {guide.name}</H2>
      <List>
        {guide.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </List>

      <H2>Keeping the log across a fleet</H2>
      <p>
        A schedule only helps if someone can see which vans are behind it. In Wrenchtron you paste your VINs and each
        van gets this schedule. Whoever does the work logs it from their phone, with photos of the odometer, the part
        and the invoice. The vans that are overdue or down come to the top. See{" "}
        <A href="/van-fleet-maintenance">how it works for a delivery fleet</A>, or the schedules for the{" "}
        {others.map((g, i) => (
          <span key={g.slug}>
            {i > 0 && (i === others.length - 1 ? " and " : ", ")}
            <A href={`/van-maintenance/${g.slug}`}>{g.name}</A>
          </span>
        ))}
        .
      </p>
    </GuidePage>
  );
}
