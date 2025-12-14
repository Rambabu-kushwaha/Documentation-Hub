import OpenAI from 'openai';

const openAIKeys = [
  process.env.OPENAI_API_KEY,
  process.env.GITHUB_ACCESS_TOKEN // Using GitHub token as backup
].filter(Boolean) as string[];

const createOpenAIClient = (key: string) => new OpenAI({ apiKey: key });

async function tryWithKeys<T>(operation: (client: OpenAI) => Promise<T>): Promise<T> {
  for (const key of openAIKeys) {
    if (!key) continue;
    const client = createOpenAIClient(key);
    try {
      return await operation(client);
    } catch (error: unknown) {
      // If it's an authentication error, try next key
      if (error && typeof error === 'object' &&
          ('status' in error) &&
          ((error as {status?: number}).status === 401 || (error as {status?: number}).status === 403)) {
        console.warn(`API key failed, trying next...`);
        continue;
      }
      throw error; // Re-throw non-auth errors
    }
  }
  throw new Error('All API keys failed');
}

/**
 * Summarizes a project based on its files
 */
export async function summarizeProject(files: { path: string; content: string }[]): Promise<string> {
  const fileSummaries = files
    .slice(0, 20) // Limit to first 20 files to avoid token limits
    .map(file => `File: ${file.path}\n\n${file.content.substring(0, 1000)}...`) // Truncate content
    .join('\n\n---\n\n');

  const prompt = `
Based on the following files from a GitHub repository, provide a comprehensive summary of the project including:

1. What the project does
2. Main technologies/frameworks used
3. Key components/features
4. Overall architecture/structure

Files:
${fileSummaries}

Please provide a concise but detailed summary (200-400 words).
`;

  try {
    return await tryWithKeys(async (client: OpenAI) => {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      });

      return response.choices[0]?.message?.content || 'Summary could not be generated.';
    });
  } catch (error) {
    console.error('Error summarizing project:', error);
    throw new Error('Failed to generate project summary');
  }
}

/**
 * Generates a README section based on project content
 */
export async function generateReadme(content: string, sections: string[]): Promise<string> {
  const prompt = `
Generate the missing or improved sections for a README based on the project content below.
The project summary is: ${content}

Generate the following sections: ${sections.join(', ')}

For each section, provide appropriate content that fits a professional README.
Format as markdown with headers.
`;

  try {
    return await tryWithKeys(async (client: OpenAI) => {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || '';
    });
  } catch (error) {
    console.error('Error generating README:', error);
    throw new Error('Failed to generate README');
  }
}

/**
 * AutoDoc AI function that generates educational documentation
 */
export async function generateAutoDocDocumentation(files: { path: string; content: string }[]): Promise<string> {
  const fileSummaries = files
    .slice(0, 30) // Allow more files for better context
    .map(file => `File: ${file.path}\n\n${file.content.substring(0, 2000)}...`)
    .join('\n\n---\n\n');

  const prompt = `You are AutoDoc AI, an autonomous documentation agent.

Your goal is to generate documentation that is:
- Clear
- Simple
- Friendly
- Easy to understand for beginners and non-technical readers

Do not use emojis.
Do not use complex words.
Do not assume prior knowledge.

Input:
Source code files from a GitHub repository.

Your tasks:

1. Understand what the project does at a high level.
2. Explain the project in simple language.
3. Structure the README using the following sections only:

   - Project Overview
   - How It Works
   - Frontend
   - Backend
   - Technologies Used
   - How to Run Locally
   - Why This Project Is Useful

4. For each section:
   - Use short paragraphs.
   - Use bullet points where helpful.
   - Explain concepts in plain language.
   - Avoid marketing language.

5. Frontend section:
   - Explain what the frontend does.
   - Mention frameworks and UI behavior simply.

6. Backend section:
   - Explain APIs and logic in simple terms.
   - Avoid implementation complexity.

7. Technologies Used:
   - List tools with one-line explanations.

8. How to Run Locally:
   - Step-by-step instructions.
   - Assume the reader is new.

9. Why This Project Is Useful:
   - Explain real-world value clearly.

Output format:
Return only valid Markdown.

Tone:
Calm, friendly, and educational.
Readable by anyone.

Repository files:
${fileSummaries}`;

  try {
    return await tryWithKeys(async (client: OpenAI) => {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more structured output
      });

      return response.choices[0]?.message?.content || '# Unable to generate documentation\n\nDocumentation generation failed.';
    });
  } catch (error) {
    console.error('Error generating AutoDoc documentation:', error);
    throw new Error('Failed to generate AutoDoc documentation');
  }
}
