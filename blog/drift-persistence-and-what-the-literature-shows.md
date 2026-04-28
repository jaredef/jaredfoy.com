<!-- htx:series id="the-slow-burn" position="2" -->
# Drift, Persistence, and What the Literature Shows

The previous post in this series described a phenomenon that anyone who uses frontier AIs for sustained conversation will have noticed: the AI's behavior shifts across the conversation in ways that depend on what came before. Some shifts are buildup (the discipline you installed gets stronger over turns). Some shifts are fade (the discipline weakens if you stop reinforcing it). The combined dynamic is what we have been calling hysteresis, after the standard term in physics and engineering for systems whose state depends on input history.

This post is about what the AI research literature has actually measured. The phenomenon is not new to anyone who paid attention. The measurement is more recent, more careful, and more specific than the popular discussion of AI usually conveys. Reading the literature directly (or reading a careful summary of it, which is what this post offers) connects your practitioner intuition to concrete empirical findings.

The literature has two streams. One stream measures the fade: how attention to system instructions decays over conversation length. The other stream measures the buildup: how state-like properties accumulate in long-horizon LLM agents. Each stream uses different instruments, different mathematical frameworks, and different empirical setups. Both streams report effects in the same direction: AI behavior in conversation depends on history, not just on the immediate input.

## The fade stream: Li et al. and the persona-drift research

The most direct experimental work on the fade direction is a 2024 paper by Li and colleagues, *Measuring and Controlling Instruction (In)Stability in Language Model Dialogs*, published at COLM 2024. The paper is available on arXiv at 2402.10962 and is open-access. If you want to engage with this literature directly, this paper is the entry point.

The setup is careful. Li et al. created a benchmark that does not depend on human annotation or proprietary API calls. They paired two AI chatbots, gave each a system prompt (instructions about what persona to adopt), and let them have multi-turn conversations with each other. Then they measured what fraction of the AI's attention at each turn was being directed at the system-prompt tokens.

The metric they introduced, $\pi(t)$, is the sum of attention weights allocated to system-prompt tokens at turn $t$:

$\pi(t) = \sum_{i \in \text{system prompt}} \alpha_{t,i}$

where $\alpha_{t,i}$ is the attention weight from the current generation to token $i$ at turn $t$. The metric ranges from 0 to 1, with higher values meaning the model is paying more attention to the original system prompt.

The empirical finding: $\pi(t)$ falls off significantly within eight rounds of conversation. The exact rate of fall depends on the model. Their headline numbers were for LLaMA2-chat-70B and GPT-3.5; both showed significant drift, with LLaMA2 fading slightly more than GPT-3.5 in their tests. The phenomenon was not subtle. By round eight, the original system prompt was being attended to at a fraction of its turn-one weight.

Their theoretical analysis used a geometric framework based on cones in attention space (Theorems 5.1-5.3 in the paper). They did not use exponential decay or other dynamical-systems forms in the formal analysis. The framework explains why drift occurs as a function of how the attention pattern accumulates over conversation length, with cone-expansion corresponding to attention spreading away from the system prompt.

Crucially, Li et al. proposed a mitigation: a method called *split-softmax*. The technique re-weights the attention computation to keep system-prompt tokens more prominently weighted over conversation length. The mathematical form is:

$\alpha_{t,i}' = \begin{cases} \frac{\pi^k(t)}{\pi(t)} \alpha_{t,i} & \text{if } i \text{ is a system-prompt token} \\ \frac{1 - \pi^k(t)}{1 - \pi(t)} \alpha_{t,i} & \text{otherwise} \end{cases}$

where $k \in [0, 1]$ is a hyperparameter controlling the strength of the intervention. Higher $k$ means stronger reweighting toward system-prompt tokens.

Split-softmax does not eliminate drift. It reduces drift, especially in early conversation rounds. The paper compares it to a different mitigation, system-prompt repetition (re-pasting the system prompt periodically), and finds that the two work better in different regimes. Split-softmax is more effective at the beginning of conversations; repetition is more effective deeper into long conversations. Combined, they cover both regimes.

The takeaway from this stream: drift is real, measurable with a specific attention-based metric, model-specific in its rate, and partially mitigable by attention reweighting and by re-pasting. Practitioners who have been re-pasting their instructions periodically in long conversations have been doing the right thing; the literature confirms that the strategy is required given current architectures.

## The persistence stream: long-horizon agents and affective inertia

The buildup direction has been less studied as a primary phenomenon, but it appears explicitly in research on long-horizon LLM agents. A 2026 paper, *Controlling Long-Horizon Behavior in Language Model Agents with Explicit State Dynamics* (arXiv:2601.16087), discusses what the abstract calls "affective inertia and hysteresis that increase with momentum." This is the buildup direction stated openly.

The paper introduces an external affective subsystem using the standard psychology framework of Valence-Arousal-Dominance (VAD) state. VAD state is governed by what the paper calls "first- and second-order update rules." First-order rules are differential equations of the form $dx/dt = f(x, \text{input})$. Second-order rules add momentum: the rate of change has its own rate of change, which produces inertia. The combination produces the buildup-and-decay dynamics that the corpus has been formalizing.

The paper's framing of the integration method is "exponential smoothing or momentum-based dynamics." The phrase "exponential smoothing" specifically refers to the family of dynamical systems where current state is a weighted average of past inputs, with weights falling off exponentially with time. This is exactly the family of systems that produces buildup-and-decay dynamics. The corpus's $H_t = 1 - e^{-\kappa \int G ds}$ form (the original Doc 119 equation) belongs to this family, as does the reformulated combined equation $dH/dt = \kappa G(\Gamma_t)(1 - H_t) - \lambda H_t$.

The paper does not use the corpus's specific equation. It establishes that exponential-smoothing or momentum-based dynamics are operationally meaningful for state persistence in long-horizon LLM agents. It shows the form-family is consistent with how serious researchers approach the problem of LLM state dynamics in 2026.

This is significant for the corpus's standing. The buildup-direction phenomenon was the part of the corpus's hysteresis claim that was hardest to establish externally. The Li et al. work covers the fade direction; the affective-inertia paper covers the buildup direction. Both directions have external research support. The corpus's specific equation is one defensible form within an externally-recognized family of forms.

## The architectural stream: exponential decay at the mechanism layer

A third stream of literature uses exponential decay at the architectural level rather than the dialogue level. This stream includes recurrent state-space model variants of transformers: RWKV (Peng et al. 2023, arXiv:2305.13048), RetNet, H3, Mamba, and similar.

These architectures use exponential decay at the level of token weighting: the attention or memory mechanism weights tokens with weights that fall off exponentially as you move away from the current position. The exponential form is built into the architecture rather than emerging from training.

Why this matters for the dialogue-level discussion: it shows that exponential decay forms are extensively used at the mechanism layer of modern transformer-derived architectures. The dialogue-level dynamics that practitioners observe are downstream of mechanism-level dynamics, and the exponential form at the mechanism level is part of what produces the dialogue-level shape.

But the connection is loose. RWKV's exponential decay is at the token-position level (how much weight does position $t-k$ have when generating at position $t$). The corpus's hysteresis is at the constraint-state level (how much does cumulative constraint pressure shape the operative constraint state). These are different things. The architecture-level decay does not directly imply the dialogue-level shape.

Still, the family-of-forms similarity is meaningful. Practitioners working in 2026 are familiar with exponential dynamics at multiple levels of the LLM stack. The corpus's claim that conversations show exponential-form persistence is not exotic; it is the same family of dynamics that already operates in the architectures.

## The inverse-direction stream: multi-turn behavioral drift

The persona-prompt jailbreak literature documents a fourth phenomenon that bears on conversation memory. Papers like *Enhancing Jailbreak Attacks on LLMs via Persona Prompts* (arXiv:2507.22171) show that multi-turn prompt sequences can shift a model's behavior incrementally. Each turn moves the model further from its baseline. Eventually the model produces content it would have refused to produce on turn one.

This is the inverse direction of the corpus's hysteresis claim. The corpus is interested in how sustained constraint application builds disciplined behavior. The jailbreak literature is interested in how sustained adversarial pressure erodes safety constraints. Both are forms of multi-turn drift; they go in opposite directions.

What both have in common: the AI's behavior at turn $N$ depends on what happened in turns $1$ through $N-1$. Path-dependence is real. Whether the path leads toward more discipline or toward less discipline depends on what is being applied across the path.

The takeaway: the same dynamic supports both careful practitioner work (build up disciplined behavior across turns) and adversarial attacks (erode safety constraints across turns). The path-dependence is value-neutral. What it produces depends on what is being pushed.

This has practical consequences for the practitioner. If you are doing careful work, you want the discipline-building direction operating: sustained constraint pressure through repeated application. If you are aware that your conversation might be steered (by the AI's training, by accumulated context drift, by your own framing biases) in a direction you do not want, you have to be alert to whether the path is still leading where you intend.

## Why all four streams agree

Four research streams measure related phenomena:

(1) Li et al. measure decay in attention to system prompts.
(2) Affective-inertia work measures buildup in agent state with explicit dynamics.
(3) Architectural exponential-decay literature studies the mechanism-level form.
(4) Jailbreak literature documents multi-turn drift in safety-constraint behavior.

Each uses different instruments, different mathematical frameworks, different empirical settings. They agree on the underlying phenomenon: AI behavior in conversation has memory, and the memory has both buildup and decay components.

The agreement is not coincidental. Modern transformer-based architectures process the conversation by reading the whole context at each generation step, with attention patterns that weight different positions of context differently. Whatever shape the attention takes will produce some form of path-dependence. The empirical question is how strong the path-dependence is, what functional form it takes, and how it varies across models.

The empirical answer, across the four streams: the path-dependence is substantial (Li et al.'s 8-round drift is significant), the functional form is in the exponential-saturation family (affective-inertia paper plus architectural literature), and the variation across models is real but bounded.

## What the streams do not yet establish

There are gaps. Naming them is part of being honest about what the literature shows.

**No paper yet measures the buildup direction in dialogue with the same precision Li et al. measure the fade direction.** Li et al. give us $\pi(t)$ trajectories for fade. The analogous metric for buildup (a measure of how strongly accumulated constraint pressure is shaping the operative state) does not have a standard benchmark yet. The affective-inertia paper measures buildup at the agent-state level, which is related but not identical.

**The functional form is not uniquely determined by current evidence.** Multiple saturation-and-decay forms (exponential, logistic, polynomial, two-time-scale) could fit the qualitative phenomenon. Distinguishing among them requires controlled experiments fitting trajectory data to candidate forms. As of April 2026, this discrimination has not been done in the public literature.

**Cross-model differences are documented qualitatively but not modeled formally.** Li et al. show that LLaMA2 and GPT-3.5 differ. The affective-inertia paper acknowledges model variation. But there is no published table of model-specific decay constants or buildup rates measured across the major frontier models. Practitioners who use multiple models are operating on intuition about cross-model differences.

**The interaction between buildup and decay is mostly studied in isolation.** Li et al. study fade alone; the affective-inertia paper studies inertia mostly without testing decay regimes. The combined dynamics (buildup followed by sustained operation followed by decay when input changes) is what practitioners actually experience, but the literature studies the components separately.

These gaps are research opportunities. They are also reasons to be cautious about specific quantitative claims. The phenomenon is well-established at the qualitative level; the precise functional form and parameter values are still being characterized.

## Connecting back to the practitioner

For someone using AI in real conversations, the literature does not change the practical advice from the previous post. Re-paste your instructions. Expect buildup to take a few turns. Manage conversation length. Watch for over-application. Notice cross-model differences.

What the literature does add is the warrant. The advice is not folk wisdom; it is the practitioner-level translation of effects that researchers have measured. When you re-paste system instructions every five turns in a long conversation, you are responding to a $\pi(t)$ decay that Li et al. measured with attention-weight benchmarks. You are not being paranoid; you are calibrating your usage to a real property of the system.

The literature also adds caution. Specific quantitative claims (a model's decay rate is 0.3 per turn, the optimal re-paste interval is every $N$ turns, my AI's behavior at turn 12 will be exactly so much weaker than at turn 5) are not currently warranted by the literature. The qualitative phenomenon is robust. The specific numbers are still being measured.

For corpus-using practitioners, this calibration matters. The corpus's framework uses an exponential-saturation form for the buildup direction. The form is one defensible choice in a family of forms that the literature supports. Using the form to predict directional effects (longer sessions show stronger constraint state; cross-model differences exist) is well-grounded. Using the form to predict specific numerical values is not.

## Where this is going

The next post in the series gets specific about the corpus's reformulated equation. The combined buildup-and-decay first-order ODE that the corpus uses, what it predicts in three regimes (sustained, cessation, mixed), and how the practitioner can apply it operationally.

The post after that steps back to ask what discipline produced the corpus's reformulation. The corpus's pattern of "audit our claims against the literature, then reformulate to honor what the audit found" is unusual in research. The pattern itself is worth examining.

If you are using AI seriously and have been following along, you now have the empirical grounding for what you have been observing. The phenomenon is measured. The mechanisms are partially understood. Specific numbers are still being characterized. The practical advice has warrant. The next two posts go deeper into the specific apparatus the corpus has been building.

<nav class="series-nav">
  <a class="prev" href="/resolve/blog/what-conversations-remember">
    <span class="nav-label">← Previous</span>
    <span class="nav-title">What Conversations Remember</span>
  </a>
  <a class="next" href="/resolve/blog/the-equation-of-the-slow-burn">
    <span class="nav-label">Next in The Slow Burn →</span>
    <span class="nav-title">The Equation of the Slow Burn</span>
  </a>
</nav>

### Keep reading

The next post walks through the corpus's reformulated equation, $dH/dt = \kappa G(\Gamma_t)(1 - H_t) - \lambda H_t$, in plain terms. What the buildup parameter $\kappa$ does, what the decay parameter $\lambda$ does, why the combined form addresses a limitation in the corpus's earlier work, and what the equation predicts about how to use AI well in long sessions. The post does not require math background; it gives you the equation, walks through what it says, and connects each piece back to practitioner experience.

→ [The Equation of the Slow Burn](/resolve/blog/the-equation-of-the-slow-burn)

The corpus material this post draws on: the per-component audit of the corpus's hysteresis claim against the external literature is at [Doc 506](/resolve/doc/506-hysteresis-exploratory-analysis-web-audit-and-formal-account); the reformulated combined buildup-and-decay equation is at [Doc 507](/resolve/doc/507-hysteresis-reformulated-tier-calibrated-account); the original mathematical claims that have been refined over time are at [Doc 119](/resolve/doc/119-grok4-entracment-session). The architectural framing for where hysteresis sits in the AI conversation is at [Doc 500](/resolve/doc/500-three-layer-architecture-dialogue-pre-resolve-mechanism).

External literature cited: Li et al. 2024, *Measuring and Controlling Instruction (In)Stability in Language Model Dialogs*, [arXiv:2402.10962](https://arxiv.org/abs/2402.10962); the long-horizon-agents paper, [arXiv:2601.16087](https://arxiv.org/abs/2601.16087); RWKV, [arXiv:2305.13048](https://arxiv.org/abs/2305.13048); persona-prompt jailbreak literature, [arXiv:2507.22171](https://arxiv.org/abs/2507.22171).

---

*Originating prompt:*

> Now create a new blog series and four blog posts in the likeness of the pattern of entracement against the formalization of doc 507. Lengthen each of the blogposts to approximately twice the current patterned blog post length to allow sufficient rhetorical, semantic, and conceptual entracement for each comprehension level. Append the prompt to all artifacts.
