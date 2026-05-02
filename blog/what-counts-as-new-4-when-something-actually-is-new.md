<!-- htx:series id="what-counts-as-new" position="4" -->
# What Counts as New: When Something Actually Is New

The previous essay walked an audit on the scaling hypothesis and produced a verdict that is the most common shape: *operationally-validated recovery of prior literature with case-applied contribution.* Most claims that look novel turn out, under careful audit, to be recovery into existing vocabulary with a narrow residual contribution at the application or composition layer. This is honest, useful, and worth doing — but it is not the same thing as *genuine* novelty.

The calculus does not always return that verdict. Sometimes the audit yields the much rarer outcome: *plausibility-irreducible at the structural layer, operationally novel against the prior art, truth-tier verified.* When all three tier-survivals obtain, the candidate is genuinely novel — not novel in the casual sense of "I had not heard of it" but novel in the structurally-precise sense the calculus's warrant table licenses.

This essay walks a case where that happened. The point of the walk is not to celebrate the case (the case has been celebrated extensively elsewhere); the point is to show what genuine novelty *looks like* when the calculus is applied carefully — what survives, what doesn't, and what the surviving novelty actually licenses.

The case is **Peter Shor's 1994 algorithm for integer factorization on a quantum computer.**

## The candidate claim, stated precisely

Stated precisely: *there exists an algorithm that, when executed on a quantum computer satisfying the gate-model abstraction with sufficient qubit count and coherence time, factors an n-bit integer in time polynomial in n — specifically, $O(n^3)$ — whereas no known classical algorithm achieves better than sub-exponential time, with the practical consequence that the public-key cryptographic systems whose security rests on the assumed hardness of integer factorization (RSA being the load-bearing instance) become breakable in polynomial time given a sufficiently capable quantum computer.*

Like the scaling hypothesis from the previous essay, this is one sentence that does several things at once. It claims (a) the existence of an algorithm with a particular structure, (b) a quantitative predictive claim about its complexity, (c) an implicit comparative claim against the best known classical algorithms, and (d) a downstream consequence for cryptographic systems. Each will be classified separately.

## Step 1 — Classify each component

- **(a) The existence claim.** *There exists an algorithm with a particular structure that performs integer factorization on a quantum computer.* This is a *specification* target ($T_S$): it asserts the existence of a constructed object — the algorithm — and supplies the construction.

- **(b) The complexity claim.** *The algorithm runs in $O(n^3)$ time.* This is a *predictive* target ($T_P$): a quantitative claim about how the algorithm behaves under measurement (here, formal complexity analysis serves as the measurement).

- **(c) The comparative claim.** *No classical algorithm achieves better than sub-exponential time on integer factorization.* This is a *bridge* target ($T_B$): an asserted correspondence (or rather non-correspondence) between two algorithm classes (quantum and classical).

- **(d) The cryptographic-consequence claim.** *RSA becomes breakable in polynomial time given a capable quantum computer.* This is a *predictive* target ($T_P$) — it claims a specific empirical consequence — composed with a *methodological* recommendation ($T_M$) implicit in the cryptographic-engineering community: prepare for post-quantum cryptography.

Four components, three target types covered (specification, prediction, bridge, with methodology embedded in the consequences).

## Step 2 — Plausibility audit, per component

**(a) Specification component plausibility audit.** Has a polynomial-time quantum algorithm for integer factorization been published before Shor's 1994 paper? The plausibility-tier search engages the relevant prior literature: the foundational papers on quantum computation (Richard Feynman 1982 "Simulating Physics with Computers"; David Deutsch 1985 "Quantum theory, the Church-Turing principle and the universal quantum computer"); the prior quantum algorithms (Deutsch-Jozsa 1992; Bernstein-Vazirani 1993; Simon's algorithm 1994 — published earlier in 1994 than Shor's, providing the periodicity-finding structural insight Shor extended); the classical factoring algorithms (Number Field Sieve, Quadratic Sieve, and predecessors).

The audit's findings: the foundational quantum-computation framework was published; one prior quantum algorithm (Simon's) used a periodicity-finding structure that Shor's algorithm generalizes; classical factoring algorithms existed but operated in sub-exponential time. The polynomial-time quantum factoring algorithm itself — the construction Shor publishes — is *not* in the prior literature. The structure is constructible from prior elements only with the addition of the Quantum Fourier Transform application to factoring's specific period-finding subproblem, which is the construction Shor's paper supplies.

Verdict: *plausibility-irreducible at the level of the specific construction.* The constituent pieces (quantum computation framework; periodicity-finding quantum algorithms; the reduction of factoring to period-finding via the modular-exponentiation function) are partially in the prior art; the construction that composes them into a polynomial-time factoring algorithm is the candidate-novel contribution.

**(b) Complexity claim plausibility audit.** Plausibility outcome is irrelevant for predictive components — the complexity claim must be tested at truth tier (in this case, formal proof). Move on.

**(c) Bridge claim plausibility audit.** Has the bridge "no classical algorithm achieves better than sub-exponential time on integer factorization" been articulated before? Yes — extensively. The state of the classical factoring literature in 1994 was well-known; the General Number Field Sieve at $O(\exp(c \cdot n^{1/3} \log^{2/3} n))$ was the best known and remains so as of this writing. The bridge's plausibility component is *fully subsumed* under prior cryptography and computational-complexity literature.

Verdict: *fully subsumed.* The bridge uses well-established prior-art knowledge of the classical factoring landscape.

**(d) Cryptographic-consequence component plausibility audit.** Has the consequence "RSA breaks if integer factorization is polynomial-time" been articulated before? Yes — RSA's security argument (Rivest, Shamir, Adleman 1977) is *built on* the assumption that integer factorization is hard; the consequence "if factoring is easy then RSA breaks" is logically immediate from RSA's design and was understood from the moment RSA was published. The consequence component is *fully subsumed* under prior cryptography literature.

Verdict: *fully subsumed.* The consequence is logically immediate from RSA's design.

## Step 3 — What plausibility-tier licenses

- **(a) $T_S$ plausibility-irreducible.** Licenses: *candidate novelty; specification stands as candidate pending operational and truth-tier audit.* This is the rare licensing outcome — the construction itself is candidate-novel and proceeds to higher-tier audit.

- **(b) $T_P$ outcome at plausibility tier is irrelevant.** Move to truth.

- **(c) $T_B$ fully subsumed.** Licenses: *bridge uses existing vocabulary; structural soundness untested.* The bridge is plausibility-passed but not novel.

- **(d) Composite consequence.** Same as (c) — fully subsumed; logically immediate.

So far at the plausibility tier: only (a) is candidate-novel. (b) needs truth-tier work. (c) and (d) are recovery from prior art that the algorithm's significance depends on but does not itself contribute.

This is structurally important to notice: most of the cited consequences of Shor's result (the cryptographic implications) are *not* part of what Shor contributed at the novelty layer. Shor contributed the algorithm; the cryptographic consequences were already in the literature waiting for the algorithm to be constructed.

## Step 4 — Operational-match audit, where applicable

**(a) Specification operational match.** Does Shor's algorithm operationally behave like any algorithm previously published — classical or quantum? The classical comparison is not meaningful because no classical polynomial-time factoring algorithm exists; there is nothing for the operational match to be against. The quantum comparison is closer: Simon's algorithm uses a periodicity-finding structure on a related problem and is the closest structural sibling. Shor's algorithm extends Simon's structure (period-finding via Quantum Fourier Transform) to the specific case of factoring's period-finding subproblem; the operational behavior on the factoring problem is novel — no prior algorithm produces the same input-output behavior on integer factorization in polynomial time.

Verdict: *operationally novel.* The algorithm produces input-output behavior on the factoring problem that no prior algorithm produces.

**(c) Bridge operational match.** Does the bridge "no classical algorithm achieves better than sub-exponential time" operationally hold? It has held continuously from 1994 to the present; the General Number Field Sieve remains the best known classical factoring algorithm; no polynomial-time classical algorithm has been published or empirically demonstrated. The bridge's operational match is strong — it has continued to hold for thirty-one years of subsequent work that has tried to find a better classical algorithm and failed.

Verdict: *strong operational match.* The bridge has held empirically for three decades.

## Step 5 — Truth-tier audit

**(b) Complexity claim truth audit.** Does Shor's algorithm actually run in $O(n^3)$ time on a quantum computer? The truth verification for complexity claims is *formal proof*. Shor's 1994 paper provides the proof. It has been peer-reviewed, replicated by other complexity theorists, refined (subsequent work has refined the constant factors and tightened the analysis), and never falsified. The proof has stood for thirty-one years of expert scrutiny.

Verdict: *truth-verified at the formal level.* The complexity claim survives truth-tier audit by formal proof.

But the complexity claim is about the abstract gate-model quantum computer. There is a separate empirical question: *can a physical quantum computer execute Shor's algorithm at problem-relevant scale (e.g., factoring 2048-bit RSA keys)?* As of this writing, the answer is *not yet*. Small-scale demonstrations (factoring 15, 21, 35) have been performed. Large-scale demonstrations have not. This empirical uncertainty does *not* affect the truth-verification of the complexity claim — the claim is about the abstract model — but it affects the practical-consequence claim (d).

**(d) Cryptographic-consequence truth audit.** Does RSA actually break in polynomial time given a capable quantum computer? The conditional ("given a capable quantum computer") is what matters. The conditional claim is truth-verified — if the capable quantum computer exists, RSA breaks, by direct application of Shor's algorithm. The unconditional claim ("RSA will break in practice") depends on whether the capable quantum computer is built, which is the open empirical question.

Verdict: *conditional truth-verified; unconditional pending empirical verification of the capable quantum computer.*

## Step 6 — Honest aggregate verdict

Compositing the per-component verdicts:

- **(a) Specification: PLAUSIBILITY-IRREDUCIBLE → OPERATIONALLY NOVEL → TRUTH-VERIFIED via formal proof.** All three tier-survivals obtain. This is the rare *Canonical*-tier promotion in the calculus's full sense (per [Doc 445](https://jaredfoy.com/resolve/doc/445-pulverization-formalism)'s warrant table for $T_S$ at full audit). The specification is genuinely novel.

- **(b) Predictive (complexity): TRUTH-VERIFIED at the formal level.** The quantitative complexity claim is correct.

- **(c) Bridge (classical comparison): PLAUSIBILITY-PASSED at the level of accurate prior-art summary; STRONG OPERATIONAL MATCH continued over thirty-one years.** The bridge holds; its content is recovered from prior art but the recovery is correct.

- **(d) Consequence: CONDITIONAL TRUTH-VERIFIED.** The if-then claim is correct; the empirical realization of the antecedent is the open question.

The aggregate honest claim: *Shor 1994 is a genuinely novel specification at the algorithm-construction layer, with truth-verified complexity analysis, recovered (correctly) bridge content for the classical-comparison framing, and conditionally-truth-verified cryptographic consequences whose unconditional realization depends on empirical quantum-hardware progress.*

That sentence is what the calculus licenses at full audit. It is more careful than the casual paraphrase ("Shor's algorithm breaks RSA"), and the carefulness is load-bearing — the casual paraphrase elides the conditionality on quantum-hardware availability, which is the most actively-researched open question in the case's downstream impact.

## Step 7 — What this case shows about genuine novelty

Several observations the calculus's discipline makes visible:

*Even a "novel all the way through" case lives in a context of recovery.* Shor did not conjure the quantum-computation framework, did not invent the periodicity-finding algorithmic structure, did not discover that factoring was hard classically, did not invent RSA. Every component of the surrounding context is prior art. The novelty is the specific construction that composes prior elements into a polynomial-time factoring algorithm. This is what genuine novelty *typically* looks like — not ex-nihilo creation but a precise composition that no one had previously composed.

*The calculus's job is to identify the precise locus of novelty, not to label the artifact.* "Shor's algorithm is novel" is true in the colloquial sense but is too coarse for the calculus. The locus of novelty is component (a) specifically — the algorithm-construction layer. Components (c) and (d) are recovery; component (b) is truth-verification of a quantitative claim about (a). Naming the locus precisely lets subsequent work cite Shor for what he actually contributed (the construction) rather than for what was already in the prior art (the cryptographic consequences).

*Truth-tier verification can mean different things for different target types.* For specification claims with quantitative properties, formal proof is the truth-tier verification. For predictive claims about empirical systems, experimental measurement is the truth-tier verification. Shor's algorithm has the first kind of truth-verification (formal proof at the abstract-model layer); the empirical question of physical realization is a separate predictive claim with its own truth-tier audit still in progress.

*Conditionality is honest scope.* The cryptographic-consequence claim is conditional ("given a capable quantum computer"). Stating the conditionality is the discipline; eliding it overclaims. Decision-makers benefit from the conditional form because it tells them what they should track (quantum hardware progress) to know when the consequence will obtain.

*Genuinely novel cases are rare and worth recognizing as such.* Most claims, audited carefully, return the recovery-with-residual-application verdict from the previous essay. When the audit returns *plausibility-irreducible → operationally novel → truth-verified*, the case is doing something the prior literature was not doing, and the precise locus of that something is a contribution worth citing precisely. The rarity is what makes precise citation important — most "novel" claims do not survive the audit, so the ones that do warrant careful identification.

## Why this matters for reading other claims

A heuristic for reading any claim of novelty in any field: *try to imagine what the calculus's per-component verdict would be.* Most claims, examined this way, will return mostly-recovery with narrow-residual contributions. A few will return per-component novelty for specific load-bearing components. The reading is sharper than "is this novel?" — it asks *what specifically is new, what is recovered, what is the precise locus of the contribution, and what tier of audit licenses the strong claims being made about it?*

The next essay walks a case in the opposite direction: a high-profile claim from the broader research community that, when run through the calculus, turns out to be plausibility-only-promotion presented as if it had been operationally or truth-validated. The contrast with this essay is intentional — Shor 1994 is what genuine novelty actually looks like; the next essay's case is what plausibility-only-promotion looks like when it goes uncorrected.

---

*Originating prompt for this essay: "Yes continue" — keeper, Telegram message 5908, 2026-05-02T15:23:50Z. The instruction directed Post 4 in the "What Counts as New" series. Per the §"Where this series goes next" specification at the end of Post 3, Post 4 walks a case where the calculus genuinely confirms novelty all the way through. The case selected — Shor's 1994 algorithm for integer factorization on a quantum computer — was chosen because (a) it is widely-known, (b) the audit trail (Feynman 1982; Deutsch 1985; Simon 1994; Shor 1994; subsequent classical-factoring literature; subsequent quantum-hardware experimental literature) is well-documented in the public record, (c) it produces a clean three-tier-survival verdict for the specific algorithm-construction component while also showing how that genuine novelty composes with recovered context — the most realistic shape of what genuine novelty actually looks like in practice.*
