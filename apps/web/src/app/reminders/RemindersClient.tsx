"use client";

import { useEffect, useMemo, useState } from "react";
import StorefrontNav from "@/app/components/StorefrontNav";
import { readBuyerSession } from "@/lib/buyer-auth";
import {
  combineReminderQueue,
  createPlanningReminder,
  fetchPlanningData,
} from "@/lib/buyer-planning";
import type { PlanningReminder } from "@/lib/buyer-planning";

type StoredPerson = {
  name: string;
  occasion: string;
};

const PEOPLE_STORAGE_KEY = "awo-demo-people";

const demoReminders: PlanningReminder[] = [
  {
    id: "reminder-mom",
    cadence: "30 days before",
    channel: "Dashboard only",
    occasion: "Birthday",
    person: "Mom",
    source: "local",
  },
  {
    id: "reminder-sam",
    cadence: "Next shop visit",
    channel: "Dashboard only",
    occasion: "Encouragement",
    person: "Sam",
    source: "local",
  },
];

function loadReminderSeed() {
  try {
    const savedPeople = window.localStorage.getItem(PEOPLE_STORAGE_KEY);

    if (!savedPeople) {
      return demoReminders;
    }

    const people = JSON.parse(savedPeople) as StoredPerson[];

    if (!Array.isArray(people) || people.length === 0) {
      return demoReminders;
    }

    return people.map((person, index) => ({
      id: `person-reminder-${index}-${person.name}`,
      cadence: index === 0 ? "30 days before" : "Planning queue",
      channel: "Dashboard only",
      occasion: person.occasion,
      person: person.name,
      source: "local" as const,
    }));
  } catch {
    return demoReminders;
  }
}

export default function RemindersClient() {
  const [accountMode, setAccountMode] = useState(false);
  const [cadence, setCadence] = useState("30 days before");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [person, setPerson] = useState("");
  const [reminders, setReminders] = useState<PlanningReminder[]>(demoReminders);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = readBuyerSession();

      if (!session) {
        setAccountMode(false);
        setReminders(loadReminderSeed());
        setStatus("Using local browser reminders. Sign in to save reminders to your account.");
        return;
      }

      setAccountMode(true);
      fetchPlanningData(session)
        .then(({ occasions, people }) => {
          setReminders(combineReminderQueue(people, occasions));
          setStatus("Using Supabase account storage.");
        })
        .catch((loadError: unknown) => {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load account reminders.",
          );
          setAccountMode(false);
          setReminders(loadReminderSeed());
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const sortedReminders = useMemo(
    () =>
      [...reminders].sort((left, right) =>
        left.person.localeCompare(right.person),
      ),
    [reminders],
  );

  async function addReminder() {
    if (!person.trim() || !occasion.trim()) {
      return;
    }

    setError("");
    setStatus("");
    setIsSaving(true);

    try {
      const session = readBuyerSession();
      const nextReminder = {
        cadence,
        occasion: occasion.trim(),
        person: person.trim(),
      };

      if (accountMode && session) {
        const saved = await createPlanningReminder(session, nextReminder);
        setReminders((current) => [
          ...current,
          {
            cadence,
            channel: "Account storage",
            id: saved.occasion.id,
            occasion: saved.occasion.title,
            person: saved.person.display_name,
            source: "account",
          },
        ]);
        setStatus("Saved reminder to Supabase.");
      } else {
        setReminders((current) => [
          ...current,
          {
            id: `${person}-${Date.now()}`,
            ...nextReminder,
            channel: "Dashboard only",
            source: "local",
          },
        ]);
        setStatus("Saved reminder locally in this browser.");
      }

      setPerson("");
      setOccasion("");
      setCadence("30 days before");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save reminder.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="reminders" />

      <section className="border-b border-[#e5ded6] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            V0.4 buyer tools
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none tracking-tight sm:text-6xl">
            Plan the nudge before the moment passes.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
            Signed-in buyers save reminders to Supabase. Real SMS, email, and
            calendar automation stay in Parking Lot / Future until consent rules
            are ready.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[380px_1fr] lg:px-10">
        <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <h2 className="text-2xl font-black">
            {accountMode ? "Add Reminder" : "Add Local Reminder"}
          </h2>
          {status ? (
            <p className="mt-3 border border-[#cfe8d8] bg-[#f2fbf5] p-3 text-sm font-bold text-[#256b3d]">
              {status}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 border border-[#f0c7c7] bg-[#fff5f5] p-3 text-sm font-bold text-[#9d1c1c]">
              {error}
            </p>
          ) : null}
          <div className="mt-5 grid gap-4">
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Person
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setPerson(event.target.value)}
                placeholder="Recipient name"
                type="text"
                value={person}
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Occasion
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setOccasion(event.target.value)}
                placeholder="Birthday, thanks, renewal..."
                type="text"
                value={occasion}
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Cadence
              <select
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setCadence(event.target.value)}
                value={cadence}
              >
                <option>30 days before</option>
                <option>7 days before</option>
                <option>Next shop visit</option>
                <option>Planning queue</option>
              </select>
            </label>
          </div>
          <button
            className={`mt-6 h-12 w-full px-4 text-sm font-black uppercase tracking-wide ${
              person.trim() && occasion.trim()
                ? "bg-[#252525] text-white hover:bg-[#3a3632]"
                : "bg-[#e5ded6] text-[#8a8178]"
            }`}
            disabled={!person.trim() || !occasion.trim()}
            onClick={addReminder}
            type="button"
          >
            {isSaving ? "Saving..." : "Add Reminder"}
          </button>
        </aside>

        <section className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-black">Reminder Queue</h2>
              <p className="mt-2 text-sm leading-6 text-[#4b4743]">
                Local planning queue for who needs a card, when to think about
                it, and which future channel should eventually handle it.
              </p>
            </div>
            <span className="border border-[#dfd5ca] bg-[#fbfaf8] px-3 py-2 text-xs font-black uppercase tracking-wide text-[#7a472e]">
              {sortedReminders.length} planned
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {sortedReminders.map((reminder) => (
              <article
                className="grid gap-4 border border-[#e5ded6] bg-[#fbfaf8] p-5 md:grid-cols-[1fr_180px_150px]"
                key={reminder.id}
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                    {reminder.person}
                  </p>
                  <h3 className="mt-2 text-xl font-black">
                    {reminder.occasion}
                  </h3>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    Cadence
                  </p>
                  <p className="mt-2 font-bold">{reminder.cadence}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    Channel
                  </p>
                  <p className="mt-2 font-bold">{reminder.channel}</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    {reminder.source === "account" ? "Supabase" : "Local"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
