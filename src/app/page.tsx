'use client';

import { useState } from 'react';

interface ProcessedRepo {
  repository: string;
  summary: string;
  existingReadme: string | null;
  missingSections: string[];
  generatedReadme: string;
}

interface AutoDocResult {
  readme: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessedRepo | null>(null);
  const [autoDocResult, setAutoDocResult] = useState<AutoDocResult | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'github' | 'autodoc'>('github');
  const [showSummary, setShowSummary] = useState(false);
  const [showDecisions, setShowDecisions] = useState(false);
  const [showReadme, setShowReadme] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setAutoDocResult(null);

    try {
      if (activeTab === 'github') {
        const response = await fetch('/api/process-repo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to process repository');
        }

        setResult(data);
      } else {
        // AutoDoc functionality - for demo, create sample files
        const sampleFiles = [
          {
            path: 'package.json',
            content: `{
  "name": "sample-project",
  "version": "1.0.0",
  "description": "An example Node.js project for AI documentation generation",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0"
  }
}`
          },
          {
            path: 'src/app.js',
            content: `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sample API working' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;`
          }
        ];

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: sampleFiles }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate documentation');
        }

        setAutoDocResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-light text-gray-800 mb-4 tracking-tight">
            Documentation Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform your code repositories into beautiful, clear documentation
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-16">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-lg text-black"
                  required
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                    ${loading
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    }
                  `}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600"></div>
                      Generating documentation...
                    </div>
                  ) : (
                    'Create Documentation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">{result.repository}</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Project Summary</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{result.summary}</p>
                </div>
                {result.missingSections.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Missing Sections Detected</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {result.missingSections.map((section, index) => (
                        <li key={index}>{section}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Generated README</h3>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 rounded p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {result.generatedReadme}
                  </pre>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.generatedReadme);
                      // Could add toast notification here
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {autoDocResult && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-purple-400 to-blue-500 px-8 py-6 text-white">
                <h2 className="text-2xl font-bold">Documentation Ready</h2>
                <p className="text-purple-100 mt-2">Fresh, clear documentation for your project</p>
              </div>

              <div className="p-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">README.md</h3>
                    <button
                      onClick={() => navigator.clipboard.writeText(autoDocResult.readme)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                      Copy Documentation
                    </button>
                  </div>

                  <div className="prose prose-gray max-w-none">
                    <pre className="text-gray-700 whitespace-pre-wrap font-mono leading-relaxed text-sm">
                      {autoDocResult.readme}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
