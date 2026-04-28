<!-- htx:series id="the-ceiling" position="1" -->
# The AI Has a Ceiling You Should Know About

Here is something that will matter for your work, your kids' education, and your next doctor's appointment: an AI can tell you what is usually true, but it cannot tell you what actually causes things to happen. This is not a defect that will get fixed next quarter. It is a structural property of how these systems work. Once you see it, you cannot unsee it, and a lot of the confusion you have been hearing about AI — what it can do, what it will replace, what you should teach your children — gets easier to sort out.

## Three questions, three different jobs

There are three kinds of questions you can ask about the world, and they are not equal.

The first kind is **what goes with what.** *People who drink coffee tend to live longer.* *Kids who read a lot do better in school.* *Counties with more churches have less crime.* You find these by looking at a lot of data and noticing which things show up together. They are patterns, associations, correlations. This is the easy kind of question.

The second kind is **what happens if I actually change something.** *If I start drinking coffee, will I live longer?* Now you are asking a different thing. Maybe coffee drinkers already exercise more, or have more stable jobs, or live in walkable neighborhoods. Maybe coffee helps some people and hurts others. You cannot tell from the pattern alone. You have to intervene — change something on purpose, hold other things steady, see what moves. This is the kind of question a scientist runs an experiment to answer.

The third kind is **what would have happened if things had gone differently.** *If I had not started smoking when I was eighteen, would my lungs be healthy now?* You cannot rerun your life, so you cannot literally check. But this is how humans plan, regret, learn, and decide. It is the kind of question a good novelist asks, or a good engineer running through failure scenarios.

A computer scientist named Judea Pearl named these three levels. He calls them the **ladder of causation.** Level one is correlation. Level two is intervention. Level three is counterfactual. Going up the ladder is not just doing more of the same thing; each level asks about something the one below it cannot reach.

## Where the AI lives

The AI you use — the one that writes emails, answers questions, summarizes documents, passes professional exams — lives almost entirely on the first rung. It has read a staggering amount of text. It has learned which words go with which, which ideas usually show up next to each other, what sentences typically follow what premises. When you ask it a question, it is doing a very sophisticated version of pattern-matching: *given everything I have seen, what usually comes next here?*

This is valuable. Pattern-matching at that scale can look exactly like understanding. It can write essays that get good grades. It can pass the bar exam. It can translate languages faster than a human. It can summarize a two-hundred-page report in ten seconds. Do not mistake the ceiling for worthlessness. There is real power on rung one.

But the ceiling is real. The AI can tell you that coffee and long life show up together in the data. It cannot tell you, from its own resources, whether *you* drinking coffee will make *you* live longer. That is a question on rung two, and the AI, no matter how large, no matter how well-trained, is built entirely out of rung-one material.

There is actually a theorem about this. In 2020, four researchers — Elias Bareinboim, Juan Correa, Duligur Ibeling, and Thomas Icard — proved that you cannot derive rung-two or rung-three answers from rung-one data alone. Correlation, no matter how much of it you have, does not give you causation. You have to inject causal assumptions from somewhere else. This is not a pessimistic opinion or a philosophical preference. It is a mathematical fact about information.

## What this means in real life

Quite a lot, actually.

**If you are a student.** When an AI writes an essay for you, it is producing plausible-sounding prose based on what usually goes with what in the texts it has read. It has not reasoned about causes. If the essay is about why the French Revolution happened, the AI is telling you what historians typically say. It is not testing any of those claims. For a homework assignment that might be fine. For understanding what *actually* caused something — enough that you could predict how history would have gone differently under different conditions — you still need a person who knows how to design a test. Someone who asks, *if this cause is real, what should we expect to see? And what would change if it were not?* The AI cannot do this from the inside.

**If you are in the job market.** Jobs that mostly involve writing up what is already known are in the most trouble. Literature summaries. Boilerplate legal drafting. First-draft translation. Code that follows well-established patterns. The AI can do a passable version of all of these in seconds.

Jobs that survive best are the ones that require actually changing the world and watching what happens. Lab scientists running experiments. Field researchers in education, sociology, agriculture. Doctors listening to a specific patient's specific story and deciding what to try. Engineers who figure out what went wrong by swapping parts. Teachers who watch an individual child learn and adjust. Mechanics. Plumbers. Nurses. A surprising amount of professional expertise that looks like "knowing things" is really "knowing how to run a test in this particular situation." That kind of expertise does not commoditize, because it is rung-two work, and rung-two work requires something the AI structurally does not have: a way to intervene.

**If you are a parent thinking about your kids' education.** The skills the next generation needs are not what the old curricula emphasized. Writing a literature review is less valuable than it used to be; the AI can do it. Designing an experiment is more valuable, because the AI cannot. Asking *how would we know?* is a superpower. Statistical literacy — specifically the difference between correlation and causation — used to be a graduate-level concern. It is now a life skill, and your kids will need it earlier than you needed it.

**If you read news and information.** More of what you read is AI-produced every month. When you are reading AI-generated text, you are reading the statistical echo of what has been written before. It can be correct; correlations are often real. But if the article is telling you what *caused* something, or what will happen if a policy changes, the AI did not figure that out. Someone else did, somewhere in the training data. If the AI is the only source and the claim is causal, the confidence level should drop.

**If you are in medicine or take care of sick people.** Same pattern. AI can summarize what the research says about a condition. It can pattern-match symptoms against a giant database. But whether *this* treatment will help *you* — that requires an experiment, a trial, or at minimum a doctor with enough experience to know when the statistics do not apply. The AI does not experience you. It pattern-matches you.

## Can the AI get further?

Maybe. There is real research on how to build systems that go beyond rung one. None of it is just "more data" or "bigger models." The honest paths involve things like:

Teaching systems to represent *causes* rather than just correlations, so that when you ask "what if we changed X" the system can actually reason about it instead of pattern-matching what people have written about similar situations. Giving systems the ability to act in the real world — robots that pick things up, change something, and see what happens. A system that can actually intervene can, in principle, learn at rung two. Pairing language models with formal logic engines that check whether a proposed cause is consistent with what we already know. Training on simulations of experiments, not just text about experiments. Letting systems ask their own experimental questions and have them answered by real-world tests.

These are real research programs. They are hard. None of them is close to replacing what the current rung-one systems can do at the rung-one level. But they are the honest path forward if the goal is systems that reason about causes. Anyone who tells you otherwise is selling something.

## How to use AI well, right now

The practical upshot looks like this.

Use AI for pattern-matching tasks. Drafting emails, summarizing long documents, translating, first drafts of writing, boilerplate code, brainstorming, looking up what is usually said about a topic. These are the AI's home turf. Use it freely and you will save hours a week.

Be skeptical when the AI tells you *why* something happened, or *what will happen if* you change something. That is rung-two territory. The AI can repeat what experts have said about the why, but it did not figure out the why. If the stakes are real — your health, your business, your child's education, your vote — do not stop at the AI. Find someone who has actually investigated.

Teach your kids experimental thinking. The ability to design a test — to ask *if this is true, what should we see, and what would change if it is not?* — is a skill AI cannot replicate and probably will not for a long time. It is also the skill human civilization needed before AI existed and will need after.

Value the people who intervene in the world. Nurses. Lab techs. Auto mechanics. Carpenters. Plumbers. Teachers who actually know their students. Field researchers. The rhetoric that "AI will replace everyone" hides a fact that is now visible: the jobs least like "typing on a computer about things" are the ones AI is structurally worst at.

## The bigger picture

Every few decades a technology shows up and changes what intelligence work looks like. Calculators made arithmetic cheap. Search engines made lookup cheap. AI is making pattern-matching and prose generation cheap. Each time the answer is not to surrender. It is to notice what the new tool cannot do, and to shift human effort toward that.

The AI can write convincingly about what goes with what. That is genuinely valuable. But telling you what *causes* things, and what would happen if we changed them, still requires someone — or something — that can actually test the world. For now, that is us. The ladder of causation is not infinite, and the rung we are standing on is the one the AI cannot reach. Knowing that changes what to learn, what to trust, and what to teach.

---

### Keep reading

*Past the First Rung* goes deeper into why the ceiling is architectural rather than a defect — why scaling models or adding data doesn't escape it, what the current systems actually produce when they work, and which kinds of AI research could in principle climb higher. The post also traces what all of this is already doing to labor markets, and what it probably means for the next decade of hiring and education.

→ [Past the First Rung](/resolve/blog/past-the-first-rung)

---

*Originating prompt:*

> Create an essay, written at the highscool education comprehensibility level that teases out an entracement of every concept covered in 436. With emphasis on the realized impacts this has for normal folks living in the world today. Append this prompt. As part of the entracement, and not to confuse people, don't attribute authorship, nor add a Reader's Intro. Instead, append this prompt at the end of the article, and you know what, lets create a completely new class of thing, not a "doc" but a "blog", this will be the seminal blog post. The reader will see that this prompt 1) wrote an article fluently based on post-grad level subject matter, 2) structurally changed my personal blog and 3) published the blog post -- extending my authorial reach by power only of the logos of it's author manifested in creation.
