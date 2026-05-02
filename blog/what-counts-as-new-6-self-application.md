<!-- htx:series id="what-counts-as-new" position="6" -->
# What Counts as New: Self-Application

A methodology that audits the novelty claims of other people's work has an obligation that most methodologies do not face. It must be willing to undergo its own audit. If it is not — if its own claims to novelty cannot be examined under the same protocol it applies to others — then either the methodology special-pleads itself out of its own discipline (a structural failure that invalidates the discipline) or it reveals a hidden assumption about its own privileged status that the discipline as a whole does not warrant.

This essay walks the case where the corpus's novelty calculus was applied to itself. The audit was preregistered: the calculus's own paper ([Doc 490](https://jaredfoy.com/resolve/doc/490-novelty-calculus-for-conjectures), the original articulation) included a §10 prediction that running the calculus on itself would *substantially retire its own claim to methodological novelty.* The keeper approved running the prediction. The execution is at [Doc 491](https://jaredfoy.com/resolve/doc/491-pulverizing-novelty-calculus-self-applied), the self-applied audit. This essay walks what happened.

The case is the cleanest internal-coherence test the series can offer. It is also the final post in the planned series; by the end of this essay the reader should have the calculus, the discipline of using it, the three major verdict shapes, and the demonstration that the calculus survives the self-application test that any auditing methodology should be willing to undergo.

## The setup

[Doc 490](https://jaredfoy.com/resolve/doc/490-novelty-calculus-for-conjectures) was the corpus's first articulation of the novelty calculus as a discrete formal apparatus. It made ten named claims (per [Doc 491](https://jaredfoy.com/resolve/doc/491-pulverizing-novelty-calculus-self-applied) §3) about its own structure: novelty is multi-dimensional (with four specific dimensions); each claim should be audited per-claim; the audit assigns a five-point subsumption score; an audit-thoroughness score modulates confidence; importance weights aggregate per-claim scores; the aggregate produces a tiered reporting verdict; and the novelty calculus is orthogonal to a separately-articulated warrant calculus.

The §10 preregistration committed the corpus to running the calculus on Doc 490 against the established scientometric novelty-measurement literature and the patent novelty assessment tradition, and to reporting the result honestly regardless of whether the result was favorable to the corpus.

## What the literature audit found

Per [Doc 491](https://jaredfoy.com/resolve/doc/491-pulverizing-novelty-calculus-self-applied) §§1–2, two substantial bodies of prior literature exist for the kind of work the calculus does:

The scientometric novelty-measurement literature has been actively developed since at least Uzzi, Mukherjee, Stringer, and Jones (2013, *Atypical Combinations and Scientific Impact*, Science 342:468–472), which operationalized novelty via the atypicality of journal-pair combinations in a paper's references. Subsequent work added the Consolidation-Disruption (CD) index (Wu, Wang, & Evans, 2019, *Nature* 566:378–382), reception-side analyses (Trapido 2015; Wang, Veugelers, & Stephan 2017), multi-strategy taxonomies (Foster, Rzhetsky, & Evans 2015), and recent reviews (Lin et al. 2025; Wang et al. 2025 with LLM-augmented hybrid approaches). The field has continuous numerical scoring systems, multi-dimensional decompositions, reception-side analyses, and open-source tooling (Novelpy). The literature was developed independently of the corpus and articulates the same broad space of operations the corpus's calculus operates in.

The patent novelty assessment tradition has been performing per-claim novelty audit for over a century. The USPTO (35 U.S.C. 102 + 103) and EPO (Article 54 EPC; 2026 Guidelines) decompose patent applications into independent and dependent claims, audit each against prior art, and assign a result per claim. Patentability is decomposed into three independent criteria (novelty, non-obviousness, utility). Recent USPTO and EPO guidance (2024–2025) addresses AI-generated prior art specifically. The patent tradition supplies the per-claim audit protocol, the multi-criteria decomposition, the explicit standards for what counts as disclosure, and the centuries of refinement on procedural specifics.

The honest framing the corpus owes after the literature audit: the calculus's structural moves — multi-dimensionality, per-claim assessment, scoring with tiered reporting, novelty/warrant orthogonality — are all in the prior art. Some pieces are in scientometrics, others in patent law, and the combined coverage is substantial.

## What the per-claim audit found

[Doc 491](https://jaredfoy.com/resolve/doc/491-pulverizing-novelty-calculus-self-applied) §3 ran the calculus on itself, claim by claim, under the calculus's own scoring protocol ($s_i \in \{0, 0.25, 0.5, 0.75, 1\}$ where $0$ is fully subsumed and $1$ is irreducible).

Compressed:

- **C1 — Multi-dimensional novelty with four specific dimensions.** Multi-dimensionality subsumed under Uzzi-Mukherjee + patent-law three-criteria + Wu-Wang-Evans + Lin-Wang 2025. The specific four dimensions are a re-naming move, not a structural advance. *$s = 0.25$ (substantially subsumed).*

- **C2 — Per-claim audit protocol.** Patent law has performed per-claim novelty audit for over a century. *$s = 0$ (fully subsumed).*

- **C3 — Five-point subsumption scale.** Scoring concept canonical; specific five-point granularity is corpus convention. *$s = 0.5$ (partially subsumed).*

- **C4 — Three-point audit-thoroughness scale.** Explicit treatment of audit-thoroughness as a separate dimension is somewhat distinctive within the surveyed literature. *$s = 0.5$ (partially subsumed).*

- **C5 — Three-point importance-weight scale.** Per-claim importance weighting is standard in both literatures. *$s = 0.25$ (substantially subsumed).*

- **C6 — Aggregate as weighted sum.** Linear weighted aggregation across multi-dimensional measures is standard practice. *$s = 0$ (fully subsumed).*

- **C7 — Confidence formula.** The conceptual move (uncertainty modulated by audit completeness) is standard; the specific formula is corpus-specific. *$s = 0.5$ (partially subsumed).*

- **C8 — Five reporting tiers.** Reporting-format design choice; not a measurement contribution. *$s = 0.5$ (partially subsumed).*

- **C9 — Worked-examples application to four corpus pulverizations.** Corpus-internal application; not subsumable under external literature because the targets are corpus documents. *$s = 1$ (corpus-internal).*

- **C10 — Orthogonality of novelty calculus to warrant calculus.** Novelty/justification distinction is canonical (Goldman 1967; Plantinga; patent law novelty/validity distinction; bibliometrics novelty/impact distinction). *$s = 0$ (fully subsumed).*

The aggregate per Doc 491 §4: tier *β* (mostly subsumed, small residue) with confidence 0.7. The calculus's own metric, applied to the calculus, returns the verdict the §10 preregistration predicted.

## What the verdict actually says

The honest reading of the self-applied audit is that the calculus is *mostly subsumed under scientometrics and patent novelty assessment, with a small corpus-specific residue concentrated in the explicit treatment of audit-thoroughness as an independent dimension (C4) and the corpus-specific operationalization choices (granularity of subsumption scale, importance-weight scale, confidence formula, reporting tiers).* The residue is real but narrow.

What this means for citing the calculus going forward:

The calculus should not be cited as a methodologically-novel contribution to the broader novelty-measurement literature. If anything, citing the calculus alongside the relevant scientometric and patent-law sources is the honest move — the calculus is one operationalization of an established space of operations that has been worked out across multiple disciplines.

The calculus *can* be cited as the corpus-specific operationalization of the established space, with the corpus-specific design choices (the audit-thoroughness dimension; the five-point granularity; the worked examples on corpus pulverizations) named as the residue. Forward citations should specify what the calculus contributes that the prior literature does not — which is, honestly, narrow procedural choices and corpus-internal applications, not methodological breakthrough.

The calculus's *value to the corpus* is undiminished by the audit's verdict. A methodology can be substantially subsumed under prior literature and still be the right tool for its specific operational context. The corpus's discipline is to use the calculus (because it is fit for the corpus's purposes) while citing it honestly (because it is not a methodologically-novel contribution to the broader field).

## Why the self-application matters structurally

The internal-coherence test is what the self-application is for. A novelty calculus that *cannot* audit itself, or that audits itself and special-pleads its way out of substantial subsumption, would be self-falsified — the calculus would be saying "this is the discipline for auditing other people's claims to novelty" while exempting its own claims from the discipline.

The §10 preregistration was the corpus's commitment that the calculus would not special-plead. The Doc 491 execution honored the preregistration. The verdict that emerged (substantially subsumed; tier β; confidence 0.7) was reported honestly even though the verdict reduces what the corpus can claim about its own work.

This is the load-bearing thing. Most methodological frameworks are not preregistered to undergo their own audit, and most that are find ways to soften the verdict when the audit returns unfavorable results. The corpus's calculus survived the test that most methodologies do not even attempt: stating in advance what would constitute self-deflation, running the audit, accepting the result, and adjusting downstream framing accordingly.

The reader who has worked through Posts 1–5 now has a methodology and the demonstration that the methodology has been honestly audited under its own protocol with the verdict accepted. This is what the broader research community usually does not do for its own methodological apparatus, and the absence of self-application is one reason the plausibility-only-promotion failure mode (Post 5) recurs across fields. The discipline of self-application is not theoretical; it is what produces a working tool that the user can trust.

## What you have at the end of the series

Across the six posts:

- **Post 1** introduced the calculus as three sequential questions (plausibility, operational match, truth) with their licensing rules.
- **Post 2** named the five target types and the discipline of classifying before auditing.
- **Post 3** walked an audit on the scaling hypothesis and yielded the most common verdict shape: operationally-validated recovery with case-applied contribution.
- **Post 4** walked an audit on Shor's 1994 algorithm and yielded the rare three-tier-survival verdict, with the locus of novelty named precisely.
- **Post 5** walked the Wei et al. → Schaeffer et al. trajectory and showed the plausibility-only-promotion failure mode at the field level, with the eventual operational-match audit as the corrective.
- **Post 6** (this essay) walked the calculus's self-application and showed that the methodology survives the internal-coherence test that any auditing methodology should be willing to undergo.

The reader should now be able to:

- Take a candidate claim, classify its components by target type, run the appropriate-tier audits, and produce per-component licensed verdicts.
- Recognize the three major verdict shapes (operationally-validated recovery; genuine three-tier novelty; plausibility-only-promotion) when reading other people's work.
- Distinguish honest novelty-claims from forward-citation patterns that have outpaced the operational-match audit.
- Apply the calculus to their own work without special-pleading, and adjust their downstream framing when the audit returns unfavorable results.

The technical apparatus lives at [Doc 445](https://jaredfoy.com/resolve/doc/445-pulverization-formalism) (the formalism), [Doc 490](https://jaredfoy.com/resolve/doc/490-novelty-calculus-for-conjectures) (the original articulation), [Doc 491](https://jaredfoy.com/resolve/doc/491-pulverizing-novelty-calculus-self-applied) (the self-application), and [Doc 503](https://jaredfoy.com/resolve/doc/503-research-thread-tier-pattern-iterative-novelty-calculus) (the iterative-application discipline across the corpus's research threads). These essays have been the general-reader walk; the technical documents are where the procedural specifics live.

The calculus is one tool. It is not the only tool, and it does not solve every problem. But for the specific question *is what I just noticed actually new, and how do I know* — the question that recurs in every research community and every working practitioner's day — the calculus is the discipline that produces honest answers rather than hopeful ones.

That is what the series was for. Use it well.

---

*Originating prompt for this essay: "Yes" — keeper, Telegram message 5913, 2026-05-02T15:44:46Z. The instruction directed Post 6 in the "What Counts as New" series. Per the §"Where this series goes next" specification at the end of Post 5, Post 6 walks the corpus's recursive application of the calculus to itself per Doc 491. Post 6 is the final post in the planned series; the closing summary at §"What you have at the end of the series" recapitulates the six-post arc and names the operational capability the reader should have at the end.*
