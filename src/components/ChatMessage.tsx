'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessagePart } from '@/hooks/useForgeChat';
import { MessageStats } from './MessageStats';

interface ChatMessageProps {
  message: Message;
}

// Chevron icon component
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// Render reasoning/thinking traces (collapsible)
function ReasoningPart({ part }: { part: MessagePart }) {
  const [expanded, setExpanded] = useState(false);

  if (!part.content.trim()) return null;

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronIcon expanded={expanded} />
        <span className="italic">Thinking...</span>
      </button>
      {expanded && (
        <div className="mt-1 ml-5 text-sm text-zinc-400 whitespace-pre-wrap border-l-2 border-zinc-700 pl-3">
          {part.content}
        </div>
      )}
    </div>
  );
}

// Render a tool (terminal) part - collapsible
function ToolPart({ part }: { part: MessagePart }) {
  const [expanded, setExpanded] = useState(false);
  const isLoading = !part.content;

  return (
    <div className="my-2 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-1.5 bg-zinc-800 border-b border-zinc-700 flex items-center gap-2 hover:bg-zinc-750 transition-colors"
      >
        <ChevronIcon expanded={expanded} />
        <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
        <span className="text-xs text-zinc-400 font-mono flex-1 text-left truncate">
          $ {part.command}
        </span>
      </button>
      {expanded && (
        <pre className="p-3 text-sm font-mono text-zinc-300 whitespace-pre-wrap break-all max-h-[300px] overflow-y-auto">
          {part.content || <span className="text-zinc-500">Running...</span>}
        </pre>
      )}
    </div>
  );
}

// Render agent tool call (google_search, url_context) - collapsible
function AgentToolPart({ part }: { part: MessagePart }) {
  const [expanded, setExpanded] = useState(false);

  // Tool names may have namespace prefix like "google_search:google_search"
  const toolName = part.toolName || '';
  const isGoogleSearch = toolName.includes('google_search');
  const toolDisplayName = isGoogleSearch
    ? 'Google Search'
    : toolName.includes('url_context')
      ? 'URL Context'
      : toolName || 'Tool';

  // Extract search query or URL from args
  const args = part.toolArgs as Record<string, unknown> | undefined;
  const queries = args?.queries as string[] | undefined;
  const toolDetail = queries?.[0] || args?.url || '';

  const isLoading = !part.content;
  const sources = part.sources || [];

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <ChevronIcon expanded={expanded} />
        <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-blue-500'}`} />
        <span className="font-medium">{toolDisplayName}</span>
        {toolDetail && (
          <span className="text-zinc-500 truncate max-w-[250px]">{String(toolDetail)}</span>
        )}
        {isLoading && <span className="text-zinc-500 italic">searching...</span>}
        {!isLoading && sources.length > 0 && (
          <span className="text-zinc-500">{sources.length} sources</span>
        )}
      </button>
      {expanded && (
        <div className="mt-1 ml-5 text-xs bg-zinc-900 rounded p-2 max-h-[200px] overflow-y-auto">
          {isGoogleSearch && sources.length > 0 ? (
            <ul className="space-y-1">
              {sources.map((source) => (
                <li key={source.id} className="text-zinc-400">
                  • {source.title}
                </li>
              ))}
            </ul>
          ) : part.content ? (
            <pre className="whitespace-pre-wrap break-all text-zinc-500">{part.content}</pre>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Render a text part with markdown
function TextPart({ content }: { content: string }) {
  if (!content.trim()) return null;
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

// Render sources citations
function SourcesPart({ part }: { part: MessagePart }) {
  const sources = part.sources || [];
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2 border-t border-zinc-700">
      <div className="text-xs text-zinc-500 mb-1">Sources:</div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-zinc-300 transition-colors"
          >
            {source.title}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  // User message
  if (message.role === 'user') {
    const textContent = message.parts[0]?.content || '';
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-3 bg-blue-600 text-white rounded-2xl rounded-br-md">
          <p className="whitespace-pre-wrap break-all">{textContent}</p>
        </div>
      </div>
    );
  }

  // Assistant message - render parts inline
  const hasParts = message.parts.length > 0;

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] px-4 py-3 bg-zinc-800 text-zinc-100 rounded-2xl rounded-bl-md">
        {hasParts ? (
          <>
            {message.parts.map((part, index) => {
              if (part.type === 'reasoning') {
                return <ReasoningPart key={index} part={part} />;
              }
              if (part.type === 'tool') {
                return <ToolPart key={index} part={part} />;
              }
              if (part.type === 'agent-tool') {
                return <AgentToolPart key={index} part={part} />;
              }
              if (part.type === 'sources') {
                return <SourcesPart key={index} part={part} />;
              }
              return <TextPart key={index} content={part.content} />;
            })}
            <MessageStats stats={message.stats} />
          </>
        ) : (
          <div className="text-zinc-500 text-sm">Thinking...</div>
        )}
      </div>
    </div>
  );
}
