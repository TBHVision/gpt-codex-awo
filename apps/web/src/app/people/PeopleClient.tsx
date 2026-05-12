"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StorefrontNav from "@/app/components/StorefrontNav";
import { readBuyerSession } from "@/lib/buyer-auth";
import {
  combinePeopleAndOccasions,
  createPlanningPerson,
  fetchPlanningData,
} from "@/lib/buyer-planning";
import type { PlanningPerson } from "@/lib/buyer-planning";

const initialPeople: PlanningPerson[] = [
  {
    id: "demo-mom",
    name: "Mom",
    occasion: "Birthday",
    relationship: "Family",
    source: "local",
  },
  {
    id: "demo-sam",
    name: "Sam",
    occasion: "Encouragement",
    relationship: "Friend",
    source: "local",
  },
];

const PEOPLE_STORAGE_KEY = "awo-demo-people";

function loadInitialPeople() {
  try {
    const savedPeople = window.localStorage.getItem(PEOPLE_STORAGE_KEY);

    if (!savedPeople) {
      return initialPeople;
    }

    const parsedPeople = JSON.parse(savedPeople) as PlanningPerson[];

    if (Array.isArray(parsedPeople) && parsedPeople.length > 0) {
      return parsedPeople.map((person) => ({
        ...person,
        source: "local" as const,
      }));
    }
  } catch {
    return initialPeople;
  }

  return initialPeople;
}

export default function PeopleClient() {
  const [accountMode, setAccountMode] = useState(false);
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [people, setPeople] = useState<PlanningPerson[]>(initialPeople);
  const [relationship, setRelationship] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = readBuyerSession();

      if (!session) {
        setPeople(loadInitialPeople());
        setAccountMode(false);
        setStatus("Using local browser storage. Sign in to save people to your account.");
        setIsLoaded(true);
        return;
      }

      setAccountMode(true);
      fetchPlanningData(session)
        .then(({ occasions, people: savedPeople }) => {
          setPeople(combinePeopleAndOccasions(savedPeople, occasions));
          setStatus("Using Supabase account storage.");
        })
        .catch((loadError: unknown) => {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load account people.",
          );
          setPeople(loadInitialPeople());
          setAccountMode(false);
        })
        .finally(() => setIsLoaded(true));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded || accountMode) {
      return;
    }

    window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
  }, [accountMode, isLoaded, people]);

  const upcomingOccasions = useMemo(
    () =>
      people.map((person, index) => ({
        ...person,
        timing: index === 0 ? "Next 30 days" : "Planning queue",
      })),
    [people],
  );

  async function addPerson() {
    if (!name.trim() || !occasion.trim()) {
      return;
    }

    setError("");
    setStatus("");
    setIsSaving(true);

    try {
      const session = readBuyerSession();
      const nextPerson = {
        name: name.trim(),
        occasion: occasion.trim(),
        relationship: relationship.trim() || "Recipient",
      };

      if (accountMode && session) {
        const saved = await createPlanningPerson(session, nextPerson);
        setPeople((current) => [
          ...current,
          {
            id: saved.person.id,
            name: saved.person.display_name,
            occasion: saved.occasion.title,
            relationship: saved.person.relationship || "Recipient",
            source: "account",
          },
        ]);
        setStatus("Saved person and first reminder to Supabase.");
      } else {
        setPeople((current) => [
          ...current,
          {
            id: `${name}-${Date.now()}`,
            ...nextPerson,
            source: "local",
          },
        ]);
        setStatus("Saved locally in this browser.");
      }

      setName("");
      setRelationship("");
      setOccasion("");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save person.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function resetPeople() {
    if (accountMode) {
      setError("Account-backed people cannot be reset from this local demo control yet.");
      return;
    }

    setPeople(initialPeople);
    setIsLoaded(true);
    window.localStorage.removeItem(PEOPLE_STORAGE_KEY);
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="people" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_45%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            V0.4 buyer tools
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
            Remember the people you send meaning to.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
            Signed-in buyers save people and first reminders to Supabase. Guests
            can still plan locally in this browser.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[380px_1fr] lg:px-10">
        <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <h2 className="text-2xl font-black">
            {accountMode ? "Add Person" : "Add Local Person"}
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
              Name
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setName(event.target.value)}
                placeholder="Recipient name"
                type="text"
                value={name}
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Relationship
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setRelationship(event.target.value)}
                placeholder="Family, friend, customer..."
                type="text"
                value={relationship}
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Occasion
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setOccasion(event.target.value)}
                placeholder="Birthday, thanks, support..."
                type="text"
                value={occasion}
              />
            </label>
          </div>
          <button
            className={`mt-6 h-12 w-full px-4 text-sm font-black uppercase tracking-wide ${
              name.trim() && occasion.trim()
                ? "bg-[#252525] text-white hover:bg-[#3a3632]"
                : "bg-[#e5ded6] text-[#8a8178]"
            }`}
            disabled={!name.trim() || !occasion.trim()}
            onClick={addPerson}
            type="button"
          >
            {isSaving ? "Saving..." : "Add Person"}
          </button>
          {!accountMode ? (
            <button
              className="mt-3 h-11 w-full border border-[#d8c8bb] px-4 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:border-[#b7653a] hover:bg-[#fff8f3]"
              onClick={resetPeople}
              type="button"
            >
              Reset Local People
            </button>
          ) : null}
          <Link
            className="mt-3 inline-flex h-11 w-full items-center justify-center border border-[#b7653a] bg-[#fff8f3] px-4 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:bg-[#f6ebe2]"
            href="/reminders"
          >
            Plan Reminders
          </Link>
        </aside>

        <div className="grid gap-6">
          <section className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
            <h2 className="text-2xl font-black">My People</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {people.map((person) => (
                <article className="border border-[#e5ded6] bg-[#fbfaf8] p-5" key={person.id}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                    {person.relationship}
                  </p>
                  <h3 className="mt-2 text-2xl font-black">{person.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#4b4743]">
                    Next card intent: {person.occasion}
                  </p>
                  <p className="mt-4 text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    {person.source === "account" ? "Supabase" : "Local"} storage
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
              <h2 className="text-2xl font-black">Upcoming Occasions</h2>
              <div className="mt-5 space-y-3">
                {upcomingOccasions.map((person) => (
                  <div className="flex items-center justify-between border border-[#e5ded6] bg-[#fbfaf8] p-4" key={person.id}>
                    <div>
                      <p className="font-black">{person.occasion}</p>
                      <p className="text-sm text-[#4b4743]">{person.name}</p>
                    </div>
                    <span className="text-xs font-black uppercase tracking-wide text-[#b7653a]">
                      {person.timing}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
              <h2 className="text-2xl font-black">Sent Card History</h2>
              <div className="mt-5 border border-dashed border-[#dfd5ca] bg-[#fbfaf8] p-5">
                <p className="text-sm leading-6 text-[#4b4743]">
                  Sent-card history will connect orders, recipients, reveal
                  status, and reminders as buyer activity accumulates in the
                  account-backed workflow.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
