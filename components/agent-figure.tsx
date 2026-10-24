import type { Agent } from "@/lib/agents";

// One isometric character per desk, in the same projection the landing-page figures use:
// x and y run along the ground, z is up, and a point lands at [(x-y)cos30, (x+y)/2 - z]. Every
// solid is drawn as its left (y+d), right (x+w) and top (z+h) face in that order, so a bright top
// sits over two darker flanks and the shape reads as a solid without any lighting maths.
//
// Colour comes from CSS: the gradients read --f-top / --f-left / --f-right, which globals.css sets
// per domain. The component itself is palette-free.

type V = [number, number, number];
const C30 = Math.cos(Math.PI / 6);
const r2 = (n: number) => +n.toFixed(2);
const xy = ([x, y, z]: V): [number, number] => [r2((x - y) * C30), r2((x + y) * 0.5 - z)];
const poly = (vs: V[]) => vs.map((v) => xy(v).join(",")).join(" ");

/** A solid box: `at` is its minimum corner, `size` its extent along x, y and z. */
function Box({ at: [x, y, z], size: [w, d, h], id }: { at: V; size: V; id: string }) {
  const top: V[] = [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
  const right: V[] = [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]];
  const left: V[] = [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]];
  return (
    <g stroke="#eef2f7" strokeOpacity=".6" strokeWidth=".8" strokeLinejoin="round">
      <polygon points={poly(left)} fill={`url(#${id}-l)`} />
      <polygon points={poly(right)} fill={`url(#${id}-r)`} />
      <polygon points={poly(top)} fill={`url(#${id}-t)`} />
    </g>
  );
}

/** Flat detail laid on a box's y+d face: u runs along x, v runs up. */
const onFront = (at: V) => `matrix(${r2(C30)} 0.5 0 -1 ${xy(at).join(" ")})`;

type Build = { parts: [V, V][]; face: { at: V; w: number }; kit: V; bob: number; mast?: V };

// Three silhouettes. The bodies differ as much as the kit does, so the row reads as individuals.
const BUILDS: Record<string, Build> = {
  // Anvil: wide, low, hard hat. The one that makes things.
  anvil: {
    parts: [
      [[3, 6, 0], [9, 9, 15]], [[18, 6, 0], [9, 9, 15]],
      [[-6, 6, 20], [6, 10, 19]], [[30, 6, 20], [6, 10, 19]],
      [[0, 0, 15], [30, 24, 27]],
      [[4, 3, 42], [22, 18, 15]],
      [[1, 0, 57], [28, 24, 4]],
    ],
    face: { at: [4, 25, 46], w: 22 },
    kit: [42, 8, 38],
    bob: 5.2,
  },
  // Cortex: no legs, it hovers. The one that goes and looks.
  cortex: {
    parts: [
      [[8, 8, 16], [14, 14, 6]],
      [[0, 0, 22], [30, 30, 28]],
    ],
    face: { at: [0, 30, 28], w: 30 },
    kit: [40, 6, 36],
    bob: 3,
    mast: [15, 15, 50],
  },
  // Veil: thin, hooded, head set back. The one that works out of sight.
  veil: {
    parts: [
      [[9, 9, 0], [5, 5, 22]], [[18, 9, 0], [5, 5, 22]],
      [[6, 6, 22], [18, 14, 26]],
      [[8, 6, 48], [16, 14, 14]],
      [[2, 2, 58], [28, 24, 6]],
    ],
    face: { at: [8, 20, 52], w: 16 },
    kit: [38, 6, 34],
    bob: 5.8,
  },

  // The studio's five. Same projection, different bodies, each with the tool of its trade.
  // Creative: tall, a beret pushed to one side, a brush.
  creative: {
    parts: [
      [[6, 8, 0], [7, 7, 16]], [[17, 8, 0], [7, 7, 16]],
      [[3, 4, 16], [24, 18, 24]],
      [[6, 5, 40], [18, 16, 16]],
      [[-2, 1, 55], [22, 18, 4]],
    ],
    face: { at: [6, 21, 47], w: 18 },
    kit: [40, 8, 34],
    bob: 4.6,
  },
  // Copywriter: slim and straight, a pen.
  copywriter: {
    parts: [
      [[8, 9, 0], [6, 6, 14]], [[16, 9, 0], [6, 6, 14]],
      [[5, 6, 14], [20, 16, 30]],
      [[6, 6, 44], [18, 16, 16]],
    ],
    face: { at: [6, 22, 51], w: 18 },
    kit: [38, 8, 34],
    bob: 5,
  },
  // Narrator: a wide cloak, a smaller hood, a book.
  narrator: {
    parts: [
      [[0, 2, 0], [30, 22, 20]],
      [[4, 5, 20], [22, 16, 24]],
      [[7, 6, 44], [16, 14, 14]],
      [[5, 4, 56], [20, 18, 4]],
    ],
    face: { at: [7, 20, 48], w: 16 },
    kit: [40, 6, 30],
    bob: 6,
  },
  // Social: short, big head, an antenna that blinks, a speech bubble.
  social: {
    parts: [
      [[8, 8, 0], [6, 6, 10]], [[16, 8, 0], [6, 6, 10]],
      [[5, 5, 10], [20, 16, 14]],
      [[2, 2, 24], [26, 22, 24]],
    ],
    face: { at: [2, 24, 38], w: 26 },
    kit: [42, 8, 40],
    bob: 3.4,
    mast: [15, 13, 48],
  },
  // Analyst: boxy, shoulder pads, a bar chart.
  analyst: {
    parts: [
      [[5, 8, 0], [7, 7, 16]], [[18, 8, 0], [7, 7, 16]],
      [[2, 4, 16], [26, 18, 26]],
      [[-4, 6, 34], [6, 12, 6]], [[28, 6, 34], [6, 12, 6]],
      [[5, 6, 42], [20, 16, 15]],
    ],
    face: { at: [5, 22, 49], w: 20 },
    kit: [42, 8, 36],
    bob: 5.4,
  },
};

function Kit({ id, at }: { id: string; at: V }) {
  const [x, y] = xy(at);
  if (id === "anvil") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect x="-9" y="-6" width="18" height="9" rx="2" fill={`url(#${id}-t)`} stroke="#eef2f7" strokeOpacity=".5" strokeWidth=".7" />
        <path d="M0 3v15" stroke="#c9d1dc" strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }
  if (id === "cortex") {
    return (
      <g transform={`translate(${x} ${y})`} fill="none" stroke="#eef2f7" strokeOpacity=".8">
        <circle r="7.5" strokeWidth="1.7" />
        <path d="M5.5 5.5 11.5 11.5" strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }
  if (id === "creative") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <path d="M-7 9 6-5" stroke="#e7ecf3" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="3" y="-12" width="7" height="8" rx="2" fill={`url(#${id}-t)`} transform="rotate(45 6.5 -8)" />
      </g>
    );
  }
  if (id === "copywriter") {
    return (
      <g transform={`translate(${x} ${y})`} strokeLinecap="round">
        <path d="M-8 8 4-4" stroke="#e7ecf3" strokeWidth="3.2" />
        <path d="M4-4l3.5-3.5" stroke="var(--f-top)" strokeWidth="3.2" />
      </g>
    );
  }
  if (id === "narrator") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect x="-9" y="-6" width="18" height="12" rx="2" fill="#e7ecf3" />
        <path d="M0-6v12" stroke="var(--f-deep)" strokeWidth="1.4" />
      </g>
    );
  }
  if (id === "social") {
    return (
      <g transform={`translate(${x} ${y})`} fill="#e7ecf3">
        <rect x="-10" y="-9" width="20" height="13" rx="4.5" />
        <path d="M-5 4l-3 5 7-5z" />
      </g>
    );
  }
  if (id === "analyst") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <rect x="-10" y="0" width="5" height="8" rx="1" fill="#e7ecf3" />
        <rect x="-3" y="-5" width="5" height="13" rx="1" fill="#e7ecf3" />
        <rect x="4" y="-11" width="5" height="19" rx="1" fill={`url(#${id}-t)`} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-7" y="-2" width="14" height="11" rx="2.5" fill="#e7ecf3" />
      <path d="M-3.6-2.4V-6a3.6 3.6 0 0 1 7.2 0v3.6" fill="none" stroke="#e7ecf3" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/** Any agent with an id, a name and a palette key: the desks, and the studio's five. */
export type Figurable = Pick<Agent, "id" | "name"> & { domain: string };

export function AgentFigure({ agent, size = 120, label }: { agent: Figurable; size?: number; label?: string }) {
  const b = BUILDS[agent.id] ?? BUILDS.anvil;
  const id = agent.id;
  const pad: V[] = [[-13, -13, 0], [43, -13, 0], [43, 43, 0], [-13, 43, 0]];
  const mast = b.mast ? xy(b.mast) : null;

  return (
    <svg
      className="afig"
      data-domain={agent.domain}
      viewBox="-60 -100 120 146"
      width={size}
      height={r2((size * 146) / 120)}
      role="img"
      aria-label={label ?? `${agent.name}, the ${agent.domain.toLowerCase()} desk`}
    >
      <defs>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".55" stopColor="var(--f-top)" /><stop offset="1" stopColor="var(--f-mid)" />
        </linearGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--f-mid)" /><stop offset="1" stopColor="var(--f-deep)" />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--f-left)" /><stop offset="1" stopColor="#0a0d14" />
        </linearGradient>
        <radialGradient id={`${id}-g`}>
          <stop offset="0" stopColor="var(--f-top)" stopOpacity=".18" /><stop offset="1" stopColor="var(--f-top)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="0" cy="18" rx="52" ry="28" fill={`url(#${id}-g)`} />
      <polygon points={poly(pad)} fill="#0d1118" stroke="var(--f-top)" strokeOpacity=".45" strokeWidth=".9" />

      <g className="afig-bob" style={{ animationDuration: `${b.bob}s` }}>
        {b.parts.map(([at, sz], i) => <Box key={i} at={at} size={sz} id={id} />)}
        {mast && (
          <>
            <line x1={mast[0]} y1={mast[1]} x2={mast[0]} y2={r2(mast[1] - 15)} stroke="#c9d1dc" strokeWidth="1.4" />
            <circle className="afig-eye" cx={mast[0]} cy={r2(mast[1] - 17)} r="3" fill="var(--f-top)" />
          </>
        )}
        <g transform={onFront(b.face.at)}>
          <rect x={r2(b.face.w * 0.14)} y="-7" width={r2(b.face.w * 0.72)} height="6" rx="2" fill="#0b0e14" stroke="#eef2f7" strokeOpacity=".4" strokeWidth=".6" />
          <rect className="afig-eye" x={r2(b.face.w * 0.22)} y="-5.8" width="5" height="3.6" rx="1.2" fill="var(--f-top)" />
        </g>
      </g>
      <Kit id={id} at={b.kit} />
    </svg>
  );
}
