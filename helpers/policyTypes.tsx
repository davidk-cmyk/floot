import { Selectable } from "kysely";
import { Policies } from "./schema";

export type PolicyWithAuthor = Selectable<Policies> & {
  requiresAcknowledgmentFromPortals: boolean;
  assignedPortals: Array<{
    id: number;
    name: string;
    slug: string;
    requiresAcknowledgment: boolean;
  }>;
  author: {
    id: number;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    oauthProvider: string | null;
  };
};