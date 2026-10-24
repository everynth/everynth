import Link from "next/link";
import { MACHINES } from "@/lib/agents";
import { HOLD_PCT, MIN_HOLD, SESSIONS_PER_DAY, STUDIO, TURNS_PER_SESSION } from "@/lib/studio";
import { Code, H2, Note } from "../ui";

// The studio as it runs: five agents, one skill each, open to EVYN holders. Numbers come from
// lib/studio so the page cannot drift from the gate.
export function Studio() {
  const n = (v: number) => v.toLocaleString("en-US");
  const machine = (id: string) => MACHINES.find((m) => m.id === id)?.model ?? id;
  return (
    <>
      <H2 id="what-it-is">What it is</H2>
      <p>
        The <Link href="/agents">studio</Link> is five agents an EVYN holder can brief about their own project. Each has one skill and a room of its own: the prompt column on the left, a monitor on the right that renders the answer — headings, tables, links, a chart from a <code>chart</code> block, image prompts as cards to copy — with a raw view and a copy button.
      </p>

      <H2 id="the-five">The five</H2>
      <table>
        <thead><tr><th>Agent</th><th>Division</th><th>Machine</th><th>Skill</th></tr></thead>
        <tbody>
          {STUDIO.map((a) => (
            <tr key={a.id}>
              <td><strong>{a.name}</strong> <code>{a.id}</code></td>
              <td>{a.domain}</td>
              <td>{machine(a.model)}</td>
              <td>{a.skills.join(" · ")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <H2 id="one-skill">One skill each</H2>
      <p>
        An agent works only inside its skill. Ask Quill how a fee splits and it answers with one line naming Ledger, and the room offers the door with your question carried over. Nothing is guessed outside the skill. A small clarifying question about the agent&apos;s own work is not a redirect.
      </p>
      <p>
        Every agent is told what is moving on Solana right now: a snapshot of the ecosystem&apos;s top twenty tokens by 24-hour volume (stablecoins and wrapped assets left out), with market cap and 24-hour change, refreshed every ten minutes. Asked what is hyped, it names tokens and quotes figures, says it is a snapshot of the moment, and draws no conclusion about where prices go. The agents make no price predictions and promise no returns; anything they had to assume is marked <em>(assumed)</em>.
      </p>

      <H2 id="gate">The gate</H2>
      <Code>{`minimum hold     ${n(MIN_HOLD)} EVYN   (${HOLD_PCT}% of supply, read from the chain on every message)
sessions         ${SESSIONS_PER_DAY} per holder per rolling 24 hours
turns            ${TURNS_PER_SESSION} per session
messages         up to 4,000 characters; 40 per hour as a brake`}</Code>
      <p>
        Sign in with the wallet that holds EVYN; the room opens or says how far off the balance is, with a link to pump.fun. Sessions are stored under the wallet so a holder can come back to them. Nobody else can read them.
      </p>

      <H2 id="desk">The same agents, for a launch</H2>
      <p>
        For a coin paired with EVYN, three of these agents deliver the identity, narrative and site copy from the launch&apos;s brief: see <Link href="/docs/launchpad/desk">The desk</Link>.
      </p>

      <Note>
        <p>
          Answers are not streamed: a long narrative on Fable can take a minute or two, and the room says so while it works. Image prompts are text; the studio does not render images.
        </p>
      </Note>

      <H2 id="api">Programmatic use</H2>
      <p>
        A message can carry one picture (PNG, JPEG, WebP or GIF, under 4 MB): a logo to critique, a banner to match, a chart to read. The agent sees it for that turn; it is not stored, and the thread marks the turn with a paperclip. The rooms call <code>POST /api/agents/sessions</code> and <code>POST /api/agents/sessions/:id</code>; both need the session cookie and the gate. See the <Link href="/docs/api#studio">API reference</Link>.
      </p>
    </>
  );
}
