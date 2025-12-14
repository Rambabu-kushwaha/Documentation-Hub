import { RepoContents } from './github';

export interface ReadmeSections {
  title: boolean;
  description: boolean;
  installation: boolean;
  usage: boolean;
  features: boolean;
  contributing: boolean;
  license: boolean;
  acknowledgements: boolean;
}

/**
 * Analyzes existing README content and identifies missing sections
 */
export function detectMissingSections(existingReadme: string, _files: RepoContents[]): string[] {
  const content = existingReadme.toLowerCase();

  const standardSections = [
    { key: 'Installation', present: content.includes('# install') || content.includes('## instal') || content.includes('getting started') },
    { key: 'Usage', present: content.includes('# usage') || content.includes('## us') || content.includes('how to use') },
    { key: 'Features', present: content.includes('# feature') || content.includes('## feature') },
    { key: 'Contributing', present: content.includes('# contribut') || content.includes('## contribut') },
    { key: 'License', present: content.includes('# licens') || content.includes('## licens') },
    { key: 'Acknowledgements', present: content.includes('# acknowledg') || content.includes('# thank') },
  ];

  return standardSections.filter(section => !section.present).map(section => section.key);
}

/**
 * Finds existing README files in the repository
 */
export function findReadme(files: RepoContents[]): RepoContents | null {
  const readmeFiles = files.filter(file =>
    file.path.toLowerCase().includes('readme') &&
    file.path.toLowerCase().endsWith('.md') &&
    file.content
  );

  return readmeFiles.find(file => file.path.toLowerCase() === 'readme.md') || readmeFiles[0] || null;
}

/**
 * Generates a complete README structure
 */
export function generateCompleteReadme(projectTitle: string, summary: string, missingSections: string[]): string {
  const titleSection = `# ${projectTitle}\n\n`;
  const descriptionSection = `## Description\n\n${summary}\n\n`;

  let readme = titleSection + descriptionSection;

  missingSections.forEach(section => {
    readme += generateSectionContent(section);
  });

  // Add common sections if not present
  const alwaysInclude = ['Installation', 'Usage', 'License'];
  alwaysInclude.forEach(section => {
    if (missingSections.includes(section)) {
      // Already added
    } else {
      readme += generateSectionContent(section);
    }
  });

  return readme;
}

function generateSectionContent(section: string): string {
  const templates = {
    'Installation': `## Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n`,
    'Usage': `## Usage\n\n\`\`\`\`\n// Example usage\n\`\`\`\n\n`,
    'Features': `## Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n`,
    'Contributing': `## Contributing\n\n1. Fork the repository\n2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)\n3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)\n4. Push to the branch (\`git push origin feature/AmazingFeature\`)\n5. Open a Pull Request\n\n`,
    'License': `## License\n\nThis project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.\n\n`,
    'Acknowledgements': `## Acknowledgements\n\n* [Contributor Name](https://github.com/username) - Inspiration/Collaboration\n\n`,
  };

  return templates[section as keyof typeof templates] || `## ${section}\n\n`;
}
