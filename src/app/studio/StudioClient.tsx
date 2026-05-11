"use client";

import { useEffect, useMemo, useState } from "react";
import StorefrontNav from "@/app/components/StorefrontNav";

type Draft = {
  id: string;
  capture: "Draft" | "Ready";
  category: string;
  title: string;
};

const initialDrafts: Draft[] = [
  {
    id: "draft-wildflower",
    capture: "Ready",
    category: "Birthday",
    title: "Wildflower Notes",
  },
  {
    id: "draft-coastal",
    capture: "Draft",
    category: "Sympathy",
    title: "Coastal Morning",
  },
];

const captureChecklist = [
  "Artwork title and story",
  "Creation photos or process notes",
  "Artist verification statement",
  "QR reveal copy",
  "Ownership terms review",
];

const STUDIO_DRAFTS_STORAGE_KEY = "awo-studio-drafts";
const STUDIO_EVIDENCE_STORAGE_KEY = "awo-studio-evidence";
const initialCapturedEvidence = [captureChecklist[0], captureChecklist[2]];

function loadInitialDrafts() {
  if (typeof window === "undefined") {
    return initialDrafts;
  }

  try {
    const savedDrafts = window.localStorage.getItem(STUDIO_DRAFTS_STORAGE_KEY);

    if (!savedDrafts) {
      return initialDrafts;
    }

    const parsedDrafts = JSON.parse(savedDrafts) as Draft[];

    if (Array.isArray(parsedDrafts) && parsedDrafts.length > 0) {
      return parsedDrafts;
    }
  } catch {
    return initialDrafts;
  }

  return initialDrafts;
}

function loadInitialEvidence() {
  if (typeof window === "undefined") {
    return initialCapturedEvidence;
  }

  try {
    const savedEvidence = window.localStorage.getItem(STUDIO_EVIDENCE_STORAGE_KEY);

    if (!savedEvidence) {
      return initialCapturedEvidence;
    }

    const parsedEvidence = JSON.parse(savedEvidence) as string[];

    if (Array.isArray(parsedEvidence)) {
      return parsedEvidence.filter((item) => captureChecklist.includes(item));
    }
  } catch {
    return initialCapturedEvidence;
  }

  return initialCapturedEvidence;
}

export default function StudioClient() {
  const [drafts, setDrafts] = useState<Draft[]>(loadInitialDrafts);
  const [capturedEvidence, setCapturedEvidence] = useState<string[]>(
    loadInitialEvidence,
  );
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Originals");

  useEffect(() => {
    window.localStorage.setItem(
      STUDIO_DRAFTS_STORAGE_KEY,
      JSON.stringify(drafts),
    );
  }, [drafts]);

  useEffect(() => {
    window.localStorage.setItem(
      STUDIO_EVIDENCE_STORAGE_KEY,
      JSON.stringify(capturedEvidence),
    );
  }, [capturedEvidence]);

  const readyCount = useMemo(
    () => drafts.filter((draft) => draft.capture === "Ready").length,
    [drafts],
  );
  const evidenceReady = capturedEvidence.length === captureChecklist.length;

  function addDraft() {
    if (!title.trim()) {
      return;
    }

    setDrafts((current) => [
      ...current,
      {
        id: `${title}-${Date.now()}`,
        capture: "Draft",
        category,
        title: title.trim(),
      },
    ]);
    setTitle("");
    setCategory("Originals");
  }

  function toggleCapture(id: string) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id
          ? { ...draft, capture: draft.capture === "Ready" ? "Draft" : "Ready" }
          : draft,
      ),
    );
  }

  function toggleEvidence(item: string) {
    setCapturedEvidence((current) =>
      current.includes(item)
        ? current.filter((capturedItem) => capturedItem !== item)
        : [...current, item],
    );
  }

  function resetStudio() {
    setDrafts(initialDrafts);
    setCapturedEvidence(initialCapturedEvidence);
    window.localStorage.removeItem(STUDIO_DRAFTS_STORAGE_KEY);
    window.localStorage.removeItem(STUDIO_EVIDENCE_STORAGE_KEY);
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#252525]">
      <StorefrontNav active="artists" />

      <section className="border-b border-[#e5ded6] bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_45%,#f4f0ea_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
            V0.5 artist studio
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none tracking-tight sm:text-6xl">
            Prepare artwork with provenance from the start.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#4b4743]">
            This shell is not authenticated artist storage yet. It frames the
            workspace artists will use to draft card products, collect evidence,
            and know when a piece is ready to publish.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[380px_1fr] lg:px-10">
        <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <h2 className="text-2xl font-black">Add Draft</h2>
          <div className="mt-5 grid gap-4">
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Artwork title
              <input
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="New card title"
                type="text"
                value={title}
              />
            </label>
            <label className="block text-sm font-black uppercase tracking-wide text-[#373431]">
              Category
              <select
                className="mt-2 h-11 w-full border border-[#dfd5ca] bg-[#fbfaf8] px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-[#b7653a]"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option>Originals</option>
                <option>Birthday</option>
                <option>Sympathy</option>
                <option>Thanks</option>
                <option>Love</option>
              </select>
            </label>
          </div>
          <button
            className={`mt-6 h-12 w-full px-4 text-sm font-black uppercase tracking-wide ${
              title.trim()
                ? "bg-[#252525] text-white hover:bg-[#3a3632]"
                : "bg-[#e5ded6] text-[#8a8178]"
            }`}
            disabled={!title.trim()}
            onClick={addDraft}
            type="button"
          >
            Add Draft
          </button>
          <button
            className="mt-3 h-11 w-full border border-[#d8c8bb] px-4 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:border-[#b7653a] hover:bg-[#fff8f3]"
            onClick={resetStudio}
            type="button"
          >
            Reset Studio Demo
          </button>

          <div className="mt-6 border border-[#e5ded6] bg-[#fbfaf8] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              Publish readiness
            </p>
            <p className="mt-2 text-3xl font-black">
              {readyCount}/{drafts.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#4b4743]">
              {evidenceReady
                ? "All baseline evidence is checked. Studio drafts can move toward publish review."
                : "Drafts need full provenance evidence before publish review."}
            </p>
          </div>
        </aside>

        <div className="grid gap-6">
          <section className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
            <h2 className="text-2xl font-black">Artwork Drafts</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {drafts.map((draft) => (
                <article className="border border-[#e5ded6] bg-[#fbfaf8] p-5" key={draft.id}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
                    {draft.category}
                  </p>
                  <h3 className="mt-2 text-2xl font-black">{draft.title}</h3>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold">
                      Evidence: {draft.capture}
                    </span>
                    <button
                      className="border border-[#d8c8bb] bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-[#7a472e] hover:border-[#b7653a]"
                      onClick={() => toggleCapture(draft.id)}
                      type="button"
                    >
                      Toggle Ready
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-black">Provenance Checklist</h2>
                <span className="border border-[#dfd5ca] bg-[#fbfaf8] px-3 py-2 text-xs font-black uppercase tracking-wide text-[#7a472e]">
                  {capturedEvidence.length}/{captureChecklist.length}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {captureChecklist.map((item) => (
                  <label
                    className="flex cursor-pointer items-center gap-3 border border-[#e5ded6] bg-[#fbfaf8] p-4 text-sm font-bold"
                    key={item}
                  >
                    <input
                      checked={capturedEvidence.includes(item)}
                      className="size-5 accent-[#252525]"
                      onChange={() => toggleEvidence(item)}
                      type="checkbox"
                    />
                    {item}
                  </label>
                ))}
              </div>
              <p className="mt-4 border border-[#e5ded6] bg-[#fff8f3] p-4 text-sm leading-6 text-[#4b4743]">
                {evidenceReady
                  ? "Evidence capture is complete for this demo workspace."
                  : "Keep collecting evidence before the studio marks work ready for production review."}
              </p>
            </div>

            <div className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
              <h2 className="text-2xl font-black">Studio Roadmap</h2>
              <div className="mt-5 space-y-3 text-sm leading-6 text-[#4b4743]">
                <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                  Real artist accounts, uploads, moderation, and publishing
                  approval come after the admin and storage model is hardened.
                </p>
                <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                  V0.5 focuses on the workspace shape: drafts, evidence,
                  readiness, and the provenance steps artists understand.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
