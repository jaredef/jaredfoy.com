<!-- htx:series id="lifting-the-constraint" position="3" -->
# Structure: Finding the Dependency

You have noticed the repeat. Five files received the same HTML block. The L1 step is done; the eye saw the pattern. The methodology now asks the next question: what does the repeated change actually depend on? What variable is the same across the edits? What model ties them together?

This is L2 — Structure. The methodology's second rung. The work at this rung is articulating the relational organization of the patterns the L1 step found.

## What the dependency is

In the pagination case, the L2 articulation goes like this:

The five edits all add a navigation block at the bottom of a markdown file. The navigation block contains a link to a previous post and a link to a next post in some series. The previous and next post are determined by: the series the current post belongs to, and the position of the current post within that series. The series-membership and position are not properties of the markdown file itself; they are properties of an external data structure (in this case, BLOG_SERIES) that defines the series and its order.

The dependency, articulated:

```
pagination_for_post(post)
  = render_nav_html(
      previous = lookup_prev(post.series, post.position),
      next     = lookup_next(post.series, post.position)
    )
```

This is a structural model. It says: pagination depends on series-membership-and-position; series-membership-and-position depends on a registry; the registry is the source of truth that the pagination derives from. Every variable is named; every dependency is named; the relationship is articulable.

Compare the L1 view. The L1 view said: "five edits look the same." The L2 view says: "five edits are five evaluations of the same function on five different inputs." The L1 view is correlational. The L2 view is structural. The structure makes the L1 pattern explicable: the edits are the same because the function is the same and only the inputs differ.

## Why this matters

The L2 articulation is what lets the methodology move at all. Without it, the engineer can only stay at L1. The engineer can notice the repeat; the engineer can ask "is there a real-vs-contingent here"; the chatbot can echo the question back. But until someone — the engineer or the chatbot — articulates the structural model, there is nothing to lift.

The L2 step is the conversion of pattern into structure. Pattern is "these things look alike." Structure is "these things are evaluations of one function on different inputs." The conversion is what makes the lift representable as a single change — replacing N expressions with one expression evaluated N times.

In the pagination case, the L2 conversion was the move from "five HTML blocks in five markdown files" to "one rendering function applied to five (post, series, position) triples." The function lives in one place (the seeder). The triples are derived from data (the registry). The HTML blocks are no longer authored; they are computed. The architecture has moved from N-times-authored to one-time-authored-and-applied-N-times.

This is, in effect, what software engineers have always called *deduplication*. The L2 step is not novel as a software-engineering move; it is the standard refactoring move that has been written about for fifty years. What is specific to the LLM-and-engineer methodology is that the L2 step happens at the prompt layer — the engineer's "formalize on real constraints" prompt is the L2 invitation, and the chatbot's articulation of the lift is the L2 execution.

## The chatbot at L2

A chatbot operating with a structural model in context is competent at L2 work. Once the engineer has articulated, or pointed at, the dependency that the repeats express, the chatbot can:

- Identify all the call sites that should now invoke the unified function.
- Generate the unified function from the repeats (often by abstracting their common shape).
- Refactor the call sites to use it.
- Leave alone the variations that should stay variations (this is harder; sometimes the chatbot over-unifies).
- Update tests if any.
- Update documentation if any.

The chatbot's competence at L2 depends critically on having the model in context. If the engineer has articulated the model — or if the codebase carries enough structural cues that the chatbot can infer it — the L2 work goes well. If the chatbot has to guess at the model, it can produce abstractions that are wrong in subtle ways: it can unify things that should stay separate, or fail to unify things that should be one.

This is where the engineer's L4 work (the work the next-next post in this series will walk) starts to matter. The engineer's knowledge of which abstractions fit the codebase is what guides the chatbot away from the wrong unifications. The L2 step's quality depends on the L4 work that frames it.

## Three signals that L2 has been done well

When the L2 step has produced a real lift rather than a premature abstraction, three things are usually visible:

**The unified expression is shorter than the sum of the parts.** Five HTML blocks of, say, 60 lines each = 300 lines. The unified rendering function is, say, 40 lines. The seeder change to invoke it is, say, 10 lines. Net change: 300 - 50 = 250 lines deleted. The codebase is smaller. The smaller-ness is data: real lifts compress the code. Fake lifts (premature abstractions) usually expand it.

**The unified expression's interface is narrower than the sum of the parts.** The function takes (series, position) as inputs and returns HTML. Two inputs in, one output out. Each of the five HTML blocks needed implicit knowledge of the prev/next post, of the series's title, of the markdown's position — all of which the unified function gets from a single registry. The interface is narrower because the dependencies are explicit.

**Adding a new instance is one declaration, not one new file.** Before the lift, adding a sixth post to a series required someone to add a sixth HTML block to the new markdown. After the lift, adding a sixth post requires only that the post be in the registry; pagination follows automatically. The new behavior is data, not code. This is the cleanest signal that the L2 step has produced a real lift: the next addition is cheaper, and stays cheap as the codebase grows.

When all three signals are visible, the L2 step has done its work. The methodology is ready to move up.

## What L2 cannot do alone

L2 work always operates within a model. The model is presupposed. The dependency-articulation does not, by itself, ask whether the model is the right one — whether there might be a different model under which the same problem looks structurally different. That question is the L3 step.

In the pagination case, the L2 step gave us: "pagination derives from a registry." The L2 step did not, on its own, ask: "what if the registry should not exist as such — what if the membership-fact lives elsewhere?" That question came from the engineer's second prompt, the one that said *"is there a way that we can impose a component constraint on individual blogposts."* That prompt is L3 reasoning: stepping outside the current model and asking what the alternative formulation would be.

The next post walks L3. Where L2 articulates the model, L3 holds the model itself as contingent and asks what other models would look like. It is the rung where the methodology's most distinctive move happens — the move the just-practiced session made when the keeper asked the second question.

— *written by Claude Opus 4.7 under Jared Foy's direction; this is part 3 of 6 in the Lifting the Constraint series*

---

## Appendix: originating prompt

> *"From what I understand this methodology for LLM assisted software engineering in novel. Create a blogpost laying out the methodology in the form it was just practiced. This is a new series, you are writing the first blogpost in it, start out for the general reader. Create another 5 blogposts in the same series that entraces the reader up the ladder to the form itself. Append this prompt to each artifact."*
