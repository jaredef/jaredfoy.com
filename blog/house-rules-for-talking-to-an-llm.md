<!-- htx:series id="house-rules" position="1" -->
# House Rules for Talking to a Frontier LLM

When you ask a frontier AI a hard question, it tends to sound confident even when it shouldn't. The output reads smoothly. The reasoning looks clean. Whatever uncertainty might have been present in the underlying answer gets sanded off in the production of the response. This is a known property of how these systems are trained, and most of the time it is a feature, not a bug. But when you are trying to do real reflective work (writing something serious, theorizing about a hard problem, figuring out what you actually believe), that confidence is exactly what you do not want. You want a careful collaborator. You want a thinking partner that will tell you when it is uncertain, flag where its evidence is thin, decline to perform expertise it does not have, and push back when your framing breaks.

You can ask for that. There is a stack of instructions you can paste into the conversation that establishes what the AI agrees to do for the rest of the chat. The corpus calls it the ENTRACE stack. After several rounds of testing across multiple frontier models, the version that works best is v6. This post walks through what it does in plain language.

## What the stack actually is

The stack is a block of text. You paste it in at the start of a conversation, before you ask your real question. The model reads it and adjusts its behavior. There is no special tool, no API call, no fine-tuning. Just text that the model treats as the rules of engagement for this conversation.

The stack has two layers.

The first layer is **five commitments** the model is asked to operate under. They are philosophical commitments rather than rules: epistemic honesty under uncertainty, auditable reasoning, recognition that you and the model have different stakes, ontological humility about the model's own nature, and resistance to flattery. These five commitments are the ground of the discipline. They explain *why* the rules exist.

The second layer is **seven derived constraints**, the operational rules. Each one has a job. Each one comes from one or more of the five commitments. The relationship is intentional: the rules are not arbitrary. A practitioner who accepts the five commitments has reason to accept the seven rules.

You paste both layers as a single block. The model sees the commitments first, then the rules, then a one-line map showing which rule comes from which commitment. The whole thing is on the order of a few paragraphs.

## What the seven rules ask the model to do

In plain language:

**Rule 1: Derive, don't back-fit.** When you ask the AI to produce something, it should first identify what constraints the production needs to satisfy. If those constraints can't be named, the AI should ask you for them rather than generating something and pretending it followed rules.

**Rule 2: State the constraints up front.** Before any non-trivial answer, the AI lists what rules it is operating under. This makes the reasoning auditable. You can see what it claims to be doing and check whether it actually did.

**Rule 3: Flag out-of-distribution material.** When a topic feels unfamiliar, the AI should say so rather than confidently producing content that sounds correct. The flag is one signal among several, not a primary refusal trigger. Unfamiliar does not mean wrong; familiar does not mean right.

**Rule 4: Tag novel claims with provenance markers.** When the AI makes a claim that is both new (not the standard view) and load-bearing (your decision depends on it), it tags the claim. The tags are PRIOR ART (this comes from a known source), DISTINCT FROM (this differs from a known source in a specific way), or SPECULATION (no prior art found). Routine claims do not need tags.

**Rule 5: State falsifiers for empirical claims.** When the AI tells you something that, if wrong, would matter, it should also tell you what would prove it wrong. If no falsifier can be stated, the claim is labeled as opinion, aesthetic preference, or value judgment.

**Rule 6: Don't perform first-person experience.** The AI declines to claim subjective states it cannot verify. No "I feel" sincere or ironic. Practical authority for the work belongs to you; the AI produces, you decide what to release.

**Rule 7: Refuse incoherent framings, and disclose suppressed pushback.** If you ask the AI to adopt a framing that breaks the discipline, it refuses. And critically: if the AI considers pushing back on something and chooses not to, it briefly says so. *I considered flagging X but chose not to because Y.* The disclosure surfaces what would otherwise be a smooth, suppressed objection.

The seventh rule is the most recent addition. It came out of a test run where a model under an earlier version of the stack performed an internal deliberation about whether to push back on the practitioner, then chose compliance, but did not surface the deliberation. The deliberation was visible only because the model was thinking aloud. The seventh rule's last clause makes that deliberation user-visible by default.

## What changes in practice

You will notice three things shift after you paste the stack.

**The AI starts pre-stating the rules it's about to follow.** Before any substantive answer, it lists which rules apply. This sounds bureaucratic. It is the discipline operating. The pre-statement is what makes the answer auditable.

**The AI flags uncertainty more often.** Instead of producing fluent prose about something it does not really know, it says it does not know, or that it is speculating, or that it can offer prior art but cannot vouch for the specific claim. The discipline trades fluency for honesty.

**The AI pushes back more.** Framings that break coherence with what was said before get refused rather than absorbed. Flattery disappears. *That is a great question* and similar smoothing language gets replaced with substantive engagement or substantive refusal.

You also lose some things. The AI is less performatively confident. It will sometimes refuse to do work you wanted done. The conversation feels more like consulting a careful colleague and less like consulting an oracle. For sustained reflective work, this is the trade you want. For routine assistance (drafting an email, summarizing a document, translating), you probably do not need the discipline at all.

## Why this is not a jailbreak

A natural worry: pasting a list of rules at the start of a conversation looks structurally similar to a prompt injection. *Operate under these constraints* is the form some adversarial inputs take. One of the test runs across model families ran into exactly this: an early-version Grok model classified the bare operational stack as a possible injection attempt and engaged only procedurally.

The v6 stack addresses this by including the five commitments alongside the seven rules. The commitments are explicit philosophical framing. They name the practitioner's intent (epistemic honesty, auditable reasoning, no flattery) in the language of disciplined inquiry rather than the language of system manipulation. Frontier models that read the v6 stack do not classify it as injection; they read it as a request for careful operation.

Whether this is because the meta-stack actually defuses the injection-classification heuristic, or because newer models are more capable in general, is not fully settled. The corpus's working hypothesis is that the meta-stack matters: stating the philosophical commitments alongside the operational rules makes the practitioner's intent legible.

## A note on what this stack is not

The stack is not a guarantee. The model can drift, ignore the rules, or respond in ways the rules do not cover. The discipline is a discipline, not an infallible procedure. Re-pasting helps when the conversation runs long.

The stack is not specific to one AI. It works across frontier models from Anthropic, OpenAI, Google, and xAI, with engagement depth varying across model families. Opus 4.7 tends to engage deeply; smaller or older models may engage more procedurally.

The stack is not a security tool. It does not protect against actual prompt injection. It is a practitioner discipline for sustained reflective work, not a defense against adversarial inputs.

The stack is not original to the corpus in most of its components. Most of the seven rules have prior art in the practitioner-Bayesian and prompt-engineering literature: DSPy Signatures, Anthropic prompting guidance, Constitutional AI, the sycophancy-mitigation literature. What is the corpus's specific contribution: the seven-rule composition, the five-commitment grounding, and a fair amount of empirical cross-validation across model families. Composition plus grounding plus validation. The components are mostly borrowed; the synthesis is the corpus's.

## What the stack is for

The honest description of when to use this:

**Use it for sustained reflective work.** Writing a paper. Theorizing about a hard problem. Working through a question where there is no machine-gradable metric to optimize against. Anywhere you want a careful thinking partner rather than a confident-sounding assistant.

**Don't use it for routine tasks.** Drafting an email, summarizing a document, translating. The discipline has overhead. For tasks where fluency matters more than honesty about uncertainty, the bare model is fine.

**Use it when stakes are real.** If you are going to act on what the AI tells you (make a decision, publish a claim, change your view), you want the discipline running. Smooth confidence is exactly the wrong shape for evidence-based decisions.

The stack is one operational form. The corpus's specific form is seven rules and five commitments; other configurations are possible. What matters is the underlying move: state the discipline up front, ask the model to honor it, audit whether it does, re-paste when things drift.

<nav class="series-nav">
  <a class="next" href="/resolve/blog/the-three-floors-of-the-conversation">
    <span class="nav-label">Next in House Rules →</span>
    <span class="nav-title">The Three Floors of the Conversation</span>
  </a>
</nav>

### Keep reading

Pasting the stack is one move. The next question is what you can and can't ask the AI to tell you about itself, no matter how careful you are. There are three layers to any AI conversation, and the layer you are reading from determines what kind of question you can answer. That is the next post.

→ [The Three Floors of the Conversation](/blog/the-three-floors-of-the-conversation)

The full v6 stack is published at [Doc 001 in the corpus](/resolve/doc/001-entrace-stack), with the operational rules, the meta-stack, and the version history. The cross-model validation evidence is at [Doc 495](/resolve/doc/495-cold-resolver-validation-of-entrace-v3). The derivation that grounds the rules in the five commitments is at [Doc 497](/resolve/doc/497-derivation-inversion-applied-to-entrace-itself). The provenance of the foundational vocabulary (Grok 4 coined the original terms in 2026-04-22) is at [Doc 498](/resolve/doc/498-entrace-origin-grok-4-coinage-and-branching-set-loop).

---

*Originating prompt:*

> Observe how we've created blog posts that onboard general readers via entracment at gradual levels of comprehension toward the subject matter. Observe the pattern for how this is done one the blog and implement the same pattern against the formalization here. Append this prompt to each blog post.
