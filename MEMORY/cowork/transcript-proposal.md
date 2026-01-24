
# Part 1
- voice over: Today's memory solutions for agents typically focus on storing fact for conversation-oriented agents like Letta or Mem0. In contrast, recently introduced agent skills focuses on codified best practices in static format. Can we bring the best from the two worlds? Can agents take advantage of its past experiences automatically? Introducing tsugi, an agent harness that automatically bootstrap battle-test how-tos from real experiences, so the future execution becomes faster and more token saving.
- visual: a inforgraphic showing 4 quadrants: static v. evolving; fact v. experience

# Part 2
- voice over: Agents today are incredible task solvers. With minimum guidances, given the right tool, it is able to research, plan, and execute end-to-end, albeit taking detours. Like this one: the agent is tasked to create notion entries from my fav YouTube channels so I have a centralized tracking over my watchlist. And it's making mistakes because... [insert the example showing in the recording] But it is able to self-correct so it still make it.
- visual: the recording showing Run 1 of the notion task

# Part 3
- voice over: However, a pitiful limitation is that agents are essentially stateless. Given the same task, if we don't pass extra information, the agent will still take the same path, making the same mistake again and again. That's why I build tsugi to enable agent escape the loop.
- visual: the recording showing codify-skill for Run 1

# Part 4
- voice over: When tsugi finds valuable learnings from the current runs, it'll automatically codify it into skills (with human-in-the-loop approval), so when the agent encounters the similar problem in the future, it can learn from the experience and take the optimal path.
- visual: the recording showing Run 2

# Part 5
- voice over: Adnt this saves token usage, API costs, while boosting speed
- visual: showing the stats in comparison mode

# Part 6
- voice over: tsugi is not only about procedural knowledge, it is also for personalization. I asked the agent to help me create a morning brief. The out-of-box execution is underwhelming, as it omitted a lot of analyzing tasks. So I asked it to generate the brief following a more rigorous procedure, and sending it to my discord channel.
- visual: the recording showing Run 1 of the morning-brief task

# Part 7
- voice over: tsugi noticed the requirement, and the preferences persists to guide the future runs so no human correction is needed again in the future. Different screnario, same cost saving and speed boost.
- visual: the stats of comparison mode for morning-brief task

# Part 8
- voice over: I also prepared playground task to ask the agent create stripe subscription, validating its capability to deal with procedural API calls and state management. Totally different task, but the same trajectory: agent explore in the first run, and use the lesson learned to improve its second run.
- visual: show the stripe-creation task comparison

# Part 9
- voice over: tsugi means "next" in japanese. We gave the agent the freedom to trial and error first, and make sure it learns its lesson. That's tsugi, explore once, exploit next.