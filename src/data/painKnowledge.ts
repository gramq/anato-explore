export type PainLevel = "usor" | "mediu" | "consultare_doctor";

export interface SymptomAnalysis {
  nivel: PainLevel;
  cauze: string[];
  recomandare: string;
  explicatieNivel: string;
  redFlags: string[];
}

export interface SymptomValidation {
  ok: boolean;
  message?: string;
}

export interface PainLevelDetails {
  label: string;
  tone: string;
  summary: string;
  keywords: string[];
}

export const painLevels: Record<PainLevel, PainLevelDetails> = {
  usor: {
    label: "Ușor",
    tone: "bg-success/15 border-success/30 text-success",
    summary: "Disconfort minor, de obicei legat de efort, postură sau oboseală locală.",
    keywords: ["ușor", "usor", "jenă", "jena", "oboseală", "oboseala", "crampă", "crampa", "după efort", "dupa efort"],
  },
  mediu: {
    label: "Mediu",
    tone: "bg-[oklch(0.82_0.16_85_/_0.18)] border-[oklch(0.72_0.16_85_/_0.35)] text-[oklch(0.46_0.13_70)]",
    summary: "Durere persistentă sau limitare la mișcare care merită monitorizată atent.",
    keywords: ["persistent", "moderat", "mediu", "limitare", "umflat", "inflamat", "arsură", "arsura", "tensiune", "înțepătură", "intepatura"],
  },
  consultare_doctor: {
    label: "Consultare doctor",
    tone: "bg-destructive/10 border-destructive/30 text-destructive",
    summary: "Semne care pot indica o problemă importantă și justifică evaluare medicală.",
    keywords: [
      "sever",
      "insuportabil",
      "nu pot",
      "amorțeală",
      "amorteala",
      "slăbiciune",
      "slabiciune",
      "ruptură",
      "ruptura",
      "traumă",
      "trauma",
      "febră",
      "febra",
      "deformare",
      "pocnit",
      "pocnitură",
      "pocnitura",
    ],
  },
};

export interface PainQuestionOption {
  label: string;
  score: Partial<Record<PainLevel, number>>;
  finding?: string;
}

export interface PainQuestion {
  id: string;
  question: string;
  options: PainQuestionOption[];
}

const baseQuestions: PainQuestion[] = [
  {
    id: "varsta",
    question: "Ce vârstă are persoana?",
    options: [
      { label: "Sub 12 ani", score: { mediu: 1, consultare_doctor: 1 }, finding: "copil" },
      { label: "12-64 ani", score: { usor: 1 }, finding: "adult" },
      { label: "65+ ani", score: { mediu: 1, consultare_doctor: 1 }, finding: "vârstă înaintată" },
    ],
  },
  {
    id: "intensitate",
    question: "Cât de intensă este durerea?",
    options: [
      { label: "Ușoară, suportabilă", score: { usor: 2 }, finding: "durere ușoară" },
      { label: "Moderată, deranjează mișcarea", score: { mediu: 3 }, finding: "durere moderată cu limitare" },
      { label: "Severă sau insuportabilă", score: { consultare_doctor: 5 }, finding: "durere severă" },
    ],
  },
  {
    id: "debut",
    question: "Cum a început?",
    options: [
      { label: "Treptat, după efort", score: { usor: 2, mediu: 1 }, finding: "debut după efort" },
      { label: "Brusc, în timpul unei mișcări", score: { mediu: 2, consultare_doctor: 1 }, finding: "debut brusc" },
      { label: "După lovitură, cădere sau pocnet", score: { consultare_doctor: 5 }, finding: "traumă sau pocnet" },
    ],
  },
  {
    id: "functie",
    question: "Poți folosi zona afectată?",
    options: [
      { label: "Da, aproape normal", score: { usor: 2 }, finding: "funcție păstrată" },
      { label: "Da, dar cu limitare", score: { mediu: 3 }, finding: "funcție limitată" },
      { label: "Nu pot folosi zona", score: { consultare_doctor: 5 }, finding: "imposibilitate funcțională" },
    ],
  },
  {
    id: "semne",
    question: "Există semne vizibile sau simptome asociate?",
    options: [
      { label: "Nu, doar disconfort", score: { usor: 2 }, finding: "fără semne vizibile" },
      { label: "Umflare ușoară sau sensibilitate", score: { mediu: 2 }, finding: "umflare sau sensibilitate" },
      { label: "Vânătaie mare, deformare, febră, amorțeală sau slăbiciune", score: { consultare_doctor: 6 }, finding: "semne de alarmă" },
    ],
  },
  {
    id: "durata",
    question: "De cât timp persistă?",
    options: [
      { label: "Mai puțin de 24-48 ore", score: { usor: 1 }, finding: "durată scurtă" },
      { label: "Câteva zile și nu trece", score: { mediu: 2 }, finding: "persistență de câteva zile" },
      { label: "Se agravează sau revine frecvent", score: { consultare_doctor: 2, mediu: 2 }, finding: "agravare sau recurență" },
    ],
  },
];

const tissueQuestions: Partial<Record<"os" | "muschi" | "tendon", PainQuestion[]>> = {
  muschi: [
    {
      id: "muschi_contractie",
      question: "Durerea apare mai ales când contractezi mușchiul?",
      options: [
        { label: "Da, dar pot continua mișcarea", score: { usor: 1, mediu: 1 }, finding: "durere la contracție" },
        { label: "Da, limitează clar mișcarea", score: { mediu: 3 }, finding: "durere musculară cu limitare" },
        { label: "Da, cu pierdere de forță", score: { consultare_doctor: 4 }, finding: "pierdere de forță" },
      ],
    },
  ],
  tendon: [
    {
      id: "tendon_miscare",
      question: "Durerea apare pe traseul tendonului la mișcări repetate?",
      options: [
        { label: "Da, doar după efort", score: { usor: 1 }, finding: "durere tendinoasă după efort" },
        { label: "Da, aproape la fiecare mișcare", score: { mediu: 3 }, finding: "durere tendinoasă repetitivă" },
        { label: "Da, cu pocnet sau pierdere de funcție", score: { consultare_doctor: 5 }, finding: "posibilă leziune de tendon" },
      ],
    },
  ],
  os: [
    {
      id: "os_sprijin",
      question: "Durerea crește la sprijin sau presiune pe os?",
      options: [
        { label: "Puțin", score: { usor: 1 }, finding: "sensibilitate osoasă ușoară" },
        { label: "Da, clar", score: { mediu: 3 }, finding: "durere la sprijin" },
        { label: "Nu pot sprijini sau există deformare", score: { consultare_doctor: 5 }, finding: "imposibilitate de sprijin" },
      ],
    },
  ],
};

export const musclePainKnowledge = {
  default: {
    usor: [
      "suprasolicitare după antrenament sau efort repetitiv",
      "crampă musculară ușoară cauzată de oboseală sau hidratare insuficientă",
      "tensiune locală produsă de postură sau încălzire incompletă",
    ],
    mediu: [
      "întindere musculară moderată",
      "contractură cu limitare la mișcare",
      "inflamație locală după efort intens sau mișcare repetitivă",
    ],
    consultare_doctor: [
      "posibilă ruptură musculară sau leziune importantă",
      "durere severă asociată cu umflare, vânătaie sau pierdere de forță",
      "simptome neurologice precum amorțeală, slăbiciune sau durere care coboară pe membru",
    ],
  },
  tendon: {
    usor: [
      "iritare ușoară a tendonului după efort",
      "tensiune locală la începutul mișcării",
      "suprasolicitare minoră prin mișcări repetitive",
    ],
    mediu: [
      "tendinită sau tendinopatie incipientă",
      "inflamație persistentă la solicitare",
      "durere la mișcare repetată sau la presiune locală",
    ],
    consultare_doctor: [
      "posibilă ruptură parțială sau completă de tendon",
      "durere bruscă după un pocnet sau traumă",
      "pierdere de funcție ori imposibilitatea folosirii segmentului afectat",
    ],
  },
  os: {
    usor: [
      "contuzie ușoară sau disconfort mecanic",
      "durere minoră după presiune sau activitate",
      "sensibilitate locală fără limitare importantă",
    ],
    mediu: [
      "inflamație articulară sau suprasolicitare mecanică",
      "durere persistentă la sprijin sau mișcare",
      "posibilă iritație periostală după efort repetitiv",
    ],
    consultare_doctor: [
      "posibilă fractură, fisură sau traumatism important",
      "durere severă cu deformare, umflare sau imposibilitate de sprijin",
      "durere osoasă persistentă care nu se ameliorează",
    ],
  },
} as const;

export function classifyPainLocally(symptoms: string): PainLevel {
  const text = symptoms.toLowerCase();

  if (painLevels.consultare_doctor.keywords.some((word) => text.includes(word))) {
    return "consultare_doctor";
  }
  if (painLevels.mediu.keywords.some((word) => text.includes(word))) {
    return "mediu";
  }
  return "usor";
}

export function getKnowledgeFor(tissueType: "os" | "muschi" | "tendon") {
  if (tissueType === "tendon") return musclePainKnowledge.tendon;
  if (tissueType === "os") return musclePainKnowledge.os;
  return musclePainKnowledge.default;
}

export function getPainQuestions(tissueType: "os" | "muschi" | "tendon"): PainQuestion[] {
  return [...baseQuestions, ...(tissueQuestions[tissueType] ?? [])];
}

const anatomyTerms = {
  mana: ["mână", "mana", "palmă", "palma", "deget", "degete", "încheietură", "incheietura", "pumn", "carp"],
  brat: ["braț", "brat", "cot", "umăr", "umar", "antebraț", "antebrat", "humerus", "radius"],
  picior: ["picior", "gleznă", "glezna", "genunchi", "coapsă", "coapsa", "gambă", "gamba", "talpă", "talpa", "femur", "tibie", "tibia", "tars"],
  trunchi: ["spate", "torace", "piept", "coaste", "abdomen", "coloană", "coloana", "pelvis", "bazin", "coxal"],
  cap: ["cap", "craniu", "mandibulă", "mandibula", "frunte", "față", "fata"],
  genital: ["penis", "testicul", "testicule", "scrot", "pula", "pulă", "vagin", "vulvă", "vulva", "genital", "genitale"],
} as const;

const regionBySelectionKeyword: Array<{ region: keyof typeof anatomyTerms; keywords: string[] }> = [
  { region: "mana", keywords: ["mână", "mana", "carp", "deget", "palm"] },
  { region: "brat", keywords: ["braț", "brat", "humerus", "radius", "scapula", "umăr", "umar"] },
  { region: "picior", keywords: ["picior", "femur", "tibia", "tibie", "tars", "gamb", "coaps", "genunchi"] },
  { region: "trunchi", keywords: ["coaste", "vertebr", "coloan", "coxal", "pelvis", "trunchi"] },
  { region: "cap", keywords: ["frontal", "mandib", "craniu", "cap"] },
];

export function validateSymptomRelevance({
  selectedName,
  symptoms,
}: {
  selectedName: string;
  symptoms: string;
}): SymptomValidation {
  const selected = selectedName.toLowerCase();
  const text = symptoms.toLowerCase();
  const selectedRegion = regionBySelectionKeyword.find((entry) =>
    entry.keywords.some((keyword) => selected.includes(keyword)),
  )?.region;
  const mentionedRegions = Object.entries(anatomyTerms)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([region]) => region as keyof typeof anatomyTerms);

  if (mentionedRegions.includes("genital") && selectedRegion && selectedRegion !== "genital") {
    return {
      ok: false,
      message:
        "Simptomele descrise par să fie pentru zona genitală, dar ai selectat altă zonă anatomică. Selectează zona potrivită sau descrie durerea pentru structura selectată.",
    };
  }

  const incompatibleRegion = mentionedRegions.find(
    (region) => region !== selectedRegion && region !== "genital",
  );
  if (selectedRegion && incompatibleRegion) {
    return {
      ok: false,
      message:
        "Simptomele descrise par să indice altă zonă a corpului decât cea selectată. Reformulează simptomele pentru structura selectată sau alege zona corectă.",
    };
  }

  return { ok: true };
}

export function analyzePainLocally({
  tissueType,
  selectedName,
  answers,
  segment,
  group,
}: {
  tissueType: "os" | "muschi" | "tendon";
  selectedName: string;
  answers: Record<string, number>;
  segment?: string;
  group?: string;
}): SymptomAnalysis {
  const consistency = validateAnswerConsistency(answers);
  if (!consistency.ok) {
    return {
      nivel: "consultare_doctor",
      cauze: ["Răspunsurile sunt contradictorii și nu permit un triaj corect."],
      recomandare: consistency.message ?? "Revizuiește răspunsurile înainte de verdict.",
      explicatieNivel: "Verdict blocat: informațiile introduse se contrazic.",
      redFlags: ["răspunsuri contradictorii"],
    };
  }

  const scores: Record<PainLevel, number> = {
    usor: 0,
    mediu: 0,
    consultare_doctor: 0,
  };
  const findings: string[] = [];

  for (const question of getPainQuestions(tissueType)) {
    const optionIndex = answers[question.id];
    const option = Number.isInteger(optionIndex) ? question.options[optionIndex] : undefined;
    if (!option) continue;

    for (const [level, score] of Object.entries(option.score) as Array<[PainLevel, number]>) {
      scores[level] += score;
    }
    if (option.finding) findings.push(option.finding);
  }

  const zoneRisk = getZoneRisk({ selectedName, segment, group });
  scores.mediu += zoneRisk.mediumBoost;
  scores.consultare_doctor += zoneRisk.doctorBoost;
  if (zoneRisk.finding) findings.push(zoneRisk.finding);

  const intensity = answers.intensitate;
  const signs = answers.semne;
  const debut = answers.debut;
  const duration = answers.durata;
  const functionLevel = answers.functie;

  if (zoneRisk.level === "high" && intensity === 1) {
    scores.consultare_doctor += 4;
    findings.push("durere moderată într-o zonă sensibilă");
  }

  if (zoneRisk.level === "high" && [1, 2].includes(signs ?? -1)) {
    scores.consultare_doctor += signs === 2 ? 4 : 2;
    findings.push("semne asociate într-o zonă sensibilă");
  }

  if (zoneRisk.level === "high" && ([1, 2].includes(debut ?? -1) || [1, 2].includes(duration ?? -1))) {
    scores.consultare_doctor += 2;
  }

  if (zoneRisk.level !== "low" && functionLevel === 2) {
    scores.consultare_doctor += 2;
  }

  const level = pickLevel(scores);
  const knowledge = getKnowledgeFor(tissueType);
  const details = painLevels[level];

  return {
    nivel: level,
    cauze: [...knowledge[level]].slice(0, 3),
    recomandare: buildRecommendation(level),
    explicatieNivel: `${details.label}: ${details.summary} Indicatori: ${findings.length ? findings.join(", ") : "simptome generale descrise"}.`,
    redFlags: findings.filter((finding) =>
      ["traumă", "pocnet", "alarmă", "imposibilitate", "pierdere", "severă"].some((word) => finding.includes(word)),
    ),
  };
}

function getZoneRisk({
  selectedName,
  segment,
  group,
}: {
  selectedName: string;
  segment?: string;
  group?: string;
}): {
  level: "low" | "medium" | "high";
  mediumBoost: number;
  doctorBoost: number;
  finding?: string;
} {
  const text = [selectedName, segment, group]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    ["cap", "craniu", "fata", "ceafa", "gat", "cervical", "coloana", "vertebr", "piept", "torace", "toracel", "stern", "coaste", "intercostal", "pectoral"].some((term) =>
      text.includes(term),
    )
  ) {
    return {
      level: "high",
      mediumBoost: 1,
      doctorBoost: 2,
      finding: "zonă sensibilă",
    };
  }

  if (["abdomen", "bazin", "pelvis", "sold", "umar"].some((term) => text.includes(term))) {
    return {
      level: "medium",
      mediumBoost: 1,
      doctorBoost: 0,
      finding: "zonă cu atenție moderată",
    };
  }

  return { level: "low", mediumBoost: 0, doctorBoost: 0 };
}

export function validateAnswerConsistency(answers: Record<string, number>): SymptomValidation {
  const intensity = answers.intensitate;
  const functionLevel = answers.functie;
  const signs = answers.semne;

  if (intensity === 0 && functionLevel === 2) {
    return {
      ok: false,
      message:
        "Ai selectat durere ușoară, dar și că nu poți folosi zona. Aceste răspunsuri se contrazic. Dacă nu poți folosi zona, durerea/problema nu mai este ușoară.",
    };
  }

  if (intensity === 0 && signs === 2) {
    return {
      ok: false,
      message:
        "Ai selectat durere ușoară, dar și semne de alarmă precum deformare, febră, amorțeală sau slăbiciune. Revizuiește răspunsurile.",
    };
  }

  if (functionLevel === 2 && signs === 0) {
    return {
      ok: false,
      message:
        "Ai selectat că nu poți folosi zona, dar ai spus că nu există semne asociate. Te rog clarifică: există slăbiciune, amorțeală, umflare, traumă sau durere severă?",
    };
  }

  return { ok: true };
}

function pickLevel(scores: Record<PainLevel, number>): PainLevel {
  if (scores.consultare_doctor >= 5 || scores.consultare_doctor >= scores.mediu + 2) {
    return "consultare_doctor";
  }
  if (scores.mediu >= 4 || scores.mediu >= scores.usor) {
    return "mediu";
  }
  return "usor";
}

function buildRecommendation(level: PainLevel): string {
  if (level === "consultare_doctor") {
    return "Este recomandată consultarea unui medic, mai ales dacă durerea este severă, a apărut după traumă, există deformare, amorțeală, slăbiciune sau nu poți folosi zona. Evită solicitarea până la evaluare.";
  }
  if (level === "mediu") {
    return "Redu efortul, monitorizează evoluția și evită mișcările care cresc durerea. Dacă simptomele persistă câteva zile, se agravează sau limitează activitatea, programează o consultație.";
  }
  return "Poți încerca repaus relativ, hidratare, revenire treptată la efort și observarea simptomelor. Dacă durerea persistă, crește sau apar semne noi, cere sfat medical.";
}
