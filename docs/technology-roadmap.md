# SAI Technology Roadmap
### Current Capabilities and Planned Development

*Draft, October 2026. Product and engineering view.*

---

## 1. The vision in one sentence

**A child draws a picture and writes a story, and SAI turns it into an animated film that is unmistakably theirs, starting with a one-minute short and building to a five-minute film made over a term.**

The child is the author, illustrator and director. The AI is the animation crew: it does the moving, lighting and timing, but it never replaces the child's drawing or rewrites their story.

---

## 2. Where we are today

### SAI Canvas (working prototype)

1. The child **draws** on a digital canvas: a character (the "hero") and, if they like, a background.
2. The child **writes a short story** and picks a look (watercolour, paper cut-out, chalk, neon, pixel, comic and more; eleven styles in total).
3. SAI sends the story and drawing to an AI model (Google Gemini), which **writes a film script as code** in our own animation language.
4. Before anything plays, SAI **safety-checks the script**. If the AI's version fails the checks twice, a ready-made story template plays instead, so the child always gets a film.
5. The film plays in the browser with scenes, camera moves, lighting, captions, speech bubbles, sound effects and gentle music. **The child's own drawing is the star of every scene.**

**Current limits:** one hero drawing and one background; 4–7 scenes; films are usually under 75 seconds, with a hard cap of 2 minutes.

### Why our approach is different

Most "AI video" tools (Google Veo, OpenAI Sora and others) generate the whole film as video. The AI draws everything, and the child's work disappears. SAI does it the other way round:

| | AI video generation | SAI Canvas |
|---|---|---|
| Who draws the characters? | The AI | **The child** |
| Cost per film | High (charged per second of video) | **Very low** (one short text request per film) |
| Size of a saved film | Tens of megabytes | **A few kilobytes** (it's a script, replayed live) |
| Can it be edited afterwards? | No, you regenerate it | **Yes**, change one scene, line or colour |
| Same result every time it plays? | Yes, but you can't change it | **Yes, and it can still be changed** |
| Safety | Hard to check video content | **Every script is checked against a fixed list of allowed actions** |

The heart of this is the **SAI Movie API**: a small animation language we designed ourselves (stage, scenes, hero, props, effects, camera, sound). The AI can only use what this language allows. This is our core technology and our main technical advantage.

### Also in the repository

- **Video Studio:** an experimental tool that turns a story into a 30-second AI-generated video using Google's Veo model. It's useful for comparison and showcases, but it isn't the main product, because the AI does the drawing rather than the child.
- **Public website:** the SAI marketing site.

---

## 3. The road to a five-minute film

A five-minute film can't be done in one AI request. Generating one long script in a single go becomes unreliable: characters drift, the story loses its thread and errors pile up. The plan is to build it in stages, the way real animation studios work: **story → storyboard → scenes → film**.

There's also a classroom benefit. **A five-minute film suits a term-long club**, with one chapter made each week and a premiere at the end.

### Stage 1: Storyboard mode *(next)*
**Target: 2–3 minute films**

- The child's story is first turned into a **storyboard**: a list of scenes, each with a one-line description, which the child can read, reorder and edit.
- **Each scene is generated separately**, so they can be made at the same time (faster) and fixed one at a time (more reliable).
- **"Redo this scene"** regenerates one scene without touching the rest.
- **Export to MP4**, so films can be downloaded, shown at assemblies and shared with parents.

*Engineering:* a two-step AI pipeline (plan, then scenes), a timeline that joins scene scripts together, and in-browser video recording for export.

### Stage 2: Cast and voice
**Target: richer, more personal films**

- **Draw a whole cast:** several characters and a different background for each scene, all kept consistent across the film.
- **Puppet animation:** SAI separates a drawing into parts (head, arms, legs, wings), so characters can wave, walk and flap rather than just slide and hop.
- **The child's own voice:** they record narration or character lines, and SAI fits the scene timing to their recording.
- **Music moods** chosen by the child for each scene.

*Engineering:* a character library, automatic separation of drawings into parts using an image-understanding model, audio recording and timing alignment.

### Stage 3: The Director's Chair
**Target: 5-minute films in chapters**

- **Talk to the crew:** the child gives plain-English directions such as *"make the dragon fly higher"*, *"make it night here"* or *"slow this bit down"*, and only that part of the script changes.
- **Simple timeline editor:** drag scenes, adjust timings and swap backgrounds without touching code.
- **Chapters:** a film is built in parts over several weeks and saved between sessions.
- **Story-shape guides:** optional structures (beginning, problem, brave choice, ending) linked to the value being explored that week.

*Engineering:* targeted script edits ("change only this"), saving work between sessions, and a visual editor sitting on top of the script.

### Stage 4: Class Cinema
**Target: collaborative films and a showcase**

- **Group films:** each child makes one chapter of a shared story, and SAI keeps the characters and style consistent across everyone's work.
- **Premiere screen:** a full-screen cinema mode with a title sequence and credits listing every child by first name.
- **Teacher view:** see every film in the class and approve it before it's shared.
- **Gallery** of approved films for parents and the school.

*Engineering:* shared projects, matching styles across different children's work, and a teacher approval step.

### Stage 5: Peek behind the curtain *(longer term)*
**Target: real computational thinking**

- Because every SAI film is **already code**, children can switch to a "behind the scenes" view and see the instructions that make their film move.
- Older or more confident children can **edit those instructions themselves**, for example `hero.hop()` or `sky: "night"`, and see the result instantly.
- This turns the club from "making films with AI" into **understanding how technology works**, which links naturally to the girls' confidence in technology strand.

*Engineering:* a child-friendly code view with live preview, using the same safety checks.

---

## 4. Summary timeline

| Stage | What children can make | Key new technology |
|---|---|---|
| **Today** | ~1-minute animated short from one drawing | SAI Movie API, AI script writing, safety checks |
| **1. Storyboard** | 2–3 minute film, scene by scene | Plan-then-scenes pipeline, MP4 export |
| **2. Cast and voice** | Films with many characters and their own voice | Puppet animation, voice recording |
| **3. Director's Chair** | 5-minute film in chapters over a term | Plain-English editing, timeline editor |
| **4. Class Cinema** | Group films and a premiere | Shared projects, teacher approval |
| **5. Behind the curtain** | Children edit the film's code | Live code view |

---

## 5. Engineering principles we keep throughout

1. **The child's work is always the star.** The AI animates; it never replaces the drawing or rewrites the story.
2. **Every film always plays.** Safety checks and fallback templates mean a child never sees a broken screen.
3. **The AI can only do what we allow.** It writes in our animation language, not free-form code, and every script is checked before it runs.
4. **Cheap to run.** Text-based scripts, rather than generated video, keep the cost per child low enough to run with whole classes.
5. **Small and fast.** Films are tiny script files that play in an ordinary school browser, with no special hardware needed.

---

## 6. Jargon guide

| Term | Plain-English meaning |
|---|---|
| **Generative AI** | AI that creates something new (text, images, code) from a description |
| **LLM (large language model)** | The type of AI that reads and writes text, e.g. Google Gemini. SAI uses one to write film scripts |
| **SAI Movie API** | SAI's own animation language: the fixed set of instructions the AI is allowed to use |
| **Runtime** | The part of SAI that reads a film script and plays it on screen |
| **Sandbox / safety check** | Running and checking the AI's script in a locked-down space so it can only do approved things |
| **Fallback template** | A ready-made film that plays if the AI's script doesn't pass the checks |
| **Pipeline** | A series of steps, each feeding the next (story → storyboard → scenes → film) |
| **Storyboard** | A scene-by-scene plan of a film, as used in real animation studios |
| **Puppet animation / rigging** | Splitting a drawing into moving parts so it can move like a puppet |
| **Text-to-video (e.g. Veo, Sora)** | AI that generates a whole video from a description. SAI deliberately doesn't rely on this |
| **Rendering / export** | Turning the live animation into a normal video file (MP4) |
| **p5.js** | A well-known open-source drawing and animation library, widely used in education, which SAI's animations are built on |
| **Next.js / TypeScript** | The modern web technologies the SAI website and tools are built with |
