let quiz = [];

// Load quiz questions from questions.json
fetch("questions.json")
  .then(response => response.json())
  .then(data => {
    quiz = data;
    initializeButtons(); // Initialize event listeners when quiz is loaded
  })
  .catch(error => {
    console.error("Error loading quiz questions:", error);
  });

let currentQuestion = 0;
let score = 0;
let mode = '';
let timerInterval;
let timeLeft;
let numQuestions = 75;
let shuffledQuiz = [];
let examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
let markedQuestions = JSON.parse(localStorage.getItem('markedQuestions')) || [];
const exerciseResults = JSON.parse(localStorage.getItem('exerciseResults')) || {};

function initializeButtons() {
  document.getElementById("startExamButton")?.addEventListener("click", startExam);
  document.getElementById("startExerciseButton")?.addEventListener("click", chooseExerciseRange);
  document.getElementById("showMarkedButton")?.addEventListener("click", showMarkedQuestions);
}

function startExam() {
  if (quiz.length === 0) {
    alert("Les questions ne sont pas encore chargées.");
    return;
  }
  mode = 'exam';
  timeLeft = 120 * 60;
  numQuestions = Math.min(75, quiz.length);
  shuffledQuiz = quiz.slice(0, numQuestions);
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

function startExerciseRange(start, end, rangeKey) {
  if (quiz.length === 0) {
    alert("Les questions ne sont pas encore chargées.");
    return;
  }
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
  if (markedQuestions.length === 0) {
    alert("Aucune question marquée.");
    return;
  }
  mode = 'flagged';
  shuffledQuiz = [...markedQuestions];
  currentQuestion = 0;
  numQuestions = markedQuestions.length;
  document.querySelector(".quiz-container").classList.add("hidden");
  document.getElementById("footer").style.display = "none";
  document.getElementById("game").classList.remove("hidden");
  showQuestion();
}

function showQuestion() {
  if (currentQuestion >= numQuestions) {
    showFinalScore();
    return;
  }

  const questionsDiv = document.getElementById("questions");
  questionsDiv.innerHTML = "";
  const q = shuffledQuiz[currentQuestion];
  const questionDiv = document.createElement("div");
  questionDiv.classList.add("question");

  const questionText = document.createElement("p");
  questionText.textContent = q.question;
  questionDiv.appendChild(questionText);

  const answersDiv = document.createElement("div");
  answersDiv.classList.add("answers");
  q.answers.forEach((ans, ansIndex) => {
    const answerButton = document.createElement("button");
    answerButton.textContent = ans;
    answerButton.classList.add("answer-button");
    answerButton.onclick = () => selectAnswer(currentQuestion, ansIndex, answerButton);
    answersDiv.appendChild(answerButton);
  });
  questionDiv.appendChild(answersDiv);

  const submitButton = document.createElement("button");
  submitButton.textContent = "Soumettre";
  submitButton.onclick = () => {
    checkAnswer();
    submitButton.style.display = "none";
    nextButton.style.display = "inline-block";
  };
  questionDiv.appendChild(submitButton);

  const nextButton = document.createElement("button");
  nextButton.textContent = "Suivant";
  nextButton.style.display = "none";
  nextButton.onclick = () => {
    currentQuestion++;
    showQuestion();
  };
  questionDiv.appendChild(nextButton);

  const endButton = document.createElement("button");
  endButton.textContent = "Terminer";
  endButton.onclick = showFinalScore;
  questionDiv.appendChild(endButton);

  const homeButton = document.createElement("button");
  homeButton.textContent = "Retour à l'accueil";
  homeButton.onclick = goBackToHome;
  questionDiv.appendChild(homeButton);

  questionsDiv.appendChild(questionDiv);
}

function goBackToHome() {
  document.getElementById("game").classList.add("hidden");
  document.querySelector(".quiz-container").classList.remove("hidden");
  document.getElementById("footer").style.display = "block";
}
