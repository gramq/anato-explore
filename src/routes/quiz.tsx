import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { bones } from "@/data/bones";
import { Brain, Check, RotateCcw, Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Test Rapid — InfoMed 3D" },
      {
        name: "description",
        content: "Testează-ți cunoștințele de anatomie cu întrebări mixte: alegere multiplă și identificare în 3D.",
      },
      { property: "og:title", content: "Test Rapid de Anatomie — InfoMed 3D" },
      { property: "og:description", content: "Quiz interactiv despre oasele corpului uman." },
    ],
  }),
  component: QuizPage,
});

interface Question {
  type: "mc" | "identify";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function buildQuestions(): Question[] {
  const find = (id: string) => bones.find((b) => b.id === id)!;
  return [
    {
      type: "mc",
      question: "Care este cel mai lung os din corpul uman?",
      options: ["Humerus", "Femur", "Tibia", "Stern"],
      correctIndex: 1,
      explanation: `${find("femur").name} (${find("femur").latin}) este cel mai lung și puternic os din corp, susținând greutatea corpului în mers.`,
    },
    {
      type: "identify",
      question: "Identifică osul: „Os în formă de fluture, articulat cu toate celelalte oase craniene.”",
      options: ["Os etmoid", "Os sfenoid", "Os occipital", "Os temporal"],
      correctIndex: 1,
      explanation: "Sfenoidul este central în craniu și conține șaua turcească pentru hipofiză.",
    },
    {
      type: "mc",
      question: "Câte vertebre cervicale are coloana?",
      options: ["5", "7", "12", "33"],
      correctIndex: 1,
      explanation: "Toți mamiferele (cu rare excepții) au 7 vertebre cervicale, indiferent de lungimea gâtului.",
    },
    {
      type: "identify",
      question: "Care este cel mai mic os din corp?",
      options: ["Ciocanul", "Nicovala", "Scărița", "Os lacrimal"],
      correctIndex: 2,
      explanation: "Scărița (Stapes) măsoară doar ~3 mm și se află în urechea medie.",
    },
    {
      type: "mc",
      question: "Mandibula este…",
      options: [
        "Singurul os mobil al craniului",
        "Cel mai mare os al feței dar fix",
        "Format din două oase pereche",
        "Parte a centurii scapulare",
      ],
      correctIndex: 0,
      explanation: "Mandibula este singurul os mobil al craniului, esențial pentru masticație și vorbire.",
    },
    {
      type: "identify",
      question: "Câte oase formează coloana vertebrală adultă?",
      options: ["24", "26", "30", "33"],
      correctIndex: 1,
      explanation: "26 oase: 7 cervicale + 12 toracice + 5 lombare + sacrum + coccis (ultimele două fuzionate).",
    },
    {
      type: "mc",
      question: "Câte coaste are corpul uman?",
      options: ["10 perechi", "12 perechi", "14 perechi", "11 perechi"],
      correctIndex: 1,
      explanation: "12 perechi: 7 adevărate, 3 false și 2 flotante.",
    },
    {
      type: "identify",
      question: "Care os este situat lateral în antebraț, pe partea policelui?",
      options: ["Ulna", "Humerus", "Radius", "Carp"],
      correctIndex: 2,
      explanation: "Radiusul este lateral și permite rotația antebrațului (pronație/supinație).",
    },
  ];
}

function QuizPage() {
  const questions = useMemo(buildQuestions, []);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];

  const handlePick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  const reset = () => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  return (
    <div className="absolute inset-0 m-4 mt-2 rounded-3xl glass overflow-y-auto p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2 fade-up">
          <Brain className="size-5 text-primary" />
          <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold">
            Test rapid de anatomie
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight fade-up">
          Cât de bine cunoști <span className="text-gradient-bone">scheletul</span>?
        </h1>

        {!done ? (
          <>
            {/* Progress */}
            <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>
                Întrebarea {idx + 1} / {questions.length}
              </span>
              <span className="text-primary font-semibold">
                Scor: {score}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-bone-glow transition-all duration-500"
                style={{ width: `${((idx + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question card */}
            <div key={idx} className="mt-8 glass-strong rounded-3xl p-7 fade-up">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`text-[10px] tracking-[0.18em] uppercase font-bold rounded-full px-2.5 py-1 ${
                    q.type === "mc"
                      ? "bg-accent/15 text-accent border border-accent/25"
                      : "bg-medical/15 text-medical border border-medical/25"
                  }`}
                >
                  {q.type === "mc" ? "Alegere multiplă" : "Identificare"}
                </span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight leading-snug">{q.question}</h2>

              <div className="mt-6 grid gap-3">
                {q.options.map((opt, i) => {
                  const isPicked = picked === i;
                  const isCorrect = i === q.correctIndex;
                  const showAnswer = picked !== null;
                  return (
                    <button
                      key={i}
                      onClick={() => handlePick(i)}
                      disabled={picked !== null}
                      className={`group flex items-center gap-3 text-left rounded-2xl px-5 py-4 border transition-all duration-300 ${
                        showAnswer
                          ? isCorrect
                            ? "bg-success/15 border-success/40"
                            : isPicked
                              ? "bg-destructive/15 border-destructive/40"
                              : "bg-primary/[0.03] border-primary/10 opacity-60"
                          : "bg-primary/[0.04] border-primary/12 hover:bg-primary/[0.08] hover:border-primary/25 spring-hover"
                      }`}
                    >
                      <span
                        className={`size-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border ${
                          showAnswer && isCorrect
                            ? "bg-success text-white border-transparent"
                            : showAnswer && isPicked
                              ? "bg-destructive text-destructive-foreground border-transparent"
                              : "border-primary/25 text-muted-foreground"
                        }`}
                      >
                        {showAnswer && isCorrect ? (
                          <Check className="size-4" />
                        ) : showAnswer && isPicked ? (
                          <X className="size-4" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      <span className="text-sm font-medium tracking-tight">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <div className="mt-6 rounded-2xl bg-primary/10 border border-primary/20 p-4 fade-up">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-[10px] tracking-[0.22em] uppercase text-primary font-bold">
                      Explicație
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{q.explanation}</p>

                  <button
                    onClick={next}
                    className="mt-4 w-full rounded-2xl bg-primary text-primary-foreground font-semibold py-3 text-sm tracking-tight spring-hover"
                  >
                    {idx + 1 >= questions.length ? "Vezi rezultatul" : "Următoarea întrebare →"}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-10 glass-strong rounded-3xl p-10 text-center fade-up">
            <div className="size-16 mx-auto rounded-3xl bg-gradient-to-br from-primary to-bone-glow flex items-center justify-center mb-5 shadow-[var(--shadow-glow)]">
              <Sparkles className="size-7 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Test încheiat!</h2>
            <p className="mt-2 text-muted-foreground">
              Ai răspuns corect la <span className="text-primary font-bold">{score}</span> din{" "}
              <span className="text-foreground font-bold">{questions.length}</span> întrebări.
            </p>
            <div className="mt-6 text-5xl font-bold text-gradient-bone">
              {Math.round((score / questions.length) * 100)}%
            </div>
            <button
              onClick={reset}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground font-semibold px-6 py-3 text-sm spring-hover"
            >
              <RotateCcw className="size-4" /> Reia testul
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
