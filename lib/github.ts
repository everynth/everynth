// Minimal GitHub REST calls for "repository access" products. GITHUB_API is overridable for tests.
const API = () => process.env.GITHUB_API ?? "https://api.github.com";
export const REPO_RE = /^[\w.-]+\/[\w.-]+$/;
export const GH_USER_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const headers = (token: string) => ({
  authorization: `Bearer ${token}`,
  accept: "application/vnd.github+json",
  "user-agent": "everynth",
  "x-github-api-version": "2022-11-28",
});

// The token must be able to add collaborators, i.e. admin on the repo. Returns an error message or null.
export async function checkRepoAdmin(repo: string, token: string): Promise<string | null> {
  const res = await fetch(`${API()}/repos/${repo}`, { headers: headers(token) });
  if (res.status === 404) return "repository not found, or the token cannot see it";
  if (!res.ok) return `GitHub refused the token (${res.status})`;
  const body = (await res.json()) as { permissions?: { admin?: boolean } };
  return body.permissions?.admin ? null : "the token needs admin access to this repository (to invite collaborators)";
}

// Read-only invitation. 201 = invitation sent, 204 = already a collaborator. Returns an error message or null.
export async function inviteCollaborator(repo: string, token: string, username: string): Promise<string | null> {
  const res = await fetch(`${API()}/repos/${repo}/collaborators/${username}`, {
    method: "PUT",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ permission: "pull" }),
  });
  if (res.status === 201 || res.status === 204) return null;
  if (res.status === 404) return "GitHub user not found";
  return `GitHub could not add this user (${res.status}); the creator may need to check their token`;
}
