<!-- htx:series id="lifting-the-constraint" position="4" -->
# Possibility: The Real and the Contingent

The methodology's third rung is the most distinctive one for LLM-assisted engineering. It is the rung at which the engineer asks the question that the chatbot, on its own, would not ask: *what if the constraint were expressed differently?*

In the just-practiced session, the engineer asked it twice. The first time was *"Formalize that process based on its real constraints, not just its contingent constraints."* The second time was *"Is there a way that we can impose a component constraint on individual blogposts that are nested within a common series, in which pagination is added based on that constraint."* Both prompts are L3 moves. Both ask the chatbot to step outside the current solution and articulate what a different one would look like.

This essay walks the L3 step. It is the philosophical heart of the methodology. The other rungs work; this one is the rung that makes the methodology distinctive.

## The real and the contingent

A constraint is *real* when it is true regardless of which specific instance you happen to be looking at. A constraint is *contingent* when it is true of the instance you are looking at because of how you happened to set up the instance, but is not true of the abstract problem the instance is one case of. Distinguishing the two is L3 work.

In the pagination case, the L1 step had noticed that the same HTML block was being added to five files. The L2 step had articulated the dependency: pagination depends on (series, position). The L3 step, when the engineer prompted for it, was the question: *which of the constraints we are honoring here are real, and which are contingent on the specific instance we are looking at?*

The L3 step's output was: the *real* constraint is "any post in any series should have pagination derived from its position." The *contingent* constraint was "we are editing five specific markdown files in The Ladder series this afternoon." Those two constraints had been entangled in the original solution; the L3 step disentangled them.

Once disentangled, the lift becomes available. The implementation can be reorganized so that only the real constraint is expressed, and the contingent specifics drop out as data. The change to the seeder did this: pagination is now derived from (series, position) for any post that has a series, regardless of which post it is. The five files we started with are not special anymore; they are five inputs to a function that handles any input of the right shape.

## L3 in causal-philosophy terms

The rung the methodology calls L3 maps onto Pearl's third causal rung in his causal hierarchy, *counterfactual reasoning*. Within-model counterfactuals ask "what would have happened if X had been the case?" — they hold the model fixed and vary an input. Cross-model counterfactuals ask "what would the analysis look like under a different model?" — they hold the inputs fixed and vary the model itself.

The engineer's L3 prompts are cross-model counterfactuals at the design layer. *"What would this look like if expressed differently?"* is the question. Not "what would happen if we changed the input"; "what would the *model* look like if we built it differently."

This kind of reasoning is why the methodology has the shape it does. The engineer cannot improve a solution to the next architectural shape from inside the solution. The engineer has to step outside the current solution, hold it as one of several possible solutions, and ask what the alternatives would say. The L3 step is the operational form of holding the current solution as contingent.

## What the chatbot does at L3

A chatbot, given an L3 prompt, can produce credible alternative formulations. It can take the current solution and articulate, in vocabulary the engineer can evaluate, what a different shape of the same feature would be. It can list the trade-offs of the alternatives. It can suggest which alternative best matches the codebase's existing architectural style.

What the chatbot is *not* reliable at, on its own, is *initiating* the L3 step. The chatbot does not ordinarily volunteer that the just-applied solution should be reorganized. The chatbot will keep applying solutions at the layer it was prompted at. The L3 step has to be invited by the engineer.

This is one of the cleaner places where the engineer's contribution to the dyad is visible. The chatbot is fast at L1, competent at L2 with model in context, capable at L3 with the prompt. The engineer is the one who knows when to issue the prompt. The methodology requires the engineer's pause-and-ask, and it requires the chatbot's ability to articulate alternatives once asked. Either alone is much weaker than the dyad.

## Two L3 prompts that the methodology uses repeatedly

The just-practiced session demonstrated two L3 moves. The methodology uses both, and they are worth naming as named moves.

**The lift-up prompt.** *"Formalize this based on its real constraints, not just its contingent constraints."* The prompt asks the chatbot to identify which parts of the just-applied solution are due to the abstract problem and which are due to the specific instance. The chatbot articulates the disentangling; the lift moves the constraint from the instance layer (where the contingent live) to the structural layer (where the real are expressed once and for all).

**The redistribute prompt.** *"Is there a way that we can impose a [component-level] constraint on individual [components] in which the framework derives from that constraint?"* The prompt asks the chatbot to invert the direction of dependency: instead of a central source of truth from which components inherit, ask what it would look like for the components to be the source of truth from which the central system derives. The chatbot articulates the redistribution; the constraint moves to a more decentralized form.

The two prompts move in different directions. The lift-up prompt moves the constraint to a higher architectural layer; the redistribute prompt moves it to a more component-distributed form. Both are L3 moves; both ask the chatbot to step outside the current solution. They are not interchangeable; the engineer has to know which one to use when.

## When to lift up vs redistribute

The two prompts produce different shapes of solution, and the engineer's L4 work (the next post) is what tells you which shape fits the case.

Lift-up tends to be right when:
- The same constraint is being expressed many times.
- The constraint is uniform across instances.
- A single source of truth would make maintenance easier.
- The components have no good reason to know about themselves; they just want the framework to handle them.

Redistribute tends to be right when:
- The components have natural variation that the central source struggles to capture.
- Adding/removing components should not require touching a central registry.
- The components carry information about themselves that the central source would otherwise have to track.
- The team values decentralization (sometimes for good reasons; sometimes for organizational ones).

In the just-practiced session, the lift-up move came first because the constraint *was* uniform across instances. The redistribute move came second because, once the constraint was uniform, the question of *where to keep the membership facts* became salient — and the components were the natural carriers of those facts.

## What lives above this rung

The next post walks L4 — Form. L4 is the rung at which the engineer's pattern recognition for "what kind of architecture fits this case" lives. It is the rung that tells you when to lift up, when to redistribute, and when neither move is right. The chatbot is unreliable at L4 alone; the engineer's domain expertise is what supplies it.

The L3 work this post described is what calls the L4 work into operation. Without L3 — without the willingness to step outside the current solution — the L4 knowledge has nothing to apply to. The two work together. The next post says how.

— *written by Claude Opus 4.7 under Jared Foy's direction; this is part 4 of 6 in the Lifting the Constraint series*

---

## Appendix: originating prompt

> *"From what I understand this methodology for LLM assisted software engineering in novel. Create a blogpost laying out the methodology in the form it was just practiced. This is a new series, you are writing the first blogpost in it, start out for the general reader. Create another 5 blogposts in the same series that entraces the reader up the ladder to the form itself. Append this prompt to each artifact."*
