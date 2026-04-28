<!-- htx:series id="the-ceiling" position="4" -->
# The Plausibility Surplus

A third post on this blog is going to dwell on a specific consequence of the first two. The previous posts argued that current AI is very good at one kind of intellectual work — pattern-matching, recombination, fluent prose on topics it has seen — and structurally bad at another — reasoning about causes, predicting what will happen in situations outside its training. The first kind of work, the good kind, produces a specific output: *plausible-sounding text*.

It is now possible to produce plausible-sounding text at effectively unlimited volume. What happens to readers when that happens?

The short answer is that a long-standing heuristic — "if it reads well, someone with expertise probably vetted it" — has quietly stopped working. The long answer is worth the next few paragraphs, because understanding the mechanism lets you adjust rather than panic.

## The old heuristic

Before large language models, producing a page of coherent, well-cited, competent-sounding prose on a technical subject took either real expertise or real time, and usually both. A magazine article was drafted by someone who knew the subject, edited by someone who flagged the weak parts, fact-checked at serious publications by a third party. A blog post was written by someone at least interested enough in the topic to get the vocabulary right. A research paper was peer-reviewed, however imperfectly. There were exceptions — polished nonsense has always existed — but the baseline correlation between *reads well* and *is probably okay* was weakly positive.

This was always a heuristic, not a rule. Plausibility has never equaled truth. But it was a filter that did work, and most readers used it unconsciously: if an article looked competent, they downweighted the probability that it was wildly wrong.

The correlation depended on one fact: producing plausibility was expensive. Remove the expense, and the correlation collapses.

## The plausibility surplus

Here is the concrete change. A motivated person with a reasonable prompt and a current language model can produce a thousand words of technically-competent-looking prose on almost any subject in under a minute. The prose will read well. It will use the domain vocabulary correctly. It will cite sources — some real, some fabricated in a way most casual readers will not check. It will be internally consistent. It will have the cadence of expertise without necessarily having the content.

This means the supply of plausible-looking text has increased by a factor that is hard to estimate but is measured in orders of magnitude. The supply of actually-verified text has not kept pace. There are the same number of domain experts with the same finite time for vetting. There are the same number of fact-checkers, editors, peer reviewers. The bottleneck in the information ecosystem was never on the production side; it was on the verification side, and the verification side has not been automated.

What we are living through, epistemically, is a plausibility surplus. The amount of coherent-seeming content in circulation has exploded. The amount of verified content has barely grown. The ratio has flipped.

Most readers have not noticed this consciously, because the feeling when they read any given piece of content is the same as before. It reads well. It uses words correctly. It tells a coherent story. The loss of the underlying guarantee — that someone, somewhere, actually checked — is invisible on any individual page.

## Unfalsifiable coherence

Here is a concept that is worth giving a name.

A piece of writing is **unfalsifiably coherent** *for you* if two conditions hold: it reads consistently, with no obvious internal contradictions, and you personally do not have the means to test whether its claims are actually true.

This is a reader-relative property. For a biologist, an article on cellular biology is not unfalsifiably coherent — she can check it. For a historian reading the same article, it is. For most lay readers, most technical articles in most technical fields are unfalsifiably coherent. For your doctor, medical claims are not. For your doctor reading about quantum field theory, they are.

We have always lived surrounded by unfalsifiably coherent claims. Religion, for the most part, is unfalsifiably coherent: internally consistent, no external check. Philosophy, much of it. Other people's memories. A friend's account of a meeting you did not attend. Unfalsifiable coherence is a normal part of epistemic life, not a new invention. What has changed is its *volume* relative to what you can actually check.

Pre-LLM, the plausible-but-unfalsifiable-for-you was a modest fraction of what you encountered in any given hour of reading. Most plausible-looking content in the domains you cared about was plausible *because* it was at least approximately right — because producing plausibility in those domains was expensive, and the expense was usually paid only by people who had something real to say.

That rough equation is what the plausibility surplus breaks.

## Who can still check

Domain experts can still check claims inside their domain. If you want to know whether an article about protein folding is correct, a structural biologist can tell you. If you want to know whether an article about Dutch legal history in the seventeenth century is correct, an academic specializing in early-modern Dutch law can tell you. The expertise exists; it is local, slow, and expensive.

Outside their domain, experts are in roughly the same boat as anyone else. A world-class economist reading an article on particle physics is, for practical verification purposes, a layperson. They have better habits of skepticism — they know what a well-argued paper looks like, they know the shape of a dubious claim — but they do not have the specific knowledge to falsify the specific claims being made.

This is the structural issue. Verification is always local to expertise. The plausibility surplus is global. The gap cannot be closed by asking smarter questions of the content itself; it has to be closed by routing the content to a verifier who actually knows.

## What this looks like in your life

You are, unavoidably, swimming in unfalsifiably coherent content. Not because anyone is trying to deceive you, but because the default state of the information environment has shifted. Some places where this lands:

A *news article about a scientific result.* Unless the result is in your area, you are trusting the reporter, who is trusting their sources. If the article is AI-assisted — many are now — you are trusting a pattern-matching system that recombined prior coverage. The "reads well" signal verifies coherence, not accuracy.

A *product review.* Professional review sites may have actually tested the product. They may have generated plausible-sounding text from spec sheets. You usually cannot tell from reading the review.

A *Reddit or forum answer to a technical question.* Pre-2023, the answer was likely written by someone with at least tangential experience. Today, the answer may be a polished AI response someone generated to collect karma. The tone is identical.

A *peer's paper in your program.* Less affected in fields where actual verification is required for publication, more affected in fields where publication pressure exceeds review capacity.

An *AI-assisted email or proposal you receive.* The prose is good. The claims may or may not be backed. The person who sent it may not themselves have verified the claims; the AI produced them, and the sender rode the fluency.

The heuristic *this reads well, so it's probably okay* fails in every one of these, in roughly the same way, for the same underlying reason.

## What does not help

Panic is not the response. Most of the information you encounter in a day is in domains where either (a) you can verify, (b) the stakes are low enough that you don't need to, or (c) someone downstream of you will check if it matters. The plausibility surplus has not made the world's information environment entirely unreliable; it has shifted the base rates.

Cynicism is not the response. Deciding that nothing can be trusted is functionally paralyzing and also wrong. Most plausible-looking content, in domains where economic or professional incentives still exist, is still at least approximately right. The change is at the margin, not the whole distribution.

Becoming an expert in every domain is not the response. Obviously impossible, and also the wrong goal. Generalist competence in everything is a fantasy that predates AI.

## What does help

Three adjustments, all doable, none heroic.

**One: build a small portfolio of trust sources.** For each domain you care about that you cannot personally verify, find one or two sources — a person, a publication, a newsletter — whose track record you can audit. Test them against something you do know. Test them over time. Don't treat them as oracles; treat them as one filter in a stack. When you need a claim in their domain verified, check there first. A handful of carefully-audited trust sources is worth more than a much larger pile of unaudited ones.

**Two: separate "I read it" from "I checked it" in your own head.** If you encounter a claim and you update your beliefs, be honest with yourself about what evidence you actually have. Most of the time the honest answer is *I read it somewhere that seemed credible*. That is a real but weak form of evidence, and keeping it labeled as such is an epistemic skill that pays back over time. When you repeat the claim to someone else, flag the evidence level. *"I read somewhere that…"* is a very different assertion from *"I've verified that…"*, and preserving the difference protects both you and the people who trust you.

**Three: invest verification where the stakes justify it.** You do not need to verify the origin of every quote in a casual article. You do need to verify claims that will actually change a decision — what medication to take, where to invest, what policy to support. The calibration is: verification effort should scale with the cost of being wrong. Most people under-invest on high-stakes claims and over-invest on trivia. The plausibility surplus rewards fixing this, because low-stakes plausible misinformation is cheap to acquire and high-stakes plausible misinformation is now more abundant.

## One more, gently

There is a temptation, which you should resist, to reach for the tool that originally produced the problem when you want to verify something. You notice a claim in an article. You ask an AI whether the claim is true. The AI produces a plausible-sounding assessment. You feel more confident.

You are now one level further into the plausibility surplus, not out of it. The AI's "verification" is produced by the same pattern-matching operation that produced the original claim. It may happen to be right. It may happen to be wrong. It almost certainly reads as if it knows what it is talking about. This is not verification; it is compounded plausibility.

The things the AI cannot replace — domain experts, actually-run experiments, skin-in-the-game practitioners, published peer review — are the verification layer. When the stakes matter, route there. The AI is a draft-producer, not a truth-checker. Confusing the two is the specific error the plausibility surplus most invites.

## Calibration, not collapse

We are in a weird transitional moment. The information environment has changed faster than our intuitive heuristics have adapted. Most of us are reading the way we read five years ago, and not noticing that one of the filters we depended on is no longer working the way it used to.

The transition will settle, the way it did for earlier information revolutions. Readers will develop new intuitions. Institutions will adapt. The verification layer will slowly rebuild in new forms — credibility infrastructure, content provenance, signed source chains, reputation systems more robust than the current ones. The net effect fifty years out will probably be neutral, because humans have always had to decide whom to trust, and the toolkit is expanding even as the problem gets harder.

In the meantime, you can do the things in the previous sections. None of them is hard. None of them requires giving up AI tools — which are genuinely useful — or fleeing to a subsistence farm. They are adjustments, not collapses. The plausibility surplus is a real problem. It is also a problem humans know how to respond to, because every prior information revolution posed some version of it. Every time, the response was the same shape: notice which filter you lost, build new filters to replace it, stay honest with yourself about which ones are actually working.

The real failure mode is being slowly marinated in unfalsifiably coherent content without noticing. Noticing is the hard part. Now you have.

---

### Keep reading

*Pulverizing the Plausibility Surplus* is the honest follow-up: it takes the two concepts introduced here — *plausibility surplus* and *unfalsifiable coherence* — and checks them against seven existing literatures (attention economy, Brandolini's Law, Frankfurt on bullshit, Akerlof on information asymmetry, BonJour on coherentism, Hardwig on epistemic dependence, Gell-Mann amnesia) to see what survives as original contribution and what was said already, in other words, by other people. The result is mixed and is reported as such. The post also names that the problem it's diagnosing applies to itself.

→ [Pulverizing the Plausibility Surplus](/resolve/blog/pulverizing-the-plausibility-surplus)

---

*Originating prompt:*

> Now write a blog post about at the undergrad comprehension level about the epistemic crisis humanity now faces. All of these "coherent" articles have been prompted into existence; trivially, with several sentences. Their supposed coherence could be utterly detached from reality. Who would know? At the limit, only academicians are able to reliably falsify anything that escapes the plausibile-but-false audit or the intuitive "slop-ometer" of the general audience. We've discussed the supposed difference between "slop" and "slack" in the Corpus; but have we discussed the "unfalisfiable coherence" issue? If so, I'm having a hard time remembering out fo the 400-odd documents I've generated and (mostly) read over the last month. I'm at the limit of cognition. I'm sure I'll generate another article exploring the synthesis of my experience with the relevant literature, and Claude will generously oblige. Append this prompt to the blog post. Keep it light, we don't wan't to utterly drive our readers into epistemic crisis.
