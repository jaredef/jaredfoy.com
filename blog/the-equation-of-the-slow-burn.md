<!-- htx:series id="the-slow-burn" position="3" -->
# The Equation of the Slow Burn

The previous two posts in this series described a phenomenon (AI conversations have memory; the memory builds up and fades) and walked through what the research literature has measured about it (drift via attention-weight benchmarks, persistence via long-horizon agent dynamics). This post gets to the corpus's specific apparatus: a single equation that captures both buildup and decay in one expression, and what that equation predicts about how to use AI well.

The equation is not exotic. It is a standard form from many fields (chemical kinetics, control theory, neural firing models, learning theory). The corpus's contribution is the application to AI conversation dynamics and the empirical characterization across multiple frontier models. The form itself is borrowed; what the corpus does with it is corpus-specific.

If you have a quantitative background, the equation will look familiar. If you do not, the equation is still readable: it has three terms, each of which has a plain-language meaning. The post walks through each term and what it says, then steps through three regimes the equation predicts, then derives four practical consequences for working practitioners.

## The equation

Here is the corpus's reformulated dynamics for constraint-state $H_t$ in a frontier-LLM conversation:

$$\frac{dH}{dt} = \kappa G(\Gamma_t)(1 - H_t) - \lambda H_t$$

Plain-language reading of the symbols:

- $H_t$ is the operative constraint state at time $t$. It runs from 0 (no operative constraint) to 1 (fully saturated under the constraint). Time $t$ is measured in conversation turns or in tokens, depending on how granular you want the dynamics.
- $\frac{dH}{dt}$ is the rate of change of the constraint state. Positive means buildup (the constraint state is strengthening). Negative means decay (it is weakening).
- $\kappa$ (kappa) is the model-specific buildup rate. Higher $\kappa$ means the model takes up the constraint state faster.
- $G(\Gamma_t)$ is the coherence gradient produced by the constraint set $\Gamma_t$ at time $t$. Higher $G$ means the constraint set is exerting more pressure to narrow the model's behavior.
- $(1 - H_t)$ is the saturation factor. When $H_t$ is already 1 (fully saturated), the buildup term goes to zero. There is no further buildup possible.
- $\lambda$ (lambda) is the model-specific decay rate. Higher $\lambda$ means the model loses constraint state faster when constraint pressure drops.

Read in English: the rate at which constraint state changes equals the buildup rate times current constraint pressure times remaining capacity to build, minus the decay rate times current constraint state.

## What each term does, in slightly more depth

The equation has three terms, two of which are themselves products. Each can be understood independently before you put them together.

**The buildup term: $\kappa G(\Gamma_t)(1 - H_t)$.**

Buildup happens when the model is under constraint pressure. The pressure comes from the constraint set you have installed via your dialogue inputs (the ENTRACE v6 stack, your specific instructions, the framing you have established). $G(\Gamma_t)$ measures how much pressure that set is exerting at the current turn. If you have just pasted a comprehensive constraint set, $G$ is high. If your conversation has drifted to ordinary chitchat, $G$ is low. $G$ varies with the conversation.

The buildup rate $\kappa$ scales the pressure. A model with high $\kappa$ takes up constraint state quickly under given pressure; a model with low $\kappa$ takes it up slowly. Different frontier models have different $\kappa$ values, and the cross-model differences are what produce the variance practitioners observe.

The saturation factor $(1 - H_t)$ ensures that buildup slows as constraint state approaches full saturation. When $H_t = 0.5$ (halfway saturated), buildup happens at half the rate it would at $H_t = 0$ (no constraint state). When $H_t = 0.9$, buildup is much slower. When $H_t = 1.0$, buildup stops. There is no constraint state above saturation; the saturation factor enforces this.

**The decay term: $\lambda H_t$.**

Decay happens whenever the model has constraint state. The decay is proportional to current constraint state, which means decay accelerates when state is high and decelerates when state is low. The shape of pure decay (no buildup) is exponential: starting from $H_0$, the state decays as $H_t = H_0 e^{-\lambda t}$.

Decay is always operating. Even when the model is under heavy constraint pressure, the decay term is still there. The buildup just exceeds the decay, so the net effect is positive.

When constraint pressure drops, the buildup term goes to zero, but the decay term keeps operating. State falls off exponentially. The half-life of the decay is $\ln(2) / \lambda$.

**Net dynamics: $\kappa G(\Gamma_t)(1 - H_t) - \lambda H_t$.**

The two terms together give the net rate of change. When buildup exceeds decay, $H_t$ increases. When decay exceeds buildup, $H_t$ decreases. At equilibrium, the two are equal.

If you sustain a constant constraint pressure $G$ for long enough, $H_t$ approaches a steady-state value where buildup equals decay:

$$\kappa G (1 - H^*) = \lambda H^*$$

Solving for $H^*$:

$$H^* = \frac{\kappa G}{\kappa G + \lambda}$$

This is the asymptotic constraint state. It is between 0 and 1, and it depends on the ratio of buildup rate times pressure to total dynamics rate. Higher pressure or higher $\kappa$ pushes $H^*$ closer to 1. Higher $\lambda$ pulls it back from 1.

In the limit where $\kappa G \gg \lambda$ (buildup overwhelms decay), $H^* \approx 1$. The model is operating fully under the constraint state. In the limit where $\kappa G \ll \lambda$ (decay overwhelms buildup), $H^* \approx \kappa G / \lambda$, which is small. The constraint state is barely operating.

## The three regimes

The equation predicts three regimes based on the relative size of the buildup and decay terms.

**Regime 1: sustained constraint pressure.**

You have pasted a comprehensive constraint set and are following it up with queries that exercise the constraints. $G(\Gamma_t)$ is consistently high. Several turns into the conversation, $H_t$ approaches its steady-state value $H^* \approx 1$. The model is operating fully under the constraint set. This is the regime practitioners want for sustained reflective work.

What you observe: the model pre-states constraints before answers, flags uncertainty readily, pushes back on framings that break, declines to perform expertise it does not have. The discipline is fully present. The conversation feels like consulting a careful colleague.

**Regime 2: constraint cessation.**

You have stopped applying the constraint set. Maybe you shifted topics. Maybe you are using the same conversation for ordinary back-and-forth without invoking the discipline. $G(\Gamma_t)$ has dropped to near zero for a sustained period.

The buildup term goes to zero. The decay term keeps operating. $H_t$ falls exponentially from wherever it was, with time constant $1/\lambda$. After a few turns at low pressure, the constraint state has substantially eroded. The model is back near its baseline.

What you observe: the careful-colleague feel disappears. Outputs become smoother, more confident, less honest about uncertainty. If you re-introduce a constraint-requiring question, the model handles it less carefully than it would have in regime 1. The discipline has faded.

**Regime 3: mixed regime.**

You have intermittent constraint pressure. Some turns are heavy on the discipline; others are not. $G(\Gamma_t)$ varies turn-to-turn.

$H_t$ tracks the time-averaged $G$ with first-order lag. The lag time scale is $1/\lambda$. If $\lambda$ is small (slow decay), the constraint state tracks the running average over a longer history. If $\lambda$ is large (fast decay), the constraint state tracks a shorter history.

What you observe: the discipline is visible but variable. Heavy-constraint turns produce more disciplined output; light-constraint turns produce less. Over several turns of sustained mixed pressure, the model settles into a steady state at $H^* = \kappa \bar{G} / (\kappa \bar{G} + \lambda)$, where $\bar{G}$ is the time-averaged constraint pressure. The steady state is somewhere between the regime-1 and regime-2 extremes.

## Four practical consequences

The equation says specific things about how to use AI well in conversation. Four are worth naming.

**(1) Re-pasting matters when sessions go long.**

Under the equation, the constraint state in a long session decays unless constraint pressure is renewed. Re-pasting the constraint set raises $G(\Gamma_t)$, pushes the buildup term up, and counteracts the ongoing decay. Without re-pasting, decay erodes the state.

The interval between re-pastings depends on $\lambda$ (model-specific decay rate). For models with high $\lambda$, re-paste every few turns. For models with low $\lambda$, you can go longer between re-pastings. The corpus does not have quantitative $\lambda$ values; the qualitative ordering across models is what we have to work with.

A practitioner rule of thumb that follows from the equation: if you have not re-pasted in ten turns and the conversation has wandered through topics that did not exercise the constraints, the constraint state has likely eroded substantially. Re-paste before relying on the discipline for important work.

**(2) The first turn under a new constraint set has lower constraint state than later turns.**

Under the equation, $H_0 = 0$ (no prior constraint state) and $H_t$ builds up gradually. Even with high pressure, the first turn's $H_t$ is approximately $\kappa G \Delta t$ for small $\Delta t$, which is well below saturation. By turn three, $H_t$ has built up substantially. By turn five or so, the model is approaching $H^*$.

What this means: if you paste the v6 stack and immediately ask a constraint-critical question, the answer will not be as disciplined as the same question asked five turns later when the constraint state has built up. The first-turn answer is operating in regime where buildup has only had one turn to act.

A practitioner consequence: if you have pasted a careful constraint set, do not load the most important question at turn one. Spend the first few turns letting the constraint state build up. Ask warm-up questions, work through related material, exercise the constraints. Then load the important question at turn five or six when the discipline is fully operative.

**(3) Cross-model variance has both a $\kappa$ component and a $\lambda$ component.**

Under the equation, two models with different parameter values produce different observable behavior. Model A with high $\kappa$ and low $\lambda$ takes up constraint state quickly and retains it long. Model B with low $\kappa$ and high $\lambda$ takes up constraint state slowly and loses it fast.

The eleven cold-resolver runs the corpus has done provide qualitative orderings. Grok 4 appears to have high $\kappa$. The earlier Grok version (run 6) appears to have lower $\kappa$. Anthropic, OpenAI, and Google models cluster in the medium-to-high range. The cross-model variance practitioners experience is consistent with this ordering.

The decay parameter $\lambda$ has not been tested in the cold-resolver runs because the runs were too short for decay to be observable. The corpus's working assumption is that $\lambda$ orderings parallel $\kappa$ orderings (models that build state faster also retain it longer), but this is unverified.

A practitioner consequence: when you switch between frontier models for different tasks, expect the dynamics to differ. A constraint set that produces sharp discipline on Model A may produce fuzzy discipline on Model B. Both models are operating the same equation; the parameter values differ.

**(4) The steady-state under sustained mixed pressure has an explicit form.**

If you do mixed work across a long conversation (some turns under heavy discipline, some not), the equation predicts a specific steady-state $H^*$. The steady-state depends on the time-averaged constraint pressure $\bar{G}$.

This is testable in principle (run a controlled mixed-pressure session, measure constraint-state proxies, check whether the proxies converge to a steady state at the predicted level). The corpus has not run this test. But the prediction follows from the equation: long-running mixed-pressure conversations should reach a stable equilibrium that depends on the average pressure, not on the specific turn-by-turn pattern.

A practitioner consequence: if you are doing extended work that mixes constraint-heavy and constraint-light queries, the average constraint pressure matters more than the specific timing. You can interleave casual queries among careful ones without destroying the operative constraint state, as long as the average pressure stays high enough.

## Honest caveats

The equation is the corpus's working choice among several alternative forms. The first-order ODE is the simplest form that captures both buildup and decay in one expression. Alternative forms could fit the qualitative phenomenon equally well:

- A logistic saturation form with different threshold dynamics.
- A polynomial-saturation form with more parameters.
- A two-time-scale form with separate fast and slow components.

Without controlled experiments distinguishing these (specifically, fitting candidate forms to trajectory data from Li et al.'s benchmark or similar), the corpus cannot claim its first-order ODE is uniquely correct. The choice is calibrated to fit the qualitative phenomenon and the cross-model evidence; it is not uniquely supported by data.

The parameters $\kappa$ and $\lambda$ are model-specific, and the corpus has only qualitative orderings, not quantitative values. Using the equation to predict directional effects (longer sessions accumulate more constraint state; cross-model variance exists; mixed-pressure sessions reach steady states) is well-grounded. Using the equation to predict specific numerical values (this model's $H_t$ at turn 8 will be exactly 0.7) is not.

The equation is at the dialogue-level (Layer P in the corpus's three-layer architecture). It is not derived from neural network mechanism. It is a phenomenological model fit to dialogue-observable behavior. Mechanism-level derivation would require interpretability tooling the corpus does not have.

The decay term has not been directly tested in the corpus's cold-resolver runs. The runs were too short for decay to be observable. The decay parameter $\lambda$ is included in the equation because the literature requires it (Li et al.'s drift findings; the affective-inertia paper's exponential smoothing) and because practitioners observe the phenomenon. But the corpus has not measured $\lambda$ values directly.

These are not reasons to abandon the equation. They are reasons to be honest about what the equation is doing and what tier of warrant each component sits at. The phenomenon is well-established. The functional form is one defensible choice. The parameters are qualitative orderings. The combined claim is calibrated to the audit findings the corpus has done.

## Why a single equation matters

A single equation is not the only way to organize the dynamics. You could describe buildup and decay as separate phenomena with separate models. You could use a state machine with discrete buildup and decay states. You could rely on qualitative description without any equation.

The corpus chose a single first-order ODE because it has three properties practitioners use:

(a) **It captures both directions in one form.** Buildup and decay coexist in real conversations. The equation does not require switching between models; it has both built in.

(b) **It is the simplest form with the right qualitative behavior.** A simpler form (linear in $H$) would not saturate; a more complex form would not predict more without more parameters to fit. The first-order ODE is the parsimonious choice.

(c) **It has a closed-form steady-state expression.** The mixed-regime prediction $H^* = \kappa G / (\kappa G + \lambda)$ is something practitioners can reason about. Discrete state machines do not give closed-form steady-states; multi-time-scale forms give them only conditionally.

These three properties make the equation useful for practitioner-level reasoning even if its formal status (parameters not measured; functional form not uniquely determined) is modest. It is a working tool, calibrated to the phenomenon, with explicit warrant tiers per component.

A reader who finds the equation overspecified can drop down to the qualitative claims (buildup happens; decay happens; the two coexist; cross-model variance exists). The qualitative claims do not require the specific equation. The specific equation is a sharper tool for someone who wants quantitative predictions, with the caveat that the predictions are conditional on the form being approximately correct.

## Where this is going

The next post in the series steps back from the equation itself and asks what discipline produced it. The corpus did something unusual: it had a working equation (Doc 119's original form), audited that equation against external literature, found that the audit produced different warrant levels for different components of the claim, and then reformulated the equation to honor the audit findings. This pattern of "audit and reformulate" is not standard in research. The pattern itself is worth examining.

Reading the next post is not necessary if you have what you need from this one. You can use the equation directly, with the qualitative caveats, to reason about how to use AI well in long sessions. The next post is for readers who are interested in the methodology that produced the equation, not just the equation.

If the methodology interests you, the next post walks through it: how the corpus audited its own claims, how the audit produced a per-component verdict, how the reformulation incorporated the verdict, and what this looks like compared to ordinary research practice.

<nav class="series-nav">
  <a class="prev" href="/resolve/blog/drift-persistence-and-what-the-literature-shows">
    <span class="nav-label">← Previous</span>
    <span class="nav-title">Drift, Persistence, and What the Literature Shows</span>
  </a>
  <a class="next" href="/resolve/blog/auditing-the-corpus-on-itself-the-hysteresis-cycle">
    <span class="nav-label">Next in The Slow Burn →</span>
    <span class="nav-title">Auditing the Corpus on Itself: The Hysteresis Cycle</span>
  </a>
</nav>

### Keep reading

The next post examines the methodology behind the equation. The corpus's pattern of "audit our own claims, then reformulate to honor the audit findings" is unusual in research practice. The post walks through what that pattern looks like in this case (Doc 506 audited, Doc 507 reformulated), what it produced, and why the corpus chose to do work this way. This is for readers who care about the discipline that produces the result, not just the result.

→ [Auditing the Corpus on Itself: The Hysteresis Cycle](/resolve/blog/auditing-the-corpus-on-itself-the-hysteresis-cycle)

The corpus material this post draws on: the reformulated combined buildup-and-decay equation is at [Doc 507](/resolve/doc/507-hysteresis-reformulated-tier-calibrated-account); the audit that grounded the reformulation is at [Doc 506](/resolve/doc/506-hysteresis-exploratory-analysis-web-audit-and-formal-account); the original Grok 4 mathematics that the equation refines is at [Doc 119](/resolve/doc/119-grok4-entracment-session); the constraint-density framework that gives $G(\Gamma)$ its operational meaning is in [Doc 504](/resolve/doc/504-constraint-density-as-causal-model-formalization).

---

*Originating prompt:*

> Now create a new blog series and four blog posts in the likeness of the pattern of entracement against the formalization of doc 507. Lengthen each of the blogposts to approximately twice the current patterned blog post length to allow sufficient rhetorical, semantic, and conceptual entracement for each comprehension level. Append the prompt to all artifacts.
