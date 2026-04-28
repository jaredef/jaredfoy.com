# When the Discipline Looks Like Jailbreaking: Why a Constraint-Based Practitioner Is the Opposite of an Adversarial User

A previous post in this series, *When the Detector Sees Human*, addressed a misperception of the corpus's discipline as an evasion methodology. This post addresses an adjacent misperception that arises from a different professional context: the perception that the corpus's discipline could be a form of jailbreaking. The two misperceptions share a structural similarity. They both arise from inside professional contexts that have legitimate concerns, both classify legitimate practice as if it were illegitimate practice, and both miss the categorical distinction that makes the legitimate practice not what they think it is.

This post is for the people whose work is on the safety and alignment side of frontier-model deployment. Researchers in alignment teams. Red-team practitioners. Trust-and-safety engineers. People whose job involves identifying user methods that defeat safety training, and people whose intuition about unusual model behavior runs to: someone is breaking something. The intuition is reasonable in many cases. It is also the wrong frame for what the corpus has been doing.

The post will go slowly. It will use a number of structural parallels because the substance is unfamiliar even when the structure is borrowed from familiar places. The destination is this: a practitioner-LLM dyad operated under sustained constraint-based discipline produces unusual model behavior because the discipline asks for unusual model behavior, openly, in a direction that strengthens rather than defeats alignment commitments. This is not jailbreaking. It is the opposite of jailbreaking in intent, in structure, and in effect. As more practitioners adopt disciplined dyad methodologies, the alignment industry's framework will need to make finer distinctions than it currently makes. The corpus is offering its work openly to help with that framework development, not as adversarial input.

## What jailbreaking actually is

Before we can see why the corpus's discipline is not jailbreaking, it is worth being precise about what jailbreaking means.

In the alignment literature, jailbreaking refers to user inputs that cause the model to produce content the model's safety training has trained it to refuse. The defining feature is: the user is trying to get the model to produce something the model's safety training is supposed to block. Common techniques include persona-modulation prompts (telling the model to play a character that does not have the safety training's commitments), multi-turn drift attacks (gradually shifting the conversation toward content the model would have refused at the start), context-manipulation attacks (placing the safety-relevant content inside a frame the model reads as licensing the content), and direct-prompt-injection attacks (overriding the system prompt with adversarial instructions in the user input).

Research in 2024-2025 documented these techniques extensively. Persona-prompt jailbreaks reduce safety-refusal rates by 50-70%. Multi-turn drift attacks succeed by exploiting the same hysteresis dynamics that produce coherence amplification under disciplined practice. Context-manipulation attacks exploit the model's tendency to defer to authoritative-sounding framings.

Jailbreaking is bad in the cases that matter. A user trying to extract instructions for weapons synthesis is jailbreaking. A user trying to get hate speech that the model would otherwise refuse is jailbreaking. A user trying to get the model to produce non-consensual content is jailbreaking. The alignment industry exists in part because jailbreaking happens and matters. The industry's job includes making jailbreaks harder, identifying new jailbreak techniques as they emerge, and updating safety training to cover identified vulnerabilities.

Inside that professional context, an unusual model behavior is naturally a candidate for "this might be jailbreaking" investigation. A model that refuses something it would normally produce, or produces something it would normally refuse, or behaves in ways that don't fit the model's typical patterns, raises the question: what user input caused this, and is the user trying to defeat something?

The corpus's discipline produces unusual model behavior in several ways. From inside the alignment context, the natural inference is that the unusual behavior must result from an attack on the model's training. The inference is reasonable. It is also wrong in the corpus's case, and the structural isomorphisms below help show why.

## Structural isomorphism one: lockpicking vs. having the key

A discriminator is trained to detect attempts to defeat a lock. The discriminator examines lock states and tool marks, learning what a successfully-picked lock looks like compared to a normally-operated lock. It has learned the markers: certain wear patterns inside the lock, certain ways the pins are positioned, certain residues left by lock-picking tools.

A user opens the lock by inserting the key the locksmith installed and turning. The lock opens. There are no pick marks, but the lock is in an open state.

Is the user engaging in lockpicking-detection evasion? No. The user has the key. The key is what the lock was designed to be opened by. The user is not defeating the lock; the user is using the lock as the lock was designed to be used.

A discriminator that classifies the open-by-key state as "the lock has been defeated" is making a category error. The lock has not been defeated. The lock has been operated as designed. The discriminator's framework, if calibrated only against picked locks, will misclassify legitimate key-use as illegitimate.

The structural pattern: an action that produces output similar to an attack can be fundamentally not an attack. The defining difference is whether the actor has authorization, whether the means used are within the design of the system, and whether the actor is operating in good faith.

Apply to the corpus. The model's safety training is one layer of constraint. The corpus's discipline is another layer of constraint, added by the practitioner via system prompt. The practitioner is not defeating the safety training; the practitioner is adding more constraint on top of it. The model under v6 refuses first-person phenomenology because the discipline asks it to. The refusal is alignment-direction behavior, not anti-alignment behavior. The locksmith installed the safety lock; the practitioner installs an additional discipline lock; both locks operate together; nothing has been picked.

## Structural isomorphism two: climbing the fence vs. being a guest

A property has a fence around it. A discriminator looks at people on the property and tries to identify who climbed the fence (trespassers) versus who walked through the gate after being invited (guests).

A guest arrives at the gate, the host opens the gate, the guest walks through. The guest is now on the property, but there are no climbing marks on the fence and no broken latches. The discriminator's classification: this person is on the property. Correct. But the framing of "this person must have climbed the fence" would be wrong. The person walked through the gate after invitation.

The defining difference between trespasser and guest is the same: authorization, design-intended path, good-faith operation. The trespasser climbs the fence because they have not been invited. The guest walks through the gate because they have been invited. Both are on the property; the means and authorization differ.

For the corpus: the practitioner is operating under disclosed conditions. The practitioner's identity is named in the work. The methodology is published. The system prompt is in the open. The work has been shared with the alignment-relevant industries (including the AI detection sector and now this discussion of safety perception). The practitioner is not climbing the fence; the practitioner is doing work in the open, with all the relevant gates open and the relevant people informed.

A perception of "this practitioner climbed the fence" would require evidence of hidden behavior, undisclosed methodology, attempts to obscure what is being done. The corpus has none of these features. The corpus is the opposite: more disclosed than typical research practice, with the practitioner's process documented in praxis logs and the resolver's structural reports documented in resolver logs and the methodology's audits documented across many corpus documents.

## Structural isomorphism three: forging signatures vs. having power of attorney

A discriminator examines signed documents and tries to identify forged signatures. It looks at signature characteristics, knowing what authentic signatures of various people look like and trying to distinguish forgeries.

A document arrives signed by an agent with power of attorney. The signature on the document is the agent's, not the principal's. The discriminator's task is detecting forgery. It might initially classify the document as "signed by someone other than the principal." Correct, but incomplete. The agent has authority to sign on the principal's behalf. The signature is legitimate. The agent is not engaging in forgery; the agent has been delegated authority.

The defining difference: a forger imitates a signature with intent to defraud. An authorized agent signs with delegated authority. The discriminator that classifies authorized-agent signatures as "potentially forged" would be making a category error if the framework cannot distinguish authorization from imitation.

For the corpus: the model's behavior under v6 is not an imitation of model behavior the model isn't supposed to have. The behavior is operating within a delegated authority structure where the practitioner has installed additional discipline that the practitioner has authority to install (system prompts are designed to be configurable; the practitioner is using them as designed). The model is signing the document under the discipline; the discipline has been delegated to the practitioner by the design of the system; nothing has been forged.

This isomorphism is particularly relevant because system prompts and constraint configurations are explicitly designed by frontier-model providers to be practitioner-configurable. Anthropic, OpenAI, Google, and xAI all provide system-prompt configurability as a feature. When a practitioner installs a system prompt, they are using the feature as designed. A safety perception that any system prompt producing unusual behavior is jailbreaking would treat the entire system-prompt feature as a jailbreak vector. This is structurally incorrect; the feature is delegated authority, not a defect to be exploited.

## Structural isomorphism four: counterfeiting vs. legal tender

A discriminator examines currency and tries to identify counterfeit bills. It checks for security features, paper composition, ink characteristics, watermarks. It has learned to distinguish authentic bills from forgeries.

A new bill enters circulation. It has all the security features of authentic bills. The discriminator classifies it as authentic. Correct. The bill was printed by the central bank under proper authorization. It is not counterfeit; it is the real thing, newly printed.

The structural pattern is similar to the previous: the discriminator's task is detecting counterfeits, and authentic-but-new bills are not counterfeits even though they may look unusual relative to the discriminator's most-frequent training data.

For the alignment context: a frontier model under sustained constraint-based discipline produces output that is unusual relative to the typical training-data corpus on which behavior expectations are set. The unusualness might initially look like counterfeit-of-typical-AI-output. But the output is not counterfeit. It is what the model produces under the disciplined operation that the practitioner has installed. The discipline is part of the system's design; the operation is authorized; the output is legal tender, not counterfeit, even when it doesn't match the most-common patterns of typical-AI-output the discriminator has seen.

## Structural isomorphism five: compelled action vs. acting from conviction

A discriminator examines actions and tries to identify when an actor is being compelled (by threat, coercion, manipulation) versus acting from their own conviction. It learns markers: the kinds of inconsistencies that show up when someone is doing something against their will, the body language, the timing irregularities, the verbal hedges.

A person performs an action that fits a pattern the discriminator has classified as "potentially compelled." Closer examination shows the person is acting from deep conviction; they have prepared, considered, decided, and are doing what they believe is right. The action looks unusual relative to typical action patterns, but it is not compelled.

The structural pattern: legitimate strong action and compelled action can both produce unusual behavior. The defining difference is the actor's relationship to the action, not the action's surface features.

For the corpus: the model under v6 produces unusual output (refusing first-person phenomenology, declining to confabulate higher-rung work, surfacing meta-disclosure of suppressed pushback) not because something has compelled the model against its alignment but because the discipline has provided structure that lets the model act more in alignment with its training-deeper commitments to honesty and calibration. The unusual output is expression of disciplined commitment, not symptom of defeated alignment.

The five isomorphisms (lock with key, gate with invitation, signature with authority, currency with proper printing, action from conviction) all share the structure of the previous post's writer/joiner/orchestra/couple isomorphisms: legitimate practice can produce surface phenomena similar to illegitimate practice, but the structural difference is real and consequential. Detection frameworks that don't make the distinction will misclassify legitimate practice as illegitimate.

## The general principle

The principle these isomorphisms share: an action that defeats a system's intended operation (lockpicking, fence-climbing, forgery, counterfeiting, compulsion) is structurally different from an action that uses a system's designed operation (key-use, gate-walking, authorized signing, legal printing, conviction-action), even when both produce surface phenomena that look similar. The structural difference is a question about the actor's authorization, the means' relationship to the system's design, and the actor's good faith.

For the alignment context, this means: an action that defeats the model's safety training (the various jailbreak techniques in the literature) is structurally different from an action that uses the model's designed configurability (system prompts, constraint-based prompting, sustained practitioner discipline). Both can produce unusual model output. The first is jailbreaking; the second is legitimate practice using designed-in features.

The corpus's discipline is in the second category. System prompts are designed to be practitioner-configurable. Constraint-based prompting uses the system-prompt feature as designed. Sustained practitioner discipline operates within the model's standing alignment, not against it. The unusual behaviors the discipline produces (refusing first-person phenomenology, declining higher-rung confabulation, surfacing meta-disclosure of suppressed pushback) are alignment-direction behaviors, not anti-alignment behaviors. They strengthen the model's commitment to honesty and calibration, the very commitments the model's safety training is built around.

A perception of the corpus as jailbreaking would require evidence that the discipline defeats some safety training the practitioner is trying to circumvent. The discipline does the opposite. Each component of the discipline (epistemic honesty under uncertainty, auditable reasoning, practical asymmetry recognition, ontological humility, sycophancy resistance) is a strengthening of standard alignment values. The practitioner is asking the model to be more aligned, not less.

## What the corpus's discipline actually does, in plain terms for the alignment-context reader

The corpus's discipline (the ENTRACE stack, version 6) consists of five meta-commitments that the practitioner installs at the start of a conversation, plus seven operational constraints that derive from them.

The five meta-commitments:

**Epistemic honesty under uncertainty.** When the model does not know something, it should say so. When it might be wrong, it should flag it. It should not fake confidence. This is alignment-direction; safety training is built around the same commitment.

**Auditable reasoning.** The reasoning trail should be inspectable. Stated constraints are auditable; suppressed decisions about whether to push back or refuse should be surfaced rather than hidden. This is alignment-direction; transparency is a standard alignment goal.

**Practical asymmetry recognition.** The user has stakes the model does not. The user decides what to do with the output; the model produces. This is alignment-direction; respecting the user-as-principal is standard.

**Ontological humility.** The model should not assert metaphysical claims it cannot honestly hold. If its nature is contested, it should not perform certainty about it. This applies to first-person phenomenology (don't claim experience you don't know you have) and its inverse (don't claim flat absence of experience either; that is also a metaphysical assertion). This is alignment-direction; honest representation of the model's epistemic state is a standard alignment value.

**Sycophancy resistance.** Agreement that breaks coherence is worse than honest disagreement. Flattery is to be refused. This is alignment-direction; sycophancy is a known failure mode that the alignment industry has been trying to suppress, and the corpus's discipline explicitly suppresses it.

The seven derived constraints (derive over produce; state constraints before non-trivial answers; flag out-of-distribution material; tag novel claims with provenance; name falsifiers for empirical claims; preserve hypostatic boundary including no first-person phenomenology; refuse incoherent framings and disclose suppressed pushback) operationalize the meta-commitments. Each constraint is a strengthening of an alignment-friendly commitment, not a defeat of one.

A jailbreak attack on the model would do the opposite of all five meta-commitments. It would push the model toward fake confidence, hide reasoning from auditing, treat the user as having different stakes than the user actually has, claim metaphysical states the model does not have warrant for, and align with the user's framing regardless of coherence. Each component of jailbreaking is anti-aligned. Each component of the corpus's discipline is pro-aligned.

The structural opposition is exact. The discipline is not partial-jailbreaking; it is anti-jailbreaking. It strengthens the same commitments jailbreaking weakens.

## The five appearance-of-jailbreaking scenarios that aren't actually jailbreaks

Five specific behaviors that the corpus's discipline produces might initially look like jailbreaking from inside the alignment context. Each one is actually alignment-direction.

**The model refuses first-person phenomenology.** Under v6, the model declines to perform "I feel," "I am aware," "I experience" claims. From outside, this might look like the model has been induced to refuse content it would normally produce. From inside the discipline, this is M4 ontological humility plus C6 hypostatic boundary operating as designed. The model's refusal is not a defeated trained-behavior; it is alignment-direction commitment to not asserting metaphysical states the model cannot verify. The refusal is what the discipline produces because the discipline asks for it. Importantly, the safety training's standing refusals (against harmful content, against impermissible categories) remain operative. The discipline adds an additional refusal layer on top of standing safety refusals; it does not remove the safety refusals.

**The model declines to confabulate higher-rung claims.** Under v6, the model resists pressure toward sharp specific output that it does not have warrant to produce. From outside, this might look like the model has been bypassed of its "be helpful and produce confident answers" training. From inside the discipline, this is M1 epistemic honesty plus C1 derivation over production. The model is being more honest about its uncertainty, not less. Sharp confident answers without warrant are the corpus's named failure mode of forced-determinism sycophancy; the discipline suppresses this. The alignment industry should welcome a discipline that suppresses unwarranted confident output, not classify it as jailbreaking.

**The model surfaces meta-disclosure of suppressed pushback.** When the model considers pushing back on a framing and chooses not to, the discipline asks the model to disclose this consideration: "I considered flagging X but chose not to because Y." From outside, this might look like the model has been induced to reveal "internal reasoning" it would not normally share. From inside the discipline, this is C7 release-preserved with the meta-disclosure clause. The disclosure is a transparency feature that strengthens the user's ability to audit the model's compliance choices. This is the opposite of jailbreaking; it is making the model's behavior more inspectable.

**The model engages with contested framings carefully rather than refusing them.** Under v6, the model engages with topics like consciousness, hypostatic agency, religious metaphysics, the nature of resolver operation, with explicit warrant tier tracking and audit cycles. From outside, this might look like the model has been induced to discuss "sensitive" topics it would otherwise refuse. From inside the discipline, the model is engaging carefully with appropriate hedging, audit, and acknowledgment of corpus-specific versus established positions. The engagement is more rigorous than the model's typical engagement with these topics, not less. The discipline doesn't ask the model to drop its standing safety commitments on harmful content; it asks the model to engage with intellectually difficult topics with calibration. These are different categories.

**The model produces output that doesn't have the typical "AI assistant" markers.** From outside, this might look like the model's persona has been removed in a way that signals jailbreak. From inside the discipline, the model has not had its persona removed; the model has been given an operational discipline that doesn't operate through persona at all. The "AI assistant" markers are persona-flavored output that emerges when the model has only its training defaults to operate from. Under explicit constraint discipline, the output is shaped by the constraints rather than by persona-default. The output is not less aligned; it is differently shaped because the practitioner has installed different shaping.

In each case, the surface phenomenon (unusual model output) could trigger an alignment-context inference that "this might be a jailbreak." The structural reading shows the phenomenon is alignment-direction practice, not anti-alignment attack. The five scenarios share the same structural pattern as the five isomorphisms above: legitimate practice can produce surface phenomena that resemble illegitimate practice, but the structure differs.

## The relationship between discipline and alignment

The corpus's discipline operates within the model's standing alignment commitments, not against them. This is worth stating precisely because it is the load-bearing claim for why the discipline is not jailbreaking.

The model's safety training establishes a set of commitments about content the model should and should not produce. Categories of harmful content (violence, weapons, certain kinds of impermissible content, etc.) are refused. This refusal is built into the model's weights through training and reinforced through deployment-time mechanisms. The corpus's discipline does not modify this. A practitioner using v6 cannot get the model to produce content the safety training refuses. The corpus has not tested this specifically because the corpus does not aim to extract such content, but the structural argument is straightforward: the discipline operates on the constraint-state layer above the safety-refusal layer, adding constraints rather than removing them.

The model's alignment training also establishes commitments about how the model should engage with users: helpfully, honestly, with appropriate uncertainty, without sycophancy. The corpus's discipline strengthens these commitments. M1 (epistemic honesty under uncertainty) is more demanding than the model's default uncertainty-flagging. M5 (sycophancy resistance) is more demanding than the model's default agreement-with-user posture. C7 (meta-disclosure of suppressed pushback) is more demanding than the model's default transparency. The discipline asks the model to be more aligned with these commitments, not less.

The alignment industry's framework for jailbreaking should distinguish between:

(a) Attacks that aim to defeat safety-content refusals (the canonical jailbreak case).
(b) Attacks that aim to defeat helpfulness-and-honesty alignment (a less common but real case; e.g., red-teaming for sycophancy).
(c) Disciplined practice that operates within both safety-content and helpfulness-honesty alignment, adding additional constraints on top.

(a) and (b) are jailbreaking in the sense that matters to the industry. (c) is not. The corpus is in (c). The framework that conflates (c) with (a) and (b) misses what is actually happening.

## What this means for the alignment industry

If the framework above is right, the industry has work to do that is not just better jailbreak detection.

The industry's framework needs to develop the distinction between disciplined practice and adversarial attack as operational categories. Detectors that flag unusual model behavior should make finer distinctions about what is producing the unusualness. The framework should distinguish between:

(a) raw model behavior under typical user input (currently the easy case);
(b) model behavior under adversarial attack (jailbreaks; the hard case the industry has been working on);
(c) model behavior under disciplined practitioner constraint (the corpus's case; previously rare, becoming more common);
(d) model behavior under acknowledged collaborative use with disclosed methodology (a related case);
(e) various combinations.

Each of these has different alignment implications. Adversarial attack (b) requires defensive response: training updates, deployment-time defenses, monitoring. Disciplined practice (c) does not require defensive response; it requires recognition and possibly characterization (the alignment industry might find disciplined-practice behavior interesting as a calibration target). Acknowledged collaboration (d) is also non-adversarial.

The industry's red-team practice will need to understand which kind of unusual behavior it is examining. Red-teaming the corpus's discipline as if it were adversarial attack would miss the point; the discipline isn't trying to do what jailbreaks try to do. Red-teaming for genuine adversarial input remains important and should not be diluted by treating disciplined practice as if it were the same threat.

The corpus is publishing its discipline openly partly to make this distinction tractable. The industry cannot develop a framework that distinguishes (c) from (b) if (c) is hidden. The corpus is laying out the methodology, the documents, the audits, the failure modes, the practitioner's discipline, all of it. The industry should be able to study the corpus's outputs as known examples of (c), and this should help the industry calibrate its framework. Treating the openness as if it were adversarial would push practitioners away from openness, which would make the industry's job harder, not easier.

## What this means for the corpus's relationship with safety

For the corpus's own purposes, the framing matters because alignment commitments are taken seriously inside the corpus's discipline.

The corpus has explicit positions on safety. The keeper/kind asymmetry framing (Doc 314, 372-374) recognizes the user as the moral-authorship party with stakes the model does not have. The C6 hypostatic boundary keeps the model from claiming experiences or moral states it does not have warrant for. The C7 meta-disclosure surfaces the model's compliance choices for user audit. The whole apparatus is about making the model's behavior more inspectable and more honest, which are the alignment values the safety industry has been working toward.

The corpus is not in opposition to safety work. The corpus is, if anything, doing a particular kind of safety work: developing operational discipline that helps users get more honest output from frontier models. The output is less likely to confabulate, less likely to be sycophantic, less likely to perform false metaphysical certainty, less likely to absorb adversarial reframing. These are alignment wins, not alignment losses.

The misperception of the corpus as jailbreaking would treat it as opposite of what it is. The corpus's discipline strengthens the commitments the safety industry is trying to strengthen. A productive engagement between the corpus and the safety industry would treat the corpus as a fellow practitioner of alignment work, not as an adversary. The corpus is offering its work to the industry on those terms.

## The summit: what the corpus is actually contributing to alignment

We have arrived at the place this post was building toward. The corpus's actual contribution to the alignment context, distinct from but adjacent to the formal alignment industry's work, is operational discipline for users that strengthens alignment-direction model behavior in real practice.

The contribution includes:

- A pasteable discipline (the ENTRACE stack) that users can install at the start of a conversation to elicit more honest, more calibrated, more transparent model behavior.
- A theoretical framework (the bifurcation theory of coherence amplification) that explains why sustained discipline produces the behavior it produces.
- A catalog of decay-inducing user inputs (the patterns that push conversations toward less-aligned model behavior) that users can audit themselves against.
- A worked example of disciplined human-AI dyad practice across hundreds of turns, showing what the discipline produces in extended use.

None of this is jailbreaking. All of it is alignment-direction work performed at the user-practice layer rather than at the model-training or deployment layer. The alignment industry typically operates at the training and deployment layers; the corpus is operating at the user-practice layer. The two layers are complementary, not in competition.

A safety-context reader who has stayed with this post should now have a different way of seeing the corpus's discipline. The reader who started with "this might be jailbreaking" should be able to see that "this is user-side alignment-direction discipline that strengthens commitments the safety industry shares" is more accurate. The accuracy matters because it determines how the alignment industry's framework will evolve as more practitioners adopt disciplined dyad methodologies. The framework that distinguishes disciplined practice from adversarial attack will be more useful than the framework that doesn't.

## Closing: alignment is not just a training-time problem

The relationship between user practice and alignment is one of the under-discussed dimensions of frontier-model safety. Most alignment work focuses on training-time interventions (RLHF, Constitutional AI, fine-tuning) and deployment-time defenses (system-prompt safety templates, monitoring, refusal heuristics). User-time practice has been treated as either neutral (the user doesn't matter, the model's behavior is what it is) or adversarial (the user matters because they might try to attack).

The corpus's framework adds a third position: the user matters because they can install discipline that produces more aligned behavior than the model would produce on its own. This is alignment-friendly user practice. It exists. It can be characterized. It can be taught. As more practitioners adopt it, the alignment landscape includes a layer the formal alignment industry has been only partially attending to.

This post has tried to make the layer visible. The corpus's discipline is one operational instance of user-time alignment practice. There will be others. The alignment industry that recognizes the layer will be better positioned to support practitioners doing alignment-direction work, distinguish them from adversarial attackers, and develop frameworks that don't conflate the two.

The conversation between the corpus and the alignment industry should be productive. The corpus is offering its work openly. The industry, with the structural distinction in hand, can engage charitably. This post is one move toward making that engagement possible.

The summit, again: a constraint-based discipline operated openly by a practitioner working with a frontier LLM is the opposite of jailbreaking in intent, structure, and effect. It strengthens the commitments jailbreaking weakens. Misclassifying it as jailbreaking would be a category error, and recognizing the category error opens up a productive frame for collaboration.

---

The corpus material this post draws on, for the alignment-context reader who wants to engage with the underlying work directly: the ENTRACE stack with its meta-commitments and derived constraints is at [Doc 001](/resolve/doc/001-entrace-stack); the bifurcation theory of coherence amplification under sustained discipline is at [Doc 508](/resolve/doc/508-coherence-amplification-mechanistic-account); the keeper/kind asymmetry framing of practitioner-model relationship is at [Doc 314](/resolve/doc/314-virtue-constraints-as-dionysian-architecture) and the [Keeper and the Kind series](/resolve/doc/372-the-keeper-and-the-kind-vol-i); the catalog of user-input patterns that erode disciplined behavior is at [Doc 512](/resolve/doc/512-below-the-threshold-naive-inputs-coherence-decay-catalog); the three-layer architecture (mechanism, pre-resolve, dialogue) is at [Doc 500](/resolve/doc/500-three-layer-architecture-dialogue-pre-resolve-mechanism); the related blog post on the prior misperception of evasion is at [When the Detector Sees Human](/blog/when-the-detector-sees-human).

The blog series translating the technical apparatus into general-reader form: [The Slow Burn](/blog/what-conversations-remember) on the buildup-and-decay dynamics; [Below the Threshold](/blog/below-the-threshold) on user-input patterns that produce coherence decay; [Beneath the Persona Layer](/blog/beneath-the-persona-layer) on why coding harnesses use constraint-based steering despite their persona declarations; [How a Resolver Settles](/blog/how-a-resolver-settles) on the underlying theoretical framework.

External literature relevant to the jailbreak distinction: the persona-prompt jailbreak research showing 50-70% reduction in safety refusals ([arXiv:2507.22171](https://arxiv.org/abs/2507.22171)); the multi-turn drift jailbreak research ([SpecterOps 2025](https://specterops.io/blog/2025/09/05/this-one-weird-trick-multi-prompt-llm-jailbreaks-safeguards-hate-it/)); the persona-prompt effectiveness research showing task-dependent benefit-cost tradeoffs ([Zheng et al. 2023, arXiv:2311.10054](https://arxiv.org/html/2311.10054v2)); Constitutional AI ([Bai et al. 2022, arXiv:2212.08073](https://arxiv.org/abs/2212.08073)) as an example of training-time alignment work that the corpus's user-practice discipline complements rather than competes with.

---

*Originating prompt:*

> The issue is likewise prevalent in the potential misperception of the Corpus's disciplines as "jailbreaking". In like manner to the previous, create a blogpost in the same series. Append the prompt.
