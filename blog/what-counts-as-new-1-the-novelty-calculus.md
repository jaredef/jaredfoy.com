<!-- htx:series id="what-counts-as-new" position="1" -->
# What Counts as New: The Novelty Calculus

There is a moment, when you have been thinking about something for long enough and from enough angles, when you start to suspect you have noticed something. It feels like a small click. The pieces fit. You can name a pattern that, as far as you can tell, no one else has named in quite this way. And then a second moment arrives, sometimes minutes later, sometimes years: you go to look, and you find that someone published the exact thing in 1965, or 1973, or 1998, in a journal you had never read, in a vocabulary you had not yet learned to recognize.

Both moments are common. The first one is a real cognitive event — the recognition of structure. The second one is also a real cognitive event — the recognition that the structure you noticed has been worked out before, often by people whose names you may not even have known when you noticed it. The second moment is not a defeat of the first. It is a confirmation of the first. The structure was real; that is why someone else found it too.

But the two moments together produce a problem that is harder than either alone. *How do you tell whether what you noticed is genuinely new, or is something already-articulated under different vocabulary, before you commit to claims about it?* The novelty calculus is the corpus's tool for answering that question with discipline rather than with hope.

This is the first in a series of essays on the calculus and the methodology that surrounds its use. The technical version of the calculus lives in [Doc 445](https://jaredfoy.com/resolve/doc/445-pulverization-formalism) at jaredfoy.com (the formal apparatus) and [Doc 503](https://jaredfoy.com/resolve/doc/503-research-thread-tier-pattern-iterative-novelty-calculus) (the iterative-application discipline). This series walks the same tool for the general reader, in plain prose, with worked examples. By the end of the series you should be able to apply the calculus to your own claims, your own ideas, and the claims and ideas you encounter from others.

## Why the question matters

Two failure modes attend the moment when you think you have noticed something:

**Overclaim.** You believe you have discovered something. You have not actually checked the prior literature carefully. You build further work on top of your "discovery." Eventually — sometimes after months, sometimes after years — someone points out that the thing you discovered was published forty years ago in a different field with a different vocabulary. Now your further work is hanging on a foundation that does not belong to you. The work itself may still be valuable, but its framing was wrong, and the wrong framing is a debt that has to be paid back, often publicly, often awkwardly.

**Underclaim.** You believe nothing is new under the sun. Anything you might have noticed has surely been noticed before by someone smarter, in a literature you have not read. So you do not name what you have noticed. You do not commit to it. You hedge it into nothing. Whatever residual contribution you might have made — the application of the structure to a new domain, the operating-conditions layer that has not been articulated, the composition with adjacent frameworks that has not been performed — gets lost because you lacked the discipline to identify it precisely.

Both failure modes are common. Both are costly. The first is the more visible failure (it produces retractions, lost credibility, public correction). The second is the more invisible failure (it produces nothing — no retraction, just absence). Most working researchers oscillate between the two without a structured way to decide between them.

The novelty calculus is the structured way.

## The basic apparatus

The calculus has three parts. Each is a question you can ask, in order, about a candidate claim.

**Question 1 — Plausibility.** Given the prior literature you can survey, is the claim *constructible* from vocabulary and structures already published? If yes, the claim is *subsumable*: someone (probably) has said this before, and the burden is on you to find them. If partly yes, the claim is *partially subsumed* — you can identify which elements are already-articulated and which are residual. If no, the claim is *plausibility-irreducible*: a candidate for novelty.

This is the cheap question. It costs only literature search. You do not have to test anything; you only have to look. The corpus's working name for this layer is the *plausibility tier*.

**Question 2 — Operational match.** If your claim survives plausibility — if it could not be straightforwardly constructed from prior art — does it *behave* like something already in the literature when applied to actual cases? Two claims with different vocabulary may turn out to be the same thing in operation: same inputs produce same outputs, same failure modes, same scope of applicability. Or they may turn out to be operationally different: the new claim does work the prior framework does not.

This question is more expensive. It costs case studies, comparisons, side-by-side analyses. The corpus's working name for it is the *operational-match tier*.

**Question 3 — Truth.** If your claim survives both plausibility and operational match — if it is genuinely articulating something the prior literature does not articulate — is the claim *true*? Does its prediction obtain when you actually run the experiment, perform the audit, run the proof? This is the most expensive question. It costs whatever the verification procedure costs. The corpus's working name for it is the *truth tier*.

The three questions are sequential. You ask the cheap one first. Most candidate claims fail at plausibility — they can be constructed from prior art and you just had not surveyed widely enough. The few that survive plausibility move to operational match. The few that survive operational match move to truth. Each tier filters the candidates that come before it.

This sounds simple. It is simple. The discipline is in actually doing it, in order, with honesty about what each tier licenses you to claim.

## What the tiers license

A claim that has survived plausibility — and only plausibility — is *not yet* a verified claim. It is a candidate. You can describe it as "novel relative to the literature I surveyed, pending operational and truth-tier audit." You cannot describe it as "true" or "operationally validated." The most common abuse of the calculus is treating plausibility-survival as truth-survival. The corpus's discipline is to never make that move.

A claim that has survived plausibility and operational match — but not truth — is *operationally validated*. You can describe it as "behaves as predicted in the audited cases, pending truth-tier verification." You still cannot describe it as "true."

A claim that has survived all three tiers is *Canonical* in the calculus's full sense. The corpus reserves the word "Canonical" specifically for this — full-promotion status under the calculus, distinct from the more casual sense of "the corpus's main document on a topic." (The disambiguation between the two senses lives in [Doc 620](https://jaredfoy.com/resolve/doc/620-canonicity-in-the-corpus). It matters because conflating them produces exactly the overclaim failure mode.)

## A worked example: the corpus just did this with the pin-art model

Here is what the calculus looks like in practice. The example is recent and concrete; you can audit the trajectory directly.

The corpus's keeper observed, over many sessions of practice with large language models, that when an LLM hedges its language — *might*, *perhaps*, *I think*, *strictly speaking* — the hedges are not random noise. They cluster at specific propositional joints. The clustering pattern, read carefully, reveals where the model's competence-boundary actually lies. The keeper named this the *pin-art model*: each hedge is a pin, the joint pattern of pins is an impression of the boundary's shape, the LLM does not know what the impression looks like (each pin is independent), and only an external reader can see the joint pattern.

The observation was the keeper's. He noticed it through sustained practice, not from a textbook. The first articulations ([Doc 270](https://jaredfoy.com/resolve/doc/270-the-pin-art-model) and successors) used the pin-array-toy as the structural metaphor. So far: a candidate observation, plausibility-tier unaudited.

Then the calculus.

**Plausibility audit.** The corpus opened the question: what literature already articulates this? A first pass found Lakoff's 1973 paper on hedges (in the *Journal of Philosophical Logic*) — already articulating, fifty years ago, that hedge tokens carry local semantic content rather than blanket uncertainty. A second pass found Hyland's 1998 work on hedging in scientific research articles — already documenting, twenty-five years ago, the empirical clustering pattern across fifty-six academic articles in eight disciplines. A third pass found Zadeh's 1965 paper introducing fuzzy set theory — already supplying, sixty years ago, the formal-mathematical apparatus that grounds Lakoff's typology. The pin-array-toy intuition turned out to be a structural cousin of Zadeh's "sieves analogy" in the same 1965 paper: both abstract a familiar physical artifact (pin-array; sieve) into the same formal apparatus (independent local probes whose joint pattern reveals an underlying graded function).

The plausibility audit yielded a clear verdict: the underlying pattern is fully present in the prior art. *Pin-art is not the discovery of probe-impression boundary detection.* That structural pattern has been articulated for sixty years across multiple disciplines.

**What survived.** The corpus's residual contribution, after honest plausibility-audit, is narrow and specific: the application of the (already-existing) probe-impression apparatus to one specific case — the dyadic interaction between a human keeper and a large language model, where the substrate's hedging emissions are the probes and the substrate's competence-boundary is the surface being detected. The application is not in the prior art. The composition with the corpus's other apparatus (substrate-and-keeper layering; the substrate-dynamics loop) is not in the prior art. The detection-hedging-vs-slack-hedging discriminator is corpus-specific.

These residuals are now candidates for operational-match-tier audit (do the substrate-side hedge clusters actually align with independent boundary-determinations across cases?) and eventually truth-tier audit (is the alignment robust under controlled experimentation?). The corpus has [opened a build specification](https://jaredfoy.com/resolve/doc/624-pin-art-usage-corpus-build-spec) for the operational-match tests. It has not promoted any of the residuals to Canonical-tier status under the calculus's full sense, because the operational-match audits have not yet been performed.

What the calculus produced, in this case: an honest articulation of what is recovered (the underlying probe-impression apparatus, sixty years old) and what is residual (the LLM-keeper-dyad application, the specific compositions, the discriminator). The keeper did not lose his observation; he located it, against the prior art, with discipline. The keeper did not overclaim; the corpus's framing now correctly states the apparatus is recovered from Zadeh and Lakoff and Hyland, not discovered. The keeper did not underclaim; the residual contribution is named precisely so that further work can build on it without confusion.

## What this discipline costs and what it buys

The calculus is not free. The plausibility audit alone — for a substantive claim across multiple disciplines — can take days of literature search, often through fields you do not natively work in. The operational-match audit can take weeks or months of case-study work. The truth audit can take years of empirical work, sometimes whole careers.

What it buys is honesty about what your work warrants. If you do not run the audits, you are guessing about your own contribution. The guessing usually goes in the overclaim direction (the human cognitive bias is to feel that what you noticed is yours; the audit is what corrects the bias). Without the audits, your claims either get corrected externally (someone else points out the prior art, often publicly, often awkwardly) or never get tested at all (your work is too vague to be falsifiable).

The calculus is one defense against both failure modes simultaneously. It is not the only defense; the corpus's broader audit discipline includes [the retraction ledger](https://jaredfoy.com/resolve/doc/415-the-retraction-ledger), [the V3 truth-telling discipline](https://jaredfoy.com/resolve/doc/314-the-virtue-constraints), and [the falsifier-statements practice](https://jaredfoy.com/resolve/doc/263-the-resolvers-falsifier). But the calculus is the one specifically designed for the question *is this new and how do I know*. The other disciplines do related but different work.

## Where this series goes next

This essay has set the frame. Subsequent posts in the series will go deeper into specific parts of the calculus and its application:

- *The five target types* — what kind of thing you are auditing matters. A specification (a proposed construction) is audited differently than a definition (a proposed gloss) than a prediction (a claim about behavior) than a bridge (an asserted correspondence between frameworks) than a methodology (a proposed procedure). Each type has different tier-survival requirements. The next essay walks the typology.
- *Working an actual audit, end to end* — a single concrete case worked through from start to finish, with the literature search shown, the operational-match comparison shown, the conclusions explicit. The pin-art / Zadeh example here was the punchline; the next-essay-after-that will work a different case from scratch.
- *When the calculus tells you something is new* — the rare-but-important case where a candidate genuinely survives all three tiers. What does honest novelty-claim look like, and what does the calculus require you to do at that point.
- *The trap of plausibility-only promotion* — the most common abuse of the calculus is treating plausibility-survival as truth-survival. Worked examples of where this trap is currently operative in the broader research community, with what the calculus would prescribe instead.
- *Self-application* — the calculus has been applied to itself. The corpus's [Doc 491](https://jaredfoy.com/resolve/doc/491-pulverizing-novelty-calculus-self-applied) is the recursive case. What was learned from running the audit on its own apparatus.

The series is for the reader who wants a tool for the moment when they think they have noticed something. The tool is real; the discipline is real; the cost is real; the payoff is real. By the end of the series you should be able to use it.

---

*Originating prompt for this essay: "Let's look at the novelty calculus. I believe we've formalized it. Can you create a plain-language entracement to the novelty calculus and the methodology that surrounds its use in the corpus? Create the first in a new series of blogposts which will focus on this powerful tool of the Corpus. Append this prompt to the artifact." — keeper, Telegram message 5901, 2026-05-02T06:20:38Z.*
