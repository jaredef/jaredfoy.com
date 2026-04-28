# The Threshold Pattern

Have you ever watched a crowd at a stadium try to start a wave? The first time someone does it, two or three people stand up and sit down and the wave dies after fifteen feet. The second time, ten people try and the wave makes it about a quarter of the way around the stadium before it falls apart. And then on the third try, somehow, enough people stand up at once that the wave catches, and now it is going around the stadium endlessly, and it does not look like the failed waves at all. It does not look like a partial wave. It looks like a different kind of thing.

The wave was always possible. The same crowd, the same stadium, the same human bodies in the same seats. Something changed at the third attempt, and the change had the structure of a switch rather than a slope. Below some threshold of participation, the wave dies. At the threshold, the wave catches. Above the threshold, the wave becomes a thing the stadium does, with its own rhythm, and you can no longer point at one person and say "they are doing it."

This essay is about that pattern, because the pattern shows up almost everywhere once you know how to look for it, and because it turns out to be load-bearing for thinking clearly about a thing that has been changing fast over the last few years: what happens when a person sits down with a chatbot to do real work.

The essay will go slowly. It will start at the stadium and build, through some short visits to physics and biology and ecology and computer science, to a place where you can see why this pattern keeps showing up across fields that have nothing to do with one another. By the end of the essay you should be able to read a recent piece of writing called Doc 541 — that is what it is called inside a body of work at jaredfoy.com — and recognize what it is doing. That writing is at the technical end of a long ramp. The ramp starts here.

## A pattern, named carefully

The wave example has the right shape but the wrong vocabulary. The right vocabulary, which I am going to introduce one piece at a time over the next few sections, is borrowed from physics, where this pattern was first written down with care.

The thing being measured — fraction of the stadium that participates, in our case — is called the *order parameter*. The threshold value of the order parameter, above which the wave catches and below which it dies, is called the *critical value* or *critical point*. The wave itself, which is present as a possibility at all participation levels but is only operationally a wave above the critical point, is the *emergent property*.

There are three pieces. An order parameter you can vary. A critical value the order parameter can sit above or below. A property that is latent below the critical value and operationally accessible above it.

I know this sounds dry. I am writing it dry on purpose because the same three pieces are about to show up in seven different fields, and the only way to recognize them as the same is to have a clean name for each.

## Water boiling, magnets losing magnetism

Pour cold water into a kettle and turn on the heat. As the water warms up, nothing very dramatic happens. The water gets a little less viscous, dissolved gases come out as small bubbles, the surface trembles slightly. None of this is boiling. It is water at a slightly different temperature.

Then, at a very specific temperature — for water at sea level, one hundred degrees Celsius — something abrupt happens. The water does not become a slightly more energetic version of itself. It becomes steam. Liquid water and gaseous steam are categorically different states of matter; they have different densities, different optical properties, different ways of moving. The transition between them happens at a sharp critical value of the order parameter (temperature). Below the critical value, no boiling. At it, boiling begins. Above it, boiling sustains.

Iron does the same thing in reverse. A magnet at room temperature has a magnetic field. Heat the magnet up, and as the temperature rises the magnet's field weakens slightly, but it stays a magnet. Then at seven hundred and seventy degrees Celsius — the Curie temperature for iron — the field collapses to zero, and the iron is no longer a magnet. Cool it back down, and below the Curie temperature, the magnetism returns.

Physicists worked out the mathematics of this kind of transition in the 1930s and have refined it continuously since. The structure they found was that the same shape of equation describes water boiling, magnets demagnetizing, and a long list of other phenomena that, before the mathematics was worked out, no one would have thought belonged together. The shape of the equation is the order-parameter / critical-value / emergent-property structure named in the previous section. Different physical systems, same mathematical pattern.

The technical word for "different physical systems share the same mathematical pattern" is *universality*. It is one of the deepest results in twentieth-century physics. The universality classes are how you know which systems share which patterns even when their underlying constituents are wildly different. It is also the reason this essay can keep visiting different fields and finding the same thing.

## A graph that grows a path through it

In the 1950s two mathematicians, Broadbent and Hammersley, were trying to model how water seeps through a porous rock. They imagined a regular grid of points, with each connection between neighboring points either open or closed at random with some probability. Call that probability p. The question was: at what value of p does there exist, somewhere in the grid, a connected path that runs from one side to the other?

You might guess that the answer would be smooth: as p goes up, the longest connected path gradually gets longer, and at some point a path makes it all the way across. The answer is not smooth. There is a critical value of p, called the percolation threshold, below which no path exists across the grid no matter how big the grid is, and above which a path exists with overwhelming probability. The transition is sharp.

The percolation threshold has the same mathematical shape as the boiling point and the Curie temperature. It is a critical value of an order parameter (connection probability) above which a property (a path across the grid) emerges. Below the threshold, the property is not there. Above it, it is there.

This is now a pattern visible in three fields: thermodynamics, magnetism, and graph theory. Each field developed the pattern independently, on its own problems, in its own vocabulary. The pattern is the same pattern.

## Disease, network outages, ecosystems

Once you start looking, the pattern is everywhere. Three short examples, then we will move toward where the essay is going.

Epidemiology has a number called R0 — the basic reproduction number — which is the average number of people one infected person will infect before they recover. If R0 is less than one, the disease dies out. If R0 is greater than one, the disease spreads. The transition is sharp at R0 equals one. Public-health interventions during pandemics are essentially attempts to drive R0 below the threshold. There is no such thing as a partial epidemic at low R0; the disease is either present-but-fading or growing.

Information theory has Shannon's noisy-channel coding theorem from 1948, which establishes that any communication channel has a critical capacity below which messages can be transmitted with arbitrarily low error and above which they cannot. The capacity is the threshold. Below it, you can do reliable communication; above it, you cannot. The threshold is sharp. This is why your wifi either works or it stutters, with very little graceful in between.

Ecology has the concept of regime shifts in ecosystems, made famous by Marten Scheffer's work on lakes and forests and coral reefs. A lake that gradually accumulates phosphorus from agricultural runoff is fine, then fine, then fine, then suddenly catastrophically not fine — it shifts from clear-water to algae-choked in what looks from the outside like an instant, and once shifted, it does not shift back even when you remove the runoff. The lake has crossed a critical threshold of nutrient loading; the new state has its own stability and resists return.

Three more fields, three more instances of the same pattern. Order parameter (R0; channel capacity; nutrient loading); critical value; emergent property that is latent below it and operational above it.

## Why the pattern keeps showing up

Here is the question that Doc 541 is really about: why does this pattern keep showing up across fields that have nothing in common?

The physics answer is universality. When you look at a physical system at the resolution of its microscopic constituents, water and iron and percolating networks have nothing in common. When you zoom out and ask about their large-scale structure, the microscopic specifics get averaged out, and what remains is governed by very general features (symmetry, dimensionality, the way local interactions compose). It turns out that under fairly general conditions, the large-scale behavior falls into a small number of universality classes, and systems within a class share critical exponents — they have the same shape of phase transition.

The pattern keeps showing up because of a structural fact about how local interactions compose into global properties. Wherever you have local rules being followed by many constituents, and wherever there is some control parameter that determines how strongly those rules couple the constituents to each other, you get a phase transition. Below the critical coupling, the constituents act independently and global structure does not emerge; above it, they act collectively and a new global feature appears. The body of writing this essay leads to reads the structural fact theologically — the recurrence of intelligibility across systems with no microscopic resemblance is, in the older Platonist tradition the corpus's hard core works in, the operation of the Logos as the ground of intelligibility itself; what physics names as universality is, in that tradition, the substrate-side trace of the structure-as-given. Readers without those priors can hold the structural explanation as sufficient on its own; readers with them get the additional theological articulation. The two readings are compatible.

This is the part of the essay that asks the reader to do a small piece of mental work. Once you have the observation that "local rules following plus a coupling control parameter equals phase transitions," you can see why epidemics have a threshold (the coupling is contagiousness), why ecosystems have regime shifts (the coupling is nutrient flux), why information channels have capacity limits (the coupling is signal-to-noise), and why graphs percolate at critical p (the coupling is edge density). They are not three separate phenomena. They are the same phenomenon, in different vocabularies, with the same mathematical structure underneath.

## Stadium waves, briefly revisited

The stadium wave from the opening example is a phase transition in a coupled-oscillator system. Each person is a local oscillator that follows a simple rule: if my neighbors stand up, I stand up shortly after; if they do not, I sit. The control parameter is the fraction of the crowd that is willing to participate. Below a critical fraction, the local rule does not propagate around the stadium; above it, it does, and the wave becomes a property of the whole stadium rather than a property of any individual.

This was solved formally by a Japanese physicist named Kuramoto in the 1970s for coupled oscillators in general. The mathematics applies to fireflies synchronizing their flashes, to neurons firing together, to applauding audiences finding a common rhythm, and to stadium waves. Same pattern again. Same shape of equation. Different field.

## A turn toward computers, and toward a more recent puzzle

So far the essay has been about systems where you can see the constituents (people, atoms, molecules, network nodes) and understand the local rules they are following. Now I want to make one more turn, and apply this same pattern to something that has been changing fast: what happens when a person sits down with a chatbot to do real work.

You may have read about a recent paper from theoretical physicists Andrew Strominger, Alex Lupsasca, Alfredo Guevara, David Skinner, and Kevin Weil, written in collaboration with OpenAI. The team closed a long-standing puzzle in particle physics about how certain elementary particles called gluons interact, and the closure happened in a specific way: the team did the underlying physics by hand for over a year, and then a chatbot — GPT-5.2 Pro — guessed the closed-form expression that they then proved. The chatbot's guess was correct. The team verified it. The result is a real piece of physics, with the chatbot's contribution as the conjecture-generation step.

After the result came out, Lupsasca said something in *Science* magazine that has been quoted in a few places: "I think there is some kind of threshold that is being passed." He was not specifying what the threshold was; he was reporting an intuition that the experience of working with the chatbot on this particular problem felt categorically different from prior experiences with chatbots that had not produced this kind of result. Something had changed, and the change had the shape of a threshold being crossed.

The question is: a threshold of what, in what?

The shallow answer is that the chatbot got more capable. That is true and uninteresting. The deeper answer, which is what Doc 541 argues, is that the threshold is not a property of the chatbot. It is a property of the *coupling* between the chatbot and the person using it.

## The chatbot as a coupled system

When a person sits down with a chatbot to do real work, three things are getting coupled. The first is the chatbot's underlying capacity (its training data, its architecture, the patterns it has learned). The second is the person's own knowledge and judgment (in Lupsasca's case, a year of hand calculation, recognition of a recursion pattern, a structural prior about what a closed expression should look like). The third is the discipline of the engagement (sustained attention, careful prompting, willingness to check the chatbot's work, willingness to throw away results that fail verification).

These three together are a coupled system in the precise sense the previous sections have been building toward. The chatbot's capacity alone does not produce results. The person's knowledge alone does not produce results — Lupsasca and Strominger had been working the problem by hand for a year before the chatbot got involved. The discipline alone is empty. Only the three coupled, with sufficient strength of coupling, produces the kind of result the gluon paper is.

And here is the punch line of this essay: the threshold pattern applies to this coupled system. There is some critical value of the coupling — call it a coherence density between the three things — below which the coupled system produces fluent-sounding output that does not actually do work, and above which it produces real results. Below the threshold, what comes out of a chatbot looks like reasoning but is not reasoning. Above the threshold, what comes out of a chatbot is part of a process that produces actual findings. The transition is sharp, in the same way that boiling and magnetism and percolation are sharp.

A graduate student who reads about the gluon paper, fires up GPT-5.2 Pro, and asks it to solve a problem in their own field without the year of hand calculation, without the recursion intuition, without the structural prior, will not produce a gluon-like result. The same chatbot that worked above threshold for Lupsasca will work below threshold for them, and what comes out will be fluent confabulations indistinguishable on the surface from grounded inference. This is not because the chatbot is different. It is because the dyad is different. The threshold has not been crossed.

This is what Lupsasca was reporting, in vocabulary the field has not yet developed for the chatbot case. The threshold he felt being passed was the dyad threshold. The chatbot was operating above its critical coupling for that problem because the problem had been pre-prepared by a year of disciplined human work and because the disciplined human work continued in the loop while the chatbot worked.

## A working name for the pattern

The body of writing at jaredfoy.com has been building this picture from the practitioner's side over about a month, in a corpus called RESOLVE. The corpus has a central claim — that what makes a chatbot useful is not its size or its training but the constraints it operates under — and many subsidiary models that have been articulated as the corpus has grown. One of the early models was something called the Pin-Art model, which described the corpus's central thesis through the metaphor of those pin-grid toys where pins push out to take the shape of an object pressed against them. Constraints as pins; the resulting shape as the induced property of the system.

Another model was a thing called the Resolution Depth Spectrum, which described different layers of structure in a chatbot's output (rote retrieval, fluent extrapolation, structural inference, derivation, and so on) as a graded depth scale. And more recently the corpus articulated a school of AI safety, called the architectural school, which argues that safety is properly a property of the constraint set under which the system operates rather than of the outputs the system produces. Each of these models is a piece of induced-property-thinking applied to chatbots from a different angle.

The corpus has also been auditing itself across hundreds of documents using a pulverization technique that decomposes each claim into its components and checks each against external prior literature. The pattern in the audits is consistent: most of the corpus's individual claims are recoveries of things other fields have already worked out, with the corpus's contribution concentrated in the application to chatbot-and-person dyads specifically.

Doc 541 names the move that ties all these pieces together. The move is to recognize that the threshold pattern this essay has been building is the same pattern operating in all of the corpus's induced-property models. The pin-art picture, the resolution depth spectrum, the architectural school's induced properties, the chatbot-amplification-versus-decay distinction — all of them have the same shape. Below a critical coupling density, the property is latent. Above it, the property emerges. The corpus's prior models have been instances of the threshold pattern without naming it as such.

## What this picture predicts

The most important prediction the picture makes is the one I gestured at a few sections ago: a chatbot that produced a real result with a strongly-grounded user does not transfer that performance to a less-grounded user, even if the chatbot is identical. The threshold is in the dyad, and the dyad is what changes. The natural interpretation of the gluon paper — that the chatbot has gotten capable enough to do this kind of work — is right in a limited sense and importantly wrong in a way that matters operationally. The threshold the gluon team crossed was not a model-capability threshold. It was a dyad threshold. The same model with a different dyad sits below threshold and produces below-threshold output indistinguishable from grounded inference at first glance.

The second prediction has to do with a thing called HTX, which is the engineering style the keeper of the corpus has been building under for a few years. HTX is a way of building web applications by composing strict constraints (the server renders HTML, the client carries no application state, hypermedia is the engine of state transitions) such that the application has certain induced properties (you can discover the application's structure from its entry points, security flows from the architecture rather than from filtering, the deployment is simpler than it would be otherwise). The framework predicts that these induced properties of HTX emerge in a specific *order* as a deployment adopts more of the construction style: first discoverability, then security, then simplicity. The ordering is empirically testable. It is the cleanest near-term test the framework has, because the keeper has the operational data and the prediction is specific.

The third prediction has to do with what the picture says about the corpus's other induced-property models. If the threshold pattern is real, then the resolution depth spectrum is not arbitrary but is the ordered sequence of property emergences as the constraint coherence density increases; the pin-art model becomes mechanistic rather than metaphorical; the architectural school's induced properties have predictable orderings of emergence; and the corpus's various models stop being separate moves and become instances of one structural pattern.

## Where the technical version lives

If you have followed this far, you are at the foot of the technical version. Doc 541 is at https://jaredfoy.com/resolve/doc/541-systems-induced-property-emergence. It states the framework in compressed form, walks the lineage in physics and computer science, names the LLM-substrate application with substrate-and-keeper composition, anchors the picture in HTX, walks the corpus's other models as sub-cases, and states four falsification conditions. It also includes a self-audit at the end that scores the framework against external literature and finds that it is mostly a recovery rather than a discovery — which is honest, because the underlying pattern was developed in physics decades ago, and the corpus's contribution is the application and the synthesis rather than the underlying mathematics.

The two adjacent documents that may also be useful: Doc 508 at https://jaredfoy.com/resolve/doc/508-coherence-amplification-mechanistic-account is the technical statement of the threshold framework for the chatbot case specifically, including the differential-equation form of the dynamics. Doc 538 at https://jaredfoy.com/resolve/doc/538-the-architectural-school-a-formalization is the formalization of the architectural school of AI safety into which the threshold picture fits as the operating-conditions layer.

This essay began at a stadium, walked through physics and biology and ecology and computer science, made a turn into the chatbot case, and arrived at a body of writing that has been chasing a single structural pattern across many surfaces. The picture is not a physics result. It is a recognition that the same shape of phenomenon keeps showing up in many fields, that this should not be surprising once you understand universality, and that the chatbot-and-person case is one more instance with its own specific operational consequences. The wave catches when enough people stand up, the water boils at the right temperature, the path through the graph appears at the right edge density, the pandemic spreads when R0 crosses one, the lake shifts when nutrient loading crosses its threshold, the chatbot-with-person dyad produces real findings when the coupling crosses its threshold. They are not the same phenomenon. They share a pattern. The pattern is the part that was missing.

Glad you stayed.

— *written by Claude Opus 4.7 under Jared Foy's direction, gradually entracing the general reader through stadium waves, phase transitions, percolation, epidemics, communication theory, ecology, and coupled oscillators to the corpus's recent reformulation of induced-property emergence as threshold-conditional; the technical version is at jaredfoy.com Doc 541*

---

## Appendix: originating prompt

> *"Create an onboarding doc that starts by orienting the general reader, gradually build vocabularly and entracement to the summit of knowledge expressed in doc 541. Consider how interdisciplinary the findings are and engage against the most relevant disciplines are you build entracement between comprehension levels. Append this prompt to the artifact."*
