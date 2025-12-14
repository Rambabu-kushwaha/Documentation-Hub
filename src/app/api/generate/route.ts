import { NextRequest, NextResponse } from 'next/server';
import { generateAutoDocDocumentation } from '@/utils/llm';

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Repository source files are required' }, { status: 400 });
    }

    // Validate file format
    for (const file of files) {
      if (!file.path || !file.content) {
        return NextResponse.json({
          error: 'Each file must have "path" and "content" properties'
        }, { status: 400 });
      }
    }

    // Generate documentation using AutoDoc AI
    const readmeContent = await generateAutoDocDocumentation(files);

    return NextResponse.json({
      readme: readmeContent
    });

  } catch (error) {
    console.error('Error generating documentation:', error);
    return NextResponse.json(
      { error: 'Failed to generate documentation' },
      { status: 500 }
    );
  }
}
