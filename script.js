let quiz = [];

// Charger les questions depuis questions.json
fetch("questions.json")
  .then(response => response.json())
  .then(data => {
    quiz = data;
  })
  .catch(error => {
    console.error("Error loading quiz questions:", error);
  });

let currentQuestion = 0;
let score = 0;
let mode = '';
let timerInterval;
let timeLeft;
let numQuestions = 50;
let shuffledQuiz = [];
let examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
let markedQuestions = JSON.parse(localStorage.getItem('markedQuestions')) || [];
const exerciseResults = {};

function startExam() {
  mode = 'exam';
  timeLeft = 120 * 60;
  numQuestions = Math.min(50, quiz.length);
  document.querySelector(".quiz-container").classList.add("hidden");
  document.getElementById("footer").style.display = "none";
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("timer").classList.remove("hidden");
  document.getElementById("score").classList.remove("hidden");
  currentQuestion = 0;
  score = 0;
  showQuestions();
  startTimer();
}

function chooseExerciseRange() {
  document.querySelector(".quiz-container").classList.add("hidden");
  document.getElementById("footer").style.display = "none";
  document.getElementById("exerciseRangePage").classList.remove("hidden");
  const exerciseRangeOptions = document.getElementById("exerciseRangeOptions");
  exerciseRangeOptions.innerHTML = '';
  for (let i = 0; i < quiz.length; i += 30) {
    const start = i + 1;
    const end = Math.min(i + 30, quiz.length);
    const rangeButton = document.createElement("button");
    rangeButton.textContent = `${start} à ${end} (${exerciseResults[`${start}-${end}`] || 0}%)`;
    rangeButton.onclick = () => startExerciseRange(start - 1, end);
    exerciseRangeOptions.appendChild(rangeButton);
  }
}

function startExerciseRange(start, end) {
  mode = 'exercise';
  numQuestions = end - start;
  shuffledQuiz = quiz.slice(start, end);
  shuffledQuiz.sort(() => Math.random() - 0.5);
  document.getElementById("exerciseRangePage").classList.add("hidden");
  document.getElementById("footer").style.display = "none";
  document.getElementById("game").classList.remove("hidden");
  currentQuestion = 0;
  score = 0;
  document.getElementById("timer").classList.add("hidden");
  document.getElementById("score").classList.add("hidden");
  document.getElementById("feedback").classList.add("hidden");
  showQuestion();
}

function showMarkedQuestions() {
  shuffledQuiz = markedQuestions;
  mode = 'flagged';
  currentQuestion = 0;
  numQuestions = markedQuestions.length;
  document.querySelector(".quiz-container").classList.add("hidden");
  document.getElementById("footer").style.display = "none";
  document.getElementById("game").classList.remove("hidden");
  showQuestion();
}

function markQuestion(question) {
  const index = markedQuestions.findIndex(q => q.question === question.question);
  if (index === -1) {
    markedQuestions.push(question);
  } else {
    markedQuestions.splice(index, 1);
  }
  localStorage.setItem('markedQuestions', JSON.stringify(markedQuestions));
  const flagButton = document.querySelector(`.flag-button[data-question="${question.question}"]`);
  if (flagButton) {
    const isMarked = markedQuestions.some(markedQ => markedQ.question === question.question);
    flagButton.classList.toggle("red", isMarked);
    flagButton.textContent = "⚑";
  }
}

function showQuestions() {
  const questionsDiv = document.getElementById("questions");
  questionsDiv.innerHTML = "";
  const quizToShow = mode === 'exam' ? quiz.slice(0, numQuestions) : shuffledQuiz;
  quizToShow.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");
    const flagAndQuestion = document.createElement("div");
    flagAndQuestion.classList.add("flag-and-question");
    const flagButton = document.createElement("button");
    flagButton.classList.add("flag-button");
    flagButton.setAttribute("data-question", q.question);
    const isMarked = markedQuestions.some(markedQ => markedQ.question === q.question);
    flagButton.classList.toggle("red", isMarked);
    flagButton.textContent = "⚑";
    flagButton.onclick = () => markQuestion(q);
    flagAndQuestion.appendChild(flagButton);
    const questionText = document.createElement("p");
    questionText.textContent = q.question;
    flagAndQuestion.appendChild(questionText);
    questionDiv.appendChild(flagAndQuestion);
    const answersDiv = document.createElement("div");
    answersDiv.classList.add("answers");
    q.answers.forEach((ans, ansIndex) => {
      const answerButton = document.createElement("button");
      answerButton.textContent = ans;
      answerButton.classList.add("answer-button");
      answerButton.onclick = () => selectAnswer(index, ansIndex, answerButton);
      answersDiv.appendChild(answerButton);
    });
    questionDiv.appendChild(answersDiv);
    if (mode === 'exam') {
      document.getElementById("endButton").classList.remove("hidden");
    }
    questionsDiv.appendChild(questionDiv);
  });
  document.getElementById("feedback").textContent = "";
  document.getElementById("score").textContent = `Score: ${score}/${numQuestions}`;
}

function showQuestion() {
  const questionsDiv = document.getElementById("questions");
  questionsDiv.innerHTML = "";
  
  // Si le tableau des questions est vide, afficher le message et le bouton
  if (!shuffledQuiz.length) {
    questionsDiv.innerHTML = "<p>Aucune question disponible.</p>";
    const backButton = document.createElement("button");
    backButton.textContent = "
