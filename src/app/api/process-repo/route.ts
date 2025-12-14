import { NextRequest, NextResponse } from 'next/server';
import { parseGitHubUrl, fetchRepoContents, checkRepoExists } from '@/utils/github';
import { summarizeProject, generateReadme } from '@/utils/llm';
import { findReadme, detectMissingSections, generateCompleteReadme } from '@/utils/readme';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid repository URL' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 });
    }

    const { owner, repo } = parsed;

    // Check if repo exists
    const exists = await checkRepoExists(owner, repo);
    if (!exists) {
      return NextResponse.json({ error: 'Repository not found or access denied' }, { status: 404 });
    }

    // Fetch repo contents
    const files = await fetchRepoContents(owner, repo);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files found in repository' }, { status: 400 });
    }

    // Find existing README
    const existingReadme = findReadme(files);
    let summary: string;
    let missingSections: string[] = [];
    let generatedReadme: string;

    if (existingReadme) {
      // Analyze existing README
      summary = existingReadme.content || '';
      missingSections = detectMissingSections(summary, files);

      if (missingSections.length > 0) {
        // Generate missing sections using LLM
        generatedReadme = await generateReadme(summary, missingSections);
      } else {
        generatedReadme = summary;
      }
    } else {
      // No existing README, generate complete one
      const projectSummary = await summarizeProject(files.map(f => ({ path: f.path, content: f.content || '' })));
      summary = projectSummary;
      missingSections = ['Installation', 'Usage', 'License'];
      generatedReadme = generateCompleteReadme(repo, projectSummary, missingSections);
    }

    return NextResponse.json({
      repository: `${owner}/${repo}`,
      summary,
      existingReadme: existingReadme?.content || null,
      missingSections,
      generatedReadme,
    });

  } catch (error) {
    console.error('Error processing repository:', error);
    return NextResponse.json(
      { error: 'Failed to process repository' },
      { status: 500 }
    );
  }
}
