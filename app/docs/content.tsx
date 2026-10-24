import type { ComponentType } from "react";
import { Api, OwnershipCheck, SelfHosting } from "./content/dev";
import { Architecture, Encryption, Payments } from "./content/how";
import { Desk, FeeRounds, HookMarketplace, Launching, LaunchpadArchitecture, LaunchpadEconomics, LaunchpadHooks, LaunchpadOverview, Pairs, TokenSites } from "./content/launchpad";
import { Faq, GettingStarted, Overview } from "./content/start";
import { Studio } from "./content/studio";
import { tutorialPage } from "./content/tutorials";
import { Buying, GithubAccess, Moderation, Selling } from "./content/using";
import { TUTORIALS } from "@/lib/tutorials";

// slug -> page body. Keep in sync with lib/docs.ts.
export const CONTENT: Record<string, ComponentType> = {
  overview: Overview,
  "getting-started": GettingStarted,
  faq: Faq,
  ...Object.fromEntries(TUTORIALS.map((t) => [t.slug, tutorialPage(t.slug)])),
  "launchpad/overview": LaunchpadOverview,
  "launchpad/launching": Launching,
  "launchpad/pairs": Pairs,
  "launchpad/hooks": LaunchpadHooks,
  "launchpad/fee-rounds": FeeRounds,
  "launchpad/token-sites": TokenSites,
  "launchpad/desk": Desk,
  studio: Studio,
  "launchpad/hook-marketplace": HookMarketplace,
  "launchpad/economics": LaunchpadEconomics,
  "launchpad/architecture": LaunchpadArchitecture,
  selling: Selling,
  buying: Buying,
  "github-access": GithubAccess,
  moderation: Moderation,
  payments: Payments,
  encryption: Encryption,
  architecture: Architecture,
  "ownership-check": OwnershipCheck,
  api: Api,
  "self-hosting": SelfHosting,
};
