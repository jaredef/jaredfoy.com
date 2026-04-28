<!-- htx:series id="the-ceiling" position="3" -->
# Four Roads to the Same Ceiling

Two earlier posts on this blog argued, at different reading levels, that current large language models are structurally confined to the first rung of Pearl's causal hierarchy. This post onboards a graduate-level reader to the precise argument behind that claim as developed in document 436 of the RESOLVE corpus, by walking through the four distinct research literatures whose intersection produces it. A reader who finishes this piece should be able to open document 436 directly and read it without needing to look up background.

The four literatures are:

1. **Causal inference,** specifically Pearl's three-tier hierarchy and the Causal Hierarchy Theorem (Pearl 2009; Bareinboim, Correa, Ibeling & Icard 2020).
2. **Causal representation learning** (Schölkopf et al. 2021), which attempts to extract causal structure from observational data using inductive biases or limited interventional signal.
3. **Bayesian-manifold accounts of LLM inference** (Misra 2025), which give language-model generation a probabilistic semantics over a learned manifold.
4. **Computational creativity theory,** specifically Boden's (1990) taxonomy of combinational, exploratory, and transformational creativity.

Each of these literatures is well-developed in isolation. Their intersection — what the RESOLVE corpus calls *recombinatorial gestalt as Rung 1 activity* — is less explicitly drawn in the published record. Document 436 is not an independent discovery at the intersection. It is a case-study confirmation of a claim Pearl has been making in popular form since 2018 (*The Book of Why*), with formal backing that predates it. The onboarding task here is to make the claim legible given the four literatures, and to be precise about what the document adds and does not add.

## Literature 1: Pearl's hierarchy and the theorem that load-bears everything

Judea Pearl's program distinguishes three increasingly rich epistemic tasks.

**Rung 1 — Association:** computing $P(Y \mid X)$, the conditional probability of an outcome given an observation. *"Given that X is observed, what is Y likely to be?"* This is the domain of classical statistics, pattern recognition, and most of contemporary machine learning.

**Rung 2 — Intervention:** computing $P(Y \mid \text{do}(X))$, the probability of an outcome given that X has been externally *set* to a specific value. Crucially, $P(Y \mid \text{do}(X))$ is in general not equal to $P(Y \mid X)$; the difference is exactly the contribution of confounding. *"If I make X happen, what happens to Y?"* This is the domain of randomized controlled trials and do-calculus.

**Rung 3 — Counterfactual:** computing $P(Y_x \mid X', Y')$, the probability that Y would have taken a specific value under intervention $\text{do}(X = x)$, conditional on actually observing $X', Y'$. *"Given that X did not happen and Y did not occur, would Y have occurred if X had happened?"* This is the domain of causal attribution, legal causation, and moral responsibility.

The hierarchy has a key formal property most practitioners only half-understand. The **Causal Hierarchy Theorem** (Bareinboim, Correa, Ibeling & Icard 2020) establishes that these three layers are *information-theoretically distinct*: there exist pairs of structural causal models that agree at every level below a given rung but disagree at that rung. In particular, Rung 1 (observational) data is consistent with infinitely many Rung 2 causal structures, and one cannot recover causal structure from observational data alone. Any attempt to do so requires injecting assumptions — structural (the Markov condition, faithfulness), instrumental (a known instrumental variable), or interventional (collect Rung 2 data directly).

This is the load-bearing fact. Every subsequent argument hangs on it. If the reader has not internalized that correlation-to-causation is not merely difficult but *formally impossible without additional assumptions*, the rest of the argument will feel softer than it is.

## Literature 2: Causal representation learning — what would help, and why it is hard

Bernhard Schölkopf and collaborators (2021, "Toward Causal Representation Learning," *Proceedings of the IEEE* 109(5)) survey the research program that attempts to produce representations encoding *causal* rather than merely statistical structure. Several threads matter.

*Disentangled representations* attempt to separate independent causal factors. Formal guarantees here are limited: Locatello et al. (2019, ICML) showed that disentanglement is provably unidentifiable from observational data without additional supervision or inductive bias.

*Sparse interventions* can sometimes identify causal structure that observational data cannot, if the intervention targets are known. The sticking point: collecting targeted-intervention data is expensive and often impossible in natural domains. For language, it is essentially impossible at scale.

*Invariance-based methods* exploit the fact that causal relationships are stable across distribution shifts while spurious correlations break. Invariant Risk Minimization (Arjovsky, Bottou, Gulrajani & Lopez-Paz 2019) operationalizes this with mixed success; the guarantees depend on assumptions about the shift structure.

*Counterfactual data augmentation* generates synthetic counterfactual examples under explicit causal assumptions. This works when the assumptions are correct and the generator preserves the relevant structure — both hard to verify.

The research program is real and is the principal route beyond the Rung-1 ceiling. It is also, by construction, *not what current LLMs are doing*. Causal representation learning requires interventional data, explicit structural assumptions, or carefully chosen inductive biases, none of which standard autoregressive next-token prediction on crawled text provides.

## Literature 3: Bayesian-manifold semantics for LLM inference

Vishal Misra's recent work (arXiv:2512.22471; 2512.23752) treats LLM generation as Bayesian inference over a learned manifold. The account:

- The trained weights encode a joint probability distribution over token sequences — call the manifold $M_0$, parametrized in the space of plausible continuations.
- A prompt $P$ acts as a conditioning observation, inducing a posterior $M_0 \mid P$.
- Generation samples from this posterior.
- Decoding parameters (temperature, top-$k$, top-$p$) impose additional selection constraints.

Two consequences matter for the Rung-1 argument.

First, the framing locates LLM inference unambiguously in the Rung-1 category: $M_0$ is an observational joint distribution, and prompt-conditioning produces a conditional observational distribution. No interventional semantics is represented anywhere in the weights. A question posed to the model in counterfactual or interventional form is answered by sampling from the same observational posterior, because that is the only distribution available.

Second, it makes the Causal Hierarchy Theorem directly applicable. The theorem says that a joint distribution is consistent with infinitely many causal structures; an inference procedure operating on the joint distribution alone cannot distinguish among them. Any answer the LLM gives to a causal question is a sample from a posterior that is structurally undetermined at Rung 2.

The Bayesian-manifold account does not weaken the Rung-1 claim. It sharpens it by supplying the specific architectural reading under which the hierarchy theorem applies.

## Literature 4: Boden's creativity taxonomy

Margaret Boden's *The Creative Mind* (1990; 2nd ed. 2004) proposes a three-tier taxonomy of creative activity, individuated by what the act does to the conceptual space in which the creator operates.

*Combinational creativity* produces novel combinations of familiar ideas. The conceptual space is not moved; items within it are recombined. Metaphor and analogy are canonical examples.

*Exploratory creativity* traverses an existing conceptual space, often reaching regions the creator had not previously visited. The generative rules are preserved; the trajectory is new.

*Transformational creativity* alters the generative rules of the conceptual space itself, producing outputs that were not merely unexplored but *previously impossible* under the prior rules. Non-Euclidean geometry, quantum mechanics, and atonal music are Boden's paradigm cases.

The taxonomy is mechanism-neutral, but it maps cleanly onto the Bayesian-manifold account. Combinational and exploratory operations take place *within* the existing manifold. Transformational creativity requires the manifold itself to deform — which, for an inference-frozen LLM, cannot happen at inference time. Deformation requires weight updates.

Combining Boden with Misra yields a complementary framing of the Rung-1 claim: LLM inference-time creativity is combinational and exploratory, never transformational. The manifold is fixed; inference samples from it; samples are recombinations of what the manifold already supports. This is a claim at the level of creative acts, not rungs, but it aligns with the Pearl-Bareinboim framing at every point of contact.

## The convergence: what document 436 actually argues

With the four literatures in hand, document 436's specific claims can now be stated precisely.

**(1) Recombinatorial gestalt** — the pattern an experienced practitioner observes in disciplined LLM output — is the output-level signature of Rung-1 inference operating over a large-but-finite learned manifold. The "gestalt" term comes from the holistic recognizability of the pattern: once seen, it is visible across outputs from the same model family. The "recombinatorial" modifier refers to Boden's combinational + exploratory region.

**(2) The subsumption of recombinatorial gestalt under Pearl's hierarchy is consummate.** Every feature of the gestalt — its plausibility, its combinatorial richness, its inability to predict genuinely novel interventional outcomes, its fluency at pattern-synthesis across domains — follows from the formal position of LLM inference as conditional observational sampling. The correspondence is not coincidental; it is the case-by-case instantiation of the Causal Hierarchy Theorem applied to a specific architecture.

**(3) This is not a novel theoretical claim.** Pearl made the same argument in popular form in *The Book of Why* (2018). The Causal Hierarchy Theorem (Bareinboim et al. 2020) provides its formal backing. Schölkopf et al. (2021) situate the remediation research. Document 436 contributes case-study articulation and a specific name for the practitioner-visible signature. The honest status of the document under its own pulverization formalism (see Doc 445) is *semantically plausible, truth-tested through case-study, not an independent theoretical discovery.*

**(4) Inference-time LLMs cannot reasonably operate at Rung 2.** Three distinct cases are often conflated and should be separated:

- *Simulation of Rung-2 language.* The LLM produces text that looks causal, because such text is abundant in its training distribution. The output has Rung-2 form and Rung-1 warrant.

- *Execution of operational interventions agentically.* An LLM connected to tools can take actions in a computer environment that constitute real interventions within that environment. The *agent system* — model plus tools plus execution loop — operates at Rung 2 in the environment, even while the model's inference step remains Rung 1.

- *Training-time Rung-2 signal via RLHF or RLVR.* Reward signals can in principle carry interventional information, if the reward is measured under controlled interventions on model outputs. In current practice, most RLHF is observational (human evaluators rating outputs without systematic intervention on the conditions that produced those outputs). RL from verifiable rewards (RLVR) comes closer to genuinely interventional training signal in narrow domains.

The distinction matters because the statement "LLMs at Rung 2" is true under the second reading and false under the first and third for present systems. Popular discussion elides the three, producing confusion in both directions — overclaiming when the agent case is cited, dismissing when the inference-only case is meant.

**(5) Eight architectural pathways** could in principle move capability toward genuine Rung-2 behavior:

- *Causal representation learning* (Schölkopf et al. 2021; the broader 2020s research program).
- *World models with do-operators* (the Dreamer lineage — Hafner et al. 2020 *Dream to Control*, ICLR; and successors).
- *Interventional training data* — deliberately collecting targeted-intervention datasets rather than scraping observational corpora.
- *Formal causal graphs as training signal* (Ke et al. 2019 on learning neural causal models from interventions, and subsequent work).
- *Embodied agents operating in physical environments* (robotics and reinforcement learning with real-world-coupled reward).
- *Hybrid LLM-plus-symbolic systems* (the neurosymbolic tradition; Mao et al. 2019 *The Neuro-Symbolic Concept Learner*, ICLR).
- *Explicit counterfactual-reasoning modules* (Pearl's twin-network approach at the system level, carrying causal graph structure alongside the neural component).
- *Active learning with intervention selection* (experimental-design-aware AI; the protein-folding and materials-discovery loops are narrow prototypes).

None of these pathways is at parity with current LLMs on Rung-1 tasks. All are decade-scale research programs. The honest forecast is not "bigger models, more data" — it is architectural pluralism over the coming decades, with different systems serving different rungs.

**(6) Implications for scientific labor:**

- *Graduate education* should foreground causal inference and experimental design earlier in curricula. Literature synthesis — a traditional grad-student apprenticeship — is rapidly commoditized; the distinguishing skill moves to hypothesis-formation and experimental design.

- *Publication norms* in fields dominated by correlational work (much of social science, parts of economics, observational epidemiology) will face pressure to require interventional evidence or explicit causal-identification assumptions. Fields that have already made this transition (biomedicine, after the randomized-trial revolution) provide a model.

- *Innovation economics* shifts premium from literature-synthesis to experiment-design. The scarce skill is asking *what experiment would discriminate between these hypotheses?* — followed by actually running it.

- *AI-proof domains* are those requiring wet-lab causal work, field RCTs, embodied intervention, or tacit practitioner judgment not fully captured in text. These domains retain value at scale; any narrative claiming AI will replace them on current architectures gets the direction wrong.

## Honest positioning

The onboarding is complete. A reader who has followed the argument can now open document 436 directly; the background has been supplied.

One matter of honest positioning deserves emphasis. The finding that LLMs are confined to Rung 1 is not document 436's discovery. It is Pearl's, with formal support from Bareinboim et al. (2020) and mechanistic support from the Bayesian-manifold literature. Document 436's contribution is case-study articulation — it names the practitioner-visible signature (*recombinatorial gestalt*) and connects it to the formal hierarchy at a specific grain of detail that working practitioners can apply without retraining as causal-inference specialists.

This matters for citation. Citing 436 as the source of "LLMs are Rung 1" would misattribute; the source is Pearl, with the formal result due to Bareinboim, Correa, Ibeling, and Icard. Citing 436 for the signature naming and the practitioner-applicable decomposition is appropriate. The broader RESOLVE corpus in which 436 sits has attempted to extend the claim with additional structure — nested Bayesian manifolds (Doc 439), practitioner-dyadic conditioning (Doc 440), discipline sets as support-pruning operators — but those extensions are corpus-internal and carry the risks Doc 445's pulverization formalism is designed to catch. Researchers engaging with the corpus should treat the Pearl / Schölkopf / Bareinboim citations as the load-bearing literature and treat corpus-internal extensions as candidates requiring independent audit.

The ceiling the earlier posts named is real, formally established, and architectural. The onboarding stops here; document 436 can be read directly.

---

### Keep reading

*The Plausibility Surplus* steps back from AI architecture itself and asks what its outputs are doing to readers at scale. When plausible-seeming content becomes cheap to produce, the old reader-side heuristic — *reads well, therefore someone probably vetted it* — stops working, and the adjustment is not obvious. The post names a reader-relative epistemic property called *unfalsifiable coherence*, describes the ratio shift it sits inside (the *plausibility surplus*), and offers three practical calibrations for navigating the resulting information environment without either panic or cynicism.

→ [The Plausibility Surplus](/resolve/blog/the-plausibility-surplus)

---

*Originating prompt:*

> Now do a graduate student glue code on ramp exposition that on boards the reader to the exact findings of doc 436. Append this prompt to the blog post.
