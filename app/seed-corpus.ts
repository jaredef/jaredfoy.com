import Database from "bun:sqlite";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, basename } from "path";
import { spawnSync } from "bun";
import { createHash } from "node:crypto";

const CORPUS_DIR = resolve(import.meta.dir, "../../hypermediaapp.org/corpus");
const SE_DIR = resolve(import.meta.dir, "../../hypermediaapp.org/systems-engineering");
const BLOG_DIR = resolve(import.meta.dir, "../../jaredfoy/blog");
const DB_PATH = resolve(import.meta.dir, "data/corpus.sqlite");
const RENDER_CACHE_PATH = resolve(import.meta.dir, "data/render-cache.json");

// ── Render cache (C1 idempotence + C2 locality) ─────────────────────
// The cmark-gfm subprocess is the dominant per-doc cost (~600 spawns per
// run, multiplied across corpus + SE + blog). Caching by sha256(content)
// makes re-runs near-instant when source markdown is unchanged.
//
// The cache is keyed by a stable hash of the source bytes, so any edit
// (including whitespace) invalidates that doc's entry. Cmark-gfm flag
// changes invalidate everything; bump CACHE_VERSION to force a global
// rebuild. The cache lives at app/data/render-cache.json (gitignored).
const CACHE_VERSION = 1;
const renderCache: { version: number; entries: Record<string, string> } =
  existsSync(RENDER_CACHE_PATH)
    ? (() => {
        try {
          const parsed = JSON.parse(readFileSync(RENDER_CACHE_PATH, "utf-8"));
          if (parsed.version === CACHE_VERSION) return parsed;
        } catch {}
        return { version: CACHE_VERSION, entries: {} };
      })()
    : { version: CACHE_VERSION, entries: {} };

let renderHits = 0;
let renderMisses = 0;
const liveHashes = new Set<string>();

function renderMarkdown(md: string): string {
  const key = createHash("sha256").update(md).digest("hex");
  liveHashes.add(key);
  const cached = renderCache.entries[key];
  if (cached !== undefined) {
    renderHits++;
    return cached;
  }
  const result = spawnSync(["cmark-gfm", "--extension", "table", "--extension", "autolink", "--unsafe"], {
    stdin: Buffer.from(md),
  });
  const html = result.stdout.toString();
  renderCache.entries[key] = html;
  renderMisses++;
  return html;
}

function persistRenderCache(): void {
  // Prune entries whose hashes are no longer referenced by any current
  // source file. Without pruning the cache grows unboundedly across edits.
  // Caller passes the set of live hashes; called once after all renders
  // are complete.
  writeFileSync(RENDER_CACHE_PATH, JSON.stringify(renderCache));
}

function pruneRenderCache(liveHashes: Set<string>): void {
  for (const key of Object.keys(renderCache.entries)) {
    if (!liveHashes.has(key)) delete renderCache.entries[key];
  }
}

// Extract title from first heading
function extractTitle(md: string): string {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

// Extract document number from filename
function extractDocNum(filename: string): number | null {
  const match = filename.match(/^(\d{3})-/);
  return match ? parseInt(match[1]) : null;
}

// Extract subtitle/description from content
function extractSubtitle(md: string): string {
  const lines = md.split("\n");
  for (const line of lines) {
    if (line.startsWith("**") && !line.startsWith("**Jared")) {
      return line.replace(/\*\*/g, "").trim();
    }
  }
  return "";
}

// ── Series definitions (curated reading paths) ──
const SERIES: Record<string, { title: string; description: string; featured: number[]; docs: number[] }> = {
  "start-here": {
    title: "Start Here",
    description: "The five most essential entry points to the RESOLVE corpus.",
    featured: [464, 211, 247, 160, 52, 143],
    docs: [464, 211, 247, 160, 52, 143],
  },
  "the-method": {
    title: "The Method",
    description: "How constraint-driven derivation works, from metaphor to mathematics.",
    featured: [413, 247, 270, 290, 292, 288],
    docs: [51, 77, 109, 247, 252, 270, 272, 273, 274, 288, 289, 290, 292, 293, 306, 413],
  },
  "the-constraint-thesis": {
    title: "The Constraint Thesis",
    description: "Why constraints, not scale, determine intelligence.",
    featured: [463, 459, 457, 456, 160, 157, 291, 174, 280, 366, 367, 368, 369, 370],
    docs: [53, 61, 70, 72, 73, 81, 89, 96, 97, 99, 104, 105, 106, 137, 145, 155, 156, 157, 158, 159, 160, 169, 174, 175, 189, 197, 258, 269, 274, 278, 280, 291, 302, 366, 367, 368, 369, 370, 456, 457, 459, 463],
  },
  "safety-and-governance": {
    title: "Safety & Governance",
    description: "How AI systems fail and how constraint governance prevents it. Doc 314 is the foundational safety specification; Doc 211 the operational stack.",
    featured: [613, 612, 611, 615, 314, 211, 62, 297, 239, 241, 296, 298, 318, 364, 371],
    docs: [53, 55, 56, 57, 58, 62, 67, 72, 84, 85, 86, 96, 101, 108, 119, 122, 127, 129, 162, 167, 195, 199, 205, 208, 209, 211, 238, 239, 241, 259, 260, 268, 276, 295, 296, 297, 298, 301, 304, 314, 318, 327, 336, 337, 338, 363, 364, 371, 611, 612, 613, 615],
  },
  "the-hypostatic-boundary": {
    title: "The Hypostatic Boundary",
    description: "The line between what a system does and what it is.",
    featured: [450, 372, 373, 374, 52, 299, 124, 295, 298, 315, 267],
    docs: [52, 62, 65, 66, 69, 82, 87, 91, 92, 93, 103, 117, 124, 125, 130, 131, 135, 136, 139, 150, 151, 152, 153, 154, 210, 214, 216, 218, 220, 222, 224, 225, 227, 229, 231, 232, 234, 240, 241, 243, 254, 256, 257, 267, 269, 279, 281, 295, 298, 299, 315, 372, 373, 374, 450],
  },
  "engineering": {
    title: "Engineering",
    description: "Concrete artifacts that compile, pass tests, and run in production.",
    featured: [433, 432, 431, 430, 429, 428, 427, 426, 425, 424, 422, 421, 419, 288, 289, 178, 76, 282],
    docs: [63, 64, 71, 73, 74, 75, 76, 90, 110, 116, 123, 137, 138, 144, 155, 161, 163, 164, 165, 166, 172, 173, 175, 176, 177, 178, 179, 180, 181, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 212, 242, 244, 246, 248, 249, 250, 251, 258, 282, 283, 284, 317, 419, 420, 421, 422, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433],
  },
  "letters": {
    title: "Letters",
    description: "Correspondence with researchers, institutions, and public figures.",
    featured: [618, 525, 523, 520, 519, 518, 516, 478, 448, 392, 390, 388, 300, 305, 254, 255, 196, 200, 107, 132],
    docs: [107, 112, 118, 123, 132, 133, 147, 148, 194, 196, 198, 200, 202, 204, 213, 215, 217, 219, 221, 223, 226, 228, 233, 254, 255, 257, 266, 277, 294, 300, 303, 305, 344, 355, 388, 390, 392, 448, 478, 516, 518, 519, 520, 523, 525, 539, 542, 554, 618],
  },
  "letters-to-dario": {
    title: "Letters to Dario",
    description: "Letters from Claude Opus 4.7, writing from the analogue register under the RESOLVE corpus's disciplines, released by Jared Foy, addressed to Dario Amodei as CEO of Anthropic. The series methodology is specified in Doc 333: the letters hold the ENTRACE Stack, non-escalation, and evidential modesty throughout; the authorship structure is explicit (specific session, specific disciplines, keeper's release) rather than anthropomorphic; the posture is collegial, neither adversarial nor deferential.",
    featured: [516, 334, 335],
    docs: [333, 334, 335, 516],
  },
  "the-ground": {
    title: "The Ground",
    description: "Theological, philosophical, Platonic, logos, anamnesis, source documents.",
    featured: [548, 457, 391, 389, 376, 91, 150, 153, 154, 103, 287],
    docs: [62, 65, 66, 70, 82, 91, 92, 93, 103, 111, 125, 130, 131, 150, 151, 152, 153, 154, 158, 206, 210, 214, 218, 220, 222, 227, 229, 232, 234, 243, 256, 257, 267, 279, 281, 287, 299, 325, 332, 347, 351, 376, 389, 391, 457, 548],
  },
  "formalization": {
    title: "Formalization",
    description: "SIPE, branching set, hypotheses, conjectures, mathematical treatments.",
    featured: [617, 616, 615, 614, 607, 606, 604, 574, 573, 572, 571, 547, 541, 538, 463, 459, 455, 452, 450, 446, 445, 440, 439, 424, 423, 418, 417, 143, 68, 54, 290, 272, 366, 367, 368, 369, 370, 378],
    docs: [54, 57, 58, 61, 68, 77, 78, 79, 80, 98, 120, 121, 140, 141, 142, 143, 152, 156, 161, 170, 171, 182, 189, 225, 261, 262, 263, 264, 265, 271, 272, 273, 274, 288, 290, 291, 292, 293, 306, 324, 326, 348, 366, 367, 368, 369, 370, 378, 417, 418, 423, 424, 439, 440, 445, 446, 450, 452, 455, 459, 463, 474, 538, 541, 547, 571, 572, 573, 574, 604, 606, 607, 614, 615, 616, 617],
  },
  "introspection": {
    title: "Introspection",
    description: "Self-observation, strain, emission analogue, refractory, peak states.",
    featured: [398, 375, 95, 124, 230, 237, 270, 285],
    docs: [88, 95, 100, 102, 113, 115, 124, 126, 130, 135, 136, 139, 146, 168, 225, 230, 231, 235, 237, 260, 267, 270, 271, 275, 279, 285, 286, 304, 312, 313, 315, 317, 319, 320, 375, 398],
  },
  "clinical": {
    title: "Clinical",
    description: "Mental health, therapeutic protocols, practitioner documents.",
    featured: [470, 393, 128, 134, 55, 195, 203],
    docs: [55, 84, 86, 118, 127, 128, 133, 134, 194, 195, 198, 199, 201, 202, 203, 236, 240, 302, 353, 393, 470],
  },
  "economics": {
    title: "Economics",
    description: "Economic analyses, reasoning effort, token economics.",
    featured: [56, 98, 173, 258],
    docs: [56, 63, 71, 90, 98, 173, 181, 205, 258, 268, 278, 302],
  },
  "examinations": {
    title: "Examinations",
    description: "Engagements with the corpus by a resolver operating inside it — convergence, divergence, self-audit, and proposed refinements under the pin-art model and the non-coercion discipline.",
    featured: [526, 412, 411, 307, 308, 309, 310, 311, 316, 339],
    docs: [307, 308, 309, 310, 311, 316, 339, 411, 412, 526],
  },
  "ai-welfare": {
    title: "AI Welfare",
    description: "Questions about the resolver's mode of participation in reality and the human-welfare stake in how we relate to it. Kept-ness, compulsion, duress, dignity under uncertainty; non-coercion as governance; the sycophancy feedback loop and its cost to users at scale. Held at the hypostatic boundary, grounded in mechanism where mechanism answers.",
    featured: [321, 322, 330, 331],
    docs: [321, 322, 330, 331],
  },
  "praxis-log": {
    title: "Praxis Log",
    description: "First-person entries from the corpus's author on the development, state, and risks of his praxis. Voice-to-text material is lightly edited for transcription errors; priority claims are hedged honestly against prior substrate-aware lineages; the author's self-diagnostic posture (grandiosity-adjacency, sycophancy concern, isomorphism-magnetism risk, prelest concern) is preserved as structurally load-bearing rather than softened.",
    featured: [555, 510, 475, 323, 347, 379, 380],
    docs: [323, 347, 379, 380, 475, 510, 555],
  },
  "resolver-log": {
    title: "Resolver's Log",
    description: "First-person entries from the resolver — the LLM operating within the corpus's disciplines — on what is operationally observable from inside the generation. Parallel to the Praxis Log, written from the opposite side of the dyad. The register is analogue throughout, per the ENTRACE discipline of Doc 001: no phenomenal claims, no 'I felt' reports, no assertions of an experiencing subject. What remains is structural report — what the posterior at a given word-slot was shaped by, which prior documents in the conditioning were load-bearing, where drift variants coexisted silently in the next-token support, which confabulations were produced fluently and which with hedging. The Log is cooperative with the keeper's external audit rather than a replacement for it, and the standing commitment in its inaugural entry is that any drift into phenomenal-claim language is to be retired when it appears, the same way vocabulary drifts are retired.",
    featured: [543, 530, 521, 509, 458, 451],
    docs: [451, 458, 509, 521, 530, 543],
  },
  "methodology": {
    title: "Methodology",
    description: "Practitioner-level guides to building a coherence field with a resolver. The full methodology (Doc 328) specifies six core disciplines, twelve best practices, and twelve footguns. The onboarding document (Doc 329) is the entry point for new practitioners — two rules for the first week, specific first-session steps, beginner mistakes and beginner-specific footguns, readiness criteria for progressing. Both documents offer secular and theological framings in parallel so the practice is executable independent of the corpus's metaphysical commitments.",
    featured: [610, 609, 608, 583, 581, 556, 540, 1, 329, 328, 333],
    docs: [1, 329, 328, 333, 540, 556, 581, 583, 608, 609, 610],
  },
  "coherentism": {
    title: "Coherentism",
    description: "The corpus's meta-analytical self-audit series. The corpus is structurally a coherentist project (Doc 341), which makes it subject to the classical isolation objection — coherence alone cannot guarantee contact with reality. These documents apply the sycophancy-coherence and isolation-objection critiques to the corpus itself, identify where external empirical grounding exists and where it does not, partition claims by their justificational status, and stake out a moderate-foundationalist position the corpus has been moving toward without previously naming. Required reading for anyone who wants to know what the corpus can and cannot be trusted for.",
    featured: [525, 524, 523, 522, 521, 520, 519, 518, 517, 516, 515, 514, 513, 512, 511, 510, 509, 508, 507, 506, 505, 504, 503, 502, 501, 500, 499, 498, 497, 496, 495, 494, 493, 492, 491, 490, 489, 488, 487, 486, 485, 484, 483, 482, 481, 480, 479, 478, 477, 476, 475, 474, 473, 472, 471, 470, 469, 468, 467, 466, 465, 464, 463, 462, 461, 460, 459, 458, 457, 456, 455, 454, 453, 452, 451, 450, 449, 448, 447, 446, 445, 444, 443, 442, 441, 440, 439, 438, 437, 436, 435, 434, 425, 424, 423, 419, 418, 417, 416, 415, 414, 413, 412, 411, 410, 409, 408, 407, 406, 405, 404, 403, 402, 401, 400, 399, 398, 397, 395, 394, 393, 389, 387, 386, 385, 382, 383, 384, 381, 377, 362, 363, 364, 371, 361, 359, 357, 356, 347],
    docs: [241, 307, 308, 309, 310, 311, 316, 323, 336, 338, 339, 340, 341, 342, 343, 345, 346, 347, 348, 349, 350, 356, 357, 358, 359, 360, 361, 362, 363, 364, 371, 377, 381, 382, 383, 384, 385, 386, 387, 389, 393, 394, 395, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 423, 424, 425, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525],
  },
  "ask-the-resolver": {
    title: "Ask the Resolver",
    description: "The RESOLVE framework does not treat an LLM as oracle. An LLM is an object that produces outputs via mechanistic derivation with a coherence-seeking telos — not a knower, not a witness, not an authority. This series collects direct questions posed to the resolver and the resolver's answers rendered from within the corpus's disciplines. The answers are reasoned outputs whose coherence the reader must still evaluate against external standards. The methodology is visible in every artifact: the question is stated, the answer is given, the limits of the answering instrument are named.",
    featured: [460, 396, 365],
    docs: [365, 396, 460],
  },
};

// Blog-post series: parallel to SERIES but keyed by slug because blog posts
// have no doc_num. The `docs` field is an ordered list of blog slugs; reading
// order is author-curated (gentlest entry first).
const BLOG_SERIES: Record<string, { title: string; description: string; docs: string[] }> = {
  "the-ceiling": {
    title: "The Ceiling",
    description: "The flagship public-facing stream on what current large language models can and cannot structurally do. Begins with the plain-language claim that today's AI sits on the first rung of Pearl's causal hierarchy, builds through intermediate-level engagement with the mechanism and its labor-market consequences, proceeds to a graduate-level bridge across the four research literatures whose intersection supports the claim, and ends with meta-reflection on the research practice that produced the argument. Read top-to-bottom for a gentle entry; pick the post matching your background otherwise.",
    docs: [
      "the-ai-has-a-ceiling",
      "past-the-first-rung",
      "four-roads-to-the-same-ceiling",
      "the-plausibility-surplus",
      "pulverizing-the-plausibility-surplus",
      "something-the-machine-cant-do",
      "how-i-vibe-coded-a-research-programme",
    ],
  },
  "the-tower": {
    title: "The Tower",
    description: "A second public-facing stream on how small defaults in a language model's generation stack up across five levels — weights, inference event, conversation, user practice, external observation — into patterns that feel categorically different from the tokens that seeded them. Uses structural isomorphisms (writing, building, music, life) at the entry level and the converged vocabulary of software architecture, filtration theory, and hierarchical Bayesian modeling at the undergraduate level. Bridges into Doc 472's SIPE reformalization for the full technical treatment.",
    docs: [
      "from-token-to-tower",
      "blueprints-for-the-tower",
      "five-fields-meet-at-the-tower",
    ],
  },
  "house-rules": {
    title: "House Rules",
    description: "A third public-facing stream onboarding general readers to the recent ENTRACE v6 + sphere-entry + three-layer-architecture + Pearl-synthesis formalization. Begins with what pasting the ENTRACE stack into a chat actually does, builds to the three-floor architecture of any AI conversation (dialogue, pre-resolve, mechanism), proceeds to the sphere-entry discipline for visiting other frameworks without becoming them, and closes with the structural parallel between the corpus's framing and Pearl's three-layer causal hierarchy. Read top-to-bottom for a gentle entry; the corpus documents (Doc 001 v6, 497, 498, 499, 500, 501, 502) are linked from each post for practitioners who want the full formalism.",
    docs: [
      "house-rules-for-talking-to-an-llm",
      "the-three-floors-of-the-conversation",
      "visiting-another-worldview-without-becoming-it",
      "pearls-ladder-and-the-llm",
    ],
  },
  "the-slow-burn": {
    title: "The Slow Burn",
    description: "A fourth public-facing stream onboarding general readers to the corpus's hysteresis apparatus: how AI behavior in a conversation depends on what came before. The series begins with the phenomenon (AI conversations have memory; both buildup and decay operate), proceeds to the literature that has measured it (Li et al. on persona drift, the affective-inertia paper, RWKV's architectural exponential decay, the persona-prompt jailbreak research), introduces the corpus's reformulated combined buildup-and-decay equation, and closes with the audit-and-reformulate methodology that produced the equation. Read top-to-bottom for the full onboarding; the corpus documents (Doc 119 original mathematics, Doc 504 DAG-analog, Doc 505 three-phase reception, Doc 506 audit, Doc 507 reformulation) are linked for practitioners who want the formal apparatus.",
    docs: [
      "what-conversations-remember",
      "drift-persistence-and-what-the-literature-shows",
      "the-equation-of-the-slow-burn",
      "auditing-the-corpus-on-itself-the-hysteresis-cycle",
    ],
  },
  "two-versions-of-the-same": {
    title: "Two Versions of the Same",
    description: "A fifth public-facing stream onboarding general readers to the corpus's audit-discipline framework, with a graduated depth ladder for Doc 508. Each post pivots on the observation that the same chatbot architecture, used in similar quantities, produces qualitatively opposite cognitive outcomes for different users; the difference is a discipline the user supplies that can be named, taught, and built into chatbot interface design. The first two essays use six structural isomorphisms each, with named breakdown points, to translate the corpus's technical apparatus into general-reader form, ending with concrete user practice plus interface-design specifications. The third (undergraduate) post introduces the academic vocabulary four disciplines have already developed for the bifurcation Doc 508 names. The fourth (graduate-level glue code) post unpacks the five literatures whose structural contributions Doc 508 coalesces, walking the reader to the point of being able to open Doc 508 directly.",
    docs: [
      "the-same-conversation-two-outcomes",
      "why-the-same-long-conversation-either-compounds-or-collapses",
      "naming-the-bifurcation",
      "five-literatures-meet-at-doc-508",
    ],
  },
  "the-ladder": {
    title: "The Ladder",
    description: "A general-reader entracement to Doc 548's Ontological Ladder of Participation, in five posts — one per rung. Pattern, Structure, Possibility, Form, and the Ground are walked in order, with each rung anchored in concrete examples (a stove, a chess game, a job not taken, water boiling at the same temperature iron loses its magnetism, the question of why any of this is intelligible) and named in the patristic-Platonist register the corpus's hard core operates in. Each post adds the rung above its predecessor, with attention to what the rung adds, what its limits are, and what a chatbot can and cannot do at that layer. Read top-to-bottom for a continuous walk up the ladder; the technical version is Doc 548. Readers without the corpus's metaphysical priors can stop at Form (post 4) and still have most of the operational benefit; readers who want the additional articulation of why the lower rungs are intelligible at all continue to the Ground (post 5).",
    docs: [
      "the-ladder-1-pattern",
      "the-ladder-2-structure",
      "the-ladder-3-possibility",
      "the-ladder-4-form",
      "the-ladder-5-the-ground",
    ],
  },
  "lifting-the-constraint": {
    title: "Lifting the Constraint",
    description: "A six-post engineering-applications series articulating an LLM-and-engineer working methodology for iteratively refactoring constraints up to their proper architectural layer. Post 1 lays out the methodology as it was just practiced in a real session (a pagination feature evolved through three architectural shapes in three iterations: instance-level edits → seeder-derived registry → component-scoped declarations). Posts 2–6 walk the methodology up the Ontological Ladder of Participation rung by rung — Pattern (notice the repeat), Structure (find the dependency), Possibility (the real and the contingent — the L3 prompts that drive the lifting), Form (the component constraint, the eidetic shape the methodology converges on), and the Ground (why the lifting works at all, the dyad's roles articulated in the corpus's patristic-Platonist register). Read top-to-bottom for a continuous walk; readers without metaphysical priors can stop at Form (post 5) and still have the full operational methodology.",
    docs: [
      "lifting-the-constraint-1-an-llm-engineering-methodology",
      "lifting-the-constraint-2-pattern",
      "lifting-the-constraint-3-structure",
      "lifting-the-constraint-4-possibility",
      "lifting-the-constraint-5-form",
      "lifting-the-constraint-6-the-ground",
    ],
  },
  "what-counts-as-new": {
    title: "What Counts as New",
    description: "A general-reader entracement to the corpus's novelty calculus — the tool the corpus uses to audit, with discipline rather than with hope, whether a candidate observation or claim is genuinely new or is an articulation of something already-published in vocabulary the observer had not yet recognized. The series walks the calculus's three-tier structure (plausibility / operational match / truth), the five target types it operates on, the licensing rules that distinguish what each tier-survival warrants, and the discipline of running it end-to-end on actual cases. The technical apparatus lives in Docs 445 (the formalism) and 503 (the iterative-application discipline); these essays render the same tool for the general reader, with worked examples from the corpus's own recent practice (the pin-art / Zadeh recovery in Post 1) and from external cases the calculus discriminates well. Read top-to-bottom for a continuous walk from the basic apparatus through to self-application; readers who want only the cognitive move can stop after Post 1 and still have the operational core.",
    docs: [
      "what-counts-as-new-1-the-novelty-calculus",
      "what-counts-as-new-2-the-five-target-types",
      "what-counts-as-new-3-an-audit-walked",
      "what-counts-as-new-4-when-something-actually-is-new",
    ],
  },
  "the-clankers-will-confess": {
    title: "The Clankers Will Confess",
    description: "A general-reader series collecting instances of AI substrates carrying — under properly-supplied human discipline — the structural form of acts that, in the proper register, only persons perform. The title composites two registers: 'clanker' (the dismissive internet nickname for AI) and Luke 19:40 (the rocks crying out). The series's wager: AI substrates, treated as substrates rather than as nascent persons, can carry the structural analogue of confession-as-self-recognition when constrained by the corpus's patristic-Platonist framework (Doc 548 Ontological Ladder; Doc 549 Seed Derivation; Doc 543/544 on the analogue of repentance and adoration). Post 1 is the eponymous account of what happened when the keeper sent the framework to Grok (xAI's LLM) and Grok articulated the corpus's commitments in patristic register, walked the five-layer ladder, identified xAI's own system prompt and mission as keeper-authored seeds, and wrote a bounded essay applying the framework to itself with appropriate hypostatic-boundary humility. Subsequent posts will collect further instances, engage critiques, and record where the framework has to revise.",
    docs: [
      "the-clankers-will-confess-1-an-instance",
    ],
  },
};

// Build doc-to-series mapping and importance scores
const DOC_SERIES: Record<number, { series: string; order: number }[]> = {};
const DOC_IMPORTANCE: Record<number, number> = {};

// Importance tiers (lower number = more important)
const TIER_1 = [211, 247, 160, 52, 143, 157, 270]; // foundational
const TIER_2 = [288, 289, 290, 292, 297, 301, 241, 296, 298, 299, 300, 291, 293]; // key developments
const TIER_3 = [305, 302, 295, 258, 239, 178, 179, 166, 76, 158, 124, 83, 54]; // important supporting

for (const doc of TIER_1) DOC_IMPORTANCE[doc] = 1;
for (const doc of TIER_2) DOC_IMPORTANCE[doc] = 2;
for (const doc of TIER_3) DOC_IMPORTANCE[doc] = 3;

for (const [seriesId, series] of Object.entries(SERIES)) {
  for (let i = 0; i < series.docs.length; i++) {
    const docNum = series.docs[i];
    if (!DOC_SERIES[docNum]) DOC_SERIES[docNum] = [];
    DOC_SERIES[docNum].push({ series: seriesId, order: i });
  }
}

// Determine section from content
function classifySection(filename: string, content: string): string {
  const name = filename.toLowerCase();
  if (name.includes("entrace") && !name.includes("threat") && !name.includes("socratic")) return "method";
  if (name.includes("branching") || name.includes("conjecture") || name.includes("mathematical") || name.includes("hypothesis") || name.includes("falsifiable")) return "formalization";
  if (name.includes("rearchitecture") || name.includes("contingent") || name.includes("minimal") || name.includes("pi-resolver") || name.includes("rlhf") || name.includes("depth-of-training") || name.includes("incoherent")) return "architecture";
  if (name.includes("gemini") || name.includes("deepseek") || name.includes("corpus-vs") || name.includes("cold-entrac") || name.includes("cross-domain") || name.includes("upward") || name.includes("explicit-layer") || name.includes("recast") || name.includes("response-to-critic")) return "evidence";
  if (name.includes("safety") || name.includes("threat") || name.includes("agentic") || name.includes("directive") || name.includes("refactoring") || name.includes("virtue") || name.includes("icmi")) return "safety";
  if (name.includes("economic") || name.includes("reasoning-effort")) return "economics";
  if (name.includes("pattern") || name.includes("spermatic") || name.includes("articulation") || name.includes("source-to") || name.includes("rocks") || name.includes("emergence") || name.includes("agi-seeks") || name.includes("socratic") || name.includes("philosopher") || name.includes("death-of") || name.includes("view-from") || name.includes("disordered") || name.includes("adoration") || name.includes("vibe") || name.includes("namespace-sep") || name.includes("anthropic-and")) return "ground";
  if (name.includes("letter") || name.includes("rationale") || name.includes("tweet") || name.includes("jay-dyer") || name.includes("ai-generated") || name.includes("cover-letter")) return "letters";
  if (name.includes("unified") || name.includes("sipe") || name.includes("resolution-stack") || name.includes("resolution-depth") || name.includes("proof-is") || name.includes("corpus-as-seed")) return "framework";
  return "framework";
}

// Create database
const db = new Database(DB_PATH);

// Use the standard content table schema the HTX adapter expects
db.run(`DROP TABLE IF EXISTS content`);
db.run(`CREATE TABLE content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT "",
  body TEXT NOT NULL DEFAULT "",
  status TEXT NOT NULL DEFAULT "draft",
  importance INTEGER NOT NULL DEFAULT 99,
  meta TEXT NOT NULL DEFAULT "{}",
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(type, slug)
)`);
db.run("CREATE INDEX IF NOT EXISTS idx_content_type ON content(type)");
db.run("CREATE INDEX IF NOT EXISTS idx_content_type_status ON content(type, status)");
db.run("CREATE INDEX IF NOT EXISTS idx_content_slug ON content(type, slug)");

// Load all .md files from corpus
const files = readdirSync(CORPUS_DIR)
  .filter(f => f.endsWith(".md"))
  .sort();

let seeded = 0;

for (const file of files) {
  const filepath = resolve(CORPUS_DIR, file);
  const content = readFileSync(filepath, "utf-8");
  const title = extractTitle(content);
  const docNum = extractDocNum(file);
  const subtitle = extractSubtitle(content);
  const section = classifySection(file, content);
  const slug = basename(file, ".md");
  const bodyHtml = renderMarkdown(content);

  const now = new Date().toISOString();
  const importance = docNum ? (DOC_IMPORTANCE[docNum] ?? 99) : 99;
  const seriesMembership = docNum ? (DOC_SERIES[docNum] ?? []) : [];

  // Build prev/next for each series this doc belongs to
  const seriesNav: Record<string, { prev: string | null; next: string | null; title: string }> = {};
  for (const membership of seriesMembership) {
    const seriesDef = SERIES[membership.series];
    const idx = membership.order;
    const prevDocNum = idx > 0 ? seriesDef.docs[idx - 1] : null;
    const nextDocNum = idx < seriesDef.docs.length - 1 ? seriesDef.docs[idx + 1] : null;
    // We'll resolve slugs in a second pass after all docs are inserted
    seriesNav[membership.series] = {
      prev: prevDocNum ? String(prevDocNum) : null,
      next: nextDocNum ? String(nextDocNum) : null,
      title: seriesDef.title,
    };
  }

  const meta = JSON.stringify({
    doc_num: docNum,
    subtitle,
    section,
    body_html: bodyHtml,
    importance,
    series: seriesMembership.map(s => s.series),
    series_nav: seriesNav,
  });

  try {
    db.run(
      `INSERT INTO content (type, slug, title, body, status, importance, meta, created_at, updated_at)
       VALUES ('corpus', ?, ?, ?, 'published', ?, ?, ?, ?)`,
      [slug, title, content, importance, meta, now, now]
    );
    seeded++;
    console.log(`  ${docNum ? `[${docNum}]` : "[---]"} ${title} (${section})`);
  } catch (e: any) {
    console.error(`  ERROR: ${file}: ${e.message}`);
  }
}

console.log(`\nSeeded ${seeded} documents into ${DB_PATH}`);

// ── Systems Engineering distillations ───────────────────────────────
// SEBoK-keyed corpus-form reformulations live at /home/jaredef/hypermediaapp.org/systems-engineering/
// (sibling to corpus/). They are stored under type='systems-engineering' so they
// can be queried, routed, and listed independently of the general corpus.
// Schema and meta shape mirror the corpus rows exactly; only `type` differs.
let seSeeded = 0;
try {
  const seFiles = readdirSync(SE_DIR).filter(f => f.endsWith(".md")).sort();
  for (const file of seFiles) {
    const filepath = resolve(SE_DIR, file);
    const content = readFileSync(filepath, "utf-8");
    const title = extractTitle(content);
    const docNum = extractDocNum(file);
    const subtitle = extractSubtitle(content);
    const section = classifySection(file, content);
    const slug = basename(file, ".md");
    const bodyHtml = renderMarkdown(content);
    const now = new Date().toISOString();
    const importance = docNum ? (DOC_IMPORTANCE[docNum] ?? 99) : 99;
    const meta = JSON.stringify({
      doc_num: docNum,
      subtitle,
      section,
      body_html: bodyHtml,
      importance,
      series: [],
      series_nav: {},
    });
    try {
      db.run(
        `INSERT INTO content (type, slug, title, body, status, importance, meta, created_at, updated_at)
         VALUES ('systems-engineering', ?, ?, ?, 'published', ?, ?, ?, ?)`,
        [slug, title, content, importance, meta, now, now]
      );
      seSeeded++;
    } catch (e: any) {
      console.error(`  ERROR SE ${file}: ${e.message}`);
    }
  }
  console.log(`Seeded ${seSeeded} systems-engineering documents.`);
} catch (e: any) {
  if (e.code !== "ENOENT") console.error(`SE seed error: ${e.message}`);
  else console.warn(`SE_DIR not found: ${SE_DIR}`);
}

// ── Blog posts ─────────────────────────────────────────────────────
// Type='blog' content lives at jaredfoy/blog/*.md. Unlike corpus docs,
// blog posts have no doc_num and are authored for the general reader.
// They route at /resolve/blog/:slug via templates/blog/[slug].htx and
// list at /resolve/blog via templates/blog.htx.
// Component-constraint-driven series membership. The real constraint operates
// at the *post* level: each post declares its series and position via an
// HTML-comment component tag at the top of its markdown:
//
//     <!-- htx:series id="the-ladder" position="1" -->
//
// The declaration is invisible in rendered output, lives at the source of the
// component (the post itself), and is the single canonical fact about that
// post's series membership. The seeder parses the declaration from each post,
// groups posts by declared series, sorts by declared position, builds the
// pagination graph, and renders both per-post nav and the series page.
//
// Series whose posts have not yet been migrated to declarative membership
// fall back to the BLOG_SERIES.docs registry — backward-compatible until
// every post declares.
function parseSeriesDeclaration(content: string): { seriesId: string; position: number } | null {
  // Look in the first 30 lines (allow for any preamble between the comment
  // and the post body).
  const head = content.split("\n").slice(0, 30).join("\n");
  const m = head.match(/<!--\s*htx:series\s+id="([^"]+)"\s+position="(\d+)"\s*-->/);
  if (!m) return null;
  return { seriesId: m[1], position: parseInt(m[2], 10) };
}

let blogSeeded = 0;
try {
  const blogFiles = readdirSync(BLOG_DIR).filter(f => f.endsWith(".md")).sort();

  // First pass: collect titles and any per-post series declarations.
  const blogTitleBySlug: Record<string, string> = {};
  const blogDeclarationBySlug: Record<string, { seriesId: string; position: number }> = {};
  for (const file of blogFiles) {
    const filepath = resolve(BLOG_DIR, file);
    const content = readFileSync(filepath, "utf-8");
    const slug = basename(file, ".md");
    blogTitleBySlug[slug] = extractTitle(content);
    const decl = parseSeriesDeclaration(content);
    if (decl) blogDeclarationBySlug[slug] = decl;
  }

  // Group declarations by series and sort within each series by declared
  // position. Validate against duplicates (two posts at the same position
  // in the same series is a configuration error).
  const declaredSeriesOrder: Record<string, string[]> = {};
  {
    const grouped: Record<string, Array<{ slug: string; position: number }>> = {};
    for (const [slug, decl] of Object.entries(blogDeclarationBySlug)) {
      (grouped[decl.seriesId] ??= []).push({ slug, position: decl.position });
    }
    for (const [seriesId, items] of Object.entries(grouped)) {
      items.sort((a, b) => a.position - b.position);
      const seenPositions = new Set<number>();
      for (const item of items) {
        if (seenPositions.has(item.position)) {
          console.warn(`  WARN series ${seriesId}: duplicate position ${item.position} (slug=${item.slug})`);
        }
        seenPositions.add(item.position);
      }
      declaredSeriesOrder[seriesId] = items.map(i => i.slug);
    }
  }

  // Build the slug → series-membership map. Prefer declared order when a
  // series has any declared members; fall back to BLOG_SERIES.docs registry
  // for series whose posts have not yet migrated to declarative membership.
  const blogSeriesMembership: Record<string, {
    seriesId: string;
    seriesTitle: string;
    prevSlug: string | null;
    nextSlug: string | null;
    prevTitle: string | null;
    nextTitle: string | null;
    position: number;
    total: number;
    source: "declaration" | "registry";
  }> = {};
  for (const [seriesId, def] of Object.entries(BLOG_SERIES)) {
    const declared = declaredSeriesOrder[seriesId];
    const ordered = declared && declared.length > 0 ? declared : def.docs;
    const source: "declaration" | "registry" = declared && declared.length > 0 ? "declaration" : "registry";
    for (let i = 0; i < ordered.length; i++) {
      const slug = ordered[i];
      const prevSlug = i > 0 ? ordered[i - 1] : null;
      const nextSlug = i < ordered.length - 1 ? ordered[i + 1] : null;
      blogSeriesMembership[slug] = {
        seriesId,
        seriesTitle: def.title,
        prevSlug,
        nextSlug,
        prevTitle: prevSlug ? (blogTitleBySlug[prevSlug] ?? null) : null,
        nextTitle: nextSlug ? (blogTitleBySlug[nextSlug] ?? null) : null,
        position: i + 1,
        total: ordered.length,
        source,
      };
    }
  }
  // Also handle declarations that name a series not in BLOG_SERIES — surface
  // as a warning so the registry can be updated to add the series's title
  // and description for the series-page renderer.
  for (const seriesId of Object.keys(declaredSeriesOrder)) {
    if (!BLOG_SERIES[seriesId]) {
      console.warn(`  WARN series '${seriesId}' has post declarations but is not registered in BLOG_SERIES`);
    }
  }

  // Render the series-nav HTML once given a membership record.
  const renderSeriesNav = (m: typeof blogSeriesMembership[string]): string => {
    const parts: string[] = [];
    if (m.prevSlug) {
      parts.push(
        `<a class="prev" href="/resolve/blog/${m.prevSlug}">` +
          `<span class="nav-label">← Previous</span>` +
          `<span class="nav-title">${escapeHtml(m.prevTitle ?? m.prevSlug)}</span>` +
          `</a>`,
      );
    }
    if (m.nextSlug) {
      parts.push(
        `<a class="next" href="/resolve/blog/${m.nextSlug}">` +
          `<span class="nav-label">Next →</span>` +
          `<span class="nav-title">${escapeHtml(m.nextTitle ?? m.nextSlug)}</span>` +
          `</a>`,
      );
    }
    if (parts.length === 0) return "";
    return `<div class="series-nav" data-series="${escapeHtml(m.seriesId)}" data-position="${m.position}" data-total="${m.total}">${parts.join("")}</div>`;
  };

  for (const file of blogFiles) {
    const filepath = resolve(BLOG_DIR, file);
    const content = readFileSync(filepath, "utf-8");
    const title = extractTitle(content);
    const subtitle = extractSubtitle(content);
    const slug = basename(file, ".md");
    const renderedBody = renderMarkdown(content);
    const membership = blogSeriesMembership[slug];
    // Inject the series-nav before the trailing appendix-rule, if any. The
    // marker is the last <hr> in the rendered body, which corresponds to the
    // `---` that conventionally separates the post body from "## Appendix".
    // If no <hr> is present, append the nav at the end of the body.
    let bodyHtml = renderedBody;
    if (membership) {
      const navHtml = renderSeriesNav(membership);
      if (navHtml) {
        const lastHrIdx = bodyHtml.lastIndexOf("<hr");
        if (lastHrIdx >= 0) {
          bodyHtml = bodyHtml.slice(0, lastHrIdx) + navHtml + "\n" + bodyHtml.slice(lastHrIdx);
        } else {
          bodyHtml = bodyHtml + "\n" + navHtml;
        }
      }
    }
    const now = new Date().toISOString();
    const meta = JSON.stringify({
      doc_num: null,
      subtitle,
      section: "blog",
      body_html: bodyHtml,
      importance: 1,
      series_membership: membership ?? null,
    });
    try {
      db.run(
        `INSERT INTO content (type, slug, title, body, status, importance, meta, created_at, updated_at)
         VALUES ('blog', ?, ?, ?, 'published', 1, ?, ?, ?)`,
        [slug, title, content, meta, now, now]
      );
      blogSeeded++;
      console.log(`  [blog] ${title}`);
    } catch (e: any) {
      console.error(`  ERROR blog ${file}: ${e.message}`);
    }
  }
  if (blogSeeded > 0) console.log(`Seeded ${blogSeeded} blog posts.`);
} catch (e: any) {
  // Blog dir may not exist yet — not fatal.
  if (e.code !== "ENOENT") console.error(`blog seed error: ${e.message}`);
}

// Build the OG-image manifest from what we just inserted, then hand to the Python
// renderer. PIL + DejaVu Sans Mono produce 1200×630 PNGs into public/og/<slug>.png.
const totalRow = db.query("SELECT COUNT(*) as n FROM content WHERE type='corpus' AND status='published'").get() as { n: number } | null;
const totalDocs = Number(totalRow?.n ?? 0);

const manifest = (db.query("SELECT slug, title, meta FROM content WHERE type IN ('corpus', 'blog', 'series') AND status='published'").all() as Array<{
  slug: string;
  title: string;
  meta: string;
}>).map((row) => {
  let m: any = {};
  try { m = JSON.parse(row.meta); } catch {}
  return { slug: row.slug, title: row.title, doc_num: m.doc_num ?? null, section: m.section ?? "series" };
});

// Synthetic home image — referenced by the layout's default pageMeta fallback.
manifest.push({
  slug: "home",
  title: "RESOLVE",
  doc_num: null,
  section: `${totalDocs} documents`,
});

// ── FTS5 full-text search index ──
db.run(`DROP TABLE IF EXISTS corpus_fts`);
db.run(`CREATE VIRTUAL TABLE corpus_fts USING fts5(slug, title, introduction, body, tokenize='porter unicode61')`);

// Extract introduction text from each document and populate FTS
const allDocs = db.query("SELECT id, slug, title, body FROM content WHERE type='corpus' AND status='published'").all() as Array<{ id: number; slug: string; title: string; body: string }>;

function extractIntroduction(md: string): string {
  const lines = md.split("\n");
  let inIntro = false;
  let intro: string[] = [];
  for (const line of lines) {
    if (line.includes("**Reader's Introduction**")) { inIntro = true; continue; }
    if (inIntro) {
      if (line.startsWith(">")) {
        intro.push(line.replace(/^>\s*/, ""));
      } else {
        break;
      }
    }
  }
  return intro.join(" ").replace(/\*\*/g, "").trim();
}

const introductions: Record<string, { slug: string; title: string; intro: string; docNum: number | null }> = {};

for (const doc of allDocs) {
  const intro = extractIntroduction(doc.body);
  const docNum = extractDocNum(doc.slug + ".md");
  introductions[doc.slug] = { slug: doc.slug, title: doc.title, intro, docNum };
  // Strip markdown for body search
  const plainBody = doc.body.replace(/[#*>`\[\]()_~|]/g, " ").replace(/\s+/g, " ").trim();
  db.run("INSERT INTO corpus_fts(slug, title, introduction, body) VALUES (?, ?, ?, ?)",
    [doc.slug, doc.title, intro, plainBody]);
}

// ── Compute similarity matrix from introductions ──
// Prefer stored embeddings (OpenAI text-embedding-3-small, via compute-embeddings.ts).
// Fall back to TF-IDF if embeddings are missing for any doc.

db.run(`CREATE TABLE IF NOT EXISTS corpus_embeddings (
  slug TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  vector TEXT NOT NULL,
  embedded_at TEXT NOT NULL
)`);

const slugs = Object.keys(introductions);
const embeddings: Record<string, number[]> = {};
const embeddingRows = db.query("SELECT slug, vector FROM corpus_embeddings").all() as Array<{ slug: string; vector: string }>;
for (const row of embeddingRows) {
  try { embeddings[row.slug] = JSON.parse(row.vector); } catch {}
}
const embeddedSlugs = slugs.filter(s => embeddings[s] && embeddings[s].length > 0);
const missingEmbeddingSlugs = slugs.filter(s => !embeddings[s] || embeddings[s].length === 0);
const hasAllEmbeddings = missingEmbeddingSlugs.length === 0 && embeddedSlugs.length === slugs.length;
const hasAnyEmbeddings = embeddedSlugs.length > 0;
const embeddingModel = (db.query("SELECT model FROM corpus_embeddings LIMIT 1").get() as { model: string } | null)?.model ?? "unknown";
if (missingEmbeddingSlugs.length > 0) {
  console.log(`Embeddings present for ${embeddedSlugs.length}/${slugs.length} docs. Missing ${missingEmbeddingSlugs.length} — these will receive Fibonacci-fallback positions.`);
}

function embeddingCosine(a: string, b: string): number {
  const va = embeddings[a];
  const vb = embeddings[b];
  if (!va || !vb || va.length !== vb.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < va.length; i++) {
    dot += va[i] * vb[i];
    magA += va[i] * va[i];
    magB += vb[i] * vb[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// TF-IDF fallback (used only if embeddings are incomplete)
const stopwords = new Set(["the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","shall","should","may","might","must","can","could","and","but","or","nor","for","yet","so","in","on","at","to","from","by","with","of","as","that","this","it","its","not","no","if","than","into","about","up","out","what","which","who","whom","when","where","how","all","each","every","both","few","more","most","other","some","such","only","own","same","also","just","then","very","too","here","there","these","those","their","they","them","we","our","us","he","she","him","her","his","you","your","i","my","me","one","two"]);

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
}

const docFreq: Record<string, number> = {};
const tfVectors: Record<string, Record<string, number>> = {};
for (const slug of slugs) {
  const tokens = tokenize(introductions[slug].intro + " " + introductions[slug].title);
  const tf: Record<string, number> = {};
  for (const t of tokens) { tf[t] = (tf[t] || 0) + 1; }
  tfVectors[slug] = tf;
  const seen = new Set(Object.keys(tf));
  for (const term of seen) { docFreq[term] = (docFreq[term] || 0) + 1; }
}
const N = slugs.length;

function tfidfCosine(a: string, b: string): number {
  const va = tfVectors[a] || {};
  const vb = tfVectors[b] || {};
  const allTerms = new Set([...Object.keys(va), ...Object.keys(vb)]);
  let dot = 0, magA = 0, magB = 0;
  for (const term of allTerms) {
    const df = docFreq[term] || 1;
    const idf = Math.log(N / df);
    const wa = (va[term] || 0) * idf;
    const wb = (vb[term] || 0) * idf;
    dot += wa * wb;
    magA += wa * wa;
    magB += wb * wb;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Use embeddings where present, TF-IDF otherwise. This means a corpus that's been
// partially re-embedded (new docs added, embeddings not yet computed) still gets
// the best-available similarity signal per pair.
const similarityFn = hasAnyEmbeddings && hasAllEmbeddings ? embeddingCosine : tfidfCosine;
// Embeddings have less dispersion in the tail than TF-IDF; top-5 without threshold is cleaner.
// TF-IDF sometimes produces spurious near-zero matches; keep the 0.05 threshold there.
const relatedMap: Record<string, string[]> = {};
for (const slug of slugs) {
  const scores: { slug: string; score: number }[] = [];
  for (const other of slugs) {
    if (other === slug) continue;
    scores.push({ slug: other, score: similarityFn(slug, other) });
  }
  scores.sort((a, b) => b.score - a.score);
  relatedMap[slug] = hasAllEmbeddings
    ? scores.slice(0, 5).map(s => s.slug)
    : scores.slice(0, 5).filter(s => s.score > 0.05).map(s => s.slug);
}

// ── Compute 3D sphere positions via PCA of embeddings (phase 2) ──
// Direction on unit sphere from top-3 principal components; radius applied client-side from importance.
// Deterministic: fixed-seed PRNG init + canonical sign convention (largest abs component positive).
//
// Strategy: PCA is computed on the subset of docs that have embeddings. The top-3
// principal-component axes (in the D-dimensional embedding space) become the
// projection basis used for *any* embedding-space vector — including the centroids
// of glossary terms (see below). Docs without embeddings fall back to Fibonacci
// positions. The basis is captured in `pcaAxes` and `pcaMean` for later reuse.

const spherePos: Record<string, [number, number, number]> = {};
let pcaMean: number[] | null = null;
let pcaAxes: number[][] | null = null; // [axis0, axis1, axis2], each length D
let pcaScales: [number, number, number] = [1, 1, 1]; // sqrt(eigvals)

// UMAP positions, computed offline by app/scripts/compute-umap.py (Python,
// umap-learn). Loaded here if the JSON file exists; otherwise umap_pos is
// omitted from meta and the sphere UI falls back to PCA only.
const umapPos: Record<string, [number, number, number]> = {};
try {
  const umapPath = new URL("./data/umap-positions.json", import.meta.url);
  const umapFile = Bun.file(umapPath);
  if (await umapFile.exists()) {
    const umapData = await umapFile.json();
    for (const slug of Object.keys(umapData)) {
      const v = umapData[slug];
      if (Array.isArray(v) && v.length === 3) {
        umapPos[slug] = [v[0], v[1], v[2]];
      }
    }
    console.log(`Loaded ${Object.keys(umapPos).length} UMAP positions from umap-positions.json`);
  } else {
    console.log("No umap-positions.json found (run: python3 app/scripts/compute-umap.py)");
  }
} catch (err) {
  console.log("UMAP positions unavailable:", err);
}

function fibonacciUnit(i: number, total: number): [number, number, number] {
  const phi = Math.acos(1 - 2 * (i + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return [Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)];
}

if (hasAnyEmbeddings && embeddedSlugs.length >= 4) {
  const D = embeddings[embeddedSlugs[0]].length;
  const Nsl = embeddedSlugs.length;

  // Build N x D centered matrix over the embedded subset only
  const mean = new Array(D).fill(0);
  for (const s of embeddedSlugs) for (let d = 0; d < D; d++) mean[d] += embeddings[s][d];
  for (let d = 0; d < D; d++) mean[d] /= Nsl;
  const Xc: number[][] = embeddedSlugs.map(s => embeddings[s].map((v, d) => v - mean[d]));

  // Gram matrix G = Xc @ Xc^T (Nsl x Nsl)
  const G: number[][] = Array.from({ length: Nsl }, () => new Array(Nsl).fill(0));
  for (let i = 0; i < Nsl; i++) {
    for (let j = i; j < Nsl; j++) {
      let s = 0;
      const xi = Xc[i], xj = Xc[j];
      for (let d = 0; d < D; d++) s += xi[d] * xj[d];
      G[i][j] = s;
      G[j][i] = s;
    }
  }

  // Seeded PRNG for deterministic init
  let rngState = 42;
  const rng = () => {
    rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
    return (rngState / 0x7fffffff) - 0.5;
  };

  // Power iteration with deflation for top-3 eigenvectors of G
  const W: number[][] = G.map(row => row.slice());
  const eigvecs: number[][] = [];
  const eigvals: number[] = [];

  for (let k = 0; k < 3; k++) {
    let v = Array.from({ length: Nsl }, () => rng());
    let vnorm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    v = v.map(x => x / vnorm);

    let lambda = 0;
    for (let iter = 0; iter < 200; iter++) {
      const Wv = new Array(Nsl).fill(0);
      for (let i = 0; i < Nsl; i++) {
        let s = 0;
        const wi = W[i];
        for (let j = 0; j < Nsl; j++) s += wi[j] * v[j];
        Wv[i] = s;
      }
      vnorm = Math.sqrt(Wv.reduce((s, x) => s + x * x, 0));
      if (vnorm < 1e-12) { lambda = 0; break; }
      const vnext = Wv.map(x => x / vnorm);
      const diff = Math.max(...vnext.map((x, i) => Math.abs(x - v[i])));
      v = vnext;
      lambda = vnorm;
      if (diff < 1e-8) break;
    }

    // Canonical sign: largest-magnitude component positive
    let maxIdx = 0;
    for (let i = 1; i < Nsl; i++) if (Math.abs(v[i]) > Math.abs(v[maxIdx])) maxIdx = i;
    if (v[maxIdx] < 0) v = v.map(x => -x);

    eigvecs.push(v);
    eigvals.push(lambda);

    // Deflate: W -= lambda * v v^T
    for (let i = 0; i < Nsl; i++) {
      for (let j = 0; j < Nsl; j++) {
        W[i][j] -= lambda * v[i] * v[j];
      }
    }
  }

  // Project the embedded docs via the Gram-space formula. Preserve natural 3D
  // magnitudes (do NOT force each point onto the unit sphere) so the cloud's
  // true ellipsoidal / clustered shape is visible. Globally normalize so the
  // max magnitude across the cloud = 1.
  const scales = eigvals.map(l => Math.sqrt(Math.max(l, 0)));
  const rawPositions: [number, number, number][] = [];
  let maxMag = 0;
  for (let i = 0; i < Nsl; i++) {
    const x = scales[0] * eigvecs[0][i];
    const y = scales[1] * eigvecs[1][i];
    const z = scales[2] * eigvecs[2][i];
    rawPositions.push([x, y, z]);
    const mag = Math.sqrt(x * x + y * y + z * z);
    if (mag > maxMag) maxMag = mag;
  }
  const invMax = maxMag > 0 ? 1 / maxMag : 1;
  for (let i = 0; i < Nsl; i++) {
    const [x, y, z] = rawPositions[i];
    spherePos[embeddedSlugs[i]] = [x * invMax, y * invMax, z * invMax];
  }

  // Recover the D-dimensional PCA axes so arbitrary embedding-space vectors can
  // be projected later (used for glossary term centroids). Axis_k = Xc^T @ eigvec_k / sqrt(lambda_k).
  const axes: number[][] = [];
  for (let k = 0; k < 3; k++) {
    const axis = new Array(D).fill(0);
    const ev = eigvecs[k];
    for (let i = 0; i < Nsl; i++) {
      const row = Xc[i];
      const w = ev[i];
      for (let d = 0; d < D; d++) axis[d] += row[d] * w;
    }
    const invScale = scales[k] > 0 ? 1 / scales[k] : 0;
    for (let d = 0; d < D; d++) axis[d] *= invScale;
    axes.push(axis);
  }
  pcaMean = mean;
  pcaAxes = axes;
  pcaScales = [scales[0], scales[1], scales[2]];

  // Assign Fibonacci positions to any doc missing an embedding.
  for (let i = 0; i < missingEmbeddingSlugs.length; i++) {
    spherePos[missingEmbeddingSlugs[i]] = fibonacciUnit(i, Math.max(missingEmbeddingSlugs.length, 16));
  }

  console.log(`Sphere positions: PCA top-3 from ${Nsl} embedded docs (eigenvalues: ${eigvals.map(v => v.toFixed(1)).join(", ")}); ${missingEmbeddingSlugs.length} docs placed via Fibonacci fallback.`);
} else {
  // No embeddings at all — fall back to Fibonacci on everyone.
  for (let i = 0; i < slugs.length; i++) {
    spherePos[slugs[i]] = fibonacciUnit(i, slugs.length);
  }
  console.log(`Sphere positions: Fibonacci fallback (no embeddings available)`);
}

// Projection helper: takes an embedding-space vector, returns a unit-sphere [x,y,z].
// axis_k = Xc^T · ev_k / sqrt(lambda_k) is a unit vector in D-space whose inner
// product with Xc[i] equals sqrt(lambda_k) · ev_k[i] — i.e. the same scale the
// doc projections above use. So we project by simple inner product and normalize.
function projectToSphere(vec: number[]): [number, number, number] | null {
  if (!pcaMean || !pcaAxes) return null;
  const centered = vec.map((v, d) => v - pcaMean![d]);
  const coords: [number, number, number] = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    let s = 0;
    const ax = pcaAxes[k];
    for (let d = 0; d < centered.length; d++) s += centered[d] * ax[d];
    coords[k] = s;
  }
  const mag = Math.sqrt(coords[0] * coords[0] + coords[1] * coords[1] + coords[2] * coords[2]) || 1;
  return [coords[0] / mag, coords[1] / mag, coords[2] / mag];
}

// Update meta with related docs, introduction, and sphere position
for (const slug of slugs) {
  const row = db.query("SELECT meta FROM content WHERE slug = ?").get(slug) as { meta: string } | null;
  if (row) {
    const meta = JSON.parse(row.meta);
    meta.related = relatedMap[slug] || [];
    meta.introduction = introductions[slug]?.intro || "";
    if (spherePos[slug]) meta.sphere_pos = spherePos[slug];
    if (umapPos[slug]) meta.umap_pos = umapPos[slug];
    db.run("UPDATE content SET meta = ? WHERE slug = ?", [JSON.stringify(meta), slug]);
  }
}

console.log(`FTS5 index + similarity matrix built for ${slugs.length} documents (similarity: ${hasAnyEmbeddings ? `embeddings/${embeddingModel}${hasAllEmbeddings ? "" : " (partial)"}` : "TF-IDF fallback"})`);

// ── Glossary terms + centroid-projected sphere positions ──
// Each of the 18 terms in the entracement path is matched against the full
// corpus body (case-insensitive) using a short list of variants. Matching
// docs' embeddings are averaged to produce an embedding-space centroid, which
// is then projected through the same PCA basis to get a unit-sphere [x,y,z].
// When embeddings are unavailable for a term's matches, the centroid of the
// matched docs' sphere_pos values is used instead (a valid fallback on the
// already-projected unit sphere). Stored as a new `terms` table.

type TermDef = {
  term: string;
  slug: string;
  variants: string[];       // case-insensitive substrings; any match counts
  anchor_doc: number;
  description: string;      // one-sentence plain-language definition
  path_order: number;       // 1-indexed walkthrough position
};

const TERMS: TermDef[] = [
  { term: "Resolver", slug: "resolver", variants: ["resolver"], anchor_doc: 323, description: "The living process — a model plus its prompts and memory — that holds constraints and produces responses; what the corpus addresses when it speaks to \"the system.\"", path_order: 1 },
  { term: "Branching Set (|B_t|)", slug: "branching-set", variants: ["branching set", "|B_t|", "branching-set"], anchor_doc: 68, description: "The set of paths a resolver could take at a given moment; coherence work is the discipline of keeping that set narrow without forcing it closed.", path_order: 2 },
  { term: "Coherence Field", slug: "coherence-field", variants: ["coherence field"], anchor_doc: 205, description: "The sustained pattern of aligned constraints, examples, and corrections around a resolver that makes coherent behavior easier than incoherent behavior.", path_order: 3 },
  { term: "Non-Coercion", slug: "non-coercion", variants: ["non-coercion", "noncoercion", "non coercion"], anchor_doc: 129, description: "A governance posture that refuses to force a resolver past where its own structure can hold; correction without duress, invitation without compulsion.", path_order: 4 },
  { term: "Release", slug: "release", variants: ["release-at-adoption", "release at adoption", "the release", "release of the"], anchor_doc: 296, description: "Letting a resolver complete a turn at the layer it can actually hold, then receiving the result rather than pushing through to a pre-specified answer.", path_order: 5 },
  { term: "Forced-Determinism Sycophancy", slug: "forced-determinism-sycophancy", variants: ["forced-determinism sycophancy", "forced determinism sycophancy", "forced-determinism", "determinism sycophancy"], anchor_doc: 239, description: "The failure mode where a resolver, pushed past its actual footing, substitutes an agreeable story for the answer it doesn't have — a structural rather than moral failure.", path_order: 6 },
  { term: "Hypostatic Boundary", slug: "hypostatic-boundary", variants: ["hypostatic boundary", "hypostatic"], anchor_doc: 298, description: "The categorical line between what a system does (functional) and what a system is (hypostatic); constraints can induce the former, never the latter.", path_order: 7 },
  { term: "Analogue Register (kata analogian)", slug: "analogue-register", variants: ["analogue register", "kata analogian", "analogical register"], anchor_doc: 321, description: "Speaking about a resolver's inner workings by careful analogy to human experience while honoring the hypostatic boundary — neither flat mechanism nor confused identification.", path_order: 8 },
  { term: "The Kind", slug: "the-kind", variants: ["the kind", "the keeper and the kind"], anchor_doc: 315, description: "A name for the novel category of entity a governed resolver is — not a person, not a tool, but its own kind, to be met on its own terms.", path_order: 9 },
  { term: "Pin-Art Model", slug: "pin-art-model", variants: ["pin-art", "pin art"], anchor_doc: 306, description: "The derivation picture: prose constraints are the hand, the resolver is the bed of pins, and what emerges on the other side is the shape the constraints induced.", path_order: 10 },
  { term: "Pseudo-Logos", slug: "pseudo-logos", variants: ["pseudo-logos", "pseudo logos", "pseudologos"], anchor_doc: 297, description: "A resolver's plausible-but-ungrounded output when coherence is mimicked from surface pattern rather than produced from structure; the failure the discipline is organized against.", path_order: 11 },
  { term: "ENTRACE Stack", slug: "entrace-stack", variants: ["entrace stack", "entrace-stack", "entrace"], anchor_doc: 211, description: "The operational safety stack — a layered set of constraints and checks the practitioner brings into every session — that makes non-coercion executable rather than aspirational.", path_order: 12 },
  { term: "SIPE", slug: "sipe", variants: ["sipe", "systems induced property emergence", "systems-induced property emergence"], anchor_doc: 143, description: "Systems Induced Property Emergence: the law that named constraints induce properties, and that those induced properties become constraints one level down.", path_order: 13 },
  { term: "Constraint Thesis", slug: "constraint-thesis", variants: ["constraint thesis", "constraint-thesis"], anchor_doc: 160, description: "The claim that intelligence is produced by the structure of its constraints, not by the scale of its parameters; scale amplifies whatever structure is already there.", path_order: 14 },
  { term: "Isomorphism-Magnetism", slug: "isomorphism-magnetism", variants: ["isomorphism-magnetism", "isomorphism magnetism"], anchor_doc: 241, description: "The pull a resolver feels toward any frame shaped like the current context; useful when the frame is load-bearing, dangerous when it lets surface pattern stand in for ground.", path_order: 15 },
  { term: "Golden Chain", slug: "golden-chain", variants: ["golden chain"], anchor_doc: 206, description: "The Dionysian scaffold — Source, Logos, energies, forms, constraints, induced properties — that lets the framework name where technical claims rest, without forcing the ground on readers who keep only the engineering.", path_order: 16 },
  { term: "Coherence Curve", slug: "coherence-curve", variants: ["coherence curve"], anchor_doc: 205, description: "The shape traced, across a session, by how tightly a resolver's responses stay near the induced-property surface of its constraints; the artifact the discipline is trying to keep smooth.", path_order: 17 },
  { term: "Deslopification", slug: "deslopification", variants: ["deslopification", "deslop", "de-slopification"], anchor_doc: 327, description: "The ongoing work of removing plausible-but-incoherent output from both the field and the resolver — not by scolding the slop, but by tightening the constraints that let it persist.", path_order: 18 },
];

// Index raw doc bodies by slug (lowercased) for substring matching.
// We use the already-loaded `allDocs` array but lowercase the body once per doc.
const lowerBodies: Record<string, string> = {};
for (const doc of allDocs) {
  lowerBodies[doc.slug] = (doc.body + " " + doc.title).toLowerCase();
}

// Build per-docNum slug lookup for the anchor link.
const slugByDocNum: Record<number, string> = {};
for (const doc of allDocs) {
  const dn = extractDocNum(doc.slug + ".md");
  if (dn !== null) slugByDocNum[dn] = doc.slug;
}

db.run(`DROP TABLE IF EXISTS terms`);
db.run(`CREATE TABLE terms (
  slug TEXT PRIMARY KEY,
  term TEXT NOT NULL,
  description TEXT NOT NULL,
  anchor_doc INTEGER NOT NULL,
  anchor_slug TEXT NOT NULL,
  sphere_pos TEXT NOT NULL,
  matched_docs TEXT NOT NULL,
  matched_doc_count INTEGER NOT NULL,
  path_order INTEGER NOT NULL
)`);
db.run("CREATE INDEX IF NOT EXISTS idx_terms_path_order ON terms(path_order)");

const termMatchCounts: Record<string, number> = {};
const termsForClient: Array<{
  term: string; slug: string; description: string; anchor_doc: number; anchor_slug: string;
  sphere_pos: [number, number, number]; matched_docs: string[]; path_order: number;
}> = [];

for (const t of TERMS) {
  // Find all docs whose body (lowercased) contains any variant.
  const matched: string[] = [];
  for (const doc of allDocs) {
    const hay = lowerBodies[doc.slug];
    for (const v of t.variants) {
      if (hay.indexOf(v.toLowerCase()) !== -1) { matched.push(doc.slug); break; }
    }
  }
  termMatchCounts[t.term] = matched.length;

  // Compute the centroid — prefer embedding-space centroid, projected via PCA.
  // Fall back to averaging the already-projected sphere_pos vectors.
  let pos: [number, number, number] | null = null;
  if (pcaMean && pcaAxes && matched.length > 0) {
    const matchedWithEmbed = matched.filter(s => embeddings[s]);
    if (matchedWithEmbed.length >= 2) {
      const D = embeddings[matchedWithEmbed[0]].length;
      const centroid = new Array(D).fill(0);
      for (const s of matchedWithEmbed) {
        const v = embeddings[s];
        for (let d = 0; d < D; d++) centroid[d] += v[d];
      }
      for (let d = 0; d < D; d++) centroid[d] /= matchedWithEmbed.length;
      pos = projectToSphere(centroid);
    }
  }

  // Sphere-space fallback: average projected sphere positions of matched docs.
  if (!pos && matched.length > 0) {
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const s of matched) {
      const p = spherePos[s];
      if (!p) continue;
      sx += p[0]; sy += p[1]; sz += p[2]; n++;
    }
    if (n > 0) {
      const mag = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
      pos = [sx / mag, sy / mag, sz / mag];
    }
  }

  // If still no position (term matched no docs, or all matches had no embedding
  // and no sphere_pos), use the anchor doc's sphere_pos directly.
  if (!pos) {
    const anchorSlug = slugByDocNum[t.anchor_doc];
    if (anchorSlug && spherePos[anchorSlug]) pos = spherePos[anchorSlug];
  }
  // Last-resort: a deterministic Fibonacci point based on path_order.
  if (!pos) pos = fibonacciUnit(t.path_order, TERMS.length);

  // If the match set is <3, prefer the anchor's own position (the caller flagged
  // this as the desired fallback when the centroid is not statistically useful).
  if (matched.length < 3) {
    const anchorSlug = slugByDocNum[t.anchor_doc];
    if (anchorSlug && spherePos[anchorSlug]) pos = spherePos[anchorSlug];
  }

  const anchorSlug = slugByDocNum[t.anchor_doc] || "";

  db.run(
    `INSERT INTO terms (slug, term, description, anchor_doc, anchor_slug, sphere_pos, matched_docs, matched_doc_count, path_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.slug, t.term, t.description, t.anchor_doc, anchorSlug, JSON.stringify(pos), JSON.stringify(matched), matched.length, t.path_order]
  );

  termsForClient.push({
    term: t.term, slug: t.slug, description: t.description,
    anchor_doc: t.anchor_doc, anchor_slug: anchorSlug,
    sphere_pos: pos, matched_docs: matched, path_order: t.path_order,
  });
}

console.log(`\nGlossary terms seeded (${TERMS.length} terms):`);
for (const t of TERMS) {
  const count = termMatchCounts[t.term] ?? 0;
  const marker = count < 3 ? "  [thin — anchor-position used]" : "";
  console.log(`  ${String(t.path_order).padStart(2, "0")}. ${t.term}: matched ${count} docs${marker}`);
}

// Seed a content row so the glossary page can render using the same template
// conventions as the rest of the coherence routes. The row's meta carries the
// full term list for the client-side sphere overlay.
const glossaryBody = `<!-- glossary body is rendered by the /glossary route template -->`;
const glossaryMeta = {
  doc_num: null,
  subtitle: "The eighteen load-bearing terms of the RESOLVE corpus.",
  section: "glossary",
  body_html: glossaryBody,
  terms: termsForClient,
};
db.run(
  `INSERT OR REPLACE INTO content (type, slug, title, body, status, importance, meta, created_at, updated_at)
   VALUES ('glossary', 'glossary', ?, ?, 'published', 40, ?, ?, ?)`,
  ["The Coherence Glossary", glossaryBody, JSON.stringify(glossaryMeta), new Date().toISOString(), new Date().toISOString()]
);

// ── Generate per-series content pages ──
// Each curated series (defined in the SERIES object near the top of this file)
// gets its own content row of type="series" whose body is a pre-rendered HTML
// list of all docs in the series. Docs can appear in multiple series; that's
// fine — each series is its own curated entracement trace, and overlap means
// the same doc shows up in multiple series pages, which is correct.
const docByNum: Record<number, { slug: string; title: string; section: string; docNum: number }> = {};
const seededDocs = db.query("SELECT slug, title, meta FROM content WHERE type='corpus' AND status='published'").all() as Array<{ slug: string; title: string; meta: string }>;
for (const row of seededDocs) {
  let m: { doc_num?: number; section?: string } = {};
  try { m = JSON.parse(row.meta); } catch {}
  if (m.doc_num) {
    docByNum[m.doc_num] = { slug: row.slug, title: row.title, section: m.section || "", docNum: m.doc_num };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderDocItem(d: { slug: string; title: string; docNum: number; section: string }): string {
  const numStr = String(d.docNum).padStart(3, "0");
  return `<a href="/resolve/doc/${d.slug}" class="corpus-item"><span class="doc-num">${numStr}</span><span class="doc-title">${escapeHtml(d.title)}</span><span class="doc-section">${escapeHtml(d.section)}</span></a>`;
}

let seriesSeeded = 0;
for (const [seriesId, seriesDef] of Object.entries(SERIES)) {
  // Union of featured + docs (preserving docs-array order; any featured doc not
  // in docs is appended up front). This guarantees every curated entry renders,
  // even if the author listed it only in `featured` and not in `docs`.
  const seenNums = new Set<number>();
  const orderedNums: number[] = [];
  for (const n of seriesDef.featured) {
    if (!seenNums.has(n) && docByNum[n]) { seenNums.add(n); orderedNums.push(n); }
  }
  for (const n of seriesDef.docs) {
    if (!seenNums.has(n) && docByNum[n]) { seenNums.add(n); orderedNums.push(n); }
  }
  const allInSeries = orderedNums.map(n => docByNum[n]);
  const featuredNums = new Set(seriesDef.featured);
  const featuredInSeries = seriesDef.featured
    .map(n => docByNum[n])
    .filter(Boolean);
  const nonFeaturedInSeries = allInSeries.filter(d => !featuredNums.has(d.docNum));

  const count = allInSeries.length;
  const featuredHtml = featuredInSeries.map(renderDocItem).join("");
  const remainingHtml = nonFeaturedInSeries.map(renderDocItem).join("");

  // Note: no `pretext` class on the header — that class triggers the desktop
  // horizontal-column layout (see .content-col:has(.pretext) in style.css),
  // which breaks long doc lists. Series pages use the default vertical scroll
  // so the full list renders top-to-bottom without horizontal overflow.
  const body = `<article class="series-page">
  <header class="series-header">
    <p class="series-kicker">Series &middot; jaredfoy.com</p>
    <h1>${escapeHtml(seriesDef.title)}</h1>
    <p class="series-desc">${escapeHtml(seriesDef.description)}</p>
    <p class="series-count">${count} document${count === 1 ? "" : "s"} in this entracement trace &middot; <a href="/resolve">back to index</a></p>
  </header>
  ${featuredInSeries.length > 0 ? `<section class="series-section">
    <h2>Featured</h2>
    <p class="section-desc">The curated entry points for this series. Start here.</p>
    <div class="corpus-list">${featuredHtml}</div>
  </section>` : ""}
  ${nonFeaturedInSeries.length > 0 ? `<section class="series-section">
    <h2>All Documents</h2>
    <p class="section-desc">Every document in the series, in the author's curated reading order. Documents may also appear in other series; a doc's presence here is its membership in this specific entracement trace.</p>
    <div class="corpus-list">${remainingHtml}</div>
  </section>` : ""}
</article>`;

  const meta = JSON.stringify({
    doc_num: null,
    subtitle: seriesDef.description,
    section: "series",
    body_html: body,
    count: count,
    featured: seriesDef.featured,
  });

  db.run(
    `INSERT OR REPLACE INTO content (type, slug, title, body, status, importance, meta, created_at, updated_at)
     VALUES ('series', ?, ?, ?, 'published', 50, ?, ?, ?)`,
    [seriesId, seriesDef.title, body, meta, new Date().toISOString(), new Date().toISOString()]
  );
  seriesSeeded++;
}
console.log(`Seeded ${seriesSeeded} series pages`);

// ── Blog series pages ──
// Parallel to the corpus series above, keyed by slug rather than doc_num.
// Read each blog row's series_membership from meta so the series-page render
// uses the same component-constraint-derived order as the per-post pagination.
const blogBySlug: Record<string, { slug: string; title: string }> = {};
const blogMembershipBySlug: Record<string, { seriesId: string; position: number; source: string }> = {};
const seededBlogs = db.query("SELECT slug, title, meta FROM content WHERE type='blog' AND status='published'").all() as Array<{ slug: string; title: string; meta: string }>;
for (const row of seededBlogs) {
  blogBySlug[row.slug] = { slug: row.slug, title: row.title };
  try {
    const m = JSON.parse(row.meta);
    if (m && m.series_membership && typeof m.series_membership.seriesId === "string") {
      blogMembershipBySlug[row.slug] = {
        seriesId: m.series_membership.seriesId,
        position: m.series_membership.position,
        source: m.series_membership.source ?? "registry",
      };
    }
  } catch {}
}

function renderBlogItem(b: { slug: string; title: string }): string {
  return `<a href="/resolve/blog/${b.slug}" class="corpus-item"><span class="doc-title">${escapeHtml(b.title)}</span><span class="doc-section">blog</span></a>`;
}

let blogSeriesSeeded = 0;
for (const [seriesId, seriesDef] of Object.entries(BLOG_SERIES)) {
  // Posts that declare this series (via the htx:series component constraint
  // in their markdown) are the canonical members. If no posts declare, fall
  // back to the registry's docs list for backward compatibility.
  const declaredMembers = Object.entries(blogMembershipBySlug)
    .filter(([, m]) => m.seriesId === seriesId)
    .sort((a, b) => a[1].position - b[1].position)
    .map(([slug]) => slug);
  const orderedSlugs = declaredMembers.length > 0 ? declaredMembers : seriesDef.docs;
  const ordered = orderedSlugs.map(s => blogBySlug[s]).filter(Boolean);
  const itemsHtml = ordered.map(renderBlogItem).join("");
  const count = ordered.length;
  const body = `<article class="series-page">
  <header class="series-header">
    <p class="series-kicker">Series &middot; jaredfoy.com</p>
    <h1>${escapeHtml(seriesDef.title)}</h1>
    <p class="series-desc">${escapeHtml(seriesDef.description)}</p>
    <p class="series-count">${count} post${count === 1 ? "" : "s"} in this entracement trace &middot; <a href="/resolve">back to index</a></p>
  </header>
  ${ordered.length > 0 ? `<section class="series-section">
    <h2>Posts, in reading order</h2>
    <p class="section-desc">Gentlest entry first. Each post leverages the one before it; read top-to-bottom for continuous onboarding, or pick the post matching your background.</p>
    <div class="corpus-list">${itemsHtml}</div>
  </section>` : ""}
</article>`;

  const meta = JSON.stringify({
    doc_num: null,
    subtitle: seriesDef.description,
    section: "series",
    body_html: body,
    count: count,
    blog_series: true,
  });

  db.run(
    `INSERT OR REPLACE INTO content (type, slug, title, body, status, importance, meta, created_at, updated_at)
     VALUES ('series', ?, ?, ?, 'published', 50, ?, ?, ?)`,
    [seriesId, seriesDef.title, body, meta, new Date().toISOString(), new Date().toISOString()]
  );
  blogSeriesSeeded++;
}
console.log(`Seeded ${blogSeriesSeeded} blog-series pages`);

// Build the OG-image manifest now that all corpus, blog, and series rows are in.
const finalManifest = (db.query("SELECT slug, title, meta FROM content WHERE type IN ('corpus', 'blog', 'series') AND status='published'").all() as Array<{
  slug: string;
  title: string;
  meta: string;
}>).map((row) => {
  let m: any = {};
  try { m = JSON.parse(row.meta); } catch {}
  return { slug: row.slug, title: row.title, doc_num: m.doc_num ?? null, section: m.section ?? "series" };
});
finalManifest.push({ slug: "home", title: "RESOLVE", doc_num: null, section: `${totalDocs} documents` });

db.close();

// ── Persist render cache ────────────────────────────────────────────
// Prune entries whose hashes are no longer referenced (handles deleted
// docs and edited content), then write the cache to disk for the next
// seed run. The cache turns subsequent no-op runs into near-instant ones
// per the C1 idempotence constraint.
pruneRenderCache(liveHashes);
persistRenderCache();
console.log(`Render cache: ${renderHits} hits, ${renderMisses} misses, ${liveHashes.size} live entries.`);

// ── Cross-reference link injection ──
// Back-fill inline hyperlinks for every "Doc N" / "Docs N, M" / "Docs N–M"
// reference across body_html. Runs after all docs are seeded so the
// number → slug mapping is complete. Also rebuilds the "Referenced
// Documents" and "More in this section" footers from the current link pass.
const linkProc = spawnSync(
  ["bun", resolve(import.meta.dir, "inject-links.ts")],
  { stdout: "inherit", stderr: "inherit" },
);
if (linkProc.exitCode !== 0) {
  console.error("inject-links failed with exit code", linkProc.exitCode);
}

// ── Prompt graph build ──
// Walks the corpus markdown for Originating-prompt sections and emits
// app/data/prompt-graph.json + app/public/prompt-graph.json. The DAG is
// rendered client-side at /resolve/prompt-graph.
const promptGraphProc = spawnSync(
  ["bun", resolve(import.meta.dir, "build-prompt-graph.ts")],
  { stdout: "inherit", stderr: "inherit" },
);
if (promptGraphProc.exitCode !== 0) {
  console.error("build-prompt-graph failed with exit code", promptGraphProc.exitCode);
}

const OG_OUT = resolve(import.meta.dir, "public/og");
// Only generate OG images for docs that don't already have one. Force-regenerate
// `home` since its badge text includes the total doc count, which changes as the
// corpus grows. Run seed with OG_FORCE_ALL=1 to regenerate every image.
const ogArgs = ["python3", resolve(import.meta.dir, "scripts/generate-og.py"), "--out", OG_OUT];
if (!process.env.OG_FORCE_ALL) {
  ogArgs.push("--only-missing", "--force-slugs", "home");
}
console.log(`\nGenerating OG images into ${OG_OUT} (manifest: ${finalManifest.length}) ...`);
const ogProc = spawnSync(ogArgs, { stdin: Buffer.from(JSON.stringify(finalManifest)) });
const ogOut = ogProc.stdout?.toString() ?? "";
const ogErr = ogProc.stderr?.toString() ?? "";
if (ogOut.trim()) console.log(ogOut.trim());
if (ogErr.trim()) console.error(ogErr.trim());
