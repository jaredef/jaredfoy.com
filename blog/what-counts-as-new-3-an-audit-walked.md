<!-- htx:series id="what-counts-as-new" position="3" -->
# What Counts as New: An Audit Walked End-to-End

The first two essays in this series introduced the calculus's three-tier structure (plausibility, operational match, truth) and the five target types (specification, definition, prediction, bridge, methodology). This essay does what the introduction is for: walks an actual audit, on an actual claim, end to end, with the classification, the literature search, the operational-match consideration, and the honest licensing made visible at every step.

The case is a real claim that has been widely discussed and that most readers will at least recognize: *the scaling hypothesis.* In its compact form: *capability in machine learning systems emerges primarily from scaling compute, data, and model size, more than from algorithmic novelty or hand-engineered domain knowledge.* The claim has been made by researchers across academia and industry; it has shaped many billions of dollars of capital allocation; it has produced specific empirical predictions that have been tested and revised. It is also a composite — it makes specifications, definitions, predictions, bridges, and methodological recommendations all at once. It is a good case to work because the calculus can take it apart cleanly and produce an honest verdict on each component.

A note on framing before the audit begins: the goal here is not to argue for or against the scaling hypothesis. The goal is to show what running the calculus on the claim actually looks like. The reader should be able to watch each step and form an independent judgment about whether the audit was conducted honestly.

## Step 1 — State the candidate claim precisely

The audit cannot run on a vague claim. The first move is always to state the claim in language precise enough to classify and to test.

The scaling hypothesis, stated precisely: *given a neural network architecture of sufficient generality (transformers, broadly), capability on tasks the model has not been explicitly trained for emerges as a smooth function of the scale of compute, data, and parameters used in training, with the functional form of the scaling being a power law in each variable, and the practical consequence being that engineering effort directed at scaling produces more capability gain than engineering effort directed at architectural innovation or domain-specific knowledge encoding.*

That is one sentence, and it does several things at once. It claims (a) a structural fact about transformer architectures, (b) a functional form for the relationship between scale and capability, (c) a practical recommendation about where to direct engineering effort, and (d) an implicit comparison to alternative approaches (knowledge encoding, architectural innovation). Each does different work; each will be classified separately.

## Step 2 — Classify each component

Per the second essay's discipline, before auditing anything, identify what kind of target each component is.

- **(a) The structural-fact component.** *Transformers of sufficient generality enable emergence of capability with scale.* This is a *specification* target ($T_S$): it asserts that a particular architectural class has a particular structural property (sufficient generality to support emergence). The audit asks: has this structural-property claim been articulated before?

- **(b) The functional-form component.** *Capability is a power law in compute, data, and parameters.* This is a *predictive* target ($T_P$): it makes a quantitative empirical claim that obtains or does not under measurement. The audit asks: do measurements bear it out?

- **(c) The practical-recommendation component.** *Direct engineering effort at scaling rather than at architectural innovation or knowledge encoding.* This is a *methodological* target ($T_M$): it recommends a procedure for allocating engineering effort. The audit asks: does the procedure produce outputs (capable systems) better than the alternatives?

- **(d) The implicit-comparison component.** *Scaling beats knowledge encoding and architectural innovation.* This is a *bridge* target ($T_B$): it asserts a comparative correspondence between two methodological frameworks (scaling-first vs knowledge-first). The audit asks: does the comparison hold across cases?

Four target types, four different audits, four different licensed conclusions. A reader who treats the scaling hypothesis as one undifferentiated claim and runs one audit will mis-type and either overclaim or underclaim. The classification step prevents this.

## Step 3 — Plausibility audit, per component

Plausibility-tier audit is a literature search for prior articulation. For each component:

**(a) Structural-fact component plausibility audit.** Has the claim that neural networks of sufficient generality enable emergence with scale been articulated before? Yes, substantially. The claim's structural shape traces to the connectionist tradition of the 1980s (Rumelhart, McClelland, Hinton) and was articulated in modern form across multiple papers in the 2010s before the transformer-specific version: Hestness et al. (2017) "Deep Learning Scaling is Predictable, Empirically" documented power-law scaling across speech recognition, machine translation, and language modeling for non-transformer architectures; Hinton, LeCun, and Bengio's Nature paper (2015) named scaling-with-compute as a central thesis of deep learning; Rich Sutton's "The Bitter Lesson" essay (2019) articulated the structural claim that general methods leveraging computation outperform methods encoding human knowledge. The transformer-specific version (Kaplan et al. 2020) is the most precise instance, but the structural claim itself is *partially subsumed* under decades of prior connectionist-and-deep-learning literature.

Verdict: *partially subsumed.* The novelty at the specification layer is the transformer-specific instantiation, not the underlying structural claim about scaling-and-emergence.

**(b) Functional-form component plausibility audit.** Has the power-law scaling claim been articulated before? Yes — Hestness et al. (2017) explicitly. Kaplan et al. (2020) refined it for transformer language models with specific exponents. The claim's shape (power-law) is *fully subsumed* under prior empirical work. The specific exponents Kaplan et al. measured were novel, but their form was not.

Verdict: *fully subsumed at the form level; novel only in the specific measurements.*

But note — for predictive components, plausibility-tier outcome is *not licensing-relevant*. Even fully-subsumed predictive claims must be tested at truth-tier. The verdict here is about the form of the claim, not about whether the claim is true.

**(c) Methodological-recommendation plausibility audit.** Has the recommendation to prefer scaling-effort over architectural-innovation-effort been articulated before? Sutton's "Bitter Lesson" (2019) is the canonical articulation; before Sutton, the same recommendation was implicit in the deep-learning community's empirical practice from roughly 2012 onward (AlexNet → VGG → ResNet → Transformer trajectory). The recommendation itself, as a methodology, is *fully subsumed* under prior practice and prior articulations.

Verdict: *fully subsumed.* The methodology is not novel.

**(d) Implicit-comparison bridge plausibility audit.** Has the comparison "scaling beats knowledge encoding" been asserted before? Yes — extensively, dating to the AI-winter critiques of expert systems (1980s–1990s) and the connectionist-symbolist debates. The bridge's vocabulary is *fully subsumed* under prior literature. Whether the bridge's *operational claim* (the comparison actually holds across cases) is true is a separate question requiring operational-match-tier audit.

Verdict on plausibility: *fully subsumed.* The bridge uses vocabulary that has been deployed for decades.

## Step 4 — What plausibility-tier licenses, per component

Per the calculus's warrant table:

- **(a) $T_S$ partially subsumed.** Licenses: *novel only in the un-subsumed elements*. The un-subsumed element is the transformer-specific instantiation (the architectural specifics of the transformer plus the specific scaling behavior measured for it). This stands as candidate-novel pending operational and truth-tier audit.

- **(b) $T_P$ outcome at plausibility tier is irrelevant.** Plausibility-tier survival or failure does not license any predictive claim. Move to truth tier.

- **(c) $T_M$ fully subsumed.** Licenses: *methodology exists; tells nothing about fitness*. No promotion at the plausibility tier.

- **(d) $T_B$ fully subsumed.** Licenses: *bridge uses existing vocabulary; structural soundness untested*. No promotion at the plausibility tier; the operational soundness of the comparison must be audited separately.

Already at this step, if we stopped here, what could be claimed honestly? Only that the transformer-specific scaling instantiation is a candidate-novel specification (component a). Components b, c, and d cannot be promoted to anything by plausibility-tier work; they require higher tiers.

The bias many readers will already feel: *but the scaling hypothesis is true, isn't it?* That feeling is responding to evidence at higher tiers (operational match, truth) that has already been observed. The calculus's discipline is to not import that evidence into the plausibility-tier verdict; the plausibility tier reports only what plausibility audit shows. Truth-tier evidence is reported separately at truth tier.

## Step 5 — Operational-match audit, where applicable

Plausibility tier left components a, b, c, d at varying licensed positions. Operational match applies to specifications, bridges, and methodologies; predictive components proceed to truth.

**(a) Specification operational match.** Does the transformer-specific scaling specification behave like prior scaling specifications across cases? The trajectory is well-documented: GPT-2 (1.5B params) → GPT-3 (175B) → GPT-4 (estimated trillions) shows the scaling behavior the specification predicts, with measured exponents in close range to Hestness et al.'s pre-transformer measurements but slightly different from Kaplan et al.'s initial transformer measurements (Hoffmann et al. 2022 "Chinchilla" revised the exponents and the data-vs-parameter tradeoff). The operational behavior of the transformer-specific scaling specification is broadly the same as the prior-art scaling specifications, with the specific transformer parameters being the only operational differentiator.

Verdict: *strong operational match with prior-art scaling literature.* The transformer-specific specification is operationally an instance of the broader scaling-emergence specification class.

**(c) Methodology operational match.** Does the scaling-first engineering methodology produce outputs (capable systems) better than the alternatives, across audited cases? The empirical record from 2012 to the present supports a strong-but-not-universal yes: large-scale general-purpose neural networks have outperformed task-specific knowledge-encoded systems across many domains (vision, language, code, multimodal); the exceptions are domains where strong domain priors are available and where data is limited (theorem proving with hand-engineered tactics, traditional symbolic mathematics in some settings, certain robotics control problems with strong physics priors).

Verdict: *strong operational match for methodology with documented exception cases.* Methodology produces $P$-grade outputs in most audited cases; exception cases are flagged.

**(d) Bridge operational match.** Does the "scaling beats knowledge encoding" comparison hold across cases? Same answer as (c) but stated as a comparison rather than a methodology: yes broadly, with the same exception cases. The bridge holds in the cases where the methodology produces $P$-grade outputs and fails in the exception cases.

Verdict: *strong operational match for the bridge across most audited cases; bridge fails in named exception classes.*

## Step 6 — Truth-tier audit for the predictive component

Component (b) — the power-law functional form claim — is the only component where plausibility was irrelevant and operational-match does not directly apply. It needs truth-tier audit: does the prediction obtain when measured?

The empirical record here is detailed. Hestness et al. (2017) measured power-law scaling for non-transformer architectures with specific exponents. Kaplan et al. (2020) measured power-law scaling for transformer language models with different exponents. Hoffmann et al. (2022, "Chinchilla") revised the Kaplan et al. exponents based on more careful experiments and identified the data-vs-parameter optimal tradeoff that the original Kaplan paper had mis-estimated. Subsequent work (multiple papers in 2023–2025) has refined the exponents further and documented modality-specific variations.

Verdict on truth: *the power-law form is empirically corroborated; the specific exponents have been revised multiple times; the form's predictive power for novel scales remains an active research question.* The predictive claim survives truth-tier audit at the *form-level* but the *quantitative-prediction-level* survives only with explicit acknowledgment that the exponents have been revised and may be revised again. The strong reading of the predictive claim ("we know exactly how capability scales") fails truth-tier audit; the weak reading ("capability scales with some power-law form") survives.

## Step 7 — Honest conclusions, per component

Putting the per-component verdicts together, what does the audit license?

- **(a) Specification.** Plausibility partial; operational match strong. The transformer-specific scaling specification is an operationally-validated instance of the broader scaling-emergence specification class; it is not a categorically-novel specification but is the specific specification that has shaped current practice.

- **(b) Prediction.** Form-level truth-tier survival with explicit revision history. Quantitative claims at any specific moment in time should be cited with their measurement vintage; revisions should be expected.

- **(c) Methodology.** Plausibility fully subsumed; operational match strong with documented exceptions. The methodology is operationally validated as the right default for most domains, with named exception classes where alternative methodologies still win.

- **(d) Bridge.** Plausibility fully subsumed; operational match strong with same exception cases. The comparison holds in the cases where the methodology holds; the bridge does not extend to the exception classes.

The honest aggregate verdict on "the scaling hypothesis": it is *operationally-validated recovery of a scaling-emergence specification class that predates transformers*, with *the specific transformer-instantiation* as the case-applied contribution, *the power-law form* corroborated at truth-tier with quantitative-revision history, and *the methodological recommendation* operationally validated with documented exception classes. It is neither a categorically novel discovery nor a meaningless re-articulation of prior literature; it is recovery into operationally-validated practice for a class of cases, with honest scope.

This verdict could be paraphrased shorter: *the scaling hypothesis is mostly right, mostly not novel, with revisions to the specific predictions that should be expected to continue, and exception cases that should be named when the methodology is recommended.* That sentence is the calculus's output, compressed. Anyone making business decisions on the basis of the scaling hypothesis benefits from having that shorter sentence rather than the unaudited "we are betting on scaling because it works."

## Step 8 — What this audit shows

Several things become visible only by walking the audit end-to-end rather than by gesturing at the calculus from a distance.

*The classification step is more than half the work.* By the time you have correctly classified the four components, the audits themselves are largely mechanical — each component has its tier, the prior literature for that tier exists, and the verdict follows. The hard part is being precise about what each component is asserting.

*Plausibility-tier audits are cheap and fast for well-trodden claims.* The scaling hypothesis has been discussed extensively, so the prior literature was easy to find. For less-discussed claims, the plausibility audit can take much longer, but the structure is the same.

*Operational-match audits are where most of the load-bearing evidence lives.* The empirical record from 2012 onward is what makes the methodology and the bridge promotable; without it, both would sit at "fully subsumed under prior literature" forever.

*Truth-tier audits for predictive components reveal the limits of strong claims.* The power-law form survives; the specific exponents have been revised. This is honest. The temptation to cite a particular vintage's exponents as "the scaling laws" without the revision history is the kind of overclaim the truth-tier audit prevents.

*The aggregate verdict is more honest and more useful than the unaudited claim.* "The scaling hypothesis works" is not actionable; "the scaling hypothesis is operationally-validated for these case classes, fails for these exception classes, has truth-tier-corroborated form with vintage-specific quantitative claims, and is methodologically subsumed under decades of prior practice" is actionable. The audit produces the second sentence from the first.

## What about cases where the audit yields a different verdict?

The scaling hypothesis is a case where the calculus largely confirms the claim with honest qualification. Other cases yield different verdicts. The next essay in this series walks a case where the calculus genuinely confirms novelty all the way through — the rare-but-important case where a candidate survives all three tiers and the warrant table licenses the strong claim. The essay after that walks a case where the calculus identifies a major plausibility-only-promotion failure mode currently operative in the broader research community.

The series's working observation: most claims fall somewhere along the scaling-hypothesis pattern (operationally-validated recovery of prior work with case-applied contribution, with honest scope). A smaller number are genuine truth-tier novelty. A larger number than people would like to admit are plausibility-only-promotions presented as if they had been operationally or truth-validated. The calculus discriminates among the three. Running it is what produces honest claims.

---

*Originating prompt for this essay: "Continue next post" — keeper, Telegram message 5905, 2026-05-02T15:17:18Z. The instruction directed Post 3 in the "What Counts as New" series. Per the §"Where this series goes next" specification at the end of Post 2, Post 3 walks an actual audit end-to-end on a single case from scratch, with the case chosen to be one a general reader can follow without prior corpus background. The scaling hypothesis was selected because (a) it is widely-known, (b) its audit-trail is well-documented in the public literature, and (c) it produces a non-trivial honest verdict that demonstrates the calculus's discriminative value rather than a degenerate all-novel or all-subsumed case.*
