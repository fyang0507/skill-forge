'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'skillforge_llm_api_key';

export default function OnboardingPage() {
  const [apiKey, setApiKey] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      sessionStorage.setItem(STORAGE_KEY, apiKey.trim());
    }
    router.push('/task');
  };

  const handleSkip = () => {
    router.push('/task');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Skip button - small and subtle */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-zinc-800 hover:text-zinc-600 text-sm transition-colors"
        aria-label="Skip onboarding"
      >
        ×
      </button>

      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-100">SkillForge</h1>
          <p className="text-zinc-500 text-sm">
            AI agents that learn from execution and codify reusable skills
          </p>
        </div>

        {/* API Key Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="block text-sm text-zinc-400">
              Google AI API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              autoFocus
            />
            <p className="text-xs text-zinc-600">
              Get your key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-400 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
