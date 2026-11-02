"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFleet } from "@/components/fleet/FleetProvider";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  createInvite,
  deleteInvite,
  joinLink,
  leaveFleet,
  removeMember,
  setMemberRole,
  subscribeToInvites,
  subscribeToMembers,
} from "@/lib/firebase/fleet";
import type { FleetInvite, FleetMember, FleetRole } from "@/types/fleet";

const ROLE_LABELS: Record<FleetRole, string> = { owner: "Owner", manager: "Manager", tech: "Tech" };
const ROLE_ORDER: Record<FleetRole, number> = { owner: 0, manager: 1, tech: 2 };
const ROLE_HELP = {
  tech: "Logs work and updates van status.",
  manager: "Also adds vans, invites techs, and edits or deletes logs.",
} as const;

const inputClass =
  "w-full rounded border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-stone-300 sm:text-sm";
const buttonClass =
  "rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200";
const linkButtonClass =
  "text-sm text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline dark:text-stone-300 dark:hover:text-white";

type Pending =
  | { kind: "remove"; member: FleetMember }
  | { kind: "leave" };

export default function TeamPage() {
  const { user } = useAuth();
  const { fleetId, fleet, member: me, loading } = useFleet();
  const { showToast } = useToast();
  const router = useRouter();

  const [members, setMembers] = useState<{ fleetId: string; list: FleetMember[] } | null>(null);
  const [invites, setInvites] = useState<{ fleetId: string; list: FleetInvite[] } | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<FleetInvite["role"]>("tech");
  const [sending, setSending] = useState(false);
  const [justInvited, setJustInvited] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const isOwner = me?.role === "owner";
  const isManager = me?.role === "owner" || me?.role === "manager";

  useEffect(() => {
    if (!fleetId || !me) return;
    return subscribeToMembers(fleetId, (list) => setMembers({ fleetId, list }));
  }, [fleetId, me]);

  useEffect(() => {
    if (!fleetId || !isManager) return;
    return subscribeToInvites(fleetId, (list) => setInvites({ fleetId, list }));
  }, [fleetId, isManager]);

  if (loading || !fleetId || !fleet || !me || !user) {
    return (
      <div className="flex justify-center py-24">
        {loading ? <LoadingSpinner /> : <p className="text-stone-600 dark:text-stone-300">You&apos;re not in a fleet yet.</p>}
      </div>
    );
  }

  const memberList = (members?.fleetId === fleetId ? members.list : [])
    .slice()
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.displayName.localeCompare(b.displayName));
  const inviteList = (invites?.fleetId === fleetId ? invites.list : []).slice().sort((a, b) => a.email.localeCompare(b.email));

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!address) return;
    if (memberList.some((m) => m.email.toLowerCase() === address)) {
      showToast(`${address} is already on the team.`, "info");
      return;
    }
    setSending(true);
    try {
      await createInvite(fleetId, fleet.name, address, isOwner ? role : "tech", user);
      setJustInvited(address);
      setEmail("");
    } catch (error) {
      console.error("Failed to invite:", error);
      showToast("Couldn't create the invite. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  const confirmPending = async () => {
    if (!pending) return;
    const action = pending;
    setPending(null);
    try {
      if (action.kind === "remove") {
        await removeMember(fleetId, action.member.uid);
        showToast(`Removed ${action.member.displayName}.`, "success");
      } else {
        await leaveFleet(fleetId, user.uid);
        router.push("/fleet");
      }
    } catch (error) {
      console.error("Failed to update team:", error);
      showToast("That didn't work. Please try again.", "error");
    }
  };

  const changeRole = async (target: FleetMember, next: Exclude<FleetRole, "owner">) => {
    try {
      await setMemberRole(fleetId, target.uid, next);
    } catch (error) {
      console.error("Failed to change role:", error);
      showToast("Couldn't change the role. Please try again.", "error");
    }
  };

  const canRemove = (m: FleetMember) =>
    m.uid !== user.uid && m.role !== "owner" && (isOwner || (isManager && m.role === "tech"));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white sm:text-3xl">Team</h1>
      <p className="mt-1 text-stone-600 dark:text-stone-300">
        Everyone here sees every van in {fleet.name}.
      </p>

      {isManager && (
        <section className="mt-8 rounded-lg border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-semibold text-stone-900 dark:text-white">Invite someone</h2>
          <form onSubmit={sendInvite} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">Their email</span>
              <input
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tech@company.com"
                required
                className={inputClass}
              />
            </label>
            {isOwner && (
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">Role</legend>
                <div className="space-y-2">
                  {(["tech", "manager"] as const).map((r) => (
                    <label key={r} className="flex items-start gap-2 text-sm">
                      <input
                        type="radio"
                        name="role"
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="mt-0.5 h-4 w-4 accent-stone-900"
                      />
                      <span>
                        <span className="font-medium text-stone-900 dark:text-white">{ROLE_LABELS[r]}</span>
                        <span className="text-stone-500 dark:text-stone-400"> — {ROLE_HELP[r]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <button type="submit" disabled={sending || !email.trim()} className={buttonClass}>
              {sending ? "Inviting…" : "Invite"}
            </button>
          </form>

          {justInvited && (
            <div className="mt-5 rounded border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700/60 dark:bg-amber-950/40">
              <p className="font-medium text-stone-900 dark:text-white">Now send {justInvited} the join link</p>
              <p className="mt-1 text-stone-600 dark:text-stone-300">
                Wrenchtron doesn&apos;t email invites. Text or email this link; they sign in with {justInvited} and
                they&apos;re in.
              </p>
              <ShareLink fleetName={fleet.name} url={joinLink(fleetId)} className="mt-3" />
            </div>
          )}
        </section>
      )}

      {isManager && inviteList.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold text-stone-900 dark:text-white">Waiting to join</h2>
          <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            {inviteList.map((inv) => (
              <li key={inv.email} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900 dark:text-white">{inv.email}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Invited as {ROLE_LABELS[inv.role].toLowerCase()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <ShareLink fleetName={fleet.name} url={joinLink(fleetId)} compact />
                  <button
                    onClick={() =>
                      deleteInvite(fleetId, inv.email).catch((error) => {
                        console.error("Failed to cancel invite:", error);
                        showToast("Couldn't cancel the invite.", "error");
                      })
                    }
                    className={linkButtonClass}
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-semibold text-stone-900 dark:text-white">
          Members <span className="font-normal text-stone-400">{memberList.length || ""}</span>
        </h2>
        <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {memberList.map((m) => (
            <li key={m.uid} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900 dark:text-white">
                  {m.displayName || m.email}
                  {m.uid === user.uid && <span className="font-normal text-stone-400"> (you)</span>}
                </p>
                {m.displayName && m.displayName !== m.email && (
                  <p className="truncate text-sm text-stone-500 dark:text-stone-400">{m.email}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                {isOwner && m.role !== "owner" ? (
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m, e.target.value as Exclude<FleetRole, "owner">)}
                    aria-label={`Role for ${m.displayName || m.email}`}
                    className="rounded border border-stone-300 bg-white px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-900"
                  >
                    <option value="tech">Tech</option>
                    <option value="manager">Manager</option>
                  </select>
                ) : (
                  <span className="text-sm text-stone-500 dark:text-stone-400">{ROLE_LABELS[m.role]}</span>
                )}
                {canRemove(m) && (
                  <button onClick={() => setPending({ kind: "remove", member: m })} className={linkButtonClass}>
                    Remove
                  </button>
                )}
                {m.uid === user.uid && m.role !== "owner" && (
                  <button onClick={() => setPending({ kind: "leave" })} className={linkButtonClass}>
                    Leave
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={!!pending}
        title={pending?.kind === "leave" ? `Leave ${fleet.name}?` : `Remove ${pending?.kind === "remove" ? pending.member.displayName : ""}?`}
        description={
          pending?.kind === "leave"
            ? "You'll lose access to the fleet's vans and history. Someone will have to invite you again."
            : "They'll lose access right away. The work they logged stays in each van's history."
        }
        confirmLabel={pending?.kind === "leave" ? "Leave" : "Remove"}
        destructive
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

/** Copy, or on a phone hand it to the share sheet (Messages, WhatsApp, email…). */
function ShareLink({
  fleetName,
  url,
  compact = false,
  className = "",
}: {
  fleetName: string;
  url: string;
  compact?: boolean;
  className?: string;
}) {
  const { showToast } = useToast();
  const text = `Join ${fleetName} on Wrenchtron to log van service from your phone:`;
  // Only rendered after the fleet loads, never in the static prerender
  const label = typeof navigator !== "undefined" && typeof navigator.share === "function" ? "Send link" : "Copy link";

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `Join ${fleetName}`, text, url });
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied.", "success");
    } catch {
      showToast(url, "info");
    }
  };

  if (compact) {
    return (
      <button onClick={share} className={linkButtonClass}>
        {label}
      </button>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <code className="min-w-0 max-w-full truncate rounded bg-white px-2 py-1.5 text-xs text-stone-700 dark:bg-stone-950 dark:text-stone-300">
        {url}
      </code>
      <button onClick={share} className={buttonClass}>
        {label}
      </button>
    </div>
  );
}
