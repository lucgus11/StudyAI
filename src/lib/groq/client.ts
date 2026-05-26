/**
 * STUDYAI – Groq AI Client
 *
 * All calls to Groq (Llama-3-70b-8192) are centralised here.
 * Each function is a server-side utility (called from Route Handlers or
 * Server Actions), never exposed to the browser.
 */

import Groq from "groq-sdk";
import type {
  GlossaryTerm,
  Flashcard,
  QuizQuestion,
  ExamQuestion,
  StudyDay,
  PlannerFormData,
} from "@/types";

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return _groq;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function chat(systemPrompt: string, userMessage: string, maxTokens = 4096): Promise<string> {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: maxTokens,
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  return completion.choices[0].message.content ?? "";
}

function parseJSON<T>(raw: string): T {
  // Strip possible markdown code fences
  const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean) as T;
}

// ---------------------------------------------------------------------------
// 1. GRAND ÉCRAN – Summary, Glossary, Key Concepts
// ---------------------------------------------------------------------------

export interface CourseAnalysis {
  summary: string;
  glossary: GlossaryTerm[];
  key_concepts: string[];
}

export async function generateCourseAnalysis(extractedText: string): Promise<CourseAnalysis> {
  const system = `Tu es un tuteur expert en pédagogie. Tu analyses des cours universitaires
et tu produis des ressources d'apprentissage structurées, claires et précises.
Réponds UNIQUEMENT en JSON valide, sans balises markdown.`;

  const user = `Voici le contenu extrait d'un cours :
---
${extractedText.slice(0, 12000)}
---

Génère un objet JSON avec exactement cette structure :
{
  "summary": "Résumé structuré du cours en 4-6 paragraphes HTML (utilise <h3>, <p>, <ul>, <li>)",
  "glossary": [
    { "term": "Terme", "definition": "Définition claire et concise" }
  ],
  "key_concepts": ["Concept 1", "Concept 2", ...]
}

Le glossaire doit contenir au moins 10 termes importants.
Les key_concepts doivent contenir 6 à 12 éléments essentiels.`;

  const raw = await chat(system, user, 6000);
  return parseJSON<CourseAnalysis>(raw);
}

// ---------------------------------------------------------------------------
// 2. MICRO-LEARNING – Flashcards
// ---------------------------------------------------------------------------

export async function generateFlashcards(extractedText: string, count = 20): Promise<Flashcard[]> {
  const system = `Tu es un expert en apprentissage actif et en mémorisation par répétition espacée.
Tu crées des flashcards pédagogiques efficaces.
Réponds UNIQUEMENT en JSON valide (tableau), sans balises markdown.`;

  const user = `Voici le contenu d'un cours :
---
${extractedText.slice(0, 10000)}
---

Génère exactement ${count} flashcards au format JSON :
[
  {
    "id": "fc_1",
    "front": "Question ou terme au recto",
    "back": "Réponse ou définition au verso",
    "difficulty": "easy|medium|hard"
  }
]

Les flashcards doivent couvrir les notions clés, définitions, formules, et concepts importants.
Varie les types (définitions, exemples, applications, comparaisons).`;

  const raw = await chat(system, user, 5000);
  return parseJSON<Flashcard[]>(raw);
}

// ---------------------------------------------------------------------------
// 3. MICRO-LEARNING – Quiz (MCQ / True-False)
// ---------------------------------------------------------------------------

export async function generateQuiz(extractedText: string, count = 10): Promise<QuizQuestion[]> {
  const system = `Tu es un enseignant expert qui crée des évaluations formatives.
Tu génères des QCM et questions Vrai/Faux pédagogiques.
Réponds UNIQUEMENT en JSON valide (tableau), sans balises markdown.`;

  const user = `Voici le contenu d'un cours :
---
${extractedText.slice(0, 10000)}
---

Génère ${count} questions au format JSON :
[
  {
    "id": "q_1",
    "question": "Texte de la question",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Explication courte de la bonne réponse"
  },
  {
    "id": "q_2",
    "question": "Affirmation à évaluer",
    "type": "true_false",
    "options": ["Vrai", "Faux"],
    "correct_answer": "Vrai",
    "explanation": "Explication courte"
  }
]

Mélange les types : 60% MCQ, 40% Vrai/Faux.
Assure-toi que les questions couvrent différentes parties du cours.`;

  const raw = await chat(system, user, 4000);
  return parseJSON<QuizQuestion[]>(raw);
}

// ---------------------------------------------------------------------------
// 4. CRASH TEST – Exam blanc
// ---------------------------------------------------------------------------

export async function generateExam(extractedText: string, durationMinutes = 60): Promise<ExamQuestion[]> {
  const questionsCount = Math.floor(durationMinutes / 6);
  const system = `Tu es un professeur universitaire expérimenté qui crée des examens équilibrés
et représentatifs du cours.
Réponds UNIQUEMENT en JSON valide (tableau), sans balises markdown.`;

  const user = `Voici le contenu d'un cours :
---
${extractedText.slice(0, 12000)}
---

Génère un examen blanc de ${durationMinutes} minutes avec ${questionsCount} questions.
Format JSON :
[
  {
    "id": "ex_1",
    "question": "Texte de la question",
    "type": "mcq|true_false|open",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "Réponse attendue",
    "points": 2,
    "explanation": "Correction détaillée"
  }
]

Répartition suggérée : 40% MCQ, 20% Vrai/Faux, 40% questions ouvertes.
Total des points : 20.
Les questions ouvertes (type "open") n'ont pas de "options".`;

  const raw = await chat(system, user, 6000);
  return parseJSON<ExamQuestion[]>(raw);
}

// ---------------------------------------------------------------------------
// 5. CRASH TEST – Corrigé et feedback IA
// ---------------------------------------------------------------------------

export interface ExamFeedback {
  score: number;
  total: number;
  percentage: number;
  globalFeedback: string;
  questionFeedbacks: { id: string; correct: boolean; feedback: string }[];
}

export async function gradeExam(
  questions: ExamQuestion[],
  answers: Record<string, string>
): Promise<ExamFeedback> {
  const system = `Tu es un correcteur bienveillant et pédagogue. Tu corriges des examens blancs
et tu fournis un retour constructif et motivant.
Réponds UNIQUEMENT en JSON valide, sans balises markdown.`;

  const qa = questions.map((q) => ({
    id: q.id,
    question: q.question,
    correct_answer: q.correct_answer,
    student_answer: answers[q.id] ?? "(sans réponse)",
    points: q.points,
    type: q.type,
  }));

  const user = `Voici les questions et les réponses de l'étudiant :
${JSON.stringify(qa, null, 2)}

Corrige l'examen et génère un objet JSON :
{
  "score": nombre_points_obtenus,
  "total": nombre_points_total,
  "percentage": pourcentage,
  "globalFeedback": "Feedback global motivant et constructif (3-4 phrases HTML avec <p>)",
  "questionFeedbacks": [
    {
      "id": "ex_1",
      "correct": true|false,
      "feedback": "Explication courte de la correction"
    }
  ]
}`;

  const raw = await chat(system, user, 3000);
  return parseJSON<ExamFeedback>(raw);
}

// ---------------------------------------------------------------------------
// 6. PLANIFICATEUR – Calendrier d'étude
// ---------------------------------------------------------------------------

export async function generateStudyPlan(data: PlannerFormData): Promise<StudyDay[]> {
  const system = `Tu es un expert en planification d'études et en optimisation cognitive.
Tu crées des plans de révision personnalisés, réalistes et efficaces.
Réponds UNIQUEMENT en JSON valide (tableau de jours), sans balises markdown.`;

  const examsInfo = data.exams
    .map((e) => `${e.subject} – ${e.date} (importance: ${e.importance})`)
    .join("\n");

  const today = new Date().toISOString().split("T")[0];
  const user = `Contexte :
- Date du jour : ${today}
- Examens à venir :
${examsInfo}
- Semaines de révision disponibles : ${data.weeksBeforeStart}
- Heures par jour : ${data.dailyHours}
- Jours de repos : ${data.restDays.join(", ")}

Génère un planning de révision complet du ${today} jusqu'à l'avant-veille du premier examen.
Format JSON (tableau de jours) :
[
  {
    "date": "YYYY-MM-DD",
    "isRestDay": false,
    "sessions": [
      {
        "subject": "Matière",
        "duration": 90,
        "topics": ["Thème 1", "Thème 2"],
        "priority": "high|medium|low"
      }
    ]
  }
]

Règles :
- Les jours de repos ont "isRestDay": true et "sessions": []
- Alloue plus de temps aux matières à haute importance et dont l'examen est proche
- Évite de réviser la même matière plus de 3h d'affilée
- Intègre des révisions espacées (revoir une matière 2-3 fois à intervalles croissants)
- Respecte strictement les heures quotidiennes (${data.dailyHours}h max par jour actif)`;

  const raw = await chat(system, user, 8192);
  return parseJSON<StudyDay[]>(raw);
}
