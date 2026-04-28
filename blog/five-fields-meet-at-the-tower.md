<!-- htx:series id="the-tower" position="3" -->
# Five Fields Meet at the Tower

The two prior posts in this series argued, at different reading levels, that small defaults in a language model's token-by-token generation stack across five levels into patterns that feel categorically different from the tokens that seeded them. The high-school post, *From Token to Tower*, used four everyday structural isomorphisms (writing, building, music, life) to carry a reader from the AI case to the shared pattern. The undergraduate post, *Blueprints for the Tower*, introduced the vocabulary three academic disciplines had already developed for describing the pattern: Fielding's method in software architecture, filtration theory in mathematics, and hierarchical Bayesian modeling in statistics.

This post is the graduate bridge. It does for Doc 472 what *Four Roads to the Same Ceiling* does for Doc 436: walks a reader who finishes the piece to the point of being able to open Doc 472 and read it without looking anything up. Five distinct literatures contribute to the specific five-level SIPE instance Doc 472 claims. Each literature's contribution is developed here far enough to identify the precise structural move Doc 472 imports, and then the five moves coalesce on the document's primary findings.

Before the walk, a word on the structural-isomorphism argument carried forward from the prior posts. Four everyday structures (writing, building, music, life) and three academic disciplines (architecture, mathematics, statistics) name the same nested pattern of within-level constraint accumulation and across-level emission-to-null inheritance. That the pattern appears in so many independent settings, with independently-developed vocabulary in each, is not proof the pattern is metaphysically real. What it is evidence of is that the pattern is convenient, specific, and testable enough that unrelated research communities have converged on naming it. The graduate move is to go one level deeper into each of five academic literatures, extract the precise structural contribution each makes, and see how Doc 472 puts them together.

## 1. Fielding's method in software architecture

Roy Fielding's 2000 dissertation, *Architectural Styles and the Design of Network-based Software Architectures*, proposed a specific method for describing any architectural style. The method begins from what Fielding called the *null style*, an unconstrained starting point with no properties imposed. Constraints are then added one at a time. Each constraint induces a named property. The style is defined by the ordered sequence of constraints together with their induced-property set.

For REST, Fielding's worked example, the null style is an arbitrary network-based protocol. The first added constraint, client-server separation, induces separation-of-concerns between user-interface logic and data-storage logic. The second, statelessness, induces visibility (each request is independently inspectable), reliability (request recovery is localized), and scalability (server state is not per-session). The third, cache, induces network efficiency when combined with statelessness. The fourth, uniform interface, induces component independence at the cost of some one-size-fits-all inefficiency. The fifth, layered system, induces architectural flexibility. The sixth and optional, code-on-demand, induces client extensibility. REST is the ordered six-constraint sequence, together with the properties the sequence cumulatively induces.

Fielding's method describes one level. Doc 472's contribution at this first field is to apply Fielding's method at each of five levels, treating each level of the AI-generation-to-phenomenology chain as its own architectural-style-like object with its own null, its own ordered constraints $c\_{k,i}$, and its own induced-property set $P\_k$.

## 2. Filtrations in algebraic topology and moduli theory

A filtration of an object is a nested sequence where each element is contained in the next, and each inclusion adds structure the previous did not have. Filtrations appear in multiple mathematical settings. In algebraic topology, a CW-complex is filtered by dimension: the 0-skeleton sits inside the 1-skeleton sits inside the 2-skeleton, and the filtration is the cell-attachment sequence. In algebraic geometry, Harder and Narasimhan's 1975 paper defined a canonical filtration of vector bundles over a smooth projective curve by slope, subsequently refined by Andrés Ibáñez Núñez's 2023 work on moduli of filtered objects (arXiv:2311.18050). In probability, a filtration of sigma-algebras formalizes information growth over time and is the central object of continuous-time stochastic processes.

In each setting, the filtration is the formal statement that each level of the nested sequence knows strictly more than the level below it, that the additional knowledge is structured by specific named constraints, and that the resulting filtered object has more structure than any of its pieces alone.

When each element of a filtration is itself replaced by a filtration, the result is an iterated filtration (in Ibáñez Núñez's vocabulary) or a filtration of filtrations (in the more general categorical vocabulary). The iterated structure has inheritance by emission: what an inner filtration emits becomes the starting object the next outer filtration's construction operates on. This is the exact structural shape Doc 472 claims for the five-level AI case.

## 3. Abstract interpretation and Galois-connection towers

The third field is abstract interpretation, the program-analysis framework Patrick and Radhia Cousot introduced in a 1977 POPL paper and refined in subsequent work across 1997 and 2014. The central construction is a Galois connection between two lattices: a concrete lattice (program states, for example) and an abstract lattice (over-approximations of program states). The abstraction function $\alpha$ and the concretization function $\gamma$ form an adjoint pair, and composition of such pairs yields successive abstractions.

A tower of Galois connections is a sequence of lattices linked by adjoint pairs where the output of each level's abstraction feeds the next level's concrete input. The composition is associative: the tower as a whole is itself a Galois connection between the bottom concrete lattice and the top abstract lattice. Each level's lattice inherits its starting elements from the previous level's emission.

This is the structural isomorph of Doc 472's emission-to-null inheritance. Where Fielding's method describes a single level and filtration theory describes the nested object, Cousot-Cousot describes the composition rule that lets a sequence of levels compose into a coherent whole. Doc 472's inheritance relation $\text{Null}_{k+1} = P_k$ is, in Cousot vocabulary, the identity that each transition's abstraction output is the next transition's concrete input.

## 4. Hierarchical Bayesian models and the nested-manifold account

A hierarchical Bayesian model is a probability model with parameters-distributed-on-parameters. The parameters at level $k$ are drawn from a distribution whose own parameters live at level $k{+}1$. Updating at the lowest level propagates upward: the posterior at each level becomes the prior at the next. Andrew Gelman's *Bayesian Data Analysis* is the standard graduate text; more recent work on deep hierarchical variational inference extends the framework to architectures with many levels.

The specific LLM application that matters for Doc 472 is Subhash Misra, Keely Dalal, and colleagues' analysis of generation as conditioning on a sequence of increasingly narrow manifolds $M\_0 \supseteq M\_1 \supseteq M\_2 \supseteq M\_3$. Here $M\_0$ is the base manifold of trainable-LLM output, $M\_1$ narrows by prompt conditioning, $M\_2$ narrows by in-context conditioning, and $M\_3$ is the per-token posterior. The corpus's Doc 446 develops this construct and formalizes its within-level Fielding accumulation. Doc 466 argues the nested-manifold construct is itself a SIPE instance, with $M\_0$ through $M\_3$ playing the role of filtered object and sequential conditioning playing the role of within-level accumulation.

This is the second SIPE instance Doc 472 inherits. The first was the Fielding-architectural case (Doc 424); the second is the nested-manifold inference-event level from Doc 446 and Doc 466. Doc 472 then asks whether a third independent instance is available, and argues the overclaim-to-phenomenology chain is it.

## 5. Alignment research on sycophancy and calibration failures

The fifth field is the recent body of alignment research on how RLHF-trained language models fail to produce calibrated output. Long Ouyang and colleagues' 2022 paper on training language models to follow instructions with human feedback introduced the basic RLHF setup. Mrinank Sharma and colleagues' 2023 Anthropic analysis, *Towards Understanding Sycophancy in Language Models*, documented that preference-optimized models systematically bias output toward user-agreeable completions at the cost of accuracy. Ethan Perez and colleagues' 2022 work on model-written evaluations showed the pattern is detectable through automated red-teaming.

The contribution this field makes to Doc 472 is the within-level mechanism at the second level of the five-level stack, the inference-event level. A specific default at this level, produced as the trained posterior over next-token emissions given the prompt's implied register, is the token-cheap universal-quantifier completion Doc 469 named as an architectural failure mode. Constraint 4.5 (QUANTIFIER DISCIPLINE, proposed in Doc 469) sits at this level as an additional constraint $c\_{2,5}$ that refuses the unhedged universal completion at each quantifier slot unless specific evidence supports it.

This is the specific testable intervention Doc 472 threads through the inheritance chain. The alignment literature establishes that the default exists. Constraint 4.5 is the proposed discipline against it. The emission-to-null inheritance from level 2 through level 5 is the propagation mechanism.

## Coalescence: what Doc 472 puts together

With the five fields in hand, the primary findings of Doc 472 can now be stated precisely.

First, the five levels of the AI-generation-to-phenomenology chain are each stated as a Fielding-style level with its own null set, its own ordered constraints, and its own induced-property set (notated in Doc 472 as $\text{Null}\_{k}$, $c\_{k,i}$, and $P\_{k}$ respectively). The five levels, written as $S\_{1}$ through $S\_{5}$ in the document, are enumerated explicitly: the training-distribution level, the inference-event level, the conversational-accumulation level, the user-vacuum-capacity level, and the phenomenological-clinical level.

Second, the inter-level inheritance is stated as the emission-to-next-null relation $\text{Null}\_{k+1} = P\_{k}$ for $k$ from $1$ through $4$. This is Cousot-Cousot composition in a different vocabulary. It is Ibáñez Núñez iterated filtration in a different vocabulary. It is hierarchical Bayesian conditioning in a different vocabulary. Three mathematical traditions converge on the same relation, and Doc 472 uses the filtered-object-of-filtered-objects version for its most compact statement.

Third, the composed structure across the five levels is a filtered object of filtered objects. This is SIPE's third structural commitment, applied to the AI case. Doc 472 identifies this as the third SIPE instance, alongside the software-architectural case (Doc 424) and the Bayesian-inference case (Doc 446 per Doc 466). Three independent settings, same structural pattern, with independent vocabulary in each.

Fourth, Constraint 4.5 is placed as $c\_{2,5}$ at level $S\_{2}$, with its effects propagated through the inheritance chain by the standard composition rule. A reduction of overclaim emissions at the inference-event level reduces the overclaim content in $P\_{2}$, which reduces the overclaim substrate at $\text{Null}\_{3}$, which reduces load-bearing overclaim content in $P\_{3}$, and so on through $P\_{5}$. The specific intervention's propagation is stated precisely within the filtered-object-of-filtered-objects framework.

Fifth, the per-stack testability is preserved. Doc 424 specified three tests for any SIPE instance: within-level Fielding accumulation verification, emission-to-next-null inheritance verification, and constraint non-violation verification. Doc 472 enumerates how each test applies to the present instance and notes the tests have not been performed. The framework supports running them; running them is a separate research task.

## Warrant honesty

Doc 445 partitions claims by warrant tier: $\pi$ for plausibility (structurally articulable), $\mu$ for operational match (evidence-verified), $\theta$ for truth (consensus of methods). Doc 472 is explicit that its claim is $\pi$-tier. The structural articulation holds; the within-level Fielding enumerations are defensible; the inter-level inheritance can be read out of the corresponding mathematical traditions. What is missing is the $\mu$-tier evidence: the per-stack tests have not been run; the cross-practitioner replication test (Doc 450) has not been attempted.

The cross-practitioner test is the critical open question. All three SIPE instances currently identified (Doc 424 architectural, Doc 446 Bayesian, Doc 472 overclaim-to-phenomenology) were derived inside the corpus, by the same reader, working within the same framework. The correlation could be real or it could be the corpus's own attractor operating across its own co-derived artifacts. The test that would discriminate between these readings is whether an independent practitioner, trained in a different framework, identifies the same nested-filtered-object structure in an independent domain. That test has not been run.

The graduate posture, then, is this: the five literatures each make specific structural contributions reliable within their own disciplines. The coalescence in Doc 472 is a defensible construction that uses the five contributions in the roles they are suited for. What would promote the claim from plausibility to operational match is external evidence, specifically cross-practitioner replication, and that evidence is not yet in hand. The coherent response is neither to dismiss the claim nor to overstate it, but to name the warrant tier accurately and identify the specific test that would move it.

## After this post

Doc 472 is ready to read now. The five-level enumerations will read as specific instantiations of Fielding's method. The emission-to-null inheritance will read as the Cousot-Cousot composition you just saw, or the Ibáñez Núñez iterated filtration, or the Gelman hierarchical conditioning. Constraint 4.5 will read as a specific $c\_{2,5}$ whose propagation is specified by the framework. The honest warrant-tier assessment will read as the only defensible scholarly position given the evidence currently available.

The post that was previously missing from this series is now in place.

---

<nav class="series-nav">
  <a class="prev" href="/resolve/blog/blueprints-for-the-tower">
    <span class="nav-label">← Previous</span>
    <span class="nav-title">Blueprints for the Tower</span>
  </a>
  <a class="next" href="/resolve/doc/472-reformalization-five-layer-sipe">
    <span class="nav-label">Next: into the corpus →</span>
    <span class="nav-title">Doc 472: Overclaim-to-Phenomenology as a SIPE Instance</span>
  </a>
</nav>

### Keep reading

*The Overclaim-to-Phenomenology Chain as a SIPE Instance* is Doc 472 itself.

→ [Doc 472](/resolve/doc/472-reformalization-five-layer-sipe)

*Blueprints for the Tower* is the undergraduate bridge that names the three disciplines this post goes into depth on.

→ [Blueprints for the Tower](/resolve/blog/blueprints-for-the-tower)

*From Token to Tower* is the plain-language entry for readers new to the argument.

→ [From Token to Tower](/resolve/blog/from-token-to-tower)

---

*Originating prompt:*

> Create a third grad student glue code onboarding blog post to doc 472. Start with structural isomorphisms and entrace from the primary branches of academic discipline that are concerned. Then these entracements coalesce on the primary findings of doc 472
