---
name: claude-code-skills
description: Creating modular, reusable skills for Claude Code to enhance its functionality.
---
# Claude Code Skills

## Key Learnings

*   **Skills Defined:** Claude Skills are modular components that extend Claude's functionality, allowing it to perform specialized tasks consistently. They provide Claude with domain-specific expertise and workflows, turning it into a specialist.
*   **Skills Structure:** A skill is a directory containing a `SKILL.md` file. This file includes instructions and metadata (in YAML frontmatter) that Claude uses to understand the skill's purpose. Additional files, like scripts or data, can be included within the skill directory.
*   **Progressive Disclosure:** Claude loads skill information on-demand, preventing context window bloat. It initially reads the metadata (description) and loads detailed instructions and resources only when the skill is relevant to the task.
*   **Custom Skills Creation:** Users can create custom Skills tailored to specific workflows, organizational knowledge, or personal preferences. Examples include applying brand style guidelines, generating communications using company templates, or structuring meeting notes with company-specific formats.
*   **Tool Integration:** Skills can integrate with external tools and APIs, allowing Claude to perform actions beyond its built-in capabilities. The Code Execution Tool is required for skills that involve code execution.
*   **Agent Skills Open Standard**: The Agent Skills specification is published as an open standard at agentskills.io, promoting interoperability across AI platforms and tools.
*   **Security**: Only use Skills from trusted sources (created by you or Anthropic). Exercise caution and thoroughly audit Skills from untrusted sources due to the potential for malicious code execution.
*   **Benefits over Prompts:** Skills are reusable and eliminate the need to repeatedly provide the same instructions across multiple conversations, specializing Claude for specific tasks. They improve consistency and performance by teaching Claude how to complete tasks in a repeatable way.
*    **Sandboxing Integration:** Skills can be used within the Claude Code sandboxing environment, offering a secure way to extend Claude's functionality without risking system integrity.

## Common Gotchas

*   **Context Window Limits:** Be mindful of the context window size when designing Skills. While progressive disclosure helps, excessively large Skills can still strain the context window.
*   **Untrusted Skills:** Using Skills from unknown or untrusted sources can pose security risks. Always audit Skills before use, especially those involving code execution.
*   **Over-Reliance on Skills:** Don't over-complicate simple tasks with Skills. Basic prompts may suffice for straightforward requests.
*   **Complex Workflows:** For complex workflows, consider using Model Context Protocol (MCP) servers in conjunction with Skills. Skills can teach agents how to use external tools and software exposed through MCP.
*   **Incorrect Configuration:** Make sure file paths and tool names are correct, otherwise the skill can not be utilized.

## Working Pattern

1.  **Identify a Task:** Determine a specific, repeatable task that you want to automate or improve with Claude.
2.  **Create a Skill Directory:** Create a new directory for your Skill, following a clear and descriptive naming convention.
3.  **Create `SKILL.md`:** Inside the directory, create a `SKILL.md` file.
4.  **Add YAML Frontmatter:** At the beginning of the `SKILL.md` file, add YAML frontmatter with the following keys:
    *   `name`: A short, descriptive name for the Skill.
    *   `description`: A one-sentence description of what the Skill does.
5.  **Add Instructions:** After the YAML frontmatter, add detailed instructions for Claude on how to perform the task. Include examples and clear steps.
6.  **Include Resources (Optional):** If the Skill requires external resources, such as scripts, data files, or configuration files, add them to the Skill directory. Reference these resources in the instructions within the `SKILL.md` file.
7.  **Test the Skill:** Test the Skill thoroughly to ensure that it performs as expected. Refine the instructions and resources as needed.
8.  **Integrate with Claude:**
    *   **Claude Code:** Place the Skill directory in the appropriate location for Claude Code to discover it.
    *   **API:** Upload the Skill via the Claude API.
9.  **Security Review:** Before deploying a skill to a production environment, be sure to review all the included code to be sure it is safe to execute.