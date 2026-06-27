# Seedance Coupling Assessment

## Question

> Is this codebase too tightly coupled around Seedance in your opinion?

This note captures an architectural review of how heavily the WaveSpeedAI API Tool depends on Seedance — whether that coupling is structural (hard to add other models) or mostly a reflection of how many Seedance endpoints the app supports.

## Context

At the time of this review, the app had:

- A registry-first workflow architecture (`src/lib/workflows.ts`) with model-family form folders (`seedance/`, `gptImage/`, `scail/`)
- **18 of 21** registered workflows as Seedance variants (2.0 and 2.0-fast, across i2v/t2v/edit/extend and turbo/spicy flavors)
- **3** non-Seedance workflows: Scail 2, GPT Image 2 edit, GPT Image 2 text-to-image
- A generic app shell (`App.tsx`, `wavespeed.ts`, `useJobs`, `MediaUpload`, `useLivePricing`) that does not branch on Seedance by name

The concern was whether Seedance’s dominance in file count and registry entries meant the shared layers were implicitly built *for* Seedance rather than *with* Seedance as one consumer among many.

## Answer

**Short answer:** No — not in an architectural sense. The app is **Seedance-heavy by product surface area**, but the **core shell is decently decoupled**. What you have looks like a registry-driven multi-model tool where Seedance happens to dominate the workflow list, not a codebase where everything implicitly assumes Seedance.

## What's actually decoupled

The important layers are model-agnostic:

- **`App.tsx`** picks the active workflow from the registry and delegates to whatever form component is registered — no Seedance-specific submit/pricing/jobs logic.
- **`wavespeed.ts`**, **`useJobs`**, **`MediaUpload`**, **`useLivePricing`**, and most of **`JobsPanel`** work off generic model IDs and payloads.
- Forms are **partitioned by family** (`seedance/`, `gptImage/`, `scail/`), which is the right kind of coupling: model-specific UI stays in model-specific folders.

That matches what `docs/wavespeed/adding-workflows.md` describes as the intended architecture.

## Where Seedance dominates (by design, mostly)

The skew is mostly **volume**, not **leakage**:

| Area | Seedance share |
|------|----------------|
| Registered workflows | **18 / 21** (~86%) |
| Workflow groups | **2 / 4** are Seedance |
| Form components | **5** Seedance vs **2** GPT Image + **1** Scail |
| Default workflow | `seedance-2.0/text-to-video` |

That’s because Seedance exposes many endpoint variants (2.0 vs 2.0-fast, turbo/spicy, i2v/t2v/edit/extend) that reuse the same few forms via `capabilities`. That’s efficient duplication, not tight coupling — one form component serves many registry entries.

Seedance-specific code is also appropriately scoped:

- Types in `types.ts` (`Seedance*Input`, `SeedanceResolution`, etc.)
- `seedanceAttachmentLimits.ts`
- `SeedanceAdvancedFields.tsx`

None of that pollutes the generic upload or API layers.

## The one real abstraction leak

The shared **`WorkflowCapabilities`** type in `workflows.ts` is shaped for Seedance:

```ts
export interface WorkflowCapabilities {
  promptRequired: boolean
  supportsAspectRatio: boolean
  supportsSeed: boolean
  durationMin: number
  durationMax: number
  resolutionOptions: SeedanceResolution[]
}
```

Docs note that only Seedance uses `capabilities` today; GPT Image and Scail ignore it. So the **generic workflow contract** carries a **Seedance-specific optional bag**. That’s mild coupling — it doesn’t break other models, but if you add more video families (Kling, Runway, etc.) you’d probably want either:

- a discriminated union (`capabilities?: SeedanceCapabilities | OtherCapabilities`), or
- capabilities moved entirely into each form family.

## Minor signs of "Seedance-first" thinking

- **`NanoBanana*`** types exist in `types.ts` but have no workflows/forms yet — forward-looking, not harmful.
- **`outputMedia.ts`** has a small model-name heuristic (`gpt-image` → image, else default video) — pragmatic, not Seedance-coupled.
- **`workflows.ts`** is long mostly because of registry entries, not because shared code branches on Seedance everywhere.

## Verdict

For a WaveSpeed UI that started with Seedance’s large endpoint matrix, this is **proportionally coupled, not pathologically coupled**.

- **Good:** Registry pattern, generic app shell, per-family form folders, shared upload/pricing/jobs.
- **Acceptable:** Most files and workflows are Seedance because most *endpoints* are Seedance.
- **Worth watching:** `WorkflowCapabilities` as a shared type; if non-Seedance video models grow, generalize that before it spreads.

If the goal is “easy to add GPT Image / Scail / future models,” the codebase is in good shape. If the goal is “Seedance should be just one peer among many with equal architectural weight,” the registry is already there — mainly rename/generalize `WorkflowCapabilities` and maybe split `workflows.ts` by group so Seedance’s 18 entries don’t visually dominate the codebase.
