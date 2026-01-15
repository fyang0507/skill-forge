# YouTube + Notion Curation Setup

## Overview

This playground demonstrates **preference learning** - the agent learns your classification rules through interactive Q&A, then encodes them in a skill for future autonomous execution.

## Prerequisites

- Python 3.9+ installed
- A Notion account with API access
- YouTube channel IDs you want to track

## Notion Integration Setup

### 1. Create a Notion Integration

1. Go to [Notion Developers](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name it (e.g., "YouTube Curator")
4. Select your workspace
5. Copy the "Internal Integration Secret"

### 2. Create Your Database

Create a Notion database with any schema you prefer. The agent will discover your fields automatically.

**Example fields you might use:**
- Title (title)
- Category (select)
- Priority (select)
- Topics (multi_select)
- Channel (text)
- Duration (number)
- URL (url)
- Notes (text)

### 3. Share Database with Integration

1. Open your Notion database
2. Click "..." menu in the top right
3. Click "Add connections"
4. Select your integration

### 4. Get Database ID

The database ID is in the URL:
```
https://notion.so/your-workspace/DATABASE_ID?v=...
                                  ^^^^^^^^^^
```

It's the 32-character string before the `?v=` parameter.

## Environment Setup

Add your Notion API key to `.env.playground`:

```bash
NOTION_API_KEY=secret_xxxxxxxxxxxxx
```

## Finding YouTube Channel IDs

YouTube channel IDs look like `UCxxxxxxxxxxxxxxxxxxxxxx` (24 characters starting with UC).

**Methods to find channel IDs:**

1. **From channel page**: View page source and search for `channelId`
2. **From video**: The video's channel link contains it
3. **Using API**: Search for the channel name

## Running the Task

1. Update `youtube-notion-curate.md` with your:
   - Notion database ID
   - YouTube channel IDs
   - A sample video URL to start with

2. Run the task in SkillForge

3. **Run 1 (Learning)**: The agent will:
   - Explore your Notion schema
   - Analyze the sample video
   - Ask you about classification preferences
   - Create utilities for fetching and classifying
   - Save everything to a skill

4. **Run 2 (Execution)**: The agent will:
   - Load the skill with your preferences
   - Run the utilities autonomously
   - Classify new videos without asking questions
