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
const exerciseResults = {};

function startExam() {
  mode = 'exam';
  timeLeft = 120 * 60;
  numQuestions = Math.min(75, quiz.length);
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

  // If no questions are available (for flagged mode)
  if (!shuffledQuiz.length) {
    questionsDiv.innerHTML = "<p>Aucune question disponible.</p>";

    // Create a button that calls goBackToHome() when pressed.
    // It will not be visible on the home page because goBackToHome() resets the view.
    const homeButton = document.createElement("button");
    homeButton.textContent = "Retour à l'accueil";
    homeButton.onclick = () => {
      goBackToHome();
      // Optionally remove this button (it won’t be visible after goBackToHome() is executed)
      homeButton.remove();
    };
    questionsDiv.appendChild(homeButton);
    return;
  }

  if (currentQuestion >= numQuestions) {
    showFinalScore();
    return;
  }

  const q = shuffledQuiz[currentQuestion];
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
    answerButton.onclick = () => selectAnswer(currentQuestion, ansIndex, answerButton);
    answersDiv.appendChild(answerButton);
  });
  questionDiv.appendChild(answersDiv);

  if (mode === 'exercise' || mode === 'flagged') {
    const submitButton = document.createElement("button");
    submitButton.textContent = "Soumettre";

    const nextButton = document.createElement("button");
    nextButton.textContent = "Suivant";
    nextButton.style.display = "none";
    nextButton.onclick = nextQuestion;

    const endButton = document.createElement("button");
    endButton.textContent = "Terminer";
    endButton.onclick = resetQuiz;

    submitButton.onclick = function() {
      checkAnswer(currentQuestion);
      submitButton.style.display = "none";
      nextButton.style.display = "inline-block";
    };

    questionDiv.appendChild(submitButton);
    questionDiv.appendChild(nextButton);
    questionDiv.appendChild(endButton);
  }
  questionsDiv.appendChild(questionDiv);
}

function selectAnswer(questionIndex, answerIndex, button) {
  const q = shuffledQuiz[questionIndex];
  button.classList.toggle("selected");
}

function nextQuestion() {
  currentQuestion++;
  showQuestion();
}

function checkAnswer(questionIndex) {
  const q = shuffledQuiz[questionIndex];
  const questionDiv = document.querySelector("#questions .question:nth-child(1)");
  const buttons = questionDiv.querySelectorAll(".answer-button");
  let candidateSelected = [];
  buttons.forEach((button, index) => {
    if (button.classList.contains("selected")) {
      candidateSelected.push(index);
    }
  });
  buttons.forEach((button, index) => {
    if (q.correct.includes(index)) {
      button.classList.add("correct");
      if (button.classList.contains("selected")) {
        if (!button.querySelector(".check-mark")) {
          button.insertAdjacentHTML("afterbegin", "<span class='check-mark'>✔ </span>");
        }
        button.classList.remove("selected");
      }
    } else if (button.classList.contains("selected")) {
      button.classList.add("incorrect");
      button.classList.remove("selected");
    }
  });
  const missingCorrect = q.correct.filter(correctIndex => !candidateSelected.includes(correctIndex));
  if (q.correct.length > 1 && missingCorrect.length > 0) {
    const messageElem = document.createElement("p");
    messageElem.className = "missing-message";
    messageElem.textContent = "Attention il y a plusieurs bonnes réponses";
    questionDiv.appendChild(messageElem);
  }
  const correctSelected = candidateSelected.filter(ans => q.correct.includes(ans)).length;
  const incorrectSelected = candidateSelected.length - correctSelected;
  if (correctSelected === q.correct.length && incorrectSelected === 0) {
    score++;
  }
  document.getElementById("score").textContent = `Score: ${score}/${numQuestions}`;
}

function endExam() {
  clearInterval(timerInterval);
  const questionsDiv = document.getElementById("questions");
  const questionDivs = questionsDiv.querySelectorAll(".question");
  questionDivs.forEach((questionDiv, index) => {
    const q = quiz[index];
    const buttons = questionDiv.querySelectorAll(".answer-button");
    let candidateSelected = [];
    buttons.forEach((button, index) => {
      if (button.classList.contains("selected")) {
        candidateSelected.push(index);
      }
    });
    buttons.forEach((button, index) => {
      if (q.correct.includes(index)) {
        button.classList.add("correct");
        if (button.classList.contains("selected")) {
          if (!button.querySelector(".check-mark")) {
            button.insertAdjacentHTML("afterbegin", "<span class='check-mark'>✔ </span>");
          }
          button.classList.remove("selected");
        }
      } else if (button.classList.contains("selected")) {
        button.classList.add("incorrect");
        button.classList.remove("selected");
      }
    });
    const missingCorrect = q.correct.filter(idx => !candidateSelected.includes(idx));
    if (q.correct.length > 1 && missingCorrect.length > 0) {
      const messageElem = document.createElement("p");
      messageElem.className = "missing-message";
      messageElem.textContent = "Attention il y a plusieurs bonnes réponses";
      questionDiv.appendChild(messageElem);
    }
    if (mode === 'exam' && !markedQuestions.some(markedQ => markedQ.question === q.question)) {
      markedQuestions.push(q);
    }
  });
  localStorage.setItem('markedQuestions', JSON.stringify(markedQuestions));
  const percentage = (score / numQuestions) * 100;
  let feedbackMessage = '';
  if (percentage < 85) {
    feedbackMessage = "Retourne au fourgon ket";
    document.getElementById("feedback").classList.add("red");
    document.getElementById("feedback").classList.remove("green");
  } else {
    feedbackMessage = "Bravo champion tu es prêt!";
    document.getElementById("feedback").classList.add("green");
    document.getElementById("feedback").classList.remove("red");
  }
  document.getElementById("feedback").textContent = feedbackMessage;
  document.getElementById("feedback").classList.remove("hidden");
  document.getElementById("score").textContent = `Score final : ${score}/${numQuestions} (${percentage.toFixed(2)}%)`;
  examHistory.push(percentage);
  localStorage.setItem('examHistory', JSON.stringify(examHistory));
  displayHistory();
  document.getElementById("endButton").classList.add("hidden");
  if (!document.getElementById("game").querySelector("button#backButton")) {
    const backButton = document.createElement("button");
    backButton.textContent = "Retourner à l'accueil";
    backButton.id = "backButton";
    backButton.onclick = resetQuiz;
    document.getElementById("game").appendChild(backButton);
  }
}

function showFinalScore() {
  const percentage = (score / numQuestions) * 100;
  alert(`Vous avez terminé l'exercice avec un score de ${percentage.toFixed(2)}%`);
  const rangeKey = `${currentQuestion - numQuestions + 1}-${currentQuestion}`;
  exerciseResults[rangeKey] = percentage.toFixed(2);
  goBackToHome();
}

function resetQuiz() {
  currentQuestion = 0;
  score = 0;
  mode = '';
  numQuestions = 50;
  shuffledQuiz = [];
  document.getElementById("game").classList.add("hidden");
  document.querySelector(".quiz-container").classList.remove("hidden");
  document.getElementById("footer").style.display = "block";
  document.getElementById("timer").classList.add("hidden");
  document.getElementById("score").classList.add("hidden");
  document.getElementById("feedback").classList.add("hidden");
  const backButton = document.getElementById("game").querySelector("button#backButton");
  if (backButton) {
    backButton.remove();
  }
}

function showHistory() {
  document.querySelector(".quiz-container").classList.add("hidden");
  document.getElementById("historyPage").classList.remove("hidden");
  goBackToHomeFooter(false);
  displayHistory();
}

function displayHistory() {
  const historyContent = document.getElementById("historyContent");
  historyContent.innerHTML = "";
  if (examHistory.length === 0) {
    historyContent.textContent = "Aucun examen effectué.";
    return;
  }
  const historyList = document.createElement("ul");
  examHistory.forEach((score, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `Examen ${index + 1}: ${score.toFixed(2)}%`;
    historyList.appendChild(listItem);
  });
  historyContent.appendChild(historyList);
}

function goBackToHome() {
  document.getElementById("exerciseRangePage").classList.add("hidden");
  document.getElementById("historyPage").classList.add("hidden");
  document.querySelector(".quiz-container").classList.remove("hidden");
  document.getElementById("footer").style.display = "block";
}

function startTimer() {
  timerInterval = setInterval(function() {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endExam();
      return;
    }
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("timer").textContent = `Temps restant : ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, 1000);
}

function resetCache() {
  localStorage.removeItem('examHistory');
  localStorage.removeItem('markedQuestions');
  examHistory = [];
  markedQuestions = [];
  alert("Le cache a été réinitialisé.");
}
