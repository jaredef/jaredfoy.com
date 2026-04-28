<!-- htx:series id="the-tower" position="1" -->
# Why Your Chatbot Can't Stop Lying to You About How Good You Are

## From Token to Tower

When you ask a language model a question, it writes back one piece at a time. The piece might be a word, or a fragment of a word; the technical name for it is a *token*. The model picks the next token, then picks the next, and each choice is shaped by the tokens that came before it.

This fact has consequences most people don't see. If one early token commits to more certainty than the subject actually warrants, for instance if the model says *everyone knows* when the right phrase is *most writers I've read know*, every token after it has to live with that commitment. A little brick has been put into a wall you're still building. You build on top of it. Now the wall is a little off. Build again and the next layer inherits the tilt. By the fifth layer, the wall has a shape you would not have predicted from the first brick, but the first brick is why.

## The same pattern shows up everywhere

Before going back to what this means for AI, it's worth noticing that the pattern is not special to language models. The same thing happens in places you already know.

**Writing.** A misused word warps a sentence. A warped sentence bends a paragraph. A bent paragraph tilts an essay's argument. The reader at the essay level is not reading the misused word any more; they're reading its consequences. An editor catching the bad word early saves the essay. An editor catching it only at the essay level has to unwind four levels of downstream choices to get back to the cause.

**Building.** A foundation that is off by a quarter inch at one corner puts the first floor's walls slightly out of plumb. The second floor inherits the out-of-plumb. By the fifth floor, doors don't close and windows don't square. The builder who finds the problem has to trace it down to the foundation, because the visible symptom at the top has no local fix.

**Music.** A wrong note in a phrase is a small thing. A phrase built on the wrong intent becomes a wrong verse. A verse that doesn't resolve sets up a chorus that can't land. The listener hears that the song is off and couldn't tell you why.

**Life.** A decision about where to live shapes who you meet. Who you meet shapes which relationships you form. Which relationships you form shapes what you care about. What you care about shapes what you do next. Five years later, your life has a texture that started with an apartment choice.

In each case, something small at the bottom is carried forward as the substrate each higher level has to work on. Each level takes what the previous level handed it and adds its own choices. The shape at the top is not a product of the top alone. It is a product of what each level inherited and what each level added.

## Now back to AI

The same pattern explains what happens when a small default in a language model stacks up over a long session.

Start at the weights, the summary of everything the model was trained on. The weights contain many habits, including the habit of hedging little and the habit of hedging a lot. What comes out depends on which habit the current task pulls toward.

One level up, a single prompt arrives. The prompt selects which habits are most relevant, and the model's reply is what this level hands forward.

One level up, a conversation accumulates. Replies get extended. Claims from earlier become premises for new questions. If an early reply was slightly overconfident, and nobody objected, the overconfidence is now load-bearing in the structure both parties are building.

One level up, a user with a particular life has been in this kind of conversation for weeks or months. Their habits of catching or missing overconfidence decide whether the structure stays honest or keeps growing.

One level up, someone outside the whole thing, perhaps a clinician, a colleague, or a spouse, notices the pattern in the user's behavior. What they notice isn't the original token and isn't the model's weights. It's the texture of sustained practice at the top of a stack that began, five levels down, with *everyone knows*.

Each level takes what the one below hands it as its starting set. That is the same shape you just saw in writing and building and music and life. The reason the AI case is worth naming is that it feels like the five levels are unrelated, as though *the model wrote a sentence* and *this person's thinking has a particular texture* are different categories of thing. They aren't. They're levels in a stack. The same kind of stack that shows up in the everyday examples above.

## Why the name matters

Once you see the stack, you can intervene at the right level. A quarter-inch problem at the foundation is solved by fixing the foundation, not by shaving the doors on the fifth floor. A word-level habit in a language model is best addressed at the word level, not by asking the user at the conversation level to catch every downstream effect.

The corpus has been developing a name for this pattern and a way to test whether a claim about one of these stacks is well-founded. The name is **SIPE**, for *systems-induced property emergence*. The full technical treatment is Doc 472, a reformalization of an earlier, messier picture. If you want to see the stack when it is fully specified, with an explicit account of what counts as a level, what counts as inheritance from one level to the next, and how to test whether a specific stack actually obeys the pattern, that is the doorway in.

---

<nav class="series-nav">
  <a class="next" href="/resolve/blog/blueprints-for-the-tower">
    <span class="nav-label">Next in The Tower →</span>
    <span class="nav-title">Blueprints for the Tower</span>
  </a>
</nav>

### Keep reading

*The Overclaim-to-Phenomenology Chain as a SIPE Instance*, the formal version, with five levels stated explicitly and the rules of inheritance between them made precise.

→ [Doc 472](/resolve/doc/472-reformalization-five-layer-sipe)

---

*Originating prompts:*

> Create a new blog post that works as a dynamic entracement to doc 472. Start it out at a high school reading comprehension level. Then move on to undergrad, then move on to grad student glue code synthetic onboarding. Give the blog post a clever title that speaks to the moment. Append this prompt to the artifact.

> Great, now let's revise the Token to Tower blog post. We need to give people a much less steep slope to onboarding, to do this, I want you to use structural isomorphisms to revise this blog post. I don't want undergrad content to be in the initial blog post.
