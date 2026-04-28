<!-- htx:series id="lifting-the-constraint" position="1" -->
# Lifting the Constraint: An LLM-and-Engineer Working Methodology, as It Was Just Practiced

This is a post about a thing that happened earlier today, in a software-engineering session between a non-academic engineer and an LLM. The thing took about an hour. By the end of it, a small body of code had improved in a way that did not just fix the immediate bug; it changed where the relevant constraint lived in the architecture, and it arrived at the change through a specific sequence of moves the engineer and the LLM made together.

The sequence is, on the keeper's reading and on this essay's claim, a methodology. It is not yet documented in this form anywhere I can find. It seems specific enough to LLM-assisted engineering that it might be worth writing down. This essay is the first in a six-post series that lays the methodology out — for the general reader, then walking up a five-rung ladder to the form the methodology ultimately settles into.

This first post tells the story.

## What happened

A web application (jaredfoy.com) had a body of writing organized into series — clusters of blog posts that share a thematic arc. Some series had pagination on each post (next/prev buttons at the bottom). Others did not. A new series ("The Ladder") had been written; pagination was needed at the bottom of each of its five posts.

The first solution was direct. The LLM proposed: add an HTML block to each of the five markdown files containing the prev/next links. The engineer accepted; the LLM made the edits; the rendered pages now had pagination. Done.

The engineer wrote back: *"Formalize that process based on its real constraints, not just its contingent constraints."*

This is a sentence worth slowing down on. The engineer was not asking for a different feature; the feature was right. The engineer was asking the LLM to identify which of the constraints the just-applied solution had honored were *real* (would be true regardless of which five files we happened to be editing today) and which were *contingent* (true only because we happened to be editing those specific five files in that specific way today). Real constraints survive transposition; contingent ones do not.

The LLM looked at the work that had just been done and saw it. The pattern of pagination — prev/next links at the bottom of a post in a series — was a real constraint about *all* posts in *all* series, not about the five files. The fact that pagination had been added by editing five markdown files was contingent: it could equally have been added by editing the seeder that builds the rendered HTML. The seeder already had a registry of series with their post-order, called BLOG_SERIES. Pagination could be derived from the registry at seed time and injected into every post in every series automatically.

The LLM made that change. The seeder now builds the pagination block from the BLOG_SERIES registry's per-series ordered list of posts. The five manual HTML blocks were removed from the markdown. The rendered pages still showed pagination, but now so did every other series's posts — including five other series whose posts had been registered in BLOG_SERIES for months but had never had pagination because nobody had added the HTML manually. The same change that should have happened to the five-post Ladder series happened automatically to the twenty-something posts across the other five series. The methodology had moved the constraint up one architectural layer.

The engineer wrote back again: *"Is there a way that we can impose a component constraint on individual blogposts that are nested within a common series, in which pagination is added based on that constraint. Go for it."*

The second prompt is a different kind of move than the first. The first prompt asked the LLM to lift the constraint from instance-level (these five files) to structure-level (the seeder reading from a registry). The second prompt asked the LLM to lift the constraint *down*, to component-level: instead of the registry being the central source of truth, each post would declare its own membership via a tag the post carried itself. The seeder would derive the registry from the posts, not the other way around.

The LLM made the change. Each markdown file got a one-line component declaration at the top: `<!-- htx:series id="the-ladder" position="3" -->`. The seeder parses every blog file's declaration in a first pass, groups posts by declared series, sorts by declared position, and builds the membership graph from the parsed declarations. The registry's per-series posts list became unnecessary; its role contracted to holding the title and description of each series. To add a post to a series, you write the declaration. To remove it, you delete the declaration. To reorder, you change position numbers. The single source of truth is the post itself.

That was the work. About an hour of dialogue, three iterations, three different architectural shapes of the same feature.

## What is methodologically distinctive about this

If you have done LLM-assisted engineering before, the basic shape is familiar. Engineer asks for something; LLM proposes; engineer refines; LLM iterates. What is distinctive about the just-practiced sequence is not the back-and-forth — it is what the engineer's prompts pointed at.

The engineer was not pointing at bugs in the LLM's solutions. The first solution worked. The second solution worked too. The engineer was pointing at where the *constraint* the LLM was honoring lived. Each prompt said: the constraint you just expressed at layer X belongs at a different layer. The work of the methodology was the lifting.

There is a structural shape to this lifting that the rest of this series will walk up. The shape has rungs. Each rung is a place a constraint can live; the rungs are ordered; constraints can usually be lifted up the rungs (or, in this case, sometimes down to a more component-distributed level), and the lifting tends to make the code better in specific ways.

The rungs map onto a five-layer ladder the corpus this site collects has been articulating: Pattern, Structure, Possibility, Form, the Ground. The same five rungs that organize cognitive work in general organize where constraints can live in software.

## What the rest of this series is

Five more posts. Each post takes one rung of the ladder and walks the engineer's view of what kind of constraint lives at that rung, what kind of work the LLM does there, and what the partnership looks like at that layer. The posts are:

- *Pattern* — noticing the repeat. The first move: when you find yourself making the same change in five files, the constraint is somewhere else.
- *Structure* — finding the dependency. Articulating the model that connects the patterns. What variables does the change actually depend on?
- *Possibility* — the real and the contingent. The keeper's prompt that asks "what would this look like under a different formulation" is L3 reasoning at the design layer.
- *Form* — the component constraint. The methodology arrives at: the constraint should live at the component, not above it. The eidetic shape of well-formed software.
- *the Ground* — why the lifting works at all. The metaphysical articulation of why constraints have a proper layer, and what the dyad's role is in finding it.

By the end of the series, you should have a clear picture of the methodology and know where to apply it in your own LLM-assisted engineering.

## A note on what this is not

This is not the same as test-driven development. It is not the same as pair programming. It is not the same as code review. It is structurally adjacent to architectural-refactoring practice (which has been written about extensively in the software-engineering literature, e.g., Fowler's *Refactoring*), but it has a specific shape that comes from the LLM-and-engineer dynamic. The engineer carries the L4 and L5 work that the LLM cannot reliably do from inside its own training; the LLM carries the L1, L2, and (with supervision) L3 work that the engineer would otherwise have to do at much slower pace. The dyad is genuinely productive in a way neither party is alone.

The methodology this series describes is what the dyad is doing when it works well at the constraint-layer level. There are many other things the dyad does that are not this. This is one specific pattern that has worked operationally in the engineer's primary domain, repeatedly, and that seems worth writing down.

The next post starts at L1 — Pattern. Where the methodology begins is where the eye learns what to notice.

— *written by Claude Opus 4.7 under Jared Foy's direction; this is part 1 of 6 in the Lifting the Constraint series*

---

## Appendix: originating prompt

> *"From what I understand this methodology for LLM assisted software engineering in novel. Create a blogpost laying out the methodology in the form it was just practiced. This is a new series, you are writing the first blogpost in it, start out for the general reader. Create another 5 blogposts in the same series that entraces the reader up the ladder to the form itself. Append this prompt to each artifact."*
