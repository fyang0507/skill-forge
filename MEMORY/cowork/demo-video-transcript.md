# Demo Video Transcript (Option B: Montage Style)

**Total Duration:** 3:00
**Structure:** One deep demo + quick montage + brief mention

---

## Part 1: Opening Hook (0:00 - 0:25)

**Time:** 25 seconds
**Visual:** Animated quadrant diagram (static↔evolving, fact↔experience) with Tsugi positioned in "evolving + experience" quadrant

**Voiceover:**
> "Agents today are stateless. Every session starts from zero—same research, same mistakes, same cost.
>
> Memory self-evolves but only store facts. Skills encode procedures but in static format. Neither learns from experience.
>
> Introducing tsugi, an agent harness that automatically bootstrap battle-test how-tos from real experiences, so future executions become faster and save tokens.

---

## Part 2: Run 1 - YouTube/Notion Task (0:25 - 1:25)

**Time:** 60 seconds
**Visual:** Screen recording of Run 1, sped up at 4-8x during waiting/loading

**Voiceover:**
> "I'm asking the agent to curate my favorite YouTube channels into Notion—a centralized watchlist. This is what the agent is doing out of the box.
>
> Watch what happens. The agent researches how to get YouTube RSS feeds..." **Highlight the fact that google's search and analyze_url works.**
>
> [hint: narrate specific exploration - e.g., "It tries the obvious URL pattern... doesn't work"]
>
> [hint: narrate the mistake - e.g., "It hits a 404 because it used the channel handle instead of the ID"]
>
> "But it self-corrects..."
>
> [hint: narrate recovery - e.g., "Finds the channel ID, constructs the correct feed URL"]
>
> "And it succeeds. But that took [XX] seconds of trial and error."

**Text overlays:**
- `[0:35]` "Researching YouTube RSS feeds..."
- `[0:50]` [hint: overlay showing the specific error]
- `[1:05]` "Self-correcting..."
- `[1:20]` "Task complete ✓"

---

## Part 3: Skill Codification (1:25 - 1:45)

**Time:** 20 seconds
**Visual:** Screen recording showing skill suggestion appearing, user clicking "Codify as Skill"

**Voiceover:**
> "Here's where Tsugi kicks in. It detected valuable learnings from this run—the gotchas, the working solution—and suggests codifying it as a skill.
>
> One click. Human in the loop. Now that experience is captured."

**Text overlays:**
- `[1:30]` "Skill detected"
- `[1:40]` "Codified ✓"

---

## Part 4: Run 2 - Same Task with Skill (1:45 - 2:15)

**Time:** 30 seconds
**Visual:** Screen recording of Run 2, can run closer to real-time since it's fast

**Voiceover:**
> "Same task. Same prompt. But now the agent finds the skill.
>
> No research. No trial and error. It knows the feed URL format, knows to fetch the channel ID first.
>
> [hint: narrate what's skipped - e.g., "Skips the Google search entirely"]
>
> Direct execution."

**Text overlays:**
- `[1:50]` "Skill found: youtube-notion-sync"
- `[2:00]` "Skipping research..."
- `[2:10]` "Done ✓"

---

## Part 5: Metrics Comparison (2:15 - 2:30)

**Time:** 15 seconds
**Visual:** Comparison mode side-by-side, metrics bar prominent

**Voiceover:**
> "[XX] seconds down to [YY]. [N]x faster. [M]% fewer tokens.
>
> That's not optimization—that's the difference between exploring and executing."

**Text overlays:**
- `[2:20]` "[XX]s → [YY]s"
- `[2:25]` "[N]x faster"

---

## Part 6: Morning Brief Montage (2:30 - 2:45)

**Time:** 15 seconds
**Visual:** Quick montage of morning-brief task, heavily sped up (8-16x), showing key moments only

**Voiceover:**
> "Tsugi isn't just procedural knowledge—it's personalization too.
>
> Here, the agent's first attempt at a morning brief was generic. I corrected it: 'Follow this structure, send to Discord.'
>
> Tsugi captured my preferences. Next run? Exactly what I wanted, no correction needed."

**Text overlays:**
- `[2:32]` "Run 1: Generic output"
- `[2:38]` "Preferences codified"
- `[2:42]` "Run 2: Personalized ✓"

---

## Part 7: Stripe Mention (2:45 - 2:50)

**Time:** 5 seconds
**Visual:** Quick flash of Stripe task comparison stats, or static screenshot

**Voiceover:**
> "Same pattern with Stripe API calls. Different task, same result."

**Text overlays:**
- `[2:47]` "Stripe: [X]s → [Y]s"

---

## Part 8: Closing (2:50 - 3:00)

**Time:** 10 seconds
**Visual:** Logo + tagline on screen, optional: quadrant diagram callback

**Voiceover:**
> "Tsugi means 'next' in Japanese.
>
> First run explores. Every run after executes.
>
> Explore once. Exploit next."

**Text overlays:**
- `[2:55]` "次 = next"
- `[2:58]` "Explore once. Exploit next."

---

## Production Notes

### Timing Budget

| Part | Duration | Cumulative |
|------|----------|------------|
| Opening Hook | 25s | 0:25 |
| Run 1 Demo | 60s | 1:25 |
| Codification | 20s | 1:45 |
| Run 2 Demo | 30s | 2:15 |
| Metrics | 15s | 2:30 |
| Morning Brief Montage | 15s | 2:45 |
| Stripe Mention | 5s | 2:50 |
| Closing | 10s | 3:00 |

### Placeholders to Fill After Recording

- [ ] Run 1 specific exploration narration
- [ ] Run 1 specific error/mistake shown
- [ ] Run 1 recovery narration
- [ ] Run 1 total time
- [ ] Run 2 time
- [ ] Speedup multiplier (Nx)
- [ ] Token savings percentage
- [ ] Morning brief stats
- [ ] Stripe stats

### Fallback to Option A

If 3:00 feels too tight after recording, cut Parts 6-7 entirely:
- Remove morning brief montage (saves 15s)
- Remove Stripe mention (saves 5s)
- Expand metrics section or add breathing room
- Mention other use cases as text: "Tested with Stripe, personal workflows, and more."
