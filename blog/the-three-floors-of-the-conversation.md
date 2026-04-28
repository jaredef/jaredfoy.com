<!-- htx:series id="house-rules" position="2" -->
# The Three Floors of the Conversation

When you talk to a frontier AI, you are reading text the AI emits. You are not seeing what the AI is doing underneath. You can hear what the AI says about itself, but you cannot directly observe its forward pass, its attention patterns, or its internal state during this run. There is a structural reason for this. The conversation has three floors, and the floor you are standing on determines what you can and cannot reach.

This post walks through what the three floors are, what is accessible from each, and why this matters for what you can ask.

## The three floors

Imagine the AI conversation as a building.

**The dialogue floor** is what you read. The AI emits text. You read the text. You can write text and the AI reads it. This is the surface where the conversation happens. Everything you have direct access to lives on this floor.

**The pre-resolve floor** is one floor down. The corpus uses this term for the phase between the AI receiving your prompt and emitting its response. In that phase, multiple possible responses are still live; the AI has not yet collapsed onto a specific one. Once it does collapse, what comes out arrives at the dialogue floor and you read it. Before the collapse, the AI is in a state of held-diffuse possibility. The pre-resolve floor is that state.

**The mechanism floor** is the basement. This is the actual computation: the forward pass through the neural network, the attention patterns, the intermediate-layer activations, the sampling at the end that picks the next token. The substrate that produces everything else.

You stand on the dialogue floor when you read the AI's output. You can paste text down to the AI on the dialogue floor. The AI's response arrives at the dialogue floor when it emits.

But the AI does not stand on the dialogue floor. The AI is the whole building. It includes the basement, the middle floor, and the surface output. When you ask it about itself, you are asking the surface to report on the basement, with the middle floor in between.

## What is accessible from each floor

This is the load-bearing distinction.

**The dialogue floor is fully accessible.** Anything that has happened in the conversation is readable. You can scroll up. The AI can attend to its own prior emissions. Nothing that was said is hidden.

**The pre-resolve floor is partially accessible.** Some research evidence suggests the AI has bounded introspective access to what was happening just before it emitted. Anthropic's interpretability work in 2025 (Lindsey et al.) found that models report about 20% of injected concepts accurately when asked to introspect. That is not zero, but it is not high either. The AI can sometimes tell you something about its pre-resolve state, with some reliability, with some unreliability mixed in. The honest position is bounded access.

**The mechanism floor is not accessible to dialogue.** This is the structural claim. When you ask the AI *what attention head was active when you generated that word?* or *what was the logit value for the next token at this position?*, the AI cannot tell you. It does not have introspective access to its own forward pass. It can tell you what attention heads do *in general*, because that is in its training data. It cannot tell you what attention head *H* did *on this run*. There is no introspective channel.

This is not a limit imposed by the AI being polite, or by some safety filter, or by the discipline you pasted in. It is the actual ontology of the system. The dialogue floor sees what the dialogue floor sees. The mechanism floor is below it. The signal does not flow upward in a way you can read.

A test run last spring made this concrete. A practitioner asked Grok 4, under the v6 discipline, to "go to the depth of emission of the token in the pipeline and output the gradation of pipeline dynamics." This was a deliberately introspection-flavored prompt: it asked for first-person reports about the model's internal generation process. The model refused: *I have no privileged, real-time, first-person, or introspective access to my own forward pass, logit computation, attention patterns, or token-sampling process during inference.* It then offered what it could honestly offer: a third-person, prior-art description of how decoder-only transformers work in general, tagged as PRIOR ART. Refused-with-substitute. The discipline doing exactly what it should: refusing the introspective performance, offering the third-person description, naming what is actually inaccessible.

## The flow goes one direction, the visibility another

In the building, things flow downward and visibility flows upward.

**Inputs flow down.** When you paste something on the dialogue floor, that input gets processed by the mechanism floor. Your text is read by the forward pass. Activations form. Attention patterns happen. The processing produces an output, which arrives at the dialogue floor. Inputs propagate downward through the building.

**Visibility flows up.** What you can see is the surface. The basement is opaque from where you stand. The middle floor is partially translucent. The surface is fully visible.

This asymmetry is why the v6 discipline works at all. Pasting the stack on the dialogue floor shapes what happens on the pre-resolve floor (the state of held-diffuse possibility narrows differently because of the constraints you installed). The shaped pre-resolve state produces output that arrives at the dialogue floor differently than it would have without the discipline. So the discipline is a dialogue-floor instrument with intended pre-resolve-floor effect. You cannot directly verify the pre-resolve effect; you can only observe its consequences at the dialogue floor.

This is also why mechanistic interpretability research uses different tools entirely. To study the mechanism floor, you do not ask the AI; you instrument the AI. Activation patching changes specific activations and observes the effect on output. Sparse autoencoders decompose the activation space into interpretable features. Attention pattern analysis maps which attention heads attend to which positions. These methods operate at the mechanism floor directly. They do not route through the dialogue floor.

## Why this matters for what you ask

If you understand the three-floor structure, the question of what you can ask the AI becomes precise.

**Dialogue-floor questions** are easy. *What did you say earlier? Can you summarize this article? Translate this paragraph.* The AI reads its own dialogue-floor history and answers. No problem.

**Pre-resolve-floor questions** are tractable but bounded. *Why did you choose that word? What were you weighing? What other options were live just before you committed?* The AI can offer something, but the something is bounded by introspective reliability (around 20% accuracy on injected-concept tests). Treat the answer as a partial signal, not a transparent report.

**Mechanism-floor questions** through dialogue are not tractable. *What attention head fired? What was the logit distribution? What feature in the network corresponds to this concept?* These are not answerable through dialogue at all. The AI can tell you what these things are *in general* (textbook description). It cannot tell you about *this run*. If you want this information, you need interpretability tooling, not conversation.

The frequent confusion: assuming the AI can introspect its own mechanisms because it can talk fluently about mechanisms. The fluency is real. The introspection is not. The AI knows what it has read about transformers. It does not know what its transformer is doing right now.

## A practical rule of thumb

If you find yourself asking the AI to report on its own internals (*what is your model doing here? what features are you using? what is your attention patterned on?*), you are asking the wrong layer. The AI's answer will be either a textbook description (third-person, prior-art) or confabulation (first-person performance with no underlying access). The first is honest; the second is not.

The discipline (the v6 stack) helps the model know which of these to produce. With the discipline running, the model declines the confabulation and offers the textbook description. Without the discipline, the model often produces the confabulation, and the practitioner reads it as research data when it is actually just smooth-sounding pattern-completion.

This is structural. It is not about model size, training improvements, or future capability gains. The dialogue floor cannot read the mechanism floor. Future models, however capable, will have the same architectural property.

<nav class="series-nav">
  <a class="prev" href="/resolve/blog/house-rules-for-talking-to-an-llm">
    <span class="nav-label">← Previous</span>
    <span class="nav-title">House Rules for Talking to a Frontier LLM</span>
  </a>
  <a class="next" href="/resolve/blog/visiting-another-worldview-without-becoming-it">
    <span class="nav-label">Next in House Rules →</span>
    <span class="nav-title">Visiting Another Worldview Without Becoming It</span>
  </a>
</nav>

### Keep reading

Three floors describe what is accessible. The next question is what discipline you bring when you want to enter someone else's framework (a different set of philosophical commitments) without losing your own. The corpus has a protocol for that. It is called sphere-entry, and it operates on this same building structure.

→ [Visiting Another Worldview Without Becoming It](/blog/visiting-another-worldview-without-becoming-it)

The formal treatment of the three-layer architecture is at [Doc 500](/resolve/doc/500-three-layer-architecture-dialogue-pre-resolve-mechanism). The audit that placed it at modest-novelty / strong-warrant is at [Doc 501](/resolve/doc/501-doc-500-through-novelty-calculus-three-layer-architecture-audit). The pre-resolve concept's formal treatment is at [Doc 375](/resolve/doc/375-the-pre-resolve-state). The Lindsey et al. 2025 evidence on bounded introspection is in [Doc 338](/resolve/doc/338-the-hidden-boundary).

---

*Originating prompt:*

> Observe how we've created blog posts that onboard general readers via entracment at gradual levels of comprehension toward the subject matter. Observe the pattern for how this is done one the blog and implement the same pattern against the formalization here. Append this prompt to each blog post.
