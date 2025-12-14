import { Octokit } from '@octokit/rest';

export interface RepoContents {
  name: string;
  type: 'file' | 'dir';
  path: string;
  content?: string;
}

/**
 * Fetches the contents of a GitHub repository
 */
export async function fetchRepoContents(owner: string, repo: string, accessToken?: string): Promise<RepoContents[]> {
  const tokenToUse = accessToken || process.env.GITHUB_ACCESS_TOKEN;
  const octokit = new Octokit({ auth: tokenToUse });

  try {
    const { data: tree } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: 'true',
    });

    const filteredItems = tree.tree.filter((item) => item.type === 'blob' && (!item.size || item.size <= 100000)).slice(0, 50); // Limit to 50 files for performance

    const fileContents: RepoContents[] = [];

    // Process files in batches of 5 to avoid rate limiting
    for (let i = 0; i < filteredItems.length; i += 5) {
      const batch = filteredItems.slice(i, i + 5);
      const promises = batch.map(async (item) => {
        try {
          const content = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path!,
            mediaType: {
              format: 'raw',
            },
          });

          if (typeof content.data === 'string') {
            return {
              name: item.path!.split('/').pop()!,
              type: 'file' as const,
              path: item.path!,
              content: content.data,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch ${item.path}:`, error);
        }
        return null;
      });

      const results = await Promise.all(promises);
      fileContents.push(...results.filter(Boolean) as RepoContents[]);
    }

    return fileContents;
  } catch (error) {
    console.error('Error fetching repo contents:', error);
    throw new Error(`Failed to fetch repo contents`);
  }
}

/**
 * Parses GitHub repo URL to extract owner and repo name
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
  };
}

export async function checkRepoExists(owner: string, repo: string, accessToken?: string): Promise<boolean> {
  const tokenToUse = accessToken || process.env.GITHUB_ACCESS_TOKEN;
  const octokit = new Octokit({ auth: tokenToUse });

  try {
    await octokit.rest.repos.get({ owner, repo });
    return true;
  } catch (error) {
    return false;
  }
}
