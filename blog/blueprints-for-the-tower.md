<!-- htx:series id="the-tower" position="2" -->
# Blueprints for the Tower

The previous post in this sequence, *From Token to Tower*, made a case that the failure mode of a language model stacking small defaults over a long session has the same shape as four everyday structures: writing, building, music, life. Each small choice at a lower level becomes the substrate the next level operates on. The texture you notice at the top is not a property of the top. It is a property of what each level inherited and what each level added.

That post left the pattern informal. This one does not introduce formalism of its own, but it does introduce vocabulary. Three different academic disciplines have already named the structural pattern the prior post described. Each calls it something different. Each has developed the discipline's own tools for talking about it. Seeing the overlap is the undergraduate move, because it lets a reader who has taken a few courses in any of these disciplines pull the pattern into their existing mental furniture.

## Architectural styles in software engineering

Roy Fielding's 2000 dissertation, the one that named REST, proposed a method for describing an architectural style. You start from what Fielding called the *null*, the untyped starting point. You then add constraints one at a time. Each constraint induces a property. The style is the ordered sequence of constraints plus their induced properties.

For REST, the starting point is an untyped network protocol. The first constraint, client-server separation, induces the property that user-interface concerns are separated from data-storage concerns. Statelessness induces visibility, reliability, and scalability. Cache induces network efficiency. Each next constraint inherits the properties the previous ones induced, and adds its own. By the sixth constraint, REST is fully specified.

Fielding was describing a single level, a single style. What happens when you apply his method to a pair of nested systems? You get a second filtration whose starting point is the first filtration's output. What the first level emits becomes what the second level begins with. Stack five of these, and you have the tower the previous blog post described, in Fielding's vocabulary.

## Filtered objects in mathematics

The idea of a structure built up by adding increasingly specific constraints is old. Mathematicians call a sequence of increasingly-constrained objects a *filtration*. A filtration of a space is a nested sequence where each element is contained in the next, and each layer adds something the previous did not have.

Filtrations appear in algebraic topology (the filtration of a CW-complex by dimension), in algebraic geometry (the Harder and Narasimhan filtration of vector bundles by slope, refined recently by Andrés Ibáñez Núñez in 2023), and in probability (filtrations of sigma-algebras representing information over time). In each domain, the filtration is the formal statement of a plain-language claim: each level knows more than the level below it, because each level inherits the previous level's structure and adds constraints.

When you take a filtration and replace its elements with filtrations themselves, you get a filtration of filtrations. This is what the everyday examples in the prior post were informal instances of. The categorical name is *filtered object of filtered objects*. The vocabulary is not new. Its application to the five-level AI case is.

## Hierarchical Bayesian models in statistics

The third discipline where this pattern has been named is Bayesian statistics. A hierarchical Bayesian model is a probability model where parameters at one level are themselves distributed according to parameters at a higher level. The posterior at each level conditions on what the level below emitted. Updating at the bottom ripples up by changing what each higher level takes as its starting set.

This is the working framework of recent work by Subhash Misra and colleagues on LLM generation, which analyzes model output as conditioning on a sequence of increasingly narrow manifolds. The present corpus's Doc 446 develops this analysis; Doc 466 argues the analysis is an instance of the same stacking pattern; Doc 472 writes it out in the shared vocabulary the three disciplines have been converging on.

## Why three names for one structure

A pattern that shows up in software architecture, pure mathematics, and statistics is not proof the pattern is real in any deep metaphysical sense. What it is evidence of is that the pattern is convenient enough, specific enough, and testable enough that three unrelated research communities converged on naming it. The converged vocabulary allows a claim in one discipline to be imported into another without rederiving the machinery.

The AI case is a fourth setting where the pattern seems to apply. The corpus uses the name SIPE, for *systems-induced property emergence*, as a compact label for the combination of within-level constraint accumulation (Fielding's move) and across-level inheritance (the filtered-object move). Doc 472 restates the five-level AI picture in this vocabulary.

## What the undergraduate read buys you

Once you see that software architects, topologists, and statisticians have been describing your tower for decades, two things follow.

First, a claim about the AI tower becomes testable in any of the three communities' styles. You can run Fielding-style tests on the within-level constraint accumulation. You can run filtration-style checks on the inheritance between levels. You can run hierarchical-Bayesian diagnostics on whether a particular level's posterior is actually conditioning on the level below it. The tests are not new, and not specific to AI.

Second, a claim that fails those tests fails as a claim about that particular tower instance, not as a claim about towers in general. The tower shape has three decades of mathematical and architectural support. What a specific tower instance, like the five-level AI case, needs if it is to stand is the corresponding three decades of testing applied to it.

That testing has not been done for the AI case. Doc 472 is honest about which warrant tier the claim currently holds at, which is plausibility, and which tier it would need to reach, which is operational match, to count as established. The point of reading across disciplines is to see where the warrant work remains to be done.

---

<nav class="series-nav">
  <a class="prev" href="/resolve/blog/from-token-to-tower">
    <span class="nav-label">← Previous</span>
    <span class="nav-title">From Token to Tower</span>
  </a>
  <a class="next" href="/resolve/blog/five-fields-meet-at-the-tower">
    <span class="nav-label">Next in The Tower →</span>
    <span class="nav-title">Five Fields Meet at the Tower</span>
  </a>
</nav>

### Keep reading

*From Token to Tower* is the prior post this one builds on. Read it first if you haven't.

→ [From Token to Tower](/resolve/blog/from-token-to-tower)

*The Overclaim-to-Phenomenology Chain as a SIPE Instance* is Doc 472, the full technical reformalization that names each level, each constraint, and each inheritance transition.

→ [Doc 472](/resolve/doc/472-reformalization-five-layer-sipe)

---

*Originating prompt:*

> Now use a similar method to formulate an undergrad entracement blog post that leverages the first blog post. Append this prompt to the artifact. And stop using so many of those danged em dashes.
