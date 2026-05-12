# {{PROJECT_NAME}} — Master Remediation Plan

Run-id: `{{ISO8601_TIMESTAMP}}` · Plan generated: {{YYYY-MM-DD}} · Author: orchestrator
Inputs: {{LIST_OF_AUTHORITY_FILES — qa-reports, discover-*.json, contract sheets, feature docs, prior remediation plans, project constitution doc (e.g. CLAUDE.md), build-pipeline architecture doc}}

> **Template note — DELETE BEFORE USE.** This file is `master-plan.template.md`. Every `{{PLACEHOLDER}}` and every `> **AUTHORING NOTE:**` block must be resolved or deleted before the plan is live. Sections you don't need (e.g. §6 if no framework work applies) should be deleted, not left empty. The discipline in §0 is project-agnostic and MUST be preserved verbatim — that section is what prevents multi-day spirals; do not summarize it.

---

## Quick Start — If This Is Your First Session

> **AUTHORING NOTE.** Quick Start is the cold-entry surface for any agent picking the plan up mid-stream. Keep it under ~40 lines. State (1) "stop, do not dispatch yet — read first," (2) the minimum read list to be authorized to dispatch, (3) current-state pointer (what's shipped, what's next), (4) the smallest legal next action. When the plan is amended, preserve prior Quick Starts verbatim with strike-through — never delete. Audit trail beats clean docs.

**Stop. Do not dispatch anything yet.** This plan is {{LINE_COUNT}}+ lines because every rule has a WHY. A fresh agent skipping straight to dispatch will repeat the production incidents that produced this plan.

> **Plan amended {{YYYY-MM-DD}}.** {{CURRENT_STATE_HEADLINE — e.g. "Wave 1 is COMPLETE — see §2 Current state for commits + closure handoff."}}
>
> **Prior amendments preserved for audit trail:** {{LIST_PRIOR_AMENDMENT_DATES_WITH_ONE_LINE_DESCRIPTION_EACH}}
>
> **What's actively executable from this plan as of {{YYYY-MM-DD}}:**
> - {{ACTIVE_WORK_ITEM_1}}
> - {{ACTIVE_WORK_ITEM_2}}
> - {{ACTIVE_WORK_ITEM_N}}

**For a fresh session continuing from {{YYYY-MM-DD}} state, {{N}} steps in order:**

1. **Read §0 Operating Discipline in full.** §0.0 lists {{N}} mandatory references. Read all of them before doing anything else. Confirm per §0.0 (state file + chat acknowledgment).

2. **Read §1 Realistic Timeline + §2 "Current state (as of {{YYYY-MM-DD}})"** — locks the baseline. Any earlier wall-clock targets in prior amendments are historical; the active workstreams are listed there.

3. **Read §{{ACTIVE_WAVE_SECTION}} in full** — that section enumerates {{ACTIVE_WORKSTREAM_NAME}} with WHAT/WHY/WHERE/DEPS specs. A fresh agent dispatching against incomplete specs will ship a {{TYPE}} that misses {{KNOWN_LANDMINE}}.

4. **Pick one {{UNIT_OF_WORK — e.g. screen, layer, fix}} and dispatch it via §0.3 sequential-only.** Subagent runs gate per its skill; orchestrator independently re-runs `{{GATE_COMMAND}}` to verify the claim. Never two `{{AGENT_INVOCATION}}` sessions on source code at the same time.

**For {{NON_ORCHESTRATOR_OPERATIONS — e.g. "QA validation," "deploys"}}:** operator action via `{{COMMAND_OR_SCRIPT}}` — orchestrator does NOT dispatch this. The {{SKILL_LIST}} skills are explicitly NOT orchestrator-invocable per their skill definitions.

**If at any point you encounter a situation §0 does not address: STOP. Escalate to founder. Never override §0 by inference.** (See §0.7.)

### Quick Start — historical {{YYYY-MM-DD}} sequence (obsolete as of {{YYYY-MM-DD}}; preserved for audit trail)

> {{REASON_THE_PREVIOUS_QUICKSTART_IS_OBSOLETE_BUT_PRESERVED}}

1. ~~{{PRIOR_STEP_1}}~~ ({{STATUS}}.)
2. ~~{{PRIOR_STEP_2}}~~ ({{STATUS}}.)
...

---

## 0. Operating Discipline (READ FIRST — Authoritative)

> **This section overrides any conflicting guidance below.** If §0 says X and a later section says Y, X wins. Every numbered rule has a WHY (the production lesson it came from) and a HOW (what to do). Skipping the WHY produces an agent that follows rules until an edge case lets them rationalize around. The WHY is the guard.

### 0.0 Mandatory reading before any dispatch

An agent who has not read all {{N}} of the following files **in order** is NOT authorized to dispatch any layer, run any skill, or commit any code in this remediation. Read first. **Confirm via two channels** before proceeding:

- **State file:** write `{{STATE_FILE_PATH — e.g. .claude/state/{{feature}}-preflight.json}}` with `{ "mandatory_reads_complete": true, "agent": "<your-id>", "timestamp": "<ISO-8601>" }`. If the file already exists from a prior session, append a new entry to a `confirmations[]` array — do not overwrite.
- **Chat acknowledgment:** post `"§0.0 acknowledged: I have read all {{N}} mandatory references in order. Proceeding."` to the founder before any tool call that modifies repo state.

Both must happen. A confirmation in only one channel is insufficient. WHY: silent acknowledgment is unverifiable; "confirm in writing" without a mechanism rationalizes into "confirmed in my reasoning." Two channels close that loophole.

1. **`{{PROJECT_CONSTITUTION_PATH — e.g. CLAUDE.md, AGENTS.md}}`** — project constitution: {{key sections — source-first protocol, never-stop, zero-deferral, finish-line criteria, ownership}}.
2. **`{{PIPELINE_ARCHITECTURE_DOC_PATH}}`** — pipeline doc. Critical sections: {{LIST_CRITICAL_SECTION_REFERENCES}}.
3. **`{{PRIMARY_BUILD_SKILL_PATH — e.g. .claude/skills/build-feature/SKILL.md}}`** — the skill that drives {{ACTIVE_WAVE}} dispatch. {{STATEMENT_OF_SKILL_MATURITY — e.g. "Has never been invoked in production. Layer 1 will be its first ever use, full stop."}}
4. **`{{CONTRACT_AUTHORING_SKILL_PATH}}`** — the skill that produced this feature's contract.
5. **`{{FEATURE_DOC_PATH}}`** — the feature doc.
6. **`{{CONTRACT_SHEET_PATH}}`** — the contract ({{authorship_state — founder-accepted? panel-unanimous? — see §0.5}}).
7. **Latest memory handoff** at `{{MEMORY_DIR_PATH}}` — read MEMORY.md first, then the file marked "START HERE IF CONTINUING {{FEATURE_NAME}}."

WHY: {{CITE_THE_ARCHITECTURE_DOC_RULE_THAT_SAYS_READ_FIRST}}. The pipeline is not obvious from code alone. Reading it cold is how multi-day spirals start.

### 0.1 Skill validation gates (THE most critical section in this plan)

`{{PRIMARY_BUILD_SKILL_NAME}}` has {{been_invoked_count: never / N times}}. **{{FIRST_DISPATCH_LAYER}} is its {{first ever / Nth}} invocation, anywhere in the codebase.** Each new "surface type" in {{ACTIVE_WAVE}} is the skill's first contact with that surface and must be treated as **skill validation as much as build work**.

{{PRE_DISPATCH_SPECIAL_CASE — if a layer is pre-skill code requiring audit + remediation instead of fresh dispatch, document it here. Example:}}

**Layer 0a is a special case — pre-contract code requiring audit + remediation, NOT a `{{SKILL}}` dispatch:**

- **{{PRE_SKILL_LAYER}}** — The {{N}} files in `{{PATH}}` were written {{date}} by {{author/agent}} and {{authored/salvaged}} BEFORE the contract was finalized. The on-disk code's relationship to the **current** Layer Brief and feature doc is **unverified**. This layer is handled via §2 Pre-flight Step {{N}} (audit, read-only) + Step {{N+1}} (orchestrator-run remediation, surgical fixes, integrity-preserving) — NOT via `{{SKILL}}` dispatch.

**`{{PRIMARY_BUILD_SKILL_NAME}}` new-surface-type validation triggered at every dispatch listed below:**

- **{{LAYER_NAME}}** — `{{SKILL}}`'s {{N}}{{st/nd/rd/th}} invocation. {{Validation level — Skill-debut full six-question audit MANDATORY / Lighter validation if N-1 passed clean / etc.}} Surface: {{surface_description}}. If this dispatch surfaces ANY skill-level defect, apply §0.6 nine-step iteration before next dispatch.
- **{{LAYER_NAME_2}}** — {{validation_treatment}}.
- ... (one bullet per layer/screen that introduces a new surface type)

**Validation protocol after each new-surface-type dispatch:**

After the subagent returns AND the orchestrator independently re-runs `{{GATE_COMMAND}}` green (per §0.3):

1. **Did `{{SKILL}}` follow its own documented protocol?** Cross-check `SKILL.md` against the dispatch's stream-json log.
2. **Did it cite the contract's Layer Brief verbatim?** Compare emitted output against the per-layer contract section.
3. **Did it respect cross-cutting rules verbatim?** {{LIST_PROJECT_INVARIANT_FAMILIES — e.g. PCI / AL / PER / ERR / SEC / AUTH}} — no paraphrase, no summary, no compression.
4. **Did it run gate at the right phase, fix its own failures, or punt?**
5. **Did the produced output match the contract's spec exactly?** ({{cite_per_surface_type_expected_output_examples}})
6. **What gaps in the SKILL itself surfaced even on a passing dispatch?**

Any defects → trigger §0.6 skill iteration protocol (per the canonical doc at `{{SKILL_ITERATION_PROTOCOL_PATH}}`). Patch SKILL.md, commit, re-run validation against the patched skill before the next dispatch on the same surface type. **Do NOT bulk-dispatch the same surface type until the surface's validation gate is green.**

WHY: Treating a layer as a normal build dispatch when it is the skill's debut, or as a normal dispatch when it is the surface-type debut, is the inverse of the spiral that ate {{N}} days ({{DATE_RANGE}}). The spiral was an integrity violation — agents modified parts of the skill / script that were NOT broken, regressing the tool with each iteration. The risk this week, unmitigated: ship N+ layers against a broken skill before noticing. Mitigation: validate the skill at every new surface type, and apply the canonical iteration protocol at `{{SKILL_ITERATION_PROTOCOL_PATH}}` for any skill modification.

### 0.2 Anti-spiral protection

**Sole source of truth for skill iteration discipline: `{{SKILL_ITERATION_PROTOCOL_PATH}}`.** Read that document end-to-end before modifying any skill. The summary below exists only to orient you toward the canonical doc.

**The diagnosis (founder's verbatim correction, {{DATE}} {{TIME}} {{TZ}}):** the {{N}}-day {{spiral_name}} spiral ({{N}} iterations, {{describe_growth_metrics}}, findings inflated {{X → Y}}+ before the loop was broken on {{date}}) was caused by **an integrity violation** — agents modified parts of the skill / script that **were not broken** "for shits and giggles" while diagnosing failures, regressing working behavior with each iteration. The act of fixing the skill was correct and necessary. The act of modifying things that were not broken was the violation.

**The integrity principle:** never modify something that is not broken.

**Skill modification is required when a skill produces wrong output.** What's forbidden is unjustified modification of working code. The 9-step protocol in `{{SKILL_ITERATION_PROTOCOL_PATH}}` is HOW to fix a skill correctly — surgically, only on the diagnosed lines, with documented justification for every modified line and every non-modified line in the touched area.

Hard rules that operationalize the integrity principle:

- **Follow the 9-step protocol in `{{SKILL_ITERATION_PROTOCOL_PATH}}` for every skill modification.** No skipping steps.
- **Step 0 cap is real: 3rd attempt on the same finding class = STOP and escalate to founder.**
- **Step 2 (fresh-context observer) is required before applying any modification.** A subagent that has not seen the failure must independently confirm the diagnosed lines.
- **Step 5 (diff justification) is required for every line changed AND every non-modified line in the touched area.** This forces conscious integrity.
- **Forbidden phrases in any dispatch prompt or agent output (these signal motivated reasoning, NOT legitimate skill iteration):** "while I'm here," "let me clean this up," "improve the structure," "refactor for clarity," "tighten the wording," "for consistency." If any of these appear before founder approval, the dispatch is rejected.
- **NOT forbidden:** "fix the skill," "iterate on the tool," "modify the script." Those phrases describe what the canonical protocol prescribes.

WHY: AI agents are biased toward action. Vague mandates like "while I'm here, let me clean this up" become permission to touch working code. The {{N}}-day spiral was caused by agents fooling themselves into thinking working sections were broken. The integrity principle is the antidote; the 9-step protocol operationalizes it.

### 0.3 Concurrency + gate-runner roles

**Sequential dispatch ONLY.** Never two `{{AGENT_INVOCATION}}` sessions touching source code at the same time.

WHY: Production lessons (locked {{DATE}}) — when Agent A finishes and runs gate, it sees Agent B's mid-implementation files failing. Agent A then "fixes" by touching files in B's territory, vibe-coding patches into B's in-progress work. Agent B comes back and finds spaghetti where its real implementation was. The gate-fight scenario happens regardless of how clearly each agent is scoped. {{ADDITIONAL_PROJECT_SPECIFIC_REASON — e.g. plan-tier throttle at 4+ concurrent sessions}}.

**Gate-runner role boundary:**

- **Subagent runs `{{GATE_COMMAND}}`** per its skill's gate step. Subagent is responsible for fixing its own gate failures before claiming the layer/screen done. The orchestrator does not fix code.
- **Orchestrator independently re-runs `{{GATE_COMMAND}}`** after the subagent returns. This is verification of the subagent's claim, not primary execution. Green → accept. Red → fix-mode dispatch on the same layer with the gate output as input.

The orchestrator's job is to verify, not to execute. The subagent's job is to execute and self-correct. Inverting these is the failure mode that produces "Layer X verified, gate passes" without the gate having been independently run.

### 0.4 Memory checkpoints

{{ESTIMATED_TOTAL_DISPATCHES}}+ dispatches will not fit in a single Claude Code session. Without explicit memory writes, post-compaction sessions read a lossy auto-summary that loses architectural decisions (locked {{DATE}}, after post-compaction me dispatched a {{example_of_a_stale_recall}} because the auto-summary referenced a stale memory file).

Mandatory memory write checkpoints:
- After **Wave 1 completes** (all foundation layers green, gate green, end-of-Wave-1 SKILL.md state captured).
- After **every {{N}} Wave-2 {{units}}** complete.
- After **Wave 3 completes**.
- After **Wave 4 completes**.

Each memory file MUST cover:
- Layer/screen-by-layer/screen status (commit hash for each).
- Any `{{PRIMARY_BUILD_SKILL_NAME}}` SKILL.md modifications with diff and justification.
- Surfaced gaps that the next wave needs to know about.
- Lessons (what next sessions should NOT repeat).

**Memory write happens BEFORE compaction, not after.** Never trust the auto-summary.

### 0.5 {{PRE-EXECUTION_AUTHORIZATION_RESOLUTION_TOPIC — typically panel marker, founder authorization, contract acceptance, or similar}}

> **AUTHORING NOTE.** Use this section to document any pre-execution authorization artifact whose semantics agents might mis-read. Example below covers a panel-review marker file that is a founder-authorization artifact, not a skill gate. Adapt to the artifact your project uses (signed RFC, ADR approval, design-review sign-off, etc.).

The {{N}}-agent {{authorization_panel}} did NOT achieve unanimous PASS. The {{authorization_artifact}} was manually patched across the commit chain `{{COMMIT_CHAIN}}` and is founder-accepted. The marker file at `{{MARKER_FILE_PATH_GLOB}}` is a **founder-authorization artifact** documenting that acceptance — it is NOT a `{{SKILL}}` gate.

**Important correction ({{DATE}}):** earlier wording in this plan claimed `{{SKILL}}` SKILL.md gates on the marker file. That is wrong. `{{SKILL}}` SKILL.md Step {{N}} only requires the {{authorization_artifact}} to exist at `{{PATH}}`; there is no marker-file check in the SKILL. The marker is preserved as a founder-authorization record (auditable history of who accepted the {{artifact}} and when), not as a SKILL-enforced gate.

**Resolution before {{FIRST_DISPATCH}}:** Verify the marker file already exists at `{{MARKER_FILE_FULL_PATH}}`. Body:

```
{{MARKER_FILE_BODY_TEMPLATE — must include: founder name + authority, date, artifact name, acceptance state, what dispatches are authorized}}
```

If the marker exists, proceed. If somehow missing, hand-create it with the exact body above.

### 0.6 Skill iteration discipline (the 9-step protocol)

> **Canonical source: `{{SKILL_ITERATION_PROTOCOL_PATH}}`.** The 9 steps below are reproduced from that document for convenience. If anything here drifts from the canonical doc, the canonical doc wins.

When `{{SKILL}}` (or any skill) produces wrong output, **the skill is the root cause and must be fixed.** The 9-step protocol below is the operationalization of the integrity principle: it constrains HOW skills are modified, not WHETHER. Every step is mandatory before any skill modification.

**Step 0 — Cap check.** If this is the 3rd+ attempt at the same finding class, STOP and escalate to founder. Do not iterate further. Wall-clock cap: 4 hours per skill modification. Cost cap: $20.

**Step 1 — Cite the exact failure.** The failure as observed (output line, error message, missing behavior). Not "the skill is buggy" — the literal failure with file paths and line numbers.

**Step 1.5 — Rule out non-skill causes.** Before assuming skill defect, verify with evidence each of:
- Is this a **contract bug** (the Layer Brief is wrong)?
- Is this an **input bug** (the dispatch prompt was wrong)?
- Is this a **context-budget bug** (the subagent ran out of attention; output truncated mid-stream)?
- Is this a **founder-decision bug** (the requirement is unclear or contradictory)?
- Cite evidence for each. **If any non-skill cause is the actual cause, fix elsewhere — do NOT modify the skill.**

**Step 2 — Cite the exact line(s) of the skill responsible.** Not "the prompt structure" — the specific lines. **An independent fresh-context observer** (a fresh general-purpose subagent that did NOT produce the failing output) confirms the diagnosis before proceeding.

**Step 3 — Articulate the skill's invariants.** What does this skill currently guarantee? Identify the ONE invariant the modification will change. The rest are protected — modifications that affect them are forbidden.

**Step 4 — Construct three test cases:**
- **OLD skill against failing input** → must reproduce the failure (proves the bug exists).
- **NEW skill against failing input** → must succeed (proves the fix works).
- **NEW skill against already-working input** → behavior must NOT change (regression check — proves the fix didn't break working code).

**Step 5 — Write the diff with full justification.** For every modified line: documented reason. For every line NOT modified inside the touched area: documented "why it stays" (cite the invariant it implements). The integrity principle, operationalized: **if a line wasn't named in the diagnosis, it doesn't change.**

**Step 6 — Apply. Run all three test cases.** If the regression case shows ANY behavior change on already-working input, REVERT and re-diagnose — the modification touched something it shouldn't have.

**Step 7 — Commit with the diff justification in the commit body.** Include: failure cited, diagnosis, modified lines + reasons, protected invariants verified, test case results.

WHY: Feynman's first principle — "you must not fool yourself, and you are the easiest person to fool" — is the operating constraint. Every step above is a guard against motivated reasoning. The artifacts (cited lines, three test cases, diff justification) make the process auditable; without artifacts, "I followed the protocol" is just a claim.

### 0.7 If §0 doesn't cover your situation — STOP

§0 cannot anticipate every edge case. When you encounter a situation where:

- A rule's intent is ambiguous in your specific context, OR
- Two rules in §0 appear to conflict for the situation in front of you, OR
- The "right move" feels obvious but isn't documented in §0, OR
- You're tempted to make a "minor" exception ("just this once," "not really a skill mod," "this is a special case"), OR
- You can rationalize an action as "consistent with §0's spirit" even though no specific rule authorizes it,

**STOP.** Do not proceed by inference. Do not invent a sub-rule. Do not act on the most reasonable-seeming interpretation.

Required action:
1. Document the question in chat to founder: cite the §0 rule(s) involved, describe the specific situation, state what you'd do absent guidance.
2. **Wait for explicit founder direction.** Don't poll, don't iterate, don't execute partial work in the meantime.
3. When direction arrives, document it and proceed within the bounds given.

WHY: every prior spiral started with an agent rationalizing one small inferred decision into a chain of subsequent inferred decisions. The integrity principle (§0.6 step 5) — never modify what isn't broken — has a sibling here: **never invent rules that aren't written.** §0 is the contract; ambiguity in §0 is for the founder to resolve, not for the agent to interpret. If §0 needs to grow, that's a §0 amendment, not in-flight invention.

---

## 1. Executive Summary

> **AUTHORING NOTE.** Executive summary serves three purposes: (1) state the dependency ordering of the waves and WHY that order (foundation → frame → interior → finish), (2) provide a finding-breakdown table that an agent can read in ~30 seconds to know what's where, (3) lock a realistic wall-clock timeline anchored to demonstrated velocity (NOT aspirational). Keep it under ~50 lines.

{{PROJECT_NAME}} is {{production_state — pre-production with zero users / live with N users / etc.}}, so this plan sequences {{N}} engineering waves strictly by dependency order (not by shipping priority). **Wave 1 — Foundation** is {{describe_data_model_or_infrastructure_change_that_must_land_first}}. **Wave 2 — Frame** is {{describe_what_gets_built_on_top_of_Wave_1}}. **Wave 3 — Interior punch-list** fixes every remaining finding whose source citations point at files that neither Wave 1 nor Wave 2 touches. **Wave 4 — Finish + regression tests** is LOW-severity polish plus the post-ship regression suite mandated by {{constitution_doc_name}}.

The rationale for this ordering is foundation → frame → interior. Building Wave 2 against the pre-Wave-1 model would force partial rewrites of {{ENUMERATE_DOUBLE_PASS_SCREENS_OR_MODULES}} when Wave 1 lands — a predictable {{N}}-screen double-pass that is zero-defensible given no shipping pressure exists. Wave 3 has no real dependency on Wave 2 — {{enumerate_wave3_subsystems}} are not part of Wave 2's surface. **Wave 2 and Wave 3 dispatches interleave under the §0.3 sequential-only rule** — pick one screen or one fix at a time, alternate as appropriate; never two at once. Wave 4 polishes.

**Finding breakdown ({{TOTAL_MAIN}} classified findings + {{TOTAL_OPPORTUNISTIC}} opportunistic = {{TOTAL_COMBINED}} total):**

| Wave | Main findings | Opportunistic | Combined | % |
|---|---:|---:|---:|---:|
| Wave 1 ({{WAVE_1_NAME}} — absorbed) | {{N}} | {{N}} | {{N}} | {{X}}% |
| Wave 2 ({{WAVE_2_NAME}} — absorbed) | {{N}} | {{N}} | {{N}} | {{X}}% |
| Wave 3 ({{WAVE_3_NAME}} — standalone fixes) | {{N}} | {{N}} | {{N}} | {{X}}% |
| Wave 4 (LOW-severity polish + regression tests) | {{N}} | {{N}} | {{N}} | {{X}}% |
| **Total** | **{{N}}** | **{{N}}** | **{{N}}** | **100%** |

{{NARRATIVE_PER_WAVE — explain absorption rationale, classification confidence, priority within Wave 3, etc. — ~2-3 paragraphs}}

### Realistic timeline (anchored to demonstrated velocity)

> **AUTHORING NOTE.** Without an empirical anchor, "behind schedule" framing accumulates without a basis. Anchor the timeline to actual git-log velocity from a recent comparable window. Cite concrete LOC/day or layers/day from shipped work. If a wave has shipped, update the table to "DONE" with the actual close date and any over/under vs forecast. Re-forecast each amendment.

Demonstrated authoring velocity from the {{DATE_RANGE}} git-log window ({{N}} active feature-build days): mean **{{N}} insertions/day**, median **{{N}} insertions/day**, ~{{N}} layers/day at operator velocity. Comparable shipped-deliverables anchor: {{CONCRETE_EXAMPLE}}.

Remaining work as of {{YYYY-MM-DD}}:

| Phase | Work | Days at operator velocity |
|---|---|---|
| Wave 1 | {{description}} | {{N}} |
| Wave 2 | {{description}} (subject to defect-rate target per §3 Pre-flight) | {{N}} |
| Wave 3 | {{description}}, interleaved with Wave 2 under §0.3 sequential-only | {{N}} (parallelized into Wave 2 windows) |
| Wave 4 | {{description}} | {{N}} |
| {{NON_ORCHESTRATOR_PHASE}} | Operator-dispatched via `{{SCRIPT}}` (NOT orchestrator-invocable). | {{N}} (interleaved with Wave 2) |
| **Total to {{SHIP_MILESTONE}} from {{YYYY-MM-DD}}** | | **{{N}}-{{M}} days** |

**Anti-spiral budget guardrails:**
- Per-dispatch caps (4-hour wall-clock, $20 cost, 3 attempts) per §0.6 apply universally.
- Wave 2 defect-rate target: {{≤N}} findings per {{unit}} avg over {{units}} 1-3 (§3 Pre-flight). Cap-hit triggers §0.6 skill iteration, not silent continuation.
- {{Optional framework-work timing — §6}} items execute per §6 timing. Do NOT execute the full {{framework_plan_path}} during {{ACTIVE_SHIP}} — most of it is over-engineering relative to observed defects (see §6).

If the realistic timeline drifts past {{N}} days from {{YYYY-MM-DD}}, escalate to founder per §0.7 — do NOT iterate inside the existing plan; that pattern produces multi-week spirals.

---

## 2. Wave 1 — {{WAVE_1_NAME}}

### Scope

{{ONE_PARAGRAPH_SCOPE_DESCRIPTION_INCLUDING — the data model / infrastructure change, the canonical IDs introduced, the new abstractions, the ledger/event tables, etc.}} Authority contract: `{{CONTRACT_SHEET_PATH}}`. Feature doc: `{{FEATURE_DOC_PATH}}`.

The contract enumerates {{N}} layers ({{LAYER_NAME_RANGE}}) and {{N}} cross-cutting invariants ({{INV_PREFIX}}-1 through {{INV_PREFIX}}-N) that apply to every layer. Build order is dictated by the contract's Layer Summary table with {{N}} DAG cycle resolutions annotated in-contract; no re-debate here.

**Key changes vs the prior contract this section replaces (if any):**
- {{CHANGE_1}}
- {{CHANGE_2}}
- ... (omit this block on a greenfield feature)

### Current state (as of {{YYYY-MM-DD}})

> **AUTHORING NOTE.** This subsection is the source of truth for "what's shipped, what's not." Every shipped layer cites a commit hash. Every outstanding follow-up names a state-file path or feature-doc section. When the wave closes, add a top-of-section amendment block summarizing closure; preserve the prior status text below the amendment, struck through, for audit trail.

**Shipped:**
- Layer {{NAME}} — {{description}} (commit `{{HASH}}`). {{any caveats — known divergences from Brief with disposition}}
- Layer {{NAME}} — ...
- ...

**Outstanding:**
- {{ITEM_1}} — see §{{POINTER}} below.
- {{ITEM_2}} — ...

**Post-Wave-1 Required Actions queued for orchestrator follow-up:**
- {{TEST_OR_VERIFICATION_FOLLOWUP}} (trigger: {{when}}).
- {{HARDENING_FOLLOWUP}}.
- {{ANNOTATION_FOLLOWUP}}.

### Build order (canonical, dependency-respecting — NOT numerical)

The contract's Layer Summary table specifies dependencies that produce a non-numerical build order. {{CITE_DEPENDENCY_INVERSIONS — e.g. "Layers 8 and 10 ship AFTER Layer 12 because of cross-domain dependency direction."}} **Do not dispatch in numerical order — follow this sequence exactly:**

```
{{ARROW_CHAIN — e.g. 0a → 0b → 0c → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 9 → 11 → 12 → 8 → 10 → 13 → 14 → 15}}
```

Reasoning per the contract's DAG cycle resolutions (annotated in-contract; do not re-debate):

- **{{LAYER_GROUP_1}}** must ship first — {{reason}}.
- **{{LAYER_GROUP_2}}** ships next — {{reason}}.
- **{{LAYER_GROUP_3}}** — {{reason}}.
- ...
- **{{FINAL_LAYER_GROUP}}** ships last in that order — {{reason}}.

Each dispatch follows §0.3 (sequential only — never parallel) and §0.1 (skill validation gate triggered at each new surface type).

### Exhaustive file list (from contract Inventory sections)

> **AUTHORING NOTE.** Enumerate every file the wave touches. Mark each file as MISSING / EXISTS / EXISTS-needs-audit. For pre-skill code requiring audit, cite the commit that landed it and explicitly flag the audit requirement.

**Library / shared infrastructure ({{LAYER_RANGE}}):**
- `{{FILE_PATH}}` ({{status — MISSING, EXISTS, EXISTS-from-pre-contract-code-commit-HASH}})
- ...

**Schema migrations (Layer {{N}}):** ~{{N}} ops across these {{schema_lib_name}} schema files:
- `{{SCHEMA_FILE}}` (add {{N}} columns: `{{COL1}}`, `{{COL2}}`, ...)
- `{{NEW_TABLE_SCHEMA_FILE}}` (CREATE — {{semantic_description}})
- {{N}} new indexes (including `{{INDEX_NAME}}` {{partial unique / etc.}})
- {{N}} new ENUM additions
- {{N}} {{seed_data_or_system_user_INSERT}}

**Router files — fix-existing (Layers {{N-M}}):**
- `{{ROUTER_FILE}}` (Layers {{N}}, {{M}} — {{cluster description}})
- ...

**New procedures (Layers {{N-M}}):**
- `{{NEW_PROCEDURE_NAMES_GROUPED_BY_LAYER}}`

**Background jobs (Layers {{N}}, {{M}}):**
- `{{JOB_FILE_PATH}}` (Layer {{N}} — {{status}}; {{description}})
- `{{SCRIPT_FILE_PATH}}` (Layer {{M}} — {{status}}; {{description}})

**Cutover (Layer {{N}}):** {{describe destructive operations, CHECK constraints, gate criteria}}.

### Pre-flight (before {{FIRST_LAYER}} dispatch) — execute as numbered tasks, in order

> **AUTHORING NOTE.** Pre-flight steps are the most-skipped section. Each step MUST end with a concrete chat-acknowledgment string the agent posts to founder. Two-channel confirmation per §0.0. If a step is read-only, label it READ-ONLY explicitly. If a step has a budget cap (e.g. "1 day"), state it.

**Step 1 — Verify the {{AUTHORIZATION_ARTIFACT}} (founder authorization artifact, per §0.5).**

- Path: `{{ARTIFACT_PATH}}`
- Verify the file exists: `{{VERIFICATION_COMMAND}}`. The marker was created in commit `{{HASH}}` ({{date}}).
- Per §0.5, the marker is a founder-authorization record, NOT a `{{SKILL}}` SKILL gate. The SKILL does not check it.
- If the marker is somehow missing, hand-create it with the body specified in §0.5.

**Step 2 — §0.0 mandatory reading + two-channel confirmation.**

Read all {{N}} docs in §0.0 in order. Then write `{{STATE_FILE_PATH}}` per §0.0 spec, AND post the chat acknowledgment per §0.0 spec. Both required.

**Step 3 — {{PRE_SKILL_CODE_AUDIT_NAME}} (READ-ONLY).**

{{Describe the pre-skill code that was authored before the contract and the audit's job: find every divergence, not assume the code is correct. This is a READ-ONLY step. Findings get written to a state file; remediation happens in Step 4.}}

Concrete procedure:

1. **Read the contract's Layer {{N}} Brief at lines {{N-M}}** of `{{CONTRACT_PATH}}`. Extract per-item specifications.
2. **Read the feature doc's Shared Infrastructure section** at `{{FEATURE_DOC_PATH}}` (`## {{SECTION_NAME}}`).
3. **For each on-disk file** ({{FILE_LIST}}), compare against BOTH authority sources line-by-line:
   - **File presence**
   - **Type-signature drift**
   - **Method-set drift**
   - **Spec-rule coverage**
   - **Adversarial-rule coverage**
   - **Cross-cutting compliance** ({{INV_LIST}})
   - **Pre-skill leftovers** — search for code referencing scope that was dropped between earlier attempts
   - **Comment-vs-reality drift**
4. **Write findings to `{{AUDIT_STATE_FILE_PATH}}`.** For each compared item, classify as PASS / GAP / DRIFT / UNAUTHORIZED-ADDITION. Group by file. List specific file:line citations for every divergence.
5. **Decision rule:** If ANY GAP / DRIFT / UNAUTHORIZED-ADDITION is found, proceed to Step 4 (remediation). If everything is PASS, the audit doc records that and Step 4 is a no-op.

**Step 4 — {{PRE_SKILL_LAYER}} remediation (orchestrator-run, surgical).**

Apply fixes per the Step-3 audit findings. This is NOT a `{{SKILL}}` dispatch — the code already exists, and the changes are targeted line edits, not a from-scratch rewrite. The integrity principle (§0.6) applies to these edits: only the diverged lines change. Working code stays untouched. Each modified line carries a documented justification in the commit message.

Procedure:

1. For each finding in `{{AUDIT_STATE_FILE_PATH}}`, apply the targeted fix. GAP = add missing. DRIFT = align. UNAUTHORIZED-ADDITION = remove.
2. After all fixes applied, run `{{GATE_COMMAND}}` (orchestrator-run). Gate must pass before commit.
3. If gate fails: read errors verbatim, diagnose root cause, apply targeted fix per integrity principle, re-run. Maximum 3 fix iterations. After 3 failures, STOP and escalate per §0.7.
4. Commit with message format: `fix({{feature}}): Layer {{N}} remediation per pre-flight audit` and a body listing every modified file + every change + the audit finding it addresses.
5. Mark Layer {{N}} remediation complete in `{{AUDIT_STATE_FILE_PATH}}`.

**Step 5 — Confirm pre-flight complete in chat.** Post: `"Pre-flight complete: marker verified, mandatory reads confirmed ({{STATE_FILE}}), Layer {{N}} audit + remediation complete ({{AUDIT_FILE}}). Proceeding to {{NEXT_LAYER}} dispatch ({{SKILL}} first ever invocation — §0.1 skill-debut validation triggers)."` Wait for founder ack before dispatching.

**Step 6 — Contract-Soundness Audit Application Gate (MANDATORY before {{NEXT_LAYER}} dispatch and every subsequent remaining-layer dispatch).**

> **AUTHORING NOTE.** This step exists when a fresh-context audit subagent surfaces BLOCKERs in unbuilt-layer Briefs that will SOUNDNESS-STOP at dispatch time. Adapt the audit dimensions (BRIEF-SCHEMA-MISMATCH, DISCRIMINATOR-UNSOUND, FK-WIRING-INCOMPLETE, ACCESS-CHECK-MISSING-FROM-BRIEF, BRIEF-INTERNAL-CONTRADICTION, ALLOWLIST-DRIFT, RISK-MITIGATION-GAP, INV-COVERAGE-GAP) to your project's invariant taxonomy.

Concrete procedure:

1. **Read the audit in full** at `{{AUDIT_PATH}}`. Section structure: Summary (counts) → Dimensions 1-N → Phase 3-A/B/C remediation plan.
2. **Group findings by affected layer.** For each finding, note whether the affected layer is (a) already shipped (contract amends to match shipped code with documented rationale) OR (b) unbuilt (contract amends to fix the brief BEFORE dispatch).
3. **For shipped-layer drift:** amend the corresponding contract section. Each amendment is a one-line update plus a SUPERSEDED footnote citing the audit finding ID and the commit that shipped the actual implementation.
4. **For unbuilt-layer BLOCKERs:** amend the corresponding Layer Brief section to (a) fix wrong column references against shipped schema, (b) fix wrong CHECK constraint values, (c) resolve internal contradictions, (d) fill in missing access checks, (e) align allowlists with shipped enums. Each amendment makes the brief implementable as written.
5. **Add an audit-application sentinel to the contract preamble.**
6. **Run `{{GATE_COMMAND}}`** to confirm no schema or build regressions.
7. **Commit** with message `fix({{feature}}): apply contract-soundness audit ({{N}} BLOCKERs + {{N}} RISK + {{N}} MINOR)`. Body lists every finding ID + the amendment line range.
8. **Confirm in chat.**

**Step 6 budget cap:** if the audit application takes more than 1 day of focused work, STOP and escalate.

**WHY Step 6 is mandatory at every remaining-layer dispatch:** if a future dispatch surfaces a NEW SOUNDNESS-STOP, the build agent halts (correctly). The orchestrator's response is to amend the contract with the new finding documented. Re-running this Step 6 as a checklist before every dispatch ensures contract drift never accumulates again.

### Per-layer dispatch budget (apply to every layer dispatch in Wave 1)

- **Wall-clock cap: 4 hours.** Cap hit → STOP, escalate to founder.
- **Cost cap: $20.** Cap hit → STOP, escalate.
- **Dispatch attempts cap: 3.** Per §0.6, the next move is NOT skill modification — it is founder review.

### Exit criteria

1. **{{PRE_SKILL_LAYER}}:** Pre-flight audit + remediation complete; `{{GATE_COMMAND}}` green (orchestrator-run); commit landed.
2. **Layers {{N}} through {{M}}:** `{{SKILL_INVOCATION_PATTERN}}` produces green `{{GATE_COMMAND}}` from the subagent AND independently re-confirmed green by orchestrator (per §0.3) after each.
3. **§0.1 skill validation gates passed at each new-surface-type layer.**
4. `{{GATE_COMMAND}}` full: green — no regressions.
5. {{OPTIONAL_LINT_OR_AST_GREP_RULE_VERIFICATION}} — zero matches.
6. {{OPTIONAL_BACKFILL_COVERAGE_VERIFICATION}}.
7. {{OPTIONAL_REVIEW_SOURCE_VERIFICATION}}: zero blocker findings.
8. {{OPTIONAL_ROLLBACK_TEST}}.
9. **§0.4 memory checkpoint written** with end-of-Wave-1 state.

### Findings absorbed by Wave 1

| id | flow | severity | title snippet |
|---|---|---|---|
| {{FINDING_ID}} ({{stream — opportunistic / main}}) | {{FLOW_NAME}} | {{SEVERITY}} | {{DESCRIPTION}} |
| ... | | | |

{{NARRATIVE_PARAGRAPH — explain why Wave 1 absorbs few or zero findings: e.g. "QA harness is frontend-driven so backend changes aren't observable yet, but Wave 1's real value is architectural — locks in canonical X so Wave 2 consumers can be built once."}}

### Downstream preconditions satisfied (post-Wave-1 closure)

| Wave-2 unit | Wave-1 output it consumes |
|---|---|
| {{WAVE_2_UNIT_1}} | {{WAVE_1_OUTPUT}} |
| {{WAVE_2_UNIT_2}} | {{WAVE_1_OUTPUT}} |
| ... | |

Wave 2 MUST NOT begin {{LISTED_UNITS}} until Wave 1 is complete. The other Wave 2 units have no Wave-1 *data-model* dependency, but per §0.3 (sequential dispatch only), they wait. The constraint is concurrency-driven, not dependency-driven.

---

## 3. Wave 2 — {{WAVE_2_NAME}}

### Scope

{{ONE_PARAGRAPH_DESCRIBING_WAVE_2 — polished UI per wireframes, design system baseline, app shell, placeholders, QA gate, commit gate}}. Authority: `{{WAVE_2_AUTHORITY_PATH_AND_LINE_RANGE}}`.

### Pre-flight (before first Wave-2 dispatch)

> **AUTHORING NOTE.** Wave 2 pre-flight should include: (1) re-verify any inconclusive findings via `{{VERIFY_SKILL}}`, (2) skill-debut validation gate for the build skill if it's never been invoked at this surface type, (3) a brief-soundness gate added to the build skill if it has no equivalent of Wave-1's Step 4c.0, (4) defect-rate target locked, (5) chat acknowledgment.

**Step 1 — Re-verify the unclassified-finding bucket via `{{VERIFY_SKILL}}`.** {{Number}}+ findings are unclassified. Re-run verify; runtime-only or inconclusive results get explicit 4a.E re-test gates rather than silent absorption.

**Confidence calibration for absorption-by-rebuild:**

| Severity classification | Absorption confidence | Action |
|---|---|---|
| critical / high / medium with specific file paths | HIGH | Rebuild absorbs; no special handling |
| unclassified — verifier returned `verified` or `runtime-only` | MEDIUM | Rebuild absorbs the source-level cause; runtime-only behavior must be re-tested at 4a.E |
| unclassified — verifier returned `inconclusive` | LOW | Re-run; if still inconclusive, treat as 4a.E re-test required |
| unclassified — never run through verifier | UNKNOWN | Re-run before assigning to a Wave-2 unit |

**Step 2 — `{{BUILD_SKILL_NAME}}` skill-debut validation gate (MANDATORY before the {{N}}-unit sequence begins).**

> **Why this step exists:** §0.1 mandates skill-debut validation at every new surface type. `{{BUILD_SKILL_NAME}}` has {{never been invoked in production / been invoked N times}}.

Concrete procedure:

1. **Pick the smallest, simplest unit as the validation target.** Recommend **{{CANARY_UNIT}}** — {{rationale}}.
2. **Dispatch `{{SKILL_INVOCATION}}` against the canary.** Apply §0.1 six-question audit after the subagent returns.
3. **Run `{{QA_AUDIT_SKILL}}`** against the shipped output. Findings ≤{{N}} = skill is acceptable; findings >{{N}} = skill defect; apply §0.6 9-step iteration before next dispatch.
4. **Confirm in chat.**

**Step 3 — `{{BUILD_SKILL_NAME}}` Brief Soundness Gate addition (MANDATORY before Step 2 dispatch).**

> **Why this step exists:** `{{REFERENCE_SKILL_NAME}}` SKILL.md Step {{N}} runs mechanical checks before any code is written. `{{BUILD_SKILL_NAME}}` has no equivalent. Without it, a Brief that references components or procedures that don't exist will silently produce broken code that surfaces only at gate or runtime.

Concrete procedure:

1. **Read `{{BUILD_SKILL_NAME}}` SKILL.md.**
2. **Add a Brief Soundness Gate** with mechanical checks:
   - **WIREFRAME-COMPONENT-MISSING:** every component cited must exist or be declared as new. Mismatches = STOP.
   - **WIREFRAME-PROCEDURE-MISSING:** every backend procedure cited must be grep-findable. Mismatches = STOP.
   - **WIREFRAME-ROUTE-MISSING:** every link/href must match an existing route or be declared as a new route. Mismatches = STOP.
   - **WIREFRAME-PROP-DRIFT:** if the wireframe shows a prop not in the component's TypeScript interface, STOP.
3. **Halt is unconditional** — no "minor deviation" / "I'll fix this in the gate cycle" rationalization.
4. **Apply Deviations report rule:** additions to the wireframe must be declared in a Step-6 Deviations report.
5. **Skill modification follows §0.6 9-step iteration protocol.**

**Step 4 — Wave 2 defect-rate target (locked).**

Per-{{unit}} {{QA_GATE_NAME}} finding rate: **≤{{N}} findings per {{unit}}, average across the first {{M}} {{units}}.** Cap thresholds:
- ≤{{N}}: continue at planned cadence.
- >{{N}} and <{{M}}: apply §0.6 to the skill, re-validate, resume.
- ≥{{M}}: STOP, escalate to founder.

WHY a defect-rate target is mandatory: without one, a `{{BUILD_SKILL_NAME}}` skill regression cascades silently through all units before discovery, wasting the entire wave's budget. The rate target is the canary.

**Step 5 — Confirm Wave 2 pre-flight complete in chat.**

### {{FOLLOW_ON_FEATURE_DELIVERABLES — added when Wave-1 produced backend surfaces with no frontend wiring}}

> **AUTHORING NOTE.** Use this subsection when the wave's closing investigation surfaced architectural gaps that didn't exist in the original contract. Each deliverable gets a WHAT / WHY / WHERE / DEPS / WIREFRAME-STATUS / FINDINGS-ABSORBED spec block. Omit this entire subsection if not applicable.

#### Deliverable {{ID}} — {{Title}}

**WHAT:** {{One paragraph describing the surface and the trigger condition. Cite exact error codes / cause-codes / status enums if applicable.}}

**WHY:** {{Cite the product-vision section, invariant ID, or No-Silent-Gaps rule that mandates this surface. Without the surface, what does the user experience? What does ops experience?}}

**WHERE:** {{File path(s) to extend or create. Form shape if a form. Suggested layout if visual.}}

**DEPS:**
- Backend procedure(s): {{cite by name + commit that shipped them}}.
- {{Other dependencies: cause-code routing, sanitization, schema-awareness, etc.}}

**WIREFRAME STATUS:** {{EXISTS-pre-this-feature-needs-extension / NONE-needs-design / EXISTS-fully-specced}}. {{If NONE, state the two paths: (a) commission wireframe via {{DESIGN_SKILL}} OR (b) build directly from this spec at higher defect-rate.}}

**FINDINGS ABSORBED:** {{count + list, or "None (new capability)"}}

{{REPEAT_FOR_EACH_DELIVERABLE}}

#### {{Follow-on-feature}} frontend dispatch ordering

Within {{DELIVERABLE_RANGE}}, the dispatch order is constrained by:
- {{CONSTRAINT_1}}.
- {{CONSTRAINT_2}}.

### Per-{{unit}} breakdown

> **AUTHORING NOTE.** Every Wave-2 unit gets the same template block: wireframe pointer, existing files to be rewritten, backend dependency, findings absorbed (grouped by severity). Keep blocks consistent so an agent can scan them in parallel.

Every {{unit}} is dispatched via `{{SKILL_INVOCATION_PATTERN}}` per the {{wave-section}} per-unit template. The skill reads the wireframe + companion `.wireframe.md` + existing shell + domain rules, then builds {{tech_stack}}. Existing implementations are REWRITTEN in full by the skill.

For each {{unit}} below, "existing files (to be rewritten)" = every file under the listed directory that the wireframe-aligned rebuild replaces. "Backend dependency" = the router(s) the unit consumes; these are fixed via `{{FIX_MODE_SKILL}}` in the {{QA_GATE}} bug cycle if QA surfaces backend regressions.

#### {{WAVE_2_UNIT_ID}} — {{Unit_Name}}

- **Wireframe:** `{{WIREFRAME_PATH}}` + `{{COMPANION_PATH}}` {{add caveat if wireframe predates a follow-on feature}}
- **Existing files to be rewritten** (all under `{{DIRECTORY}}`):
  - `{{FILE}}`, `{{FILE}}`, ... {{enumerate every file}}
- **Backend dependency:** `{{ROUTER_PATH}}` {{+ Wave-1 layers it consumes}}
- **Findings absorbed: {{N}}** (bucket `{{BUCKET_NAME}}`)
  - **CRITICAL ({{N}}):** `{{ID}}`, ...
  - **HIGH ({{N}}):** `{{ID}}` ({{title snippet}}), ...
  - **MEDIUM ({{N}}):** `{{ID}}`, ...
  - **UNCLASSIFIED ({{N}}):** `{{ID}}`, ...
  - Plus {{N}} opportunistic: `{{ID}}`, ...
- **{{Optional}} NEW {{follow-on-feature}} deliverables (must ship in same dispatch as the rebuild):**
  - **{{DELIVERABLE_ID}}: {{Title}}** — full spec at "{{Deliverable subsection}}" above.

{{REPEAT_FOR_EACH_UNIT}}

### {{OPTIONAL_NEW_SHELL_OR_ADMIN_SURFACES_SECTION}}

> **AUTHORING NOTE.** Use this section when the wave introduces a new shell layer (admin, public, embed, etc.) that doesn't exist yet. Note the shell decision is a BLOCKER for any unit in this section.

#### {{ID}} — {{Surface_Name}}

- **Spec source:** "{{Deliverable subsection}}" above.
- **Wireframe:** {{STATUS}}.
- **Existing files to be rewritten:** None (new surface).
- **Backend dependency:** {{cite}}.
- **Findings absorbed: 0 directly** (new capability).
- **Suggested route:** `{{ROUTE_PATH}}` (path depends on shell decision).

{{REPEAT}}

### App-shell + placeholders ({{SECTION_IDS}}) — {{BUCKET_NAME}}

{{Describe shell rebuild, placeholder component for not-yet-shipped sections, findings absorbed.}}

**Existing files to be rewritten:**
- {{PATH_GLOB_1}}
- {{PATH_GLOB_2}}

**Findings absorbed: {{N}}** (bucket `{{BUCKET_NAME}}`)
- **CRITICAL ({{N}}):** ...
- **HIGH ({{N}}):** ...
- **MEDIUM ({{N}}):** ...
- Plus {{N}} opportunistic.

### "{{CATCHALL_BUCKET_1}}" and "{{CATCHALL_BUCKET_2}}" catchall buckets

**`{{bucket_name}}` ({{N}} findings):** {{Describe what this catchall covers and why Wave 2 absorbs it.}}

**`{{bucket_name}}` ({{N}} findings):** {{Same.}}

### Per-{{unit}} dispatch budget

Same discipline as Wave 1 layers: 4 hours wall-clock, $20 cost, 3 dispatch attempts max per {{unit}}. Cap hit → STOP, escalate. Per §0.6, the response is NEVER `{{BUILD_SKILL_NAME}}` skill modification or scope expansion — it is founder review.

### Wave 2 exit criteria

1. **{{ID}}.1** — All {{N}} {{units}} green per QA audit ({{QA_GATE_INVOCATION}}).
2. **{{ID}}.2** — Performance targets met ({{specific_metrics}}).
3. **{{ID}}.3** — Any backend bugs surfaced fixed via `{{FIX_MODE_SKILL}}`; review re-runs CLEAN.
4. **{{ID}}.4** — `{{GATE_COMMAND}}` green — subagent-run AND orchestrator-re-run per §0.3.
5. **{{ID}}.5** — Constitution-diff captures any new invariants.
6. **§0.1 skill validation gate** — first `{{BUILD_SKILL_NAME}}` dispatch reviewed for skill-level defects; any defects resolved via §0.6.
7. **§0.4 memory checkpoint** — written every {{N}} {{units}}.
8. **{{Optional follow-on-deliverable coverage criterion}}** — all follow-on deliverables shipped + QA-verified.
9. **{{ID}}.6** — Commit: `feat({{wave}}): frontend complete for {{scope_summary}} — CEO-demo-ready, placeholders in place`.

---

## 4. Wave 3 — {{WAVE_3_NAME}}

### Scope

Every finding whose `source_citations` point at files that neither Wave 1 nor Wave 2 rewrites. These are all standalone fixes. The Zero-Deferral Policy applies: every CRITICAL, HIGH, and MEDIUM finding is resolved before Wave 3 exits. Within the wave, order is: **CRITICAL + {{priority_subsystem}} first**, then **CRITICAL non-{{priority_subsystem}}**, then **HIGH**, then **MEDIUM**.

**Wave 3 starts after Wave 1 schema lands.** Wave 2 and Wave 3 dispatches interleave under the §0.3 sequential-only rule — pick one Wave-2 unit or one Wave-3 fix at a time. Never two at once.

### File bucket summary

| Bucket | Path prefix | Wave-3 findings | Opportunistic |
|---|---|---:|---:|
| {{BUCKET_NAME_1}} | `{{PATH_GLOB}}` | {{N}} | {{N}} |
| {{BUCKET_NAME_2}} | `{{PATH_GLOB}}` | {{N}} | {{N}} |
| ... | | | |
| **Total** | | **{{N}}** | **{{N}}** |

### 4.1 CRITICAL + {{priority_subsystem}}-priority (fix first)

| id | file:line | description |
|---|---|---|
| {{FINDING_ID}} | `{{FILE:LINE}}`; {{additional_locations}} | {{ONE_SENTENCE_DESCRIPTION}}. Fix: {{actionable_remediation}}. |

### 4.2 CRITICAL + non-{{priority_subsystem}}

{{NONE if applicable, or list per format above.}}

### 4.3 HIGH — {{priority_subsystem}} ({{N}} findings)

These are the "punch-list {{priority}} priority" items. Order is: {{Security-semantic first, then UX, then input hygiene — adapt to project}}.

**{{CATEGORY_1}} ({{N}}):**
- `{{FINDING_ID}}` `{{FILE}}` — {{description}}. Fix: {{remediation}}.
- ...

**{{CATEGORY_2}} ({{N}}):**
- ...

**{{CATEGORY_3}} ({{N}}):**
- ...

### 4.4 HIGH — Non-{{priority_subsystem}} ({{N}} findings)

| id | file | description |
|---|---|---|
| {{FINDING_ID}} | `{{FILE}}` | {{DESCRIPTION}}. |

### 4.5 MEDIUM ({{N}} findings)

**{{subsystem}} ({{N}}):**
- `{{FINDING_ID}}` — {{description}}.

**{{subsystem}} ({{N}}):**
- ...

### 4.6 Wave 3 opportunistic ({{standalone_streams}})

| id | file | bucket | description |
|---|---|---|---|
| {{FINDING_ID}} | `{{FILE}}` | {{BUCKET}} | {{DESCRIPTION}}. |

### 4.7 Wave 3 exit criteria

1. All {{N}} main-stream Wave-3 findings + {{N}} opportunistic Wave-3 findings resolved (classified as FIX / SPEC-GAP+FIX / RISK+fix / DISMISS with source commit referenced).
2. `{{GATE_COMMAND}}` green (subagent-run AND orchestrator-re-run per §0.3).
3. `{{QA_AUDIT_SKILL}}` re-run on {{affected_flows}} — all previously-flagged Wave-3 findings resolved; any NEW findings that appear must be LOW (Wave 4 eligible) or absorbed by a not-yet-run Wave-2 unit.
4. Zero deferrals documented per the Zero-Deferral Policy. If a finding cannot be fixed (e.g., needs a product decision), it escalates to `{{ESCALATION_SKILL}}` — NOT deferred to Wave 4.
5. **§0.4 memory checkpoint written** with end-of-Wave-3 state.

**Per-fix dispatch budget for Wave 3:** 4-hour wall-clock cap, $20 cost cap, 3 dispatch attempts max per finding. Cap hit → STOP and escalate.

---

## 5. Wave 4 — Finish + Regression Tests

### 5.1 LOW-severity polish batch ({{N}} findings + {{N}} opportunistic)

| id | flow | file | description |
|---|---|---|---|
| {{FINDING_ID}} | {{FLOW}} | `{{FILE}}` | {{DESCRIPTION}}. |

### 5.2 Regression test suite (post-ship per `{{CONSTITUTION_DOC}}` source-first protocol)

Per `{{CONSTITUTION_DOC}}`: tests are **NOT** written before source code exists. They serve two purposes: (1) regression locks when QA finds a bug worth locking, (2) **post-ship safety nets after {{milestone}} ships to production and is validated working**. This phase completes BEFORE {{NEXT_MILESTONE}} begins.

**Scope of the Wave-4 regression suite (narrowed):**

> **Why this scope is narrowed:** the original Wave-4 framing said "every backend procedure touched by Waves 1, 2, and 3" — that is hundreds of procedures and {{N}} weeks of test-writing alone. The constitution's finish-line criteria explicitly do NOT require coverage percentage or mutation score. Open-ended per-procedure unit-test scope expands the bar past the locked criteria. The narrowed scope below ships journey-level safety nets that exercise canonical user paths — which is what regression tests are *for* — without expanding the locked finish line.

- **{{N}} E2E journey tests ({{TEST_FRAMEWORK}}).** {{Describe scope — one journey per primary user path plus auth journeys.}} Each test calls real procedures against a real database — never mocks, never `as unknown as` casts. **Litmus test from `{{CONSTITUTION_DOC}}`:** if you delete the production router, the test must fail.
- **Regression locks for QA-surfaced bugs only.** During Wave 1/2/3, every QA finding worth locking gets a regression test written AFTER the fix.
- **No comprehensive per-procedure unit tests.** A future post-ship phase authors comprehensive tests. That phase is OUT OF SCOPE per the constitution.

**Wave-4 test-writing budget:** {{N}}-{{M}} days for {{N}} journey tests + {{N}} day for test-audit + test-fix cycle. Total ≈ {{N}}-{{M}} days, not {{N}} weeks.

**Test quality rules (verbatim from `{{CONSTITUTION_DOC}}`):**
- Every test block MUST call the actual procedure under test.
- {{TEST_PATTERN_1}} for integration tests — real code, real database.
- {{TEST_PATTERN_2}} for unit tests — real procedure code.
- Direct database operations are ONLY for verification AFTER calling the procedure — never as the test action itself.
- THE LITMUS TEST: If you delete the production router and the test still passes, the test is broken.
- {{ENFORCEMENT_RULES — ast-grep / hookify rule names}}.

### 5.3 Wave 4 exit criteria

Per the finish-line criteria locked in `{{CONSTITUTION_DOC}}`:

1. **(a)** Every user journey works in a real browser (`{{QA_AUDIT_SKILL}}` full re-run: zero blockers).
2. **(b)** `{{GATE_COMMAND}}` passes (backend + frontend + tests) — subagent-run AND orchestrator-re-run per §0.3.
3. **(c)** QA auditor zero blockers across all {{N}} flows in the {{REPORTS_DIRECTORY}} harness.

Nothing else counts. Not test coverage percentage. Not mutation score. These criteria are locked by the constitution and cannot be expanded.

**§0.4 memory checkpoint — final**: written after Wave 4 completes, capturing the full ship state, every skill modification across all four waves, and the lessons that should propagate to the next product's remediation cycle. This memory file becomes the canonical handoff for the next product's remediation cycle.

---

## 6. {{OPTIONAL — Framework / Build-Pipeline Enhancements (Surgical Scope, Out of Scope)}}

> **AUTHORING NOTE.** Use this section when a separate framework-rewrite plan exists and you need to partition it into "do now (surgical)," "do later (workstream)," and "out of scope (unjustified by observed defects)." Omit this entire section if no such framework work is on the table. The discipline: every framework item must cite a documented, reproducible defect class in this codebase. Otherwise reject per §0.7 anti-rationalization.

### 6.1 Empirical anchor: what defect classes ARE shipping in this codebase

From the {{soundness audit / review state}}: **{{N}} BLOCKERs / {{M}} total findings**. Distribution by defect class:

| Defect class | Count | Where the defect lives |
|---|---|---|
| {{CLASS_1}} | {{N}} | {{Where in the authoring/build process this defect lives}} |
| ... | | |

**Defects from "agent forgot a cross-cutting rule in code" (the class the proposed DSL solves): {{count — ideally ZERO}}.** {{Cite evidence: which layer reviews verified every cross-cutting rule correct on disk under existing helpers + skill.}}

**The defects this codebase ships are upstream of where the DSL operates.** They are {{authoring drift / process drift / etc.}}, not code-authoring drift.

### 6.2 Insert NOW (during {{SHIP_MILESTONE}} — surgical, ~{{N}} day total)

Items from the framework-rewrite plan that DO solve observed defects, are cheap to implement, and do not disrupt active dispatch flow:

1. **{{ITEM_NAME}}** at `{{PATH}}` (~{{N}} LOC). {{Description of what it solves.}} **STATUS: {{SHIPPED-in-commit / VERIFY-ON-DISK / TODO}}.**
2. ...

Total: ~{{N}} day combined. These are inserts, not workstreams. They do not require pausing layer dispatch. They are validated against the same `{{GATE_COMMAND}}` cadence as any other change.

### 6.3 Insert AFTER {{SHIP_MILESTONE}}, BEFORE {{NEXT_MILESTONE}} (~{{N}}-{{M}} days)

The high-leverage workstream from the framework-rewrite plan. This is what closes {{defect class}} entirely. Execute as a discrete {{N}}-{{M}} day workstream after Wave 4 ships, before {{NEXT_MILESTONE}} begins:

1. **{{ITEM}}.** {{Description.}}
2. ...

Reference architecture: `{{FRAMEWORK_PLAN_PATH}}` {{specific section references}}. Skip the rest of that plan.

**Why AFTER {{SHIP_MILESTONE}} and not now:** changing the {{authoring system}} mid-feature means re-authoring the active contract while in flight. That is a self-inflicted spiral. Ship {{SHIP_MILESTONE}} on the existing system (patched per Step 6), then upgrade the system before {{NEXT_MILESTONE}}'s contract is authored.

### 6.4 Out of scope (do NOT execute during {{SHIP_MILESTONE}}; reconsider only if defects shipped justify it)

The following items are out of scope for this codebase as of {{YYYY-MM-DD}}. Each item solves a defect class for which the codebase has zero observed instances:

| Framework-rewrite item | Defect class it claims to solve | Observed instances in this codebase |
|---|---|---|
| {{ITEM}} | {{DEFECT_CLASS}} | {{Zero / N — citation of evidence}} |
| ... | | |

**The bar for ever executing these:** a documented, reproducible defect from a layer review or QA audit that demonstrates the existing skill + helpers + soundness gates failed to catch a defect class one of these items would have caught. Without that evidence, executing the over-engineered work is substitution of one working mechanism for another working mechanism, not engineering value.

### 6.5 Where in the plan §6.2 / §6.3 items are referenced

- §6.2 (insert NOW): referenced in §1 Realistic Timeline as {{INSERT_LABEL}} — execute during {{WAVE}} finish.
- §6.3 (insert AFTER): referenced in §5.3 Wave 4 exit — execute as discrete workstream after Wave 4 memory checkpoint, before any {{NEXT_MILESTONE}} work begins.
- §6.4 (out of scope): referenced as a forbidden-execution-path callout. If a future session proposes any §6.4 item without first citing a documented defect that justifies it, reject the proposal per §0.7.

---

## 7. Appendix A — Full finding-to-wave mapping ({{N}} main-stream findings)

> **AUTHORING NOTE.** This appendix is the auditable mapping from each finding to the wave that resolves it. Generated mechanically from QA reports + a wave-classification script; not hand-authored. Table columns are fixed below. Wave codes: W1 = foundation; W2:{{unit}} = frame rebuild; W3:{{subsystem}} = punch-list standalone; W4:low-polish = LOW severity polish.

Table columns: `finding_id` | `flow` | `severity` | `action_class` | `source_citations` (truncated to ≤78 chars) | `wave` | `reason`.

| finding_id | flow | severity | action | source_citations | wave | reason |
|---|---|---|---|---|---|---|
| {{ID}} | {{FLOW}} | {{SEV}} | {{CLASS}} | {{CITATIONS}} | {{WAVE_CODE}} | {{ABSORPTION_REASON}} |
| ... | | | | | | |

---

## 8. Appendix B — Opportunistic findings ({{N}} findings from {{VERIFY_SKILL}})

Table columns: `finding_id` | `flow_id` | `draft_severity` | `source_citations` (truncated) | `wave` | `title` (truncated to ≤120 chars).

| finding_id | flow | sev | citations | wave | title |
|---|---|---|---|---|---|
| {{ID}} | {{FLOW}} | {{SEV}} | {{CITATIONS}} | {{WAVE_CODE}} | {{TITLE}} |
| ... | | | | | |

---

## Template usage checklist (delete before plan is live)

Before this plan is considered authored:

- [ ] Every `{{PLACEHOLDER}}` resolved or the containing line deleted.
- [ ] Every `> **AUTHORING NOTE:**` callout deleted (its guidance is for the author, not the agent).
- [ ] §0 Operating Discipline reviewed verbatim — section structure preserved, project-specific paths filled in (skill paths, state file paths, gate command, agent invocation pattern).
- [ ] §0.0 mandatory-reading list contains {{N}} entries with WHY citation for each.
- [ ] §0.1 skill validation gate enumerates EVERY new surface type the wave introduces.
- [ ] §0.5 authorization artifact body matches the actual marker file on disk.
- [ ] Wave 1 build order is dependency-respecting (NOT numerical) and arrow-chain notation is used.
- [ ] Wave 1 exhaustive file list is complete — every path either marked MISSING or EXISTS with audit-status.
- [ ] Wave 1 pre-flight steps end with concrete chat-acknowledgment strings.
- [ ] Wave 2 pre-flight includes skill-debut validation, Brief Soundness Gate, defect-rate target.
- [ ] Wave 2 per-{{unit}} blocks are all populated with wireframe + files + backend + findings.
- [ ] Wave 3 finding tables are mechanically derived from QA reports, not hand-authored.
- [ ] Wave 4 regression scope is narrowed to journey tests — not "every backend procedure."
- [ ] Realistic timeline is anchored to demonstrated velocity from a real git-log window.
- [ ] §6 either filled in with empirical anchor or deleted entirely.
- [ ] Appendix A and B populated from the actual QA reports.
- [ ] Plan has a `Plan generated: {{DATE}}` header and a Quick Start with the {{N}}-step amended sequence for fresh-session entry.
- [ ] All prior Quick Starts / amendments preserved verbatim with strike-through for audit trail (no deletions).
- [ ] This checklist deleted.
