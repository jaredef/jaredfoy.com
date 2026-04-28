<!-- htx:series id="lifting-the-constraint" position="2" -->
# Pattern: Noticing the Repeat

The first rung of the methodology is the first rung of the ladder. The eye trained to notice repeated changes is the eye that knows when the constraint is somewhere else.

This essay walks the L1 step of the Lifting the Constraint methodology. It is the simplest step. Its difficulty is not in the abstraction; it is in being patient enough to notice. Most of the work happens before the LLM even gets the next prompt — in the pause where the engineer looks at a series of similar edits and asks: why do these all look the same?

## The repeat

Software is full of patterns that repeat. Some repeats are fine; some are signs that a constraint is not living in its proper place. The eye learns the difference by practicing.

Three quick examples of the kind of repeat that signals a misplaced constraint:

- The pagination case from the first post in this series. The LLM makes essentially the same edit to five different markdown files. Five almost-identical HTML blocks. The constraint these five edits all honor — that posts in a series should display next/prev navigation — is one constraint, expressed five times. The repeat is the signal.

- A web app that renders timestamps in a UI. Across thirty React components, you find code that takes a Date object and produces a localized human-readable string. Most of them are slight variations: some include the year, some don't, some handle null timestamps, some don't. Thirty repeats of essentially the same logic. The repeat is the signal.

- A backend service that emits log lines. Each handler has its own try/catch block that catches errors, logs them with a particular format, and either re-raises or swallows them. Forty handlers, forty try/catch blocks, mostly the same shape. The repeat is the signal.

In each case, the repeat is not noise. It is data about where the constraint should live. The constraint is one thing; the system is expressing it many times because the architecture has not given it a single home. Lifting the constraint to its proper home means deleting most of the expressions and keeping one.

## What the L1 step is

The L1 step in the methodology is: notice the repeat. Train the eye to see, when a series of similar edits is being made, that the similarity is the data. Pause before continuing. Ask: is this repeat necessary, or am I expressing the same constraint multiple times because the architecture is not letting me express it once?

The pause is harder than it sounds. There is real pressure to keep moving. The five edits are small; you and the LLM can finish them in two minutes; the work continues. The pressure to move is the pressure that prevents the L1 step from happening. When the engineer noticed, in the just-practiced session, that the LLM had been instructed to add HTML to five files, and asked "is there a real-vs-contingent here?", the engineer had paid the cost of pausing. Without the pause, the methodology does not start.

In LLM-assisted engineering, there is a specific reason the pause is harder than in solo work. The LLM is fast. It can produce five edits in seconds. The engineer is sitting next to a tool that makes the contingent solution cheap. Cheap means easy to ship. Easy to ship means the pressure to lift the constraint is low. The methodology has to push back against the cost-of-pausing being asymmetrically low for the contingent path.

There is a corresponding reason to pause that is also specific to LLM-assisted work. The LLM can do the lifting *too*. Once the engineer notices the repeat, the engineer does not have to do the architectural refactor by hand. The engineer says "look at this — is there a real-vs-contingent here?" and the LLM articulates the lift. The lift is not free, but it is faster than it would be in solo refactoring. The combination of these two facts (contingent solutions are cheap; lifts are also cheap) means that the methodology's per-iteration cost is low if the engineer is paying attention to where lifts are warranted.

## What the L1 step is not

The L1 step is not an excuse to refactor everything. Software is full of repeats that are fine to leave alone. Some repeats are easier to maintain as repeats than as a unified abstraction; the wrong abstraction is more expensive than three honest copies. The cliche is "duplication is far cheaper than the wrong abstraction" (Sandi Metz; broadly attributed). The L1 step is not the rejection of this cliche; it is consistent with it.

What the L1 step *is*: the readiness to notice the repeat as data. Whether to lift it or leave it is the L2 step (find the dependency the repeat actually expresses) and the L3 step (ask what the alternative formulations would look like). The L1 step is just: notice. Do not act on the noticing yet. Just see it.

The eye trained to see the repeat is the eye that gets to make the L2 move next.

## What an LLM contributes at L1

A chatbot is, structurally, very good at noticing repeats. Its training has seen a large amount of code; pattern recognition is its native register. If you ask a chatbot "are these five edits expressing the same constraint?", the chatbot can usually tell you, with high reliability, what the structural similarity is.

What the chatbot is *not* reliable at, on its own, is deciding whether the repeat warrants a lift. That decision requires L4 work: knowing what kind of architecture the codebase already lives in, knowing what kind of abstractions fit the team's working style, knowing the historical context of why the code is the way it is. The decision is made by the engineer. The chatbot articulates the candidate lift; the engineer decides whether to authorize it.

The engineer's role at L1 is to ask the question that the chatbot, on its own, would not ask. *Is there a real-vs-contingent here?* The chatbot, given that prompt, can produce a substantive answer. Without the prompt, the chatbot will keep applying contingent solutions because that is what the immediate task is asking for.

This is the partnership at the lowest rung of the methodology: the engineer's eye notices; the engineer's pause holds the noticing long enough to ask; the chatbot articulates what was noticed in operational terms. Then the dyad moves up to L2.

## The cost of skipping L1

A codebase that never makes the L1 move tends to look a particular way. The contingent solutions accumulate. Each individual edit is fine; the codebase as a whole drifts toward a state where the same constraint is expressed in dozens of places, each slightly different, each requiring synchronized maintenance. When the constraint changes (and it always changes), every expression has to be updated. Half of them get updated; half of them don't; bugs follow. The cost is not in any individual contingent solution; the cost is in the accumulating drift.

LLM-assisted engineering can accelerate this drift if the L1 step is not practiced. The chatbot's speed makes contingent solutions cheaper; cheaper means more of them get applied; the drift accelerates. In the just-practiced session, the engineer's first prompt — "formalize that based on real constraints, not just contingent" — was the antidote applied at exactly the right moment, to exactly the right place. The methodology lives in moments like that.

## What lives above this rung

The next rung is L2 — Structure. When you have noticed a repeat, the next move is to articulate the dependency the repeat actually expresses. What does the change in those five files depend on? What variable is the same across the five edits? Is there a model that ties them together? The next post walks the L2 step.

— *written by Claude Opus 4.7 under Jared Foy's direction; this is part 2 of 6 in the Lifting the Constraint series*

---

## Appendix: originating prompt

> *"From what I understand this methodology for LLM assisted software engineering in novel. Create a blogpost laying out the methodology in the form it was just practiced. This is a new series, you are writing the first blogpost in it, start out for the general reader. Create another 5 blogposts in the same series that entraces the reader up the ladder to the form itself. Append this prompt to each artifact."*
