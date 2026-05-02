import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { classifyPainLocally, getKnowledgeFor, painLevels, type PainLevel } from "@/data/painKnowledge";

const InputSchema = z.object({
  structureName: z.string().min(1).max(120),
  structureLatin: z.string().min(0).max(120).optional().default(""),
  structureDescription: z.string().min(0).max(1000).optional().default(""),
  tissueType: z.enum(["os", "muschi", "tendon"]).default("os"),
  symptoms: z.string().min(3).max(800),
});

const ResponseSchema = z.object({
  nivel: z.enum(["usor", "mediu", "consultare_doctor"]),
  cauze: z.array(z.string().min(1).max(280)).min(1).max(4),
  recomandare: z.string().min(1).max(600),
  explicatieNivel: z.string().min(1).max(400),
});

export type SymptomAnalysis = z.infer<typeof ResponseSchema>;

const TISSUE_LABEL: Record<"os" | "muschi" | "tendon", string> = {
  os: "țesut osos (sistem scheletal)",
  muschi: "țesut muscular (sistem muscular striat)",
  tendon: "tendon / țesut conjunctiv fibros",
};

export const analyzeSymptoms = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<SymptomAnalysis> => {
    const localLevel = classifyPainLocally(data.symptoms);
    const localKnowledge = getKnowledgeFor(data.tissueType);
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return buildLocalAnalysis(data.tissueType, localLevel);
    }

    const tissueLabel = TISSUE_LABEL[data.tissueType];

    const systemPrompt = `Ești un asistent medical educațional care clasifică simptome legate de o structură anatomică specifică. Răspunzi DOAR în limba română, cu diacritice. Nu pui diagnostic medical real. Clasifici severitatea exclusiv într-unul dintre cele 3 niveluri: usor, mediu, consultare_doctor. Pentru semne severe precum traumă, deformare, amorțeală, slăbiciune, durere insuportabilă, febră sau imposibilitate de folosire, alegi consultare_doctor.`;

    const userPrompt = `Structură selectată: ${data.structureName}${data.structureLatin ? ` (${data.structureLatin})` : ""}
Tip țesut: ${tissueLabel}
Context anatomic: ${data.structureDescription || "n/a"}
Clasificare locală inițială: ${localLevel}
Bază locală pentru acest țesut:
- Ușor: ${localKnowledge.usor.join("; ")}
- Mediu: ${localKnowledge.mediu.join("; ")}
- Consultare doctor: ${localKnowledge.consultare_doctor.join("; ")}

Simptome descrise de utilizator: "${data.symptoms}"

Returnează strict JSON valid cu:
- nivel: "usor" | "mediu" | "consultare_doctor"
- cauze: 2-3 cauze posibile, specifice pentru ${tissueLabel}
- recomandare: recomandare practică, inclusiv când trebuie medic
- explicatieNivel: de ce ai ales nivelul`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        instructions: systemPrompt,
        input: userPrompt,
        text: {
          format: {
            type: "json_schema",
            name: "analiza_simptome",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                nivel: { type: "string", enum: ["usor", "mediu", "consultare_doctor"] },
                cauze: {
                  type: "array",
                  minItems: 2,
                  maxItems: 3,
                  items: { type: "string" },
                },
                recomandare: { type: "string" },
                explicatieNivel: { type: "string" },
              },
              required: ["nivel", "cauze", "recomandare", "explicatieNivel"],
            },
          },
        },
      }),
    });

    if (response.status === 429) {
      throw new Error("Prea multe cereri. Te rugăm să încerci din nou în câteva momente.");
    }
    if (response.status === 402) {
      throw new Error("Creditele OpenAI sunt epuizate sau cheia nu are billing activ.");
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI API error:", response.status, text);
      throw new Error("Asistentul AI este temporar indisponibil.");
    }

    const json = (await response.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };

    const outputText =
      json.output_text ??
      json.output
        ?.flatMap((item) => item.content ?? [])
        .filter((content) => content.type === "output_text")
        .map((content) => content.text)
        .join("");

    if (!outputText) {
      throw new Error("Răspuns invalid de la asistentul AI.");
    }

    const parsed = ResponseSchema.parse(JSON.parse(outputText));
    return parsed;
  });

function buildLocalAnalysis(tissueType: "os" | "muschi" | "tendon", level: PainLevel): SymptomAnalysis {
  const knowledge = getKnowledgeFor(tissueType);
  const details = painLevels[level];

  return {
    nivel: level,
    cauze: [...knowledge[level]].slice(0, 3),
    recomandare:
      level === "consultare_doctor"
        ? "Este recomandată consultarea unui medic, mai ales dacă durerea este severă, apare după traumă sau limitează funcția. Până atunci, evită solicitarea zonei."
        : level === "mediu"
          ? "Monitorizează simptomele, redu efortul și aplică măsuri simple precum repaus relativ. Dacă durerea persistă sau se agravează, consultă un medic."
          : "Încearcă repaus relativ, hidratare și revenire treptată la efort. Dacă simptomele persistă, cresc sau apar semne noi, cere sfat medical.",
    explicatieNivel: `${details.label}: ${details.summary}`,
  };
}
