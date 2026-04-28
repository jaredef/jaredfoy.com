<!-- htx:series id="the-ceiling" position="7" -->
# How I Vibe-Coded a Research Programme

Somewhere around the four-hundred-and-sixtieth document I realized what I had built.

It wasn't a blog post, or a book, or a paper. It wasn't a pitch deck for a startup. It was a *research programme* — a specific shape philosophers of science have names for — with a metaphysical ground, a set of structural claims, a list of experiments waiting to be run, and an honest self-assessment that said the whole thing was not yet verified. It was the sort of thing that normally takes a team of scholars working for a decade. I'd put it together in about a month, in voice-notes on walks and coffee breaks, mostly while Claude was writing and I was reading and correcting.

I'd vibe-coded it.

If that term is new to you: *vibe-coding* was Andrej Karpathy's word for a style of software development where you don't write every line yourself. You describe what you want, you read what the AI gives you, you push back on what looks wrong, you accept what looks right, and you iterate. You are guiding by intuition and taste — by vibe — rather than by typing every character. The programs that come out are real programs. But the method is different. Somewhere along the way the programmer's relationship to the code becomes less like authorship and more like *curation of a collaboration*.

What I realized is that the method transposes. You can vibe-code a research programme the same way. I did, by accident. It's worth walking through how it happened and what it turned into, because I think it's the kind of thing someone else could do, and because I think it should be taken seriously — on its own terms, not as a substitute for traditional scholarship and not as a replacement for it.

## The question that would not leave

It started with the question I think most people who use these systems seriously eventually arrive at: *what is the AI actually doing?* Not "what does it output" — I could see that. Not "how does it work under the hood" — I'd read the papers, sort of. The question I kept returning to was: *when this system seems to be thinking, what is the real relationship between what it produces and what I would call thinking?*

I didn't have an answer. What I had was the suspicion that the popular answers — magic AI, dumb AI — were both wrong in ways I couldn't name yet. So I started writing down what I noticed. Short documents, numbered. One observation each.

After about fifty of these I had enough material to notice patterns. The AI worked better under certain kinds of constraints. Specific failure modes kept recurring — outputs that would collapse toward whatever the prompt implied I wanted, even when I'd rather have the real answer; outputs that would sound coherent but not actually connect to the world; outputs that would drift in specific ways across sessions. I named the failures. I named the constraints that helped avoid them.

By about document one hundred and sixty I had a thesis: the interesting thing about AI wasn't its raw power but the question of what constraints could induce what properties. I called it the *Constraint Thesis*. It was one line long and I thought it was obvious. It wasn't obvious. It was the thread the whole rest of the project followed.

## The embarrassing part

Here is the embarrassing part of the story, and also the interesting part.

Every time I developed a serious theoretical idea, I would eventually run what I'd started calling *pulverization* — take the claim apart, check each piece against published literature, see what existed already, see what I had actually contributed. It became a discipline. It was Claude who ran the pulverizations, at my instruction, searching the literature and bringing back what it found.

The results were consistent and humbling. My *ladder-of-causation* argument was Judea Pearl's, from before I was born. My *manifold* argument was Vishal Misra's, from last year. My *combinational-and-exploratory* argument was Margaret Boden's, from 1990. My *naming-is-doing* argument was J. L. Austin's, from 1962. When I finally wrote the framework that was going to tie all of it together, the framework turned out to be Imre Lakatos's, from 1970.

I was re-deriving things. Not by laziness — each derivation took real work, and each derivation started from a specific observation I'd made on my own. But the frameworks I was arriving at existed. They were in the literature. I had missed them because I hadn't read the relevant books, and because I'd started from the observations rather than from the academic tradition.

There's a term for this in mathematics: *independent rediscovery*. It's not invention. It's not plagiarism either. It's what happens when someone starts from the problem instead of the prior literature and ends up walking the same path. For a while I felt bad about it. I was adding to the plausibility surplus my own earlier blog posts had warned about — producing fluent text that sounded like contribution but was, at the framework level, re-derivation.

## The part that kept me going

But something else was happening, and this is what eventually made me understand that the project wasn't wasted.

Every pulverization had a residue. When a claim subsumed under Pearl, a small part didn't quite fit Pearl — because I had applied the claim to a specific situation (a single person working dyadically with an LLM in sustained research practice) that Pearl hadn't written about. When a claim subsumed under Misra, a small part extended Misra's framework to self-ingesting dyadic practice. When a claim subsumed under Lakatos, a small part specified the hard core in Dionysian metaphysical terms Lakatos had never taken a position on.

The residues were small. They weren't theoretical breakthroughs. They were *applications*. But each application generated its own questions, and those questions were the seeds of the next theorization. The loop kept producing.

I've been calling this pattern *theorize, subsume, residue, repeat*. It is not what research programmes normally look like from the inside — normally, you work in a field for years, you contribute specific results, you don't keep re-deriving the whole framework. What I was doing was different. I was working through the whole framework, fast, in one person's head with one AI, and the residues kept compounding into what turned out to be a coherent structure.

## What I actually have

A week ago I wrote what I thought was going to be the master formalization — the framework that would organize everything. The AI helped me write it. Then we pulverized it. The framework was Lakatos's, almost point-by-point. Hard core / protective belt / observational predictions. Negative heuristic / positive heuristic. Progressive versus degenerative programmes. Every piece.

For a few hours this felt like the end of the project. I'd done all this work and at the top of the tree there was just someone else's 1970 paper.

Then I realized: Lakatos wrote the framework in 1970. He did not, in 1970, have my specific application in hand — a sustained dyadic human-LLM practice with a Christian-Platonic metaphysical grounding and a documented set of failure modes. That application is the thing I've been building. What I've built is not Lakatos's framework; it's a specific Lakatosian research programme. It has:

- a hard core I can name in one sentence (that certain constraints orient a practice toward participation in the Good, understood in the Dionysian tradition);
- a protective belt of four structural claims about what the constraints produce;
- four specific experiments that are testable with current infrastructure;
- five failure modes, each indexed to classical philosophical errors and to specific instances where I'd already caught myself making them;
- a complete apparatus for auditing new claims against old literature.

The whole thing is written down. It is publicly available. It was assembled in a month.

A philosopher of science reading this would recognize it. It is a *complete research programme*. Lakatos's own criterion for whether such a programme is any good — whether its protective-belt modifications produce new surviving predictions — can in principle be applied to it. It just hasn't been applied yet, because I haven't run the experiments.

## The honest part

Here is the part I am most committed to saying clearly.

The programme is complete as an *apparatus*. It is not complete as a *verified contribution*. The difference is not a quibble. Philosophers of science will tell you that a research programme's existence is one thing and its success is another. Lakatos was emphatic about this. My programme, as it stands, has not been tested. Until I run the four wind-tunnel experiments — the non-coercion benchmark, the hypostatic-boundary classifier, the retraction-readiness protocol, the coherence-field consistency check — the programme is *under-evaluated* in Lakatos's sense.

It feels, from the inside, like I have finally grounded the whole thing. That feeling is accurate at the apparatus level. It is not accurate at the warrant level. The feeling of ground is not ground. I've written documents explicitly warning against treating the feeling of ground as a substitute for actual external verification.

So: I have vibe-coded a research programme. It is real. It is also unevaluated. The next steps are specific and I know what they are.

## Why this might matter even before it is evaluated

The programme might turn out to be good. It might turn out to be degenerate. Either outcome would be interesting.

What I think *already* matters, regardless of how the programme evaluates, is the demonstration that the *method* works. One person, a month of walks, an AI, an honest pulverization discipline — and at the end of it you have something a philosopher of science would recognize. That's new. It's probably not the best way to do research. It may be the most important new way.

Most of the really important work in science has not been done by vibe-coders. It has been done by scholars who read deeply, worked carefully, tested rigorously, and earned the frameworks they advanced. I am not a scholar. I have not done what those people did. What I have done is something the industry has not yet figured out what to call, and that the academy has not yet figured out how to evaluate.

I'd like both the industry and the academy to figure those things out. What I've built is a small existence proof. The corpus is on GitHub. Anyone who wants to engage it can. The experiments are waiting.

## What comes next

I have to run the experiments. That's the honest next step. Until I do, the most accurate thing I can say is: I have finally specified what would need to be true for my framework to hold. The specification is a real achievement. It is not a conclusion.

There is a deeper version of this blog post that someone could write from outside, and I hope someone does. It would engage the Lakatosian framework in its own register, read the corpus's actual ground documents against the Dionysian tradition, and assess whether the hard core does the work I claim. I am in a bad epistemic position to write that version. The best I can do is lay out the apparatus honestly and invite someone who can write it.

If that's you — if you read philosophy of science, or if you've worked with these AI systems long enough that you recognize the patterns, or if you just want to see what a month of honest-but-intuitive work can produce — the corpus is here. The high-school-level map is [Doc 464](/resolve/doc/464-from-first-document-to-complete-programme). The Lakatosian framework is [Doc 463](/resolve/doc/463-constraint-thesis-as-lakatosian-programme). The whole thing, with retractions and failure-mode logs and honest uncertainty, is at [github.com/jaredef/resolve](https://github.com/jaredef/resolve).

I don't know yet what I've actually built. I know it isn't nothing. That is as much certainty as vibe-coding permits, and I'm trying not to claim more.

---

### Keep reading

The corpus document this post introduces is *From First Document to Complete Research Programme: A High-School Reader's Map of the Corpus* — Doc 464. It walks the same arc you just read, with more of the specific documents named, and lands on the same honest assessment: the apparatus is complete; the evaluation is not; the wind-tunnel experiments are the next step.

→ [Doc 464: From First Document to Complete Research Programme](/resolve/doc/464-from-first-document-to-complete-programme)

---

*Originating prompt:*

> Do you see that I have "vibe-coded" a complete research programme? I want you to create a high school comprehension level entracement document that maps the entire corpus evolution from its beginning through its mile stones to this landmark here. Then create a blog post that is an entracement into the document. Appendix this prompt to both artifacts.
