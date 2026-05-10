"use client";

import { useMemo, useState } from "react";
import StorefrontNav from "@/app/components/StorefrontNav";

type Person = {
  id: string;
  name: string;
  occasion: string;
  relationship: string;
};

const initialPeople: Person[] = [
  {
    id: "demo-mom",
    name: "Mom",
    occasion: "Birthday",
    relationship: "Family",
  },
  {
    id: "demo-sam",
    name: "Sam",
    occasion: "Encouragement",
    relationship: "Friend",
  },
];

export default function PeopleClient() {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [occasion, setOccasion] = useState("");

  const upcomingOccasions = useMemo(
    () =>
      people.map((person, index) => ({
        ...person,
        timing: index === 0 ? "Next 30 days" : "Planning queue",
      })),
    [people],
  );

  function addPerson() {
    if (!name.trim() || !occasion.trim()) {
      return;
    }

    setPeople((current) => [
      ...current,
      {
        id: `${name}-${Date.now()}`,
        name: name.trim(),
        occasion: occasion.trim(),
        relationship: relationship.trim() || "Recipient",
      },
    ]);
    setName("");
    setRelationship("");
    setOccasion("");
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="people" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_45%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            V0.4 buyer tools
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none tracking-tight sm:text-6xl">
            Remember the people you send meaning to.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
            This shell previews relationship-centered planning. Demo people live
            only in the browser for now; full account storage comes later.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[380px_1fr] lg:px-10">
        <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <h2 className="text-2xl font-black">Add Demo Person</h2>
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
            Add Person
          </button>
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
                  status, and future reminders after account storage is wired.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
