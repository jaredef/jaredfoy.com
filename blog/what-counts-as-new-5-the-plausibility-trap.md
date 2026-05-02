<!-- htx:series id="what-counts-as-new" position="5" -->
# What Counts as New: The Plausibility-Only Trap

The previous two essays walked cases at opposite ends of the calculus's verdict spectrum: the scaling hypothesis (mostly recovered, with case-applied contribution and honest scope) and Shor's 1994 algorithm (genuinely novel at the construction layer, with all three tier-survivals). This essay walks a case in between — a high-profile claim that was promoted, broadly accepted, and forward-cited as if it had been operationally validated, when in fact only plausibility-tier evidence existed for it. Subsequent operational-match audit, when finally performed, substantially deflated what the original claim could honestly license.

The case is *emergent abilities of large language models*. The contrast with the previous essays is intentional: this is what the calculus's most common failure mode looks like at the field level, and also what eventual correction through operational-match audit looks like when the field finally performs it. The case is illustrative rather than damning — both the original work and the subsequent audit were conducted honestly; what the case demonstrates is the cost of treating empirical-looking evidence at one tier as if it had been verified at a higher tier.

## The candidate claim, stated precisely

Stated precisely, the emergent-abilities claim from Wei et al. 2022 (*Emergent Abilities of Large Language Models*, Transactions on Machine Learning Research; widely cited NeurIPS workshop and subsequent journal version):

*Across a range of benchmark tasks, large language models exhibit a qualitative phase transition in capability at certain scales — performance is near-random for models below a critical scale and rises sharply above it, with the implication that these capabilities cannot be predicted from extrapolation of smaller-scale performance and are emergent properties of scale.*

The claim has two distinguishable components:

- **(a) The empirical observation.** *On the specific benchmarks measured, the performance curves exhibit flat-then-rising shapes at certain scales.*
- **(b) The interpretation.** *The flat-then-rising shapes constitute qualitative phase transitions in capability that cannot be predicted from smaller-scale performance and are therefore emergent in a structurally significant sense.*

The two components require different audits. The empirical observation is a *predictive* claim about what specific measurements will show under specific conditions. The interpretation is a *specification* claim that proposes a property class ("emergence" with specific structural commitments) and a *bridge* claim that asserts the empirical observation instantiates the property class.

## Step 1 — Classification

- **(a) Empirical observation.** Predictive target ($T_P$): the curves either show the shape claimed under the measurement conditions or they don't. Plausibility is irrelevant; truth-tier verification is what licenses the claim.
- **(b) Interpretation as emergence.** Composite of specification ($T_S$, the property class "emergence") and bridge ($T_B$, the assertion that the empirical observation is an instance of the property class). For the bridge specifically, plausibility-tier audit can verify the vocabulary; operational-match audit is required for the bridge to license forward-citations as if the bridge held.

## Step 2 — What the field actually did

The Wei et al. paper presented charts showing flat-then-rising curves on certain benchmarks. The empirical observation was correct under the measurement conditions used. The paper's interpretation — that these curves represented qualitative phase transitions in capability — was offered as a substantive scientific claim and was widely cited as such across the subsequent eighteen months of LLM research. References to the paper in downstream work treated the bridge ((b)-component) as if it had been operationally validated: subsequent papers built theoretical frameworks for "emergence," speculated about safety implications, made predictions about future capability jumps, and structured research agendas around the assumption that the bridge held.

What the calculus's discipline says about this trajectory: the empirical observation (a) was at plausibility-of-measurement (the charts were what they were) but had not been audited at the operational-match level (do the same curves obtain under different but operationally-justified measurement choices?). The interpretation (b) was plausibility-passed (the vocabulary of "emergence" connects to the established phase-transition literature in physics and complexity science) but had not been operationally validated as a bridge (does the empirical observation actually instantiate the structural commitments of the emergence property class, when the bridge is tested against alternatives?).

The field, broadly, did not run the operational-match audit before the bridge was forward-cited. The paper's empirical-looking charts were treated as load-bearing for the interpretation; the interpretation was treated as load-bearing for downstream theoretical and policy claims. This is the plausibility-only-promotion trap exactly: a tier of evidence (the empirical observation under the specific metric choices) was treated as licensing claims at higher tiers (the structural-emergence interpretation, the predictive implications) that the lower-tier evidence did not in fact license.

## Step 3 — The eventual operational-match audit

In 2023, Schaeffer, Miranda, and Koyejo published *Are Emergent Abilities of Large Language Models a Mirage?* (NeurIPS 2023; received an Outstanding Paper Award). The Schaeffer et al. paper is the operational-match audit the field had not previously performed: it tested the empirical observation under different metric choices and found that the apparent flat-then-rising shapes were artifacts of metric selection, not properties of the underlying capability.

The Schaeffer et al. argument, compressed:

The Wei et al. charts used *discontinuous* performance metrics (exact-match accuracy on multi-step problems; the model either gets the full answer right or scores zero). Under such metrics, smooth gradual improvement at the model-token-prediction level translates to a flat-then-rising shape at the metric level — partial answers all score zero (flat region) until the model is good enough to occasionally produce fully-correct answers (rising region). The shape is determined by the *metric*, not by a phase transition in the underlying capability.

Schaeffer et al. demonstrated this empirically: when the same evaluations were re-run with *continuous* metrics (cross-entropy loss; partial-credit scoring; token-level accuracy), the flat-then-rising shapes disappeared and were replaced by smoothly-rising curves consistent with continuous improvement at the underlying-capability level. The "emergence" was an artifact of plotting choice.

The Schaeffer et al. finding does not say Wei et al. were dishonest. It says: the empirical observation Wei et al. reported was correct under their measurement choices, but the interpretation depends critically on those measurement choices, and operationally-justified alternative choices yield substantially different visualizations and interpretations.

## Step 4 — Per-component honest verdicts after the audit

Compositing the per-component verdicts after the Schaeffer et al. operational-match audit:

- **(a) Empirical observation.** Truth-verified under the specific metric choices used; *not* truth-verified as a metric-independent observation about underlying capability. The honest scope is metric-specific.

- **(b) Interpretation as emergence.** The bridge (empirical observation → emergence property class) is *operationally weakened* by the metric-dependence finding. The bridge held under one operational specification and failed under operationally-justified alternative specifications. Per the calculus's warrant table for bridges at operational-match tier, the bridge is in the "weak match" region — some operational behaviors align (the original metric choice does produce the observation), others diverge (continuous metrics do not). The bridge cannot license forward-citations as if it were operationally robust.

The aggregate honest claim, after the operational-match audit: *Under specific metric choices that are common but not unique, large language models exhibit performance curves with flat-then-rising shapes on certain benchmarks. The shapes are sensitive to metric choice; under continuous metrics, the shapes flatten to smooth scaling. The interpretation of the original shapes as emergent phase transitions in capability is metric-dependent; the structurally-strong reading of "emergence" is not licensed by the metric-dependent empirical observation alone.*

That sentence is the calculus's verdict after both the original and the audit work. It is substantially weaker than the original claim's downstream forward-citations would suggest.

## Step 5 — What this case shows about the plausibility-only trap

Several observations the calculus makes visible:

*Empirical-looking charts are tier-ambiguous evidence.* A chart in a paper looks like truth-tier evidence — it presents measurements; the measurements are what they are. But the chart's interpretation depends on choices (metric selection, axis scaling, benchmark selection, model selection) that themselves require operational-match audit to validate. A chart that has not been audited for metric-independence is plausibility-tier evidence for the underlying interpretation, not truth-tier evidence. Treating it as truth-tier is the trap.

*Forward-citation accelerates the trap.* Once a claim is in the literature and being forward-cited, the field's working assumption tends to be "this has been validated already." Subsequent papers cite the original claim and build on it; the building-on becomes its own evidence (the field acts as if the claim is true; therefore the claim is treated as if it were true). This is structurally similar to the *implicit promotion via citation* failure mode named in [Doc 445 §"Implications for the hypothesis ledger"](https://jaredfoy.com/resolve/doc/445-pulverization-formalism). The field had not run the operational-match audit; the citation patterns were licensed only by plausibility-tier evidence; but the citation patterns were treated as if they validated the claim.

*Vocabulary that already exists in adjacent literature is plausibility-passed but not bridge-validated.* "Emergence" has a precise structural meaning in the phase-transition literature in physics and complexity science. The Wei et al. interpretation borrowed the vocabulary, which made the interpretation plausibility-passed (the vocabulary connects). But the bridge from the LLM-benchmark-curve observation to the phase-transition structural commitments was not operationally validated; the borrowed vocabulary was load-bearing in a way the underlying evidence did not yet support.

*The audit, when finally performed, was straightforward.* Schaeffer et al. did not require new measurement equipment, new mathematical breakthroughs, or new benchmarks. They re-ran the existing evaluations with different metric choices that were operationally justified. The cost was not the mechanics of the audit; the cost was the cognitive effort to question whether the original metric choices were operationally robust, against a field-wide assumption that the chart-shapes were what they appeared to be.

*The honest verdict is more useful than either the strong original claim or a dismissal.* The claim "emergent abilities don't exist" would be as wrong as the original claim that "emergent abilities are robust phase transitions." The honest verdict is that the empirical curves under specific metric choices are real, the interpretation as structural emergence depends on those metric choices, and forward-citations should specify which reading is being invoked.

## Step 6 — The structural lesson generalizes

This case is one instance of a pattern that recurs across research communities. A claim is published with empirical-looking evidence at one tier. The vocabulary in which the claim is interpreted is plausibility-passed (it connects to existing literature). The interpretation is forward-cited as if it had been operationally validated. The actual operational-match audit is delayed, sometimes by years. When the audit is finally performed, the claim's licensed scope is substantially narrower than the forward-citation patterns assumed.

The calculus's discipline, applied consistently, would prevent the trap from operating: each citation of the original claim would specify what tier of evidence the citation rests on, and forward-citations would not promote the claim beyond what the lower-tier evidence licenses. In practice, this discipline is rare in active research communities because the speed of the citation cycle exceeds the speed of operational-match audit, and because the warrant-tier vocabulary is not standard equipment in most research training.

A practical consequence for the careful reader: when reading a high-profile claim, ask *what tier of evidence is the claim resting on, and has the operational-match audit been performed?* If the answer is plausibility-tier evidence with the operational-match audit pending, the claim should be cited only with explicit qualification. The Wei et al. → Schaeffer et al. trajectory is one instance; the careful reader will find many more on examination.

## What this means for the series

The four cases walked across Posts 3, 4, and 5 cover the three major verdict regions of the calculus:

- *Post 3 (scaling hypothesis):* operationally-validated recovery with case-applied contribution. The most common verdict for substantive claims.
- *Post 4 (Shor 1994):* genuine three-tier-survival novelty. The rare-but-important verdict when it occurs.
- *Post 5 (emergent abilities):* plausibility-only-promotion forward-cited as if operationally validated, with subsequent operational-match audit substantially deflating the licensed scope. The failure-mode verdict.

The three together exhaust the major shapes of how the calculus's discriminative output looks in practice. A reader who has internalized the three patterns can apply the calculus to most claims they encounter and produce honest verdicts.

The next and final essay in this series walks the corpus's recursive application of the calculus to itself — [Doc 491](https://jaredfoy.com/resolve/doc/491-pulverizing-novelty-calculus-self-applied) — where the calculus was used to audit its own apparatus. The recursive case is an internal-coherence check that any methodology proposing to audit other claims should be willing to undergo, and what was learned from running it.

---

*Originating prompt for this essay: "Continue to post 5" — keeper, Telegram message 5910, 2026-05-02T15:30:32Z. The instruction directed Post 5 in the "What Counts as New" series. Per the §"Where this series goes next" specification at the end of Post 4, Post 5 walks a case where the calculus identifies a major plausibility-only-promotion failure mode currently operative in the broader research community. The case selected — the Wei et al. 2022 emergent-abilities claim and the Schaeffer et al. 2023 operational-match audit — was chosen because (a) it is high-profile and well-documented in the public literature, (b) it cleanly demonstrates the plausibility-only-promotion trap and the eventual operational-match correction, and (c) it can be discussed without becoming a personal attack on either Wei et al. (who did honest work) or Schaeffer et al. (who did honest follow-up); the case shows the calculus's pattern at the field level rather than indicting individual researchers.*
