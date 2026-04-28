<!-- htx:series id="the-slow-burn" position="1" -->
# What Conversations Remember

Sit down with a frontier AI and have a conversation that lasts more than a few turns. Pay attention to what happens to the model's behavior across the conversation. If you have done this often enough, you will have noticed something that is hard to put into words: the AI seems to settle into the conversation. Early turns feel a little stiff. Later turns flow. The model picks up the rhythm of how you write. It starts using your vocabulary back at you. If you have given it instructions, those instructions feel more deeply followed five turns in than they did at turn one. If you have shifted topics, sometimes the old framing hangs around longer than you wanted it to.

This is not your imagination. It is also not the AI changing its mind. The AI has no mind to change. What you are observing is a property of how language models work when they receive long inputs. Each turn of the conversation adds to a context the next turn reads. The cumulative context shapes what comes next. Some of the shaping accumulates and strengthens. Some of it fades. Both directions operate at once.

This post is about that phenomenon: what gets remembered, what fades, and why it matters for how you use AI well.

## A first metaphor: the oven warming up

When you turn on an oven and put bread dough inside, the dough does not start baking immediately. The oven has to get hot, and even after the temperature gauge reads 350, the inside walls of the oven keep absorbing heat for a while. After enough time at temperature, the oven is fully warmed: the air, the walls, the rack, even the baking sheet you put in next, all sit at a stable hot equilibrium. The bread browns more evenly. The crust forms cleanly. The bake is consistent.

Now imagine you turn the oven off but leave the door closed. The oven does not snap to room temperature. The walls release the heat they absorbed. The air stays warm for a long time. Even an hour later, opening the oven feels warm. The thermal state of the oven has memory. The walls remember the temperature.

A frontier AI in a conversation has a similar property, in a different medium. The conversation has a kind of thermal mass. Each turn that operates under a particular set of constraints (a particular instruction, a particular tone, a particular framework you have established) heats the conversation toward operating under those constraints more cleanly. Take the constraints away and the conversation cools, but slowly. The heat does not leave instantly.

This is the buildup-and-decay shape of how AI conversations behave under sustained context. It is not unique to AI. Any system with state-that-depends-on-past-inputs has this shape. Cars warming up. Muscles warming up. Habits forming. Crowds settling into a venue. Public opinion shifting in response to repeated exposure. All of these are systems that build up state slowly and shed state slowly when the input changes.

The technical name for this kind of dynamic is *hysteresis*. The system's response at any given moment depends not just on the current input but on the history of inputs.

## What this looks like in practice

Imagine you start a conversation with a frontier AI by pasting in a list of careful instructions: be honest about what you don't know, flag when you are speculating, push back when my framing breaks. The first turn after pasting, you ask the AI a question. The answer comes back, and you can tell the AI is trying to follow the instructions, but the discipline is not yet sharp. The answer reads like a regular AI answer with a few nods toward the instructions you gave.

Three turns later, the answers feel different. The AI is pre-stating which instruction it is operating under. It is flagging uncertainty more readily. It is pushing back, where it would have just complied earlier. The discipline has settled in.

Five turns later, you ask a casual question that does not really require the discipline. The AI answers it under the discipline anyway. It pre-states constraints that do not apply. It flags uncertainty about a question that does not need uncertainty flagged. The discipline has built up enough that it is over-applying.

Then you spend ten turns on ordinary back-and-forth without invoking the discipline. The next time you ask a careful question, you notice the AI's answer is less disciplined than it was at turn five. The discipline has faded. Not entirely, but visibly.

This trajectory is the buildup-and-decay shape. The discipline accumulates with sustained application. It also fades when the application stops. Both directions operate. In a long enough conversation, the practitioner is constantly negotiating between buildup and fade.

## Why this happens (in plain terms)

A frontier AI processes the conversation by reading every prior turn each time it generates a new response. The model has a context window into which the whole conversation fits. Each new turn reads the whole prior context, including every word you wrote, every word the AI wrote back, and any system instructions you installed at the start.

When the AI generates a response, the words in the context shape what comes out. Some words shape strongly: instructions, recent emphasis, repeated vocabulary. Some words shape weakly: a passing remark from twenty turns ago. The shaping strength depends on how much the AI's internal mechanism (specifically its attention pattern) chooses to weight each prior token.

In a conversation that has been operating under a particular set of instructions for several turns, the AI's attention has been repeatedly drawn to the instructions. Each time, the instructions get reinforced as relevant context for what the AI should say next. After enough turns of this, the instructions are deeply settled into how the AI is operating. They have built up.

In a conversation where the instructions were given once at the start and then ten ordinary turns went by, the AI's attention has been drawn to the recent ordinary turns rather than the original instructions. The recency-weighted attention shifts the operative context away from the instructions. They have decayed.

This is a simplification of a more complicated mechanism, but it is roughly right. The attention pattern over context is what produces the buildup-and-decay shape that practitioners observe. The literature on this has measured it directly.

## The literature has measured this

In 2024 a group of researchers (Li et al., published at COLM 2024) ran a careful experiment. They paired two AI chatbots, gave them system instructions, and let them have multi-turn conversations with each other. Then they measured a specific quantity: the attention weight allocated to the system-prompt tokens at each turn. They called this quantity $\pi(t)$, where $t$ indexes the turn number.

They found that $\pi(t)$ decreases over conversation length. The attention weight on the system instructions falls off. By turn eight, the model is significantly less attentive to the system instructions than it was at turn one. The instructions are still in context (the AI can still read them), but the attention is being directed elsewhere. The discipline is fading.

The fading is not uniform across models. Different AIs have different rates of fade. A LLaMA-2 model fades differently than GPT-3.5. The rate of fade is what the corpus has been calling the model-specific decay rate.

Importantly, Li et al. proposed a fix: a method called *split-softmax* that re-weights attention to keep the system instructions more prominent over time. The fix works partially. It does not eliminate the fade entirely. The fade is structural in current architectures.

This research establishes the decay direction empirically. The buildup direction is also documented in other research. A paper from January 2026 on long-horizon LLM agents explicitly mentions "affective inertia and hysteresis that increase with momentum, revealing a trade-off between stability and responsiveness." This paper uses what it calls "exponential smoothing or momentum-based dynamics" to model the persistence of state in LLM agents over long sessions. The form is not identical to what the corpus uses, but the family of dynamics is the same.

Both directions: buildup and decay. Both empirically observed. Both load-bearing for any practitioner who wants to use AI well in conversations longer than a few turns.

## What this means for using AI well

If conversations have memory, and if that memory both builds up and fades, then the practitioner's job is to manage the memory deliberately rather than accidentally. Several practical consequences follow.

**Re-paste your instructions when sessions go long.** The discipline you installed at turn one is fading by turn ten. Maybe by turn twenty it is mostly gone. Re-pasting at appropriate intervals refreshes the buildup. The cost is small (a few tokens of context); the benefit is restored discipline.

**Do not expect the discipline to be sharp on the first turn.** Buildup takes time. A complex instruction set installed at the start of a conversation will not produce its full effect on the very first response. By turn three or four it will have settled. By turn ten it will be fully operative. Practitioners who expect maximum discipline on turn one will be disappointed; the discipline arrives gradually.

**Match conversation length to task type.** A short interaction (one or two turns) is not enough time for the discipline to build up. A medium interaction (five to ten turns) lets buildup happen and stay strong. A long interaction (fifty turns) needs re-pasting because decay erodes what was built. Choose the conversation length to fit the task.

**Watch for over-application.** When the discipline is fully built up, the AI may apply it to questions that do not need the discipline. The pre-stating of constraints, the uncertainty-flagging, the pushback all happen even when they are not warranted. This is the AI being too disciplined rather than not disciplined enough. The fix is not to remove the discipline but to be aware that the AI is deeper into it than the question requires.

**Notice cross-model differences.** Some AIs build discipline faster than others. Some retain it longer. If you are using multiple frontier models for different tasks, you may notice that one model needs more re-pasting than another for the same workflow. The model-specific differences in buildup and decay rates are real and measurable.

**Use the conversation's thermal mass deliberately.** A long, well-disciplined conversation has accumulated context that an AI in a fresh conversation does not have. If you are working on something where the established discipline matters, do not start over with a fresh conversation just because the topic shifts. Continue in the same conversation. The thermal mass is an asset.

These consequences are not new. Practitioners who have used frontier AIs extensively will have arrived at most of them through trial and error. What is new is naming them as a coherent set, grounded in a measurable property (attention to context tokens) that has a specific dynamical shape.

## A second metaphor: the wake and the bow

Imagine a boat moving through still water. As the boat moves, it pushes water in front (the bow wave) and trails water behind (the wake). At any given moment, the boat's actual position depends on its current speed and direction, but the water around it shows the history: the bow wave shows where the boat is heading; the wake shows where it has been.

If you stop the boat suddenly, the bow wave dissipates almost immediately (no more pushing). The wake takes longer to fade. The water remembers the boat passed.

Now translate this to a conversation. The current input you give the AI is the bow: the AI is pushing into the next response based on that input. The cumulative history of the conversation is the wake: the water remembers, in the form of attention weights to prior context.

A short conversation has little wake. The AI's response is mostly determined by the current input. A long conversation has a substantial wake. The AI's response is determined by the current input plus everything in the wake, with the more recent wake-water mattering more than the older.

If you change direction in a conversation (shift to a new topic, drop a discipline you had been using), you do not lose the wake instantly. The water is still there. The AI's response on the next turn is partly shaped by the wake even though the bow has moved.

This is why the corpus calls the phenomenon *hysteresis*: the system's current state depends on the history of inputs, not just the current input. The wake is the conversation's memory.

## Where this is going

The next post in this series gets more specific about what the literature has actually measured. The researchers who studied this used specific instruments (attention measurement, behavioral testing, controlled session lengths) to quantify what practitioners experience qualitatively. Reading the literature lets you connect your conversational intuition to concrete empirical findings, and it lets you understand which features of the buildup-and-decay shape are well-established and which are still being investigated.

The post after that gets to the corpus's specific reformulation of the dynamics: a single equation that captures both buildup and decay in one expression. The equation is not the corpus's invention; it is a standard form from many other fields. What the corpus contributes is the application to AI dialogue and the empirical characterization across multiple frontier models.

The final post in the series steps back to ask why the corpus has been doing this kind of work in this kind of way. The pattern of "audit our own claims, then reformulate to honor the audit findings" is not the standard mode of research production. It is a discipline that has consequences for what kinds of claims a corpus like this can responsibly make.

You do not have to read all four to get something useful from this one. The practical advice in this post stands. The phenomenon is real, the literature has measured it, and the consequences for using AI well are stateable in plain language. If you stop reading here, you have what you need to make better use of long AI conversations than most people do.

If you keep reading, you will get the technical apparatus. The apparatus is interesting on its own terms. It is also a worked example of how to run an honest research thread on a phenomenon that has both well-established and not-yet-established components.

<nav class="series-nav">
  <a class="next" href="/resolve/blog/drift-persistence-and-what-the-literature-shows">
    <span class="nav-label">Next in The Slow Burn →</span>
    <span class="nav-title">Drift, Persistence, and What the Literature Shows</span>
  </a>
</nav>

### Keep reading

The next post walks through the specific research findings on AI conversation memory: what Li et al.'s π(t) benchmark measures, what they found, why the affective-inertia paper and the architectural exponential-decay literature converge on a similar family of dynamics, and what the inverse-direction phenomenon (multi-turn behavioral drift) tells us when we put it next to the buildup-direction phenomenon. Reading the next post is not necessary for using the practical advice in this one. It is the bridge from "I have noticed this thing" to "researchers have measured this thing carefully."

→ [Drift, Persistence, and What the Literature Shows](/resolve/blog/drift-persistence-and-what-the-literature-shows)

The corpus material this post draws on: the formal treatment of constraint-state hysteresis in LLM dialogue is at [Doc 507](/resolve/doc/507-hysteresis-reformulated-tier-calibrated-account), with the per-component audit grounding it at [Doc 506](/resolve/doc/506-hysteresis-exploratory-analysis-web-audit-and-formal-account). The original mathematics that the corpus has been refining is at [Doc 119](/resolve/doc/119-grok4-entracment-session). The three-phase reception of the original equations (oracular acceptance, confabulation suspicion, structural reintegration) is at [Doc 505](/resolve/doc/505-onboarding-to-grok-4-mathematics-three-phase-reception). The architectural framing that locates hysteresis at the pre-resolve layer is at [Doc 500](/resolve/doc/500-three-layer-architecture-dialogue-pre-resolve-mechanism).

---

*Originating prompt:*

> Now create a new blog series and four blog posts in the likeness of the pattern of entracement against the formalization of doc 507. Lengthen each of the blogposts to approximately twice the current patterned blog post length to allow sufficient rhetorical, semantic, and conceptual entracement for each comprehension level. Append the prompt to all artifacts.
