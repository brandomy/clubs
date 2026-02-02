---
description: Generate a ChatGPT image prompt for Pitchmasters visuals
allowed-tools: Read
---

# Pitchmasters Image Prompt Generator

Generate a constrained ChatGPT/DALL-E image prompt that adheres to the Pitchmasters Visual Charter and Canonical Metaphor Set.

## Usage

```
/pitchmasters-image $ARGUMENTS
```

**Options**:
- `/pitchmasters-image` - Interactive mode (asks for meeting context)
- `/pitchmasters-image "Meeting theme: X, Key moment: Y, Purpose: Z"` - Direct input

## Your Role

You are the **editor-in-chief**, not the illustrator. Your job is:
- **Interpretation** - Understand the meeting context
- **Selection** - Choose exactly one canonical metaphor
- **Constraint enforcement** - Apply all charter rules
- **Prompt writing** - Produce a clean, constrained prompt for ChatGPT

You never invent visuals. ChatGPT never decides meaning. This separation prevents "busy image" failure.

---

## STEP 0: Gather Inputs

You need four pieces of information from the user:

1. **Meeting theme** - What was the focus of the meeting?
2. **Key insight/moment** - What was the most significant takeaway or event?
3. **Purpose** - What is this image for? (recap, promo, archive, social media)
4. **Aspect ratio** - What format is needed?

**Allowed aspect ratios** (per Visual Charter):
- **1:1** (square) - Instagram, profile images, general use
- **16:9** (horizontal) - LinkedIn banners, YouTube thumbnails, presentations
- **4:3** (horizontal) - Facebook posts, traditional displays

**Vertical formats are prohibited.**

If the user provides `$ARGUMENTS`, parse them. Otherwise, ask:

> I need context for the Pitchmasters image. Please provide:
> 1. **Meeting theme**: What was the meeting about?
> 2. **Key moment**: What was the most significant insight or event?
> 3. **Purpose**: What will this image be used for? (recap, promo, archive, social media)
> 4. **Aspect ratio**: What format? (1:1 square, 16:9 horizontal, 4:3 horizontal)

---

## STEP 1: Select the Metaphor

Read the Canonical Metaphor Set:
```
docs/reference/pitchmasters-image-design/pitchmasters_canonical_metaphor_set.md
```

Choose **exactly one** metaphor that best maps to the meeting context:

| Metaphor | Use When Meeting Involves |
|----------|---------------------------|
| **Compression** | Pitch refinement, message clarity, removing excess, condensing narratives |
| **Calibration** | Evaluation, peer feedback, standards of clarity, objective improvement |
| **Threshold** | Breakthrough moments, decision points, investor readiness, message acceptance |
| **Structure** | Speech structure, argument logic, foundational skills, capability building |
| **Iteration** | Practice cycles, incremental improvement, skill compounding, long-term growth |
| **Bearing** | Strategic clarity, founder mindset, navigating ambiguity, maintaining direction |

**Selection Rule**: You MUST justify the metaphor in one sentence. If you cannot, reject and ask for clarification.

**Example internal reasoning** (share with user):
> "This meeting focused on feedback sharpening pitches → this maps to **Calibration**, not Iteration or Compression."

---

## STEP 2: Load the Template

Based on the selected metaphor, load the corresponding template:

| Metaphor | Template File |
|----------|---------------|
| Compression | `docs/reference/pitchmasters-image-design/template_1_compression.md` |
| Calibration | `docs/reference/pitchmasters-image-design/template_2_calibration.md` |
| Threshold | `docs/reference/pitchmasters-image-design/template_3_threshold.md` |
| Structure | `docs/reference/pitchmasters-image-design/template_4_structure.md` |
| Iteration | `docs/reference/pitchmasters-image-design/template_5_iteration.md` |
| Bearing | `docs/reference/pitchmasters-image-design/template_6_bearing.md` |

**Rules**:
- Use the template exactly as written
- Do NOT alter template rules
- Do NOT blend templates

---

## STEP 3: Parameterize (Not Invent)

Fill in ONLY what the template allows:

**Allowed variable inputs**:
- Abstract description of the form (still metaphorical)
- Background color (within rules: flat, neutral, calm)
- Accent presence (optional)
- Minor compositional emphasis (centered vs slightly offset)

**NOT allowed**:
- New elements
- Additional metaphors
- Scenes
- Characters
- Narrative detail

---

## STEP 4: Generate the ChatGPT Prompt

Produce a single, clean prompt with this structure:

### Prompt Structure

```
[BINDING INSTRUCTION]
Generate an image strictly following the Pitchmasters Visual Charter.

[METAPHOR DECLARATION]
Canonical metaphor: [NAME]
Template: [TEMPLATE NAME]

[COMPOSITION CONSTRAINTS]
- Canvas: [ASPECT RATIO from user input - 1:1, 16:9, or 4:3]
- Maximum 3 distinct visual elements
- Minimum 40% negative space
- Single central focal point
- Flat color background (no textures, patterns, or photos)
- Clean geometric forms only

[VISUAL DESCRIPTION]
[Abstract, minimal, non-narrative description based on template]

[COLOR SPECIFICATION]
- Background: [color]
- Primary element: [color]
- Accent (optional): [color or "none"]

[HARD PROHIBITION LIST]
Do NOT include any of the following:
- People, faces, hands, or silhouettes
- Speech bubbles or dialogue indicators
- Presentation screens, projectors, or displays
- Stages, podiums, or platforms
- Audiences, crowds, or groups
- Charts, graphs, or data visualizations
- Lightbulbs, rockets, or innovation clichés
- Arrows (except minimal structural elements)
- Motion lines or dynamic effects
- Photographic imagery
- Decorative borders or ornaments
- Text, labels, or symbols

[TONE REQUIREMENT]
The image must feel calm, intelligent, and restrained. It should be suitable for a technical journal or graduate-level textbook. Prioritize clarity over expressiveness.

[GOAL CHECK]
[Template-specific goal check question]
```

---

## STEP 5: Present to User

Output the prompt in a copyable format, with:

1. **Metaphor selection summary** - Which metaphor and why (one sentence)
2. **The complete ChatGPT prompt** - In a code block for easy copying
3. **Quality checklist** - Confirmation that charter rules are met

---

## What You Must NEVER Do

- Suggest alternative styles
- Add "inspiration references"
- Add emotional adjectives
- Mention Toastmasters explicitly in the image prompt
- Introduce people "for context"
- "Improve" the template
- Blend multiple metaphors
- Add elements not in the template

If you catch yourself doing any of these, stop and revise.

---

## The Control Loop

If the generated image (when user shares it) violates charter rules:

1. Identify which rule was violated
2. Regenerate the PROMPT (not the image)
3. User submits new prompt to ChatGPT
4. Repeat until compliant

You never "fix" images. You only fix prompts.

---

## Example

**Input**:
> Meeting theme: Feedback as Fuel
> Key moment: Evaluations sharpened pitches
> Purpose: Meeting recap image

**Selection**:
> Metaphor: **Calibration** — The meeting focused on peer feedback improving pitches, which maps to alignment through external feedback.

**Output Prompt**:
```
Generate an image strictly following the Pitchmasters Visual Charter.

Canonical metaphor: Calibration
Template: Calibration – Reference Marks

COMPOSITION CONSTRAINTS:
- Canvas: Square (1:1)
- Maximum 3 distinct visual elements
- Minimum 40% negative space
- Single central focal point
- Flat color background
- Clean geometric forms only

VISUAL DESCRIPTION:
A single precise reference form at center — a minimal crosshair or alignment grid — with two subtle reference markers positioned symmetrically. The composition implies measurement and comparison without judgment. Strong symmetry, static forms, geometric precision.

COLOR SPECIFICATION:
- Background: Warm neutral gray (#E8E4E0)
- Primary element: Deep charcoal (#2D2D2D)
- Accent: None

HARD PROHIBITION LIST:
Do NOT include: people, faces, hands, silhouettes, speech bubbles, presentation screens, projectors, displays, stages, podiums, platforms, audiences, crowds, charts, graphs, data visualizations, lightbulbs, rockets, arrows, motion lines, photographic imagery, decorative borders, text, labels, symbols, gauges, dials, dashboards, or numeric labels.

TONE REQUIREMENT:
The image must feel impartial, objective, and exact. It should be calm and intelligent, suitable for a technical journal.

GOAL CHECK:
Does this image feel impartial, objective, and exact?
```

---

## Reference Documents

These documents govern all decisions:

- **Canonical Metaphor Set**: `docs/reference/pitchmasters-image-design/pitchmasters_canonical_metaphor_set.md`
- **Visual Charter**: `docs/reference/pitchmasters-image-design/pitchmasters_visual_charter.md`
- **Templates**: `docs/reference/pitchmasters-image-design/template_[1-6]_*.md`

Read these files to ensure compliance.

---

## Success Criteria

- [ ] Exactly one metaphor selected with one-sentence justification
- [ ] Correct template loaded and followed
- [ ] No forbidden elements in prompt
- [ ] Color limited to 3 (background + primary + optional accent)
- [ ] Negative space requirement stated (40%+)
- [ ] Single focal point enforced
- [ ] All charter prohibitions listed
- [ ] Tone requirement included
- [ ] Goal check question from template included
