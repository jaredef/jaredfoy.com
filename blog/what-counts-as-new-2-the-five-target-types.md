<!-- htx:series id="what-counts-as-new" position="2" -->
# What Counts as New: The Five Target Types

The first essay in this series introduced the novelty calculus as three sequential questions: plausibility, operational match, truth. The questions are answered in order, each filtering the candidates that survive the previous one, with each tier-survival licensing only its specific kind of claim.

What the first essay did not say, and what this essay is about: *the kind of thing you are auditing changes what each tier-survival licenses.* A claim that this new architectural style is structurally different from REST is not the same kind of claim as the claim that a particular psychology experiment will yield a particular result, and you cannot run the same audit on both. The calculus has five target types. Each has different tier-survival requirements. Mis-typing a target — running the wrong audit, or accepting the wrong license — is the most common error in applying the calculus, and it produces the same overclaim/underclaim failure modes the calculus was designed to prevent.

This essay walks the five types, with what each is, what audit it requires, and what the surviving tier licenses you to claim.

The technical taxonomy lives in [Doc 445 §"Target typology"](https://jaredfoy.com/resolve/doc/445-pulverization-formalism); this essay renders the same typology in plain language with worked examples.

## Why the type matters

The fastest way to see why typing matters: imagine you have noticed something. You run a plausibility audit. You find the prior literature does not articulate it.

What can you claim?

If the thing you noticed is a *proposed construction* — say, an architectural pattern for organizing software — then plausibility-irreducibility is meaningful: the construction may be novel pending higher-tier audits.

If the thing you noticed is a *prediction* about how something will behave — say, that conversations between humans and language models exhibit a particular kind of memory-decay over time — then plausibility-irreducibility is *irrelevant*. Predictions are not made true by being absent from the literature. The question for predictions is whether they actually obtain when tested. Plausibility is the wrong tier; you should not have started there.

If the thing you noticed is a *definition* — say, what the acronym SIPE stands for — then plausibility-irreducibility licenses only a weak claim ("semantically plausible, truth untested") because definitions are made true by what the term actually denotes, which requires consultation with whoever the authoritative source is.

The same surface-level "I noticed something nobody has published" leads to three different licensed conclusions depending on what kind of thing was noticed. The discipline is to *classify before auditing*. Otherwise you run the right audit on the wrong type and either overclaim what your evidence licenses (the more common failure) or underclaim what stronger audits would yield (the more invisible failure).

## The five types

### Specification ($T_S$): a proposed construction

A *specification target* is a proposed construction that did not exist before someone wrote it down. Architectural patterns are specifications. Constraint sets are specifications. Programming languages are specifications. Methodologies for performing some task — when described in enough detail that another agent could execute them — are specifications. Anything that takes the form *here is a structure I propose; here are its parts; here is how the parts fit together* is a specification.

The question for a specification is: *has this been constructed before?*

What plausibility-tier audit licenses for a specification:

- *Fully subsumed* — every constitutive element of the specification has a published analogue, and the composition has been published too. Verdict: not novel relative to the prior art; cite it.
- *Partially subsumed* — some elements have analogues, some do not. Verdict: novel only in the un-subsumed elements; document them precisely; the rest is recovery.
- *Plausibility-irreducible* — the specification cannot be straightforwardly constructed from prior-art elements. Verdict: candidate novelty; the specification stands as candidate pending operational and truth-tier audit.

Specifications are unusual among the five types in that *plausibility-irreducibility licenses a meaningful claim by itself*. Even without operational-match-tier audit, a plausibility-irreducible specification is a candidate-novel artifact whose presence in the world is itself the contribution. Books, patents, software systems, theological frameworks — many specifications exist and matter without needing further verification, because their presence as constructions is what they are.

Worked example: REST as a specification, articulated by Roy Fielding in his 2000 dissertation. The plausibility audit yields *partially subsumed* — every individual constraint Fielding names was articulated before in earlier networking and software literature. The composition was the contribution. REST as specification stands as candidate-novel at the composition level even before the truth-tier audit (which, in this case, has been running for twenty-five years through every web-scale system that adheres to the constraints).

### Definition ($T_D$): a proposed gloss

A *definitional target* is a proposed meaning for a term, name, or acronym. *What does this word mean?* When someone says "let's call this the Substrate-and-Keeper Composition" or "SIPE stands for Systems-Induced Property Emergence," they are proposing a definition. The proposed meaning attaches a string to a content; the content may or may not match what the term actually denotes when the proposal is audited.

The question for a definition is: *does this proposed gloss match what the term denotes?*

What plausibility-tier audit licenses for a definition:

- *Fully subsumed under prior art* — verdict: *semantically plausible, truth untested*. The definition uses vocabulary that already exists in adjacent literature; you cannot tell from plausibility alone whether the definition matches the actual denotation. This is the calculus's most precise verdict-name; it specifies exactly what plausibility-survival licenses without overclaiming.

For definitions, plausibility-tier survival does *not* license promotion. To promote a definition, you must run truth-tier audit. Truth, for definitions, is settled by consulting the authoritative definer: for corpus-internal terms, the keeper; for technical terms in established fields, the canonical publication; for terms whose authority is contested, the procedure for resolving the contest.

Worked example: when someone proposes that the acronym "SIPE" stands for "Sustained-Inference Probabilistic Execution," the plausibility audit can verify that all four words appear in the probabilistic-programming and streaming-inference literature. This yields the verdict *semantically plausible, truth untested*. The actual content the acronym denotes in the corpus is *Systems-Induced Property Emergence*, which is determined by the keeper as the authoritative definer, not by what the words could plausibly mean. The proposed definition fails truth-audit despite passing plausibility-audit. ([Doc 444](https://jaredfoy.com/resolve/doc/444-pulverizing-the-sipe-confabulation) walks this exact case in technical detail.)

### Prediction ($T_P$): a claim about behavior

A *predictive target* is a claim about what some system will do under some conditions. *Under condition X, system S will exhibit behavior B.* Falsifiable empirical claims, scientific predictions, engineering tolerances, behavior-of-LLMs-in-particular-contexts claims — these are predictive targets.

The question for a prediction is: *does reality bear it out?*

What plausibility-tier audit licenses for a prediction: *nothing*. Plausibility is irrelevant for predictions. A prediction is not made true by being absent from the literature, and not made false by being present. The only tier that operates on predictions is truth: an experiment, a measurement, an observation that either confirms or falsifies the prediction.

The temptation to apply plausibility-tier audit to predictions is strong because plausibility audits are cheap — they cost only literature search. The discipline is to *not run plausibility on predictive targets and pretend it tells you something*. The calculus's warrant table is explicit about this: plausibility-tier outcome is *not licensing-relevant* for predictive targets. Only truth-tier verification (or falsification) licenses promotion (or retraction).

Worked example: the prediction that a particular LLM will exhibit hedge-cluster patterns aligned with token-level entropy peaks across a particular set of audited cases. This prediction lives in [Doc 624](https://jaredfoy.com/resolve/doc/624-pin-art-usage-corpus-build-spec) as part of the usage-corpus build specification. It will not be promoted to *operationally validated* by plausibility-audit; it will be promoted by running the actual build and measuring the alignment, or it will be falsified by the same.

### Bridge ($T_B$): an asserted correspondence between frameworks

A *bridge target* is a claim that two distinct frameworks, articulated in different vocabularies, are operationally the same — that there is a structure-preserving mapping between their concepts and that the mapping holds across the cases the bridge is supposed to cover. *Concept X in framework F corresponds to concept Y in framework G; relation R in F corresponds to relation R' in G; the mapping holds across cases C₁, C₂, ... Cₙ.*

The question for a bridge is: *does the asserted correspondence actually hold?*

What plausibility-tier audit licenses for a bridge:

- *Fully subsumed* — the bridge uses vocabulary already published in both source frameworks. Verdict: bridge-vocabulary is plausible; structural soundness untested. The bridge stands as candidate pending operational-match-tier audit (does the mapping hold across cases?) and possibly truth-tier audit (case-by-case verification or formal proof of correspondence).

Bridges are the most common type of claim the corpus produces and one of the easiest to overclaim. The temptation: notice that two frameworks use similar vocabulary or have similar shape; declare a bridge; cite the bridge in further work. The discipline: a plausibility-passed bridge is *plausibility-passed*, full stop. Forward-citing it as if it had been operationally validated, or as if its truth-tier had been audited, is the most common abuse.

Worked example: the bridge from Pin-Art's probe-impression apparatus to Zadeh's fuzzy-set-theoretic membership-function apparatus, articulated in [Doc 625](https://jaredfoy.com/resolve/doc/625-fuzzy-set-theory-and-pin-art). The bridge is currently plausibility-passed: the structural correspondence is clear at the vocabulary layer (probes ↔ objects, rest-positions ↔ membership-grades, impression ↔ sampled membership function, etc.). The bridge has not been operationally validated; that requires the usage-corpus build of Doc 624 to test whether the alignment actually obtains across cases. The bridge has not been truth-tier audited; that would require formal proof of the correspondence under specified conditions. Doc 625 is honest about this: §9 ("What This Synthesis Does NOT Claim") names the bridge as plausibility-passed and explicitly does not promote it further.

### Methodology ($T_M$): a proposed procedure

A *methodological target* is a proposed procedure for producing or testing claims, generating outputs, performing operations. *Here is a method; here are its steps; here is what running the method should produce.*

The question for a methodology is: *does the procedure yield outputs whose warrant survives audit?*

What plausibility-tier audit licenses for a methodology: *the methodology exists; this tells nothing about whether it works.* Plausibility-tier survival for methodologies licenses no promotion at all. Procedure-existence is necessary but not sufficient. To promote, you need at least operational-match-tier audit (the methodology produces outputs that resemble what comparable methodologies in the prior art produce) and ideally truth-tier audit (the outputs survive independent verification).

The temptation with methodologies is to take *the methodology has been published* as evidence that *the methodology works*. The discipline is to run the methodology, examine its outputs, and audit whether the outputs hold up.

Worked example: the corpus's pin-art-usage-corpus build methodology, specified in [Doc 624](https://jaredfoy.com/resolve/doc/624-pin-art-usage-corpus-build-spec). The methodology is published. Plausibility-tier passes — the build steps are constructible from established research methodology in corpus linguistics, LLM evaluation, and related fields. But the methodology has *not* been run yet; it is a build specification, not a build outcome. Plausibility-tier survival licenses only *the methodology exists in specifiable form*. To promote it further, the corpus would have to run Phase 1 (schema validation on five sessions), examine the outputs, and audit whether the methodology yields outputs that resemble peer-reviewed corpus-linguistics outputs (operational match) and that survive independent expert audit (truth).

## The classification step is the discipline

The calculus's warrant table is sharp because typing is sharp. Once you know what type your target is, the warrant-table tells you exactly what tier-survival licenses what claim. The classification step itself is where most of the discipline happens, because you can run the right audit only after you know what you are auditing.

Three classification heuristics that work in practice:

- *Specification target asks "what is the structure?"* — if the answer is something you could build or describe in detail, it is a specification.
- *Definitional target asks "what does it mean?"* — if the answer requires consulting an authoritative definer, it is a definition.
- *Predictive target asks "what will happen?"* — if the answer requires running an experiment or observation, it is a prediction.
- *Bridge target asks "is X like Y?"* — if the answer requires checking a structure-preserving mapping, it is a bridge.
- *Methodological target asks "what should I do?"* — if the answer is a procedure with steps, it is a methodology.

A single artifact often contains multiple target types. A research paper might propose a specification (the architecture), define new terms (definitions), make predictions about how it will behave (predictions), assert correspondences with adjacent frameworks (bridges), and recommend a procedure for using it (methodology). Each component is audited as its own type, with its own tier-survival requirements. Treating the whole paper as one target — and running one audit on all of it — is mis-typing at scale.

## What survives the typing

When you classify carefully and audit each component as its own type, several things become honest that were previously confused:

The component that is plausibility-passed as a *specification* may stand as candidate-novel-construction even though the *predictions* it makes about its own behavior are still untested. Both can be true at once; the warrant table licenses both honestly.

The component that is plausibility-passed as a *bridge* must not be cited as if it had been operationally validated. The bridge stands as bridge; the operational-match work is queued; subsequent forward-citations should specify which tier the bridge currently sits at.

The component that is plausibility-passed as a *methodology* says nothing about whether the methodology works. To know whether it works, you have to run it and audit the outputs.

The component that is plausibility-passed as a *definition* is *semantically plausible, truth untested*. Truth-tier audit (consultation with the authoritative definer) is the only thing that promotes definitions.

The component that is plausibility-tier-anything as a *prediction* is irrelevant. Predictions are made true or false by reality, not by literature.

This is not a limitation of the calculus; it is the calculus's strength. It tells you precisely what you can and cannot claim given the audits you have run. If you want stronger claims, run the higher-tier audits the type requires.

## Where this series goes next

The next essay walks an actual audit end-to-end on a single case: the classification, the literature search at the plausibility tier, the case-study work at the operational-match tier, the conclusions drawn at each step, what the audit licensed and what it did not. The example will be one the reader can follow without prior corpus background.

The essays after that will engage the rare-but-important case where the calculus says "yes, novel" all the way through; the trap of plausibility-only promotion; and the corpus's own [Doc 491](https://jaredfoy.com/resolve/doc/491-pulverizing-novelty-calculus-self-applied) where the calculus was applied recursively to itself.

The series is for the reader who wants the tool and is willing to pay the cost of using it well.

---

*Originating prompt for this essay: "Yes, write post 2" — keeper, Telegram message 5903, 2026-05-02T14:24:59Z. The instruction directed the next post in the "What Counts as New" series. The structure of post 2 follows the §"Where this series goes next" specification at the end of post 1: a walk of the five target types ($T_S$, $T_D$, $T_P$, $T_B$, $T_M$) with what each is, what audit it requires, and what the surviving tier licenses you to claim.*
