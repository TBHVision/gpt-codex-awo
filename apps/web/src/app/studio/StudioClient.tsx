"use client";

import { useEffect, useMemo, useState } from "react";
import StorefrontNav from "@/app/components/StorefrontNav";
import { readBuyerSession } from "@/lib/buyer-auth";
import {
  createStudioDraft,
  fetchArtistStudioProfile,
  fetchStudioDrafts,
  updateStudioDraftChecklist,
} from "@/lib/artist-studio";
import type { ArtistStudioProfile, StudioDraftRecord } from "@/lib/artist-studio";

type LocalDraft = {
  category: string;
  id: string;
  provenanceChecklist: string[];
  status: string;
  title: string;
};

const captureChecklist = [
  "Artwork title and story",
  "Creation photos or process notes",
  "Artist verification statement",
  "QR reveal copy",
  "Ownership terms review",
];

const initialDrafts: LocalDraft[] = [
  {
    category: "Birthday",
    id: "draft-wildflower",
    provenanceChecklist: [captureChecklist[0], captureChecklist[2]],
    status: "draft",
    title: "Wildflower Notes",
  },
  {
    category: "Sympathy",
    id: "draft-coastal",
    provenanceChecklist: [captureChecklist[0]],
    status: "draft",
    title: "Coastal Morning",
  },
];

const STUDIO_DRAFTS_STORAGE_KEY = "awo-studio-drafts";

function normalizeDraft(draft: Partial<LocalDraft> & { capture?: string }) {
  const provenanceChecklist = Array.isArray(draft.provenanceChecklist)
    ? draft.provenanceChecklist.filter((item) => captureChecklist.includes(item))
    : draft.capture === "Ready"
      ? [...captureChecklist]
      : [];

  return {
    category: typeof draft.category === "string" ? draft.category : "Originals",
    id: typeof draft.id === "string" ? draft.id : `draft-${Date.now()}`,
    provenanceChecklist,
    status: typeof draft.status === "string" ? draft.status : "draft",
    title: typeof draft.title === "string" ? draft.title : "Untitled artwork",
  };
}

function loadInitialDrafts() {
  try {
    const savedDrafts = window.localStorage.getItem(STUDIO_DRAFTS_STORAGE_KEY);

    if (!savedDrafts) {
      return initialDrafts;
    }

    const parsedDrafts = JSON.parse(savedDrafts) as Array<Partial<LocalDraft> & { capture?: string }>;

    if (Array.isArray(parsedDrafts) && parsedDrafts.length > 0) {
      return parsedDrafts.map(normalizeDraft);
    }
  } catch {
    return initialDrafts;
  }

  return initialDrafts;
}

function isReady(draft: LocalDraft | StudioDraftRecord) {
  return (draft.provenanceChecklist ?? []).length === captureChecklist.length;
}

export default function StudioClient() {
  const [accountMode, setAccountMode] = useState(false);
  const [artistProfile, setArtistProfile] = useState<ArtistStudioProfile | null>(null);
  const [category, setCategory] = useState("Originals");
  const [drafts, setDrafts] = useState<Array<LocalDraft | StudioDraftRecord>>(initialDrafts);
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const session = readBuyerSession();

      if (!session) {
        setAccountMode(false);
        setDrafts(loadInitialDrafts());
        setStatus("Using local studio storage. Sign in as an artist/admin to save drafts to Supabase.");
        setIsLoaded(true);
        return;
      }

      fetchArtistStudioProfile(session)
        .then(async (profile) => {
          setArtistProfile(profile);

          if (!profile.artistId) {
            setAccountMode(false);
            setDrafts(loadInitialDrafts());
            setStatus("Signed in account is not connected to an artist workspace yet.");
            return;
          }

          setAccountMode(true);
          setDrafts(await fetchStudioDrafts(session, profile.artistId));
          setStatus(`Using Supabase studio storage for ${profile.artistName}.`);
        })
        .catch((loadError: unknown) => {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load artist studio.",
          );
          setAccountMode(false);
          setDrafts(loadInitialDrafts());
        })
        .finally(() => setIsLoaded(true));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded || accountMode) {
      return;
    }

    window.localStorage.setItem(STUDIO_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  }, [accountMode, drafts, isLoaded]);

  const readyCount = useMemo(() => drafts.filter(isReady).length, [drafts]);
  const evidenceReady = readyCount === drafts.length && drafts.length > 0;

  async function addDraft() {
    if (!title.trim()) {
      return;
    }

    setError("");
    setStatus("");
    setIsSaving(true);

    try {
      const session = readBuyerSession();

      if (accountMode && session && artistProfile?.artistId) {
        const draft = await createStudioDraft(session, {
          artistId: artistProfile.artistId,
          category,
          checklist: [],
          title: title.trim(),
        });
        setDrafts((current) => [...current, draft]);
        setStatus("Saved studio draft to Supabase.");
      } else {
        setDrafts((current) => [
          ...current,
          {
            category,
            id: `${title}-${Date.now()}`,
            provenanceChecklist: [],
            status: "draft",
            title: title.trim(),
          },
        ]);
        setStatus("Saved studio draft locally in this browser.");
      }

      setTitle("");
      setCategory("Originals");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save studio draft.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleEvidence(draftId: string, item: string) {
    setError("");
    const target = drafts.find((draft) => draft.id === draftId);

    if (!target) {
      return;
    }

    const currentChecklist = target.provenanceChecklist ?? [];
    const nextChecklist = currentChecklist.includes(item)
      ? currentChecklist.filter((capturedItem) => capturedItem !== item)
      : [...currentChecklist, item];

    setDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? { ...draft, provenanceChecklist: nextChecklist }
          : draft,
      ),
    );

    const session = readBuyerSession();
    if (accountMode && session) {
      try {
        await updateStudioDraftChecklist(session, {
          checklist: nextChecklist,
          draftId,
        });
        setStatus("Updated provenance checklist in Supabase.");
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : "Could not update provenance checklist.",
        );
      }
    }
  }

  function resetStudio() {
    if (accountMode) {
      setError("Supabase-backed studio drafts cannot be reset from this local demo control.");
      return;
    }

    setDrafts(initialDrafts);
    setIsLoaded(true);
    window.localStorage.removeItem(STUDIO_DRAFTS_STORAGE_KEY);
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
            Signed-in artist/admin accounts save studio drafts and provenance
            checklists to Supabase. Guests can still explore the workflow locally.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[380px_1fr] lg:px-10">
        <aside className="h-fit border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
          <h2 className="text-2xl font-black">Add Draft</h2>
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
            disabled={!title.trim() || isSaving}
            onClick={addDraft}
            type="button"
          >
            {isSaving ? "Saving..." : "Add Draft"}
          </button>
          {!accountMode ? (
            <button
              className="mt-3 h-11 w-full border border-[#d8c8bb] px-4 text-sm font-black uppercase tracking-wide text-[#7a472e] hover:border-[#b7653a] hover:bg-[#fff8f3]"
              onClick={resetStudio}
              type="button"
            >
              Reset Local Studio
            </button>
          ) : null}

          <div className="mt-6 border border-[#e5ded6] bg-[#fbfaf8] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b7653a]">
              Publish readiness
            </p>
            <p className="mt-2 text-3xl font-black">
              {readyCount}/{drafts.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#4b4743]">
              {evidenceReady
                ? "All draft evidence is complete for baseline review."
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
                  <p className="mt-3 text-sm font-bold text-[#4b4743]">
                    Status: {isReady(draft) ? "Ready" : draft.status}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#8a8178]">
                    {accountMode ? "Supabase" : "Local"} studio storage
                  </p>
                  <div className="mt-5 space-y-2">
                    {captureChecklist.map((item) => (
                      <label
                        className="flex cursor-pointer items-center gap-3 border border-[#e5ded6] bg-white p-3 text-sm font-bold"
                        key={`${draft.id}-${item}`}
                      >
                        <input
                          checked={(draft.provenanceChecklist ?? []).includes(item)}
                          className="size-5 accent-[#252525]"
                          onChange={() => toggleEvidence(draft.id, item)}
                          type="checkbox"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="border border-[#e5ded6] bg-white p-6 shadow-[0_18px_45px_rgba(45,38,32,.06)]">
            <h2 className="text-2xl font-black">Studio Roadmap</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[#4b4743]">
              <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                Draft records now live on `cards` for authenticated artist/admin
                workspaces, with provenance checklist state stored alongside the
                draft.
              </p>
              <p className="border border-[#e5ded6] bg-[#fbfaf8] p-4">
                Uploads, media storage, review queues, and publishing controls
                remain future scoped so this screen stays read/write but not
                destructive.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
