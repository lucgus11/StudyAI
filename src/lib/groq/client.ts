/**
 * STUDYAI – Groq AI Client
 * Modèle : llama-3.3-70b-versatile
 */

import Groq from "groq-sdk";
import type {
  GlossaryTerm, Flashcard, QuizQuestion, ExamQuestion, StudyDay, PlannerFormData,
} from "@/types";

let _groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  return _groq;
}

async function chat(systemPrompt: string, userMessage: string, maxTokens = 4096): Promise<string> {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: maxTokens,
    temperature: 0.3,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  return completion.choices[0].message.content ?? "";
}

function parseJSON<T>(raw: string): T {
  // Supprimer les balises markdown
  let clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // Extraire uniquement le bloc JSON entre { } ou [ ]
  const jsonStart = clean.search(/[{[]/);
  const jsonEnd = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  if (jsonStart !== -1 && jsonEnd !== -1) {
    clean = clean.slice(jsonStart, jsonEnd + 1);
  }

  // Nettoyer les caractères de contrôle invalides
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");

  try {
    return JSON.parse(clean) as T;
  } catch {
    // Réparer les sauts de ligne non échappés dans les strings JSON
    const repaired = clean.replace(/("(?:[^"\\]|\\.)*")/g, (match) =>
      match.replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\r/g, "")
    );
    return JSON.parse(repaired) as T;
  }
}

// ---------------------------------------------------------------------------
// HELPER : construire le contexte selon si on a du vrai texte ou non
// ---------------------------------------------------------------------------

function buildContext(extractedText: string, title: string, subject: string): string {
  const isRealContent = extractedText.length > 200 &&
    !extractedText.startsWith("MATIÈRE :") &&
    !extractedText.startsWith("Cours intitulé");

  if (isRealContent) {
    return extractedText.slice(0, 12000);
  }

  // Pas de vrai contenu : on demande à l'IA d'utiliser ses connaissances
  // sur ce sujet académique précis
  return `[AUCUN PDF FOURNI]
Utilise tes connaissances académiques sur le sujet suivant :
- Matière : ${subject}
- Titre du cours : ${title}

Génère un contenu académique RÉEL et PRÉCIS sur "${title}" en "${subject}",
comme si tu étais un professeur spécialiste de cette discipline.
Inclus les concepts fondamentaux, les théories principales et les notions clés
propres à CE sujet. Ne parle JAMAIS de pédagogie, d'apprentissage ou de méthodes d'enseignement.`;
}

// ---------------------------------------------------------------------------
// 1. Résumé, Glossaire, Concepts clés
// ---------------------------------------------------------------------------

export interface CourseAnalysis {
  summary: string;
  glossary: GlossaryTerm[];
  key_concepts: string[];
}

export async function generateCourseAnalysis(
  extractedText: string,
  title = "",
  subject = ""
): Promise<CourseAnalysis> {
  const context = buildContext(extractedText, title, subject);
  const hasPDF = !context.startsWith("[AUCUN PDF FOURNI]");

  const system = `Tu es un professeur universitaire expert en "${subject || "la matière demandée"}".
Tu dois produire un résumé académique rigoureux sur "${title || subject}".
RÈGLE ABSOLUE : ton contenu doit porter EXCLUSIVEMENT sur le sujet académique "${title || subject}".
Ne mentionne JAMAIS la pédagogie, l'apprentissage, les méthodes d'enseignement ou l'évaluation.
Réponds UNIQUEMENT en JSON valide, sans balises markdown.`;

  const user = hasPDF
    ? `Voici le contenu extrait du cours "${title}" (${subject}) :
---
${context}
---
Génère un objet JSON avec cette structure EXACTE :
{
  "summary": "Résumé structuré en HTML (utilise <h3>, <p>, <ul>, <li>, <strong>) sur le CONTENU ACADÉMIQUE du cours",
  "glossary": [{ "term": "Terme technique du cours", "definition": "Définition précise" }],
  "key_concepts": ["Concept clé 1", "Concept clé 2", ...]
}
Le résumé doit avoir 4-6 sections avec des <h3> portant sur les THÈMES DU COURS (ex: <h3>Le cycle de l'eau</h3>).
Le glossaire doit contenir au moins 8 termes techniques du cours.`
    : `En tant que professeur expert en "${subject}", génère un cours complet sur "${title}".
Réponds avec ce JSON EXACT :
{
  "summary": "Cours académique complet en HTML sur <strong>${title}</strong> avec des <h3> pour chaque grande section du contenu (ex: définitions, théories, exemples concrets, enjeux actuels)",
  "glossary": [{ "term": "Terme technique propre à ${subject}", "definition": "Définition académique précise" }],
  "key_concepts": ["Concept fondamental 1", "Concept fondamental 2", ...]
}
IMPORTANT : les <h3> doivent parler du CONTENU de "${title}", pas de méthodes d'apprentissage.
Minimum 8 termes dans le glossaire, minimum 6 concepts clés.`;

  const raw = await chat(system, user, 6000);
  return parseJSON<CourseAnalysis>(raw);
}

// ---------------------------------------------------------------------------
// 2. Flashcards
// ---------------------------------------------------------------------------

export async function generateFlashcards(
  extractedText: string,
  count = 20,
  title = "",
  subject = ""
): Promise<Flashcard[]> {
  const context = buildContext(extractedText, title, subject);
  const hasPDF = !context.startsWith("[AUCUN PDF FOURNI]");

  const system = `Tu es un professeur expert en "${subject || "la matière demandée"}".
Tu crées des flashcards sur le contenu académique de "${title || subject}".
Chaque flashcard doit tester une notion RÉELLE de ce sujet.
Réponds UNIQUEMENT en JSON valide (tableau), sans balises markdown.`;

  const user = hasPDF
    ? `Voici le contenu du cours "${title}" (${subject}) :
---
${context.slice(0, 10000)}
---
Génère exactement ${count} flashcards basées sur CE contenu :
[{ "id": "fc_1", "front": "Question sur une notion du cours", "back": "Réponse précise", "difficulty": "easy|medium|hard" }]`
    : `En tant que professeur expert en "${subject}", génère ${count} flashcards sur "${title}".
Les flashcards doivent couvrir les notions fondamentales de "${title}" en "${subject}".
Format JSON : [{ "id": "fc_1", "front": "Question académique précise sur ${title}", "back": "Réponse académique précise", "difficulty": "easy|medium|hard" }]
Les questions doivent porter sur des FAITS, DÉFINITIONS, THÉORIES propres à "${title}".`;

  const raw = await chat(system, user, 5000);
  return parseJSON<Flashcard[]>(raw);
}

// ---------------------------------------------------------------------------
// 3. Quiz
// ---------------------------------------------------------------------------

export async function generateQuiz(
  extractedText: string,
  count = 10,
  title = "",
  subject = ""
): Promise<QuizQuestion[]> {
  const context = buildContext(extractedText, title, subject);
  const hasPDF = !context.startsWith("[AUCUN PDF FOURNI]");

  const system = `Tu es un professeur expert en "${subject || "la matière demandée"}".
Tu crées des questions d'examen sur "${title || subject}".
Les questions portent STRICTEMENT sur le contenu académique de ce cours.
Réponds UNIQUEMENT en JSON valide (tableau), sans balises markdown.`;

  const user = hasPDF
    ? `Contenu du cours "${title}" (${subject}) :
---
${context.slice(0, 10000)}
---
Génère ${count} questions basées sur CE contenu :
[{ "id": "q_1", "question": "...", "type": "mcq", "options": ["A","B","C","D"], "correct_answer": "A", "explanation": "..." }]
Mélange : 60% mcq, 40% true_false.`
    : `En tant que professeur en "${subject}", génère ${count} questions d'examen sur "${title}".
Format JSON : [{ "id": "q_1", "question": "Question précise sur ${title}", "type": "mcq|true_false", "options": ["A","B","C","D"], "correct_answer": "...", "explanation": "Explication académique" }]
Les questions doivent tester des CONNAISSANCES RÉELLES sur "${title}" en "${subject}".`;

  const raw = await chat(system, user, 4000);
  return parseJSON<QuizQuestion[]>(raw);
}

// ---------------------------------------------------------------------------
// 4. Examen blanc
// ---------------------------------------------------------------------------

export async function generateExam(extractedText: string, durationMinutes = 60): Promise<ExamQuestion[]> {
  const questionsCount = Math.floor(durationMinutes / 6);

  const system = `Tu es un professeur universitaire qui crée des examens rigoureux.
Réponds UNIQUEMENT en JSON valide (tableau), sans balises markdown.`;

  const user = `Contenu du cours :
---
${extractedText.slice(0, 12000)}
---
Génère un examen de ${durationMinutes} minutes avec ${questionsCount} questions :
[{ "id": "ex_1", "question": "...", "type": "mcq|true_false|open", "options": ["A","B","C","D"], "correct_answer": "...", "points": 2, "explanation": "..." }]
Répartition : 40% mcq, 20% true_false, 40% open. Total : 20 points.`;

  const raw = await chat(system, user, 6000);
  return parseJSON<ExamQuestion[]>(raw);
}

// ---------------------------------------------------------------------------
// 5. Correction examen
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
  const system = `Tu es un correcteur bienveillant. Tu corriges des examens et fournis un retour constructif.
Réponds UNIQUEMENT en JSON valide, sans balises markdown.`;

  const qa = questions.map((q) => ({
    id: q.id, question: q.question, correct_answer: q.correct_answer,
    student_answer: answers[q.id] ?? "(sans réponse)", points: q.points, type: q.type,
  }));

  const user = `Questions et réponses de l'étudiant :
${JSON.stringify(qa, null, 2)}

Corrige et génère :
{
  "score": points_obtenus,
  "total": points_total,
  "percentage": pourcentage,
  "globalFeedback": "<p>Feedback global motivant</p>",
  "questionFeedbacks": [{ "id": "ex_1", "correct": true|false, "feedback": "Explication courte" }]
}`;

  const raw = await chat(system, user, 3000);
  return parseJSON<ExamFeedback>(raw);
}

// ---------------------------------------------------------------------------
// 6. Planning d'étude
// ---------------------------------------------------------------------------

export async function generateStudyPlan(data: PlannerFormData): Promise<StudyDay[]> {
  const system = `Tu es un expert en planification d'études. Tu crées des plans de révision personnalisés.
Réponds UNIQUEMENT en JSON valide (tableau de jours), sans balises markdown.`;

  const examsInfo = data.exams
    .map((e) => `${e.subject} – ${e.date} (importance: ${e.importance})`)
    .join("\n");

  const today = new Date().toISOString().split("T")[0];

  const user = `Contexte :
- Date du jour : ${today}
- Examens : ${examsInfo}
- Semaines disponibles : ${data.weeksBeforeStart}
- Heures/jour : ${data.dailyHours}
- Jours de repos : ${data.restDays.join(", ")}

Génère le planning du ${today} jusqu'à l'avant-veille du premier examen :
[{
  "date": "YYYY-MM-DD",
  "isRestDay": false,
  "sessions": [{ "subject": "Matière", "duration": 90, "topics": ["Thème 1"], "priority": "high|medium|low" }]
}]
Règles : repos = sessions vides, max ${data.dailyHours}h/jour actif, révisions espacées.`;

  const raw = await chat(system, user, 8192);
  return parseJSON<StudyDay[]>(raw);
}
