# Playground Task 3: YouTube + Notion Personal Recommendation Curation

## Overview

Create a playground task demonstrating **preference learning** - the agent learns user's classification rules through interactive Q&A, then encodes them in a skill for future autonomous execution.

**Core Demo Value:**
- **Multimodal**: Gemini analyzes actual video/audio content via `urlContext`
- **Preference Learning**: Agent discovers user's taxonomy through conversation (Run 1)
- **Autonomous Execution**: Skill encodes preferences, no Q&A needed (Run 2)

**Key Insight:** This is about learning *classification rules*, not integration gotchas. The Notion schema is just the structure - the real value is encoding "how does this user want to categorize content?"

**Extended Value:** Run 1 produces TWO types of artifacts:
1. **Skills** (knowledge): Classification rules, preferences, schema understanding
2. **Executables** (code): Utility scripts, scrapers, API helpers that streamline Run 2

---

## The Two Runs

### Run 1: Learning + Environment Preparation (The Hard Way)
1. User provides YouTube video URL + Notion database + subscription list
2. Agent explores Notion schema (discovers what fields exist)
3. Agent figures out how to fetch YouTube RSS feeds
4. Agent analyzes video content (multimodal)
5. Agent asks user questions about classification preferences
6. Agent creates Notion page with user-approved classification
7. **Artifacts produced:**
   - **Skill**: Classification rules, schema knowledge, preferences
   - **Executables**: RSS fetcher, video metadata parser, Notion API helpers

### Run 2: Streamlined Autonomous Execution
1. User triggers "daily recommendation" flow
2. Agent loads skill (preferences) + executables (utilities)
3. Utilities fetch new videos from subscriptions automatically
4. Agent analyzes and classifies without asking questions
5. Agent creates Notion pages for all new content
6. **Outcome**: Fully automated pipeline, zero manual steps

---

## Implementation Steps

### Step 1: Extend Skill Commands

Two changes to `src/lib/tools/skill-commands.ts`:

#### 1a. Add `skill add-file` command
Writes arbitrary files within a skill directory (sandboxed to `.skills/`):

```typescript
'skill add-file': async (args) => {
  const match = args.match(/^(\S+)\s+(\S+)\s+"([\s\S]+)"$/);
  if (!match) return 'Usage: skill add-file <skill-name> <filename> "<content>"';

  const [, skillName, filename, content] = match;

  // Security: prevent path traversal
  if (filename.includes('..') || filename.startsWith('/')) {
    return 'Error: Invalid filename (no path traversal allowed)';
  }

  const skillDir = path.join(SKILLS_DIR, skillName);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(path.join(skillDir, filename), content);
  return `File written to ${skillDir}/${filename}`;
},
```

#### 1b. Extend `skill get` to include file discovery
When agent loads a skill, also show what files exist so it knows what executables are available:

```typescript
'skill get': async (name) => {
  if (!name.trim()) return 'Usage: skill get <name>';
  const skillDir = path.join(SKILLS_DIR, name.trim());
  const skillPath = path.join(skillDir, 'SKILL.md');

  try {
    const content = await fs.readFile(skillPath, 'utf-8');

    // List other files in skill directory for discovery
    const files = await fs.readdir(skillDir);
    const otherFiles = files.filter(f => f !== 'SKILL.md');

    let output = content;
    if (otherFiles.length > 0) {
      output += '\n\n---\n## Skill Files\n';
      output += otherFiles.map(f => `- ${skillDir}/${f}`).join('\n');
    }
    return output;
  } catch {
    return `Skill "${name}" not found`;
  }
},
```

**Example output of `skill get youtube-curator`:**
```markdown
---
name: youtube-curator
description: Curate YouTube videos to Notion
---
# YouTube Curator
## Classification Rules
...

---
## Skill Files
- .skills/youtube-curator/fetch_videos.py
- .skills/youtube-curator/config.json
- .skills/youtube-curator/add_to_notion.py
```

**Usage examples:**
```bash
# Write a Python script
skill add-file youtube-curator fetch_videos.py "#!/usr/bin/env python3
import feedparser
..."

# Write config
skill add-file youtube-curator config.json '{"channel_ids": ["UC..."]}'

# Run the script (using full path from skill get output)
python .skills/youtube-curator/fetch_videos.py --config .skills/youtube-curator/config.json
```

### Step 2: Add Python to Shell Allowlist
```typescript
// src/lib/tools/skill-commands.ts
const ALLOWED_SHELL_COMMANDS = [
  'curl', 'cat', 'ls', 'head', 'tail', 'find', 'tree', 'jq', 'grep',
  'export', 'source',
  'python', 'python3', 'pip', 'pip3',  // ADD - for local Python execution
];
```

### Step 3: Create playground directory structure
```
playground/youtube-notion/
├── youtube-notion-curate.md    # Task prompt (Run 1 and Run 2)
└── setup.md                     # Notion API setup
```

### Step 4: Create setup.md
- Notion integration setup instructions
- User provides their own database (agent discovers schema)
- Environment variable: `NOTION_API_KEY` in `.env.playground`

### Step 5: Create youtube-notion-curate.md
Single task file that works for both runs:
- Run 1: No skill → agent asks questions, creates executables
- Run 2: Skill loaded → agent runs executables autonomously

---

## Notion Database

User provides their own Notion database. Agent must:
1. Query the database schema via Notion API
2. Discover what properties/fields exist
3. Ask user about classification rules for those fields

The schema is **not predefined** - agent learns it dynamically.

---

## Code Execution Architecture

### Local Python Execution (Simplified)

All code runs locally via shell commands. No Gemini sandbox - simpler and less confusing for the agent.

**Allowlisted commands:**
- Existing: `curl`, `cat`, `ls`, `jq`, `grep`, `skill` commands
- New: `python`, `python3`, `pip`, `pip3`

**Virtual Environment Setup:**
Agent creates a venv inside the skill directory during Run 1:
```bash
python -m venv .skills/youtube-curator/.venv
source .skills/youtube-curator/.venv/bin/activate
pip install notion-client feedparser requests
```

**Why local-only:**
- Notion API calls must happen locally anyway (external API)
- Single execution environment = simpler agent reasoning
- Can install any Python package (not limited to sandbox libraries)

---

## Executables (Generated During Run 1)

Code the agent creates and tests locally:

```
.skills/youtube-curator/
├── SKILL.md                    # Knowledge (preferences, rules)
├── .venv/                      # Python virtual environment
├── fetch_videos.py             # Fetch YouTube RSS feeds for channels
├── classify_video.py           # Apply classification rules to a video
├── add_to_notion.py            # Create Notion page with classified data
├── config.json                 # Channel IDs, database ID, preferences
└── run.py                      # Main entry point that orchestrates all
```

**Workflow:**
1. Agent writes Python code using `skill add-file youtube-curator fetch_videos.py "..."`
2. Agent tests using `python .skills/youtube-curator/fetch_videos.py`
3. Agent iterates based on errors until working
4. Agent saves knowledge with `skill set youtube-curator "---\nname: ..."`
5. Run 2: Agent calls `skill get youtube-curator` → sees file paths → runs scripts

**Example: fetch_videos.py**
```python
#!/usr/bin/env python3
"""Fetch latest videos from YouTube channel RSS feeds."""

import feedparser
import json
from pathlib import Path

def fetch_channel_videos(channel_id: str) -> list[dict]:
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    feed = feedparser.parse(url)
    return [
        {
            "title": entry.title,
            "url": entry.link,
            "published": entry.published,
            "channel": feed.feed.title,
        }
        for entry in feed.entries
    ]

def fetch_all_channels(config_path: str = "config.json") -> list[dict]:
    config = json.loads(Path(config_path).read_text())
    videos = []
    for channel_id in config["channel_ids"]:
        videos.extend(fetch_channel_videos(channel_id))
    return videos

if __name__ == "__main__":
    import sys
    videos = fetch_all_channels()
    print(json.dumps(videos, indent=2))
```

---

## Skill Template (Generated After Run 1)

The skill encodes what the agent learned from the interactive session:

```markdown
---
name: youtube-curator
description: Analyze YouTube videos and add to personal watch list with learned classification rules
---

# YouTube Curator

## Database Schema (Discovered)
[Agent fills this after exploring Notion API]
- Title: title property
- Category: select (options: tech, business, culture, ...)
- Priority: select (options: must-watch, recommended, backlog)
- Topics: multi_select (options: AI, programming, interviews, ...)
...

## Classification Rules (Learned from User)
[Agent fills this based on user's answers]
- Lex Fridman episodes → Priority: must-watch
- Duration > 2 hours → Tag: "deep dive"
- Topics about AI/LLM → Category: tech
- Interview format → Priority: +1
...

## User Preferences
- Prefers technical depth over news
- Likes interview/conversation format
- Wants timestamps for long videos
...
```

---

## Task Prompt Content

**youtube-notion-curate.md:**
```markdown
---
name: youtube-notion-curate
description: Analyze YouTube videos and curate to personal Notion database
---

Set up a system to curate YouTube content to my Notion recommendation database.

Inputs:
- YouTube channel list: [CHANNEL_IDS or URLs]
- Sample video to start: [VIDEO_URL]
- Notion Database ID: [DATABASE_ID]
- Auth: Bearer token from NOTION_API_KEY in .env.playground

Your task:
1. Explore my Notion database schema to understand available fields
2. Figure out how to fetch RSS feeds for my YouTube subscriptions
3. Analyze the sample video content (use multimodal capabilities)
4. Ask me about classification preferences (categories, priorities, tags)
5. Create the Notion page with my approved classification
6. Save reusable utilities (RSS fetcher, classifier) as executables

Note: If you're unsure how I want to classify content, ask me.
After this setup, future runs should be autonomous.
```

---

## Metrics: Run 1 vs Run 2

| Metric | Run 1 (Learning) | Run 2 (Execution) |
|--------|------------------|-------------------|
| User questions asked | 3-5 | 0 |
| Manual research steps | Many (RSS, API, schema) | 0 |
| Code written | Utilities created | Utilities reused |
| Classification accuracy | High (user-guided) | High (skill-guided) |
| Time to completion | 10-15 min | < 1 min |
| Total turns | 15-20 | 3-5 |

**Key value prop**: Run 1 is expensive but produces reusable artifacts. Run 2 amortizes that investment.

---

## Files to Create

1. **playground/youtube-notion/setup.md**
   - Notion integration setup
   - How to get database ID
   - Environment variable instructions

2. **playground/youtube-notion/youtube-notion-curate.md**
   - Task prompt (works for both Run 1 and Run 2)
   - Video URL placeholder
   - Database ID placeholder

---

## Verification

1. **Run 1 produces artifacts**: Skill file exists + executable utilities created
2. **Run 2 uses artifacts**: Agent loads skill, calls utilities, no manual steps
3. **Multimodal proof**: Summary reflects video content, not just title/description
4. **Automation proof**: Run 2 processes multiple videos without user interaction
