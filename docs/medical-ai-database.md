# Medical AI Database Plan

## Goal

The AI must not answer from general knowledge alone. It should answer only from:

1. the selected anatomy structure;
2. matching diseases/conditions from PostgreSQL;
3. matching symptoms and triage questions from PostgreSQL;
4. active guardrails from `ai_guardrails`.

If the user asks about a non-medical topic, the assistant should refuse briefly and return to the medical context.

## PostgreSQL Tables

- `anatomy_structures`: body parts, tissues, model selection ids.
- `conditions`: medical conditions/diseases and default severity.
- `symptoms`: symptom catalog with keywords and red-flag markers.
- `condition_symptoms`: relation between conditions and symptoms.
- `triage_questions`: questions the app asks the user.
- `triage_options`: answer options and severity scores.
- `triage_rules`: hard rules, including contradictions and red flags.
- `medical_sources`: bibliography/source tracking.
- `ai_guardrails`: rules injected into the AI prompt.

## Runtime Flow

1. User selects a model region, for example `muschi-mana-antebrat`.
2. App fetches the matching `anatomy_structures` row.
3. App fetches relevant `triage_questions` and `triage_options`.
4. User answers the questions.
5. Server scores answers using database rules.
6. Server retrieves possible `conditions` and linked `symptoms`.
7. Only then, if `OPENAI_API_KEY` exists, server calls OpenAI with a limited prompt:

```text
You are a medical education assistant.
Use only the database context below.
Do not answer non-medical topics.
If the answer is not in the database context, say that the database does not contain enough information.
Never provide a real diagnosis.
```

8. If no OpenAI key exists, the app returns the deterministic local/database result.

## Why This Prevents Off-Topic Answers

The model is not asked a broad question like "what do you think?". It receives:

- strict system instructions;
- database context only;
- a JSON response schema;
- guardrails saying medical scope only.

So if someone asks about `Moara cu noroc`, the assistant should answer:

```text
Pot răspunde doar despre anatomie, simptome și triaj medical educațional.
```

## Next Step

Replace the current `src/data/painKnowledge.ts` fallback with reads from Supabase/PostgreSQL. Keep the local file only as an offline fallback.
