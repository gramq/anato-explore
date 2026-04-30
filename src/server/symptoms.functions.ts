import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  structureName: z.string().min(1).max(120),
  structureLatin: z.string().min(0).max(120).optional().default(""),
  structureDescription: z.string().min(0).max(1000).optional().default(""),
  tissueType: z.enum(["os", "muschi", "tendon"]).default("os"),
  symptoms: z.string().min(3).max(800),
});

const ResponseSchema = z.object({
  cauze: z.array(z.string().min(1).max(280)).min(1).max(4),
  recomandare: z.string().min(1).max(600),
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
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY nu este configurat.");
    }

    const tissueLabel = TISSUE_LABEL[data.tissueType];

    const systemPrompt = `Ești un asistent medical educațional care analizează simptome legate de o structură anatomică specifică. Răspunzi DOAR în limba română, cu diacritice. Oferi informații generale, NU diagnostice medicale reale. Adaptezi răspunsul în funcție de tipul de țesut: pentru os te referi la patologii scheletale (fracturi, artroză, osteoporoză), pentru mușchi la patologii musculare (întinderi, crampe, contracturi, miozită), iar pentru tendon la tendinopatii (tendinită, ruptură, entezită). Răspunsul trebuie să fie specific structurii indicate și simptomelor descrise.`;

    const userPrompt = `Structură selectată: ${data.structureName}${data.structureLatin ? ` (${data.structureLatin})` : ""}
Tip țesut: ${tissueLabel}
Context anatomic: ${data.structureDescription || "n/a"}

Simptome descrise de utilizator: "${data.symptoms}"

Returnează 2-3 posibile cauze plauzibile (SPECIFICE pentru ${tissueLabel}) și o recomandare practică (specialist + măsuri imediate).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "raspuns_simptome",
              description: "Returnează cauze posibile și o recomandare în română.",
              parameters: {
                type: "object",
                properties: {
                  cauze: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 cauze posibile, specifice tipului de țesut.",
                  },
                  recomandare: {
                    type: "string",
                    description: "Recomandare practică, inclusiv tipul de specialist.",
                  },
                },
                required: ["cauze", "recomandare"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "raspuns_simptome" } },
      }),
    });

    if (response.status === 429) {
      throw new Error("Prea multe cereri. Te rugăm să încerci din nou în câteva momente.");
    }
    if (response.status === 402) {
      throw new Error("Creditele AI sunt epuizate. Adaugă fonduri în workspace.");
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Asistentul AI este temporar indisponibil.");
    }

    const json = (await response.json()) as {
      choices?: Array<{
        message?: {
          tool_calls?: Array<{ function?: { arguments?: string } }>;
        };
      }>;
    };

    const argsStr = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) {
      throw new Error("Răspuns invalid de la asistentul AI.");
    }

    const parsed = ResponseSchema.parse(JSON.parse(argsStr));
    return parsed;
  });
