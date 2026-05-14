import Image from "next/image";
import type { ReactNode } from "react";

type ProvenanceSensorPreviewProps = {
  cardTitle: string;
  coverMediaUrl: string | null;
  proofMediaUrl?: string | null;
};

const sensorDetails = [
  {
    body: "4K visual capture shows the human hand, brush, and card surface.",
    label: "Visual",
    meta: "4K RGB",
  },
  {
    body: "Arducam ToF depth frames isolate hand distance over the flat card plane.",
    label: "Depth",
    meta: "240 x 180 ToF",
  },
  {
    body: "FLIR Lepton 3.5 thermal frames highlight hand heat over the cooler artwork.",
    label: "Thermal",
    meta: "160 x 120 thermal",
  },
];

function PanelFrame({
  children,
  label,
  meta,
}: {
  children: ReactNode;
  label: string;
  meta: string;
}) {
  return (
    <div className="border border-[#e5ded6] bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#2f2d2b]">
          {label}
        </h3>
        <span className="text-[10px] font-black uppercase tracking-wide text-[#a85f38]">
          {meta}
        </span>
      </div>
      {children}
    </div>
  );
}

function VisualFrame({
  cardTitle,
  coverMediaUrl,
}: {
  cardTitle: string;
  coverMediaUrl: string | null;
}) {
  return (
    <div className="awo-proof-panel awo-proof-visual-panel">
      <div
        aria-label={`${cardTitle} visual provenance preview`}
        className="awo-proof-card-plane"
        role="img"
        style={
          coverMediaUrl
            ? {
                backgroundImage: `url(${coverMediaUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        {!coverMediaUrl ? (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <p className="text-2xl font-black leading-tight text-[#5f4638]">
              {cardTitle}
            </p>
          </div>
        ) : null}
      </div>
      <div className="awo-proof-hand awo-proof-hand-visual">
        <span className="awo-proof-palm" />
        <span className="awo-proof-finger awo-proof-finger-one" />
        <span className="awo-proof-finger awo-proof-finger-two" />
        <span className="awo-proof-finger awo-proof-finger-three" />
      </div>
      <span className="awo-proof-brush" />
    </div>
  );
}

function TofFrame() {
  return (
    <div className="awo-proof-panel awo-proof-tof-panel">
      <div className="awo-proof-card-plane awo-proof-card-plane-tof" />
      <div className="awo-proof-hand awo-proof-hand-tof">
        <span className="awo-proof-palm" />
        <span className="awo-proof-finger awo-proof-finger-one" />
        <span className="awo-proof-finger awo-proof-finger-two" />
        <span className="awo-proof-finger awo-proof-finger-three" />
      </div>
      <span className="awo-proof-depth-shadow" />
    </div>
  );
}

function ThermalFrame() {
  return (
    <div className="awo-proof-panel awo-proof-thermal-panel">
      <div className="awo-proof-card-plane awo-proof-card-plane-thermal" />
      <div className="awo-proof-hand awo-proof-hand-thermal">
        <span className="awo-proof-palm" />
        <span className="awo-proof-finger awo-proof-finger-one" />
        <span className="awo-proof-finger awo-proof-finger-two" />
        <span className="awo-proof-finger awo-proof-finger-three" />
      </div>
    </div>
  );
}

export default function ProvenanceSensorPreview({
  cardTitle,
  coverMediaUrl,
  proofMediaUrl,
}: ProvenanceSensorPreviewProps) {
  if (proofMediaUrl) {
    return (
      <section className="border-y border-[#e5ded6] bg-[#fffdfa] px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b7653a]">
                Origin proof preview
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#252525]">
                Three synced lenses, six seconds.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#4b4743]">
              A preview frame from the visual camera, time-of-flight depth, and
              thermal layers. The production pass will replace this frame with
              the full synchronized six-second video sequence.
            </p>
          </div>

          <div className="mt-7 border border-[#e5ded6] bg-white p-3 shadow-[0_18px_45px_rgba(45,38,32,.08)]">
            <div className="awo-proof-media-frame">
              <Image
                alt={`${cardTitle} synchronized provenance proof preview`}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 1280px, 100vw"
                src={proofMediaUrl}
              />
              <span className="awo-proof-media-scan" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {sensorDetails.map((item) => (
              <div
                className="border border-[#e5ded6] bg-white px-4 py-3"
                key={item.label}
              >
                <p className="text-xs font-black uppercase tracking-wide text-[#2f2d2b]">
                  {item.meta}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#5a514a]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
              Preview loop
            </span>
            <div className="awo-proof-timeline" aria-hidden="true">
              <span />
            </div>
            <span className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
              6s
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-y border-[#e5ded6] bg-[#fffdfa] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b7653a]">
              Origin proof preview
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#252525]">
              Three synced lenses, six seconds.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#4b4743]">
            The shopper preview loops a short creation moment across the visual
            camera, time-of-flight depth, and thermal layers before the full
            purchased-card reveal unlocks.
          </p>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          <PanelFrame label={sensorDetails[0].label} meta={sensorDetails[0].meta}>
            <VisualFrame cardTitle={cardTitle} coverMediaUrl={coverMediaUrl} />
          </PanelFrame>
          <PanelFrame label={sensorDetails[1].label} meta={sensorDetails[1].meta}>
            <TofFrame />
          </PanelFrame>
          <PanelFrame label={sensorDetails[2].label} meta={sensorDetails[2].meta}>
            <ThermalFrame />
          </PanelFrame>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {sensorDetails.map((item) => (
            <div
              className="border border-[#e5ded6] bg-white px-4 py-3"
              key={item.label}
            >
              <p className="text-xs font-black uppercase tracking-wide text-[#2f2d2b]">
                {item.meta}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5a514a]">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
            Synced loop
          </span>
          <div className="awo-proof-timeline" aria-hidden="true">
            <span />
          </div>
          <span className="text-xs font-black uppercase tracking-wide text-[#8a8178]">
            6s
          </span>
        </div>
      </div>
    </section>
  );
}
