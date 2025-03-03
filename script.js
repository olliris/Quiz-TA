let quiz = [];

// Load quiz questions from questions.json
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
let numQuestions = 75;
let shuffledQuiz = [];
let examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
let markedQuestions = JSON.parse(localStorage.getItem('markedQuestions')) || [];
const exerciseResults = JSON.parse(localStorage.getItem('exerciseResults')) || {};

function startExam() {
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

function chooseExerciseRange() {
  document.querySelector(".quiz-container").classList.add("hidden");
  document.getElementById("footer").style.display = "none";
  document.getElementById("exerciseRangePage").classList.remove("hidden");
  const exerciseRangeOptions = document.getElementById("exerciseRangeOptions");
  exerciseRangeOptions.innerHTML = '';

  for (let i = 0; i < quiz.length - 100; i += 30) {
    let start = i + 1;
    let end = Math.min(i + 30, quiz.length - 100);
    let rangeKey = `${start}-${end}`;
    
    const rangeButton = document.createElement("button");
    rangeButton.textContent = `${rangeKey} (${exerciseResults[rangeKey] || 0}%)`;
    rangeButton.onclick = () => startExerciseRange(start - 1, end, rangeKey);
    exerciseRangeOptions.appendChild(rangeButton);
  }

  // Add Elsevier groups
  const elsevier1Key = "Elsevier 1-50";
  const elsevier2Key = "Elsevier 51-100";

  const elsevier1Button = document.createElement("button");
  elsevier1Button.textContent = `${elsevier1Key} (${exerciseResults[elsevier1Key] || 0}%)`;
  elsevier1Button.onclick = () => startExerciseRange(quiz.length - 100, quiz.length - 50, elsevier1Key);
  exerciseRangeOptions.appendChild(elsevier1Button);

  const elsevier2Button = document.createElement("button");
  elsevier2Button.textContent = `${elsevier2Key} (${exerciseResults[elsevier2Key] || 0}%)`;
  elsevier2Button.onclick = () => startExerciseRange(quiz.length - 50, quiz.length, elsevier2Key);
  exerciseRangeOptions.appendChild(elsevier2Button);
}

function startExerciseRange(start, end, rangeKey) {
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
  showQuestions();
}

function showQuestions() {
  const questionsDiv = document.getElementById("questions");
  questionsDiv.innerHTML = "";
  
  shuffledQuiz.forEach((q, index) => {
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
      answerButton.onclick = () => selectAnswer(index, ansIndex, answerButton);
      answersDiv.appendChild(answerButton);
    });
    questionDiv.appendChild(answersDiv);
    questionsDiv.appendChild(questionDiv);
  });
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
  showQuestions();
}

function showFinalScore(rangeKey) {
  const percentage = (score / numQuestions) * 100;
  alert(`Vous avez terminé l'exercice avec un score de ${percentage.toFixed(2)}%`);
  exerciseResults[rangeKey] = percentage.toFixed(2);
  localStorage.setItem('exerciseResults', JSON.stringify(exerciseResults));
  goBackToHome();
}
