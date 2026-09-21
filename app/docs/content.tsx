import type { ComponentType } from "react";
import { Api, OwnershipCheck, SelfHosting } from "./content/dev";
import { Architecture, Encryption, Payments } from "./content/how";
import { Faq, GettingStarted, Overview } from "./content/start";
import { Buying, GithubAccess, Moderation, Selling } from "./content/using";

// slug -> page body. Keep in sync with lib/docs.ts.
export const CONTENT: Record<string, ComponentType> = {
  overview: Overview,
  "getting-started": GettingStarted,
  faq: Faq,
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
