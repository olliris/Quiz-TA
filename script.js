let quiz = [];

fetch("questions.json")
  .then(response => response.json())
  .then(data => { quiz = data; })
  .catch(error => { console.error("Error loading quiz questions:", error); });

let currentQuestion = 0;
let score = 0;
let mode = '';
let timerInterval;
let timeLeft;
let numQuestions = 90;
let shuffledQuiz = [];
let examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
let markedQuestions = JSON.parse(localStorage.getItem('markedQuestions')) || [];
let exerciseResults = JSON.parse(localStorage.getItem('exerciseResults')) || {};
let currentRangeKey = '';

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
    const rangeKey = start + "-" + end;
    const rangeButton = document.createElement("button");
    const percentage = exerciseResults[rangeKey];
    if (percentage !== undefined) {
      rangeButton.textContent = start + " à " + end + " (" + percentage + "%)";
    } else {
      rangeButton.textContent = start + " à " + end;
    }
    rangeButton.onclick = (function(s, e) {
      return function() { startExerciseRange(s - 1, e); };
    })(start, end);
    exerciseRangeOptions.appendChild(rangeButton);
  }
}

function startExerciseRange(start, end) {
  mode = 'exercise';
  numQuestions = end - start;
  shuffledQuiz = quiz.slice(start, end);
  shuffledQuiz.sort(function() { return Math.random() - 0.5; });
  currentRangeKey = (start + 1) + "-" + end;
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
  const index = markedQuestions.findIndex(function(q) { return q.question === question.question; });
  if (index === -1) {
    markedQuestions.push(question);
  } else {
    markedQuestions.splice(index, 1);
  }
  localStorage.setItem('markedQuestions', JSON.stringify(markedQuestions));
  const flagButton = document.querySelector('.flag-button[data-question="' + question.question + '"]');
  if (flagButton) {
    const isMarked = markedQuestions.some(function(markedQ) { return markedQ.question === question.question; });
    flagButton.classList.toggle("red", isMarked);
    flagButton.textContent = "⚑";
  }
}

function showQuestions() {
  const questionsDiv = document.getElementById("questions");
  questionsDiv.innerHTML = "";
  const quizToShow = mode === 'exam' ? quiz.slice(0, numQuestions) : shuffledQuiz;
  quizToShow.forEach(function(q, index) {
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");

    const flagAndQuestion = document.createElement("div");
    flagAndQuestion.classList.add("flag-and-question");

    const flagButton = document.createElement("button");
    flagButton.classList.add("flag-button");
    flagButton.setAttribute("data-question", q.question);
    const isMarked = markedQuestions.some(function(markedQ) { return markedQ.question === q.question; });
    flagButton.classList.toggle("red", isMarked);
    flagButton.textContent = "⚑";
    flagButton.onclick = (function(question) {
      return function() { markQuestion(question); };
    })(q);
    flagAndQuestion.appendChild(flagButton);

    const questionText = document.createElement("p");
    questionText.innerHTML = q.question.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    flagAndQuestion.appendChild(questionText);
    questionDiv.appendChild(flagAndQuestion);

    const answersDiv = document.createElement("div");
    answersDiv.classList.add("answers");
    q.answers.forEach(function(ans, ansIndex) {
      const answerButton = document.createElement("button");
      answerButton.textContent = ans;
      answerButton.classList.add("answer-button");
      answerButton.onclick = (function(i, ai, btn) {
        return function() { selectAnswer(i, ai, btn); };
      })(index, ansIndex, answerButton);
      answersDiv.appendChild(answerButton);
    });
    questionDiv.appendChild(answersDiv);

    if (mode === 'exam') {
      document.getElementById("endButton").classList.remove("hidden");
    }
    questionsDiv.appendChild(questionDiv);
  });
  document.getElementById("feedback").textContent = "";
  document.getElementById("score").textContent = "Score: " + score + "/" + numQuestions;
}

function showQuestion() {
  const questionsDiv = document.getElementById("questions");
  questionsDiv.innerHTML = "";

  if (!shuffledQuiz.length) {
    questionsDiv.innerHTML = "<p>Aucune question disponible.</p>";
    const homeButton = document.createElement("button");
    homeButton.textContent = "Retour à l'accueil";
    homeButton.onclick = function() { goBackToHome(); homeButton.remove(); };
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
  const isMarked = markedQuestions.some(function(markedQ) { return markedQ.question === q.question; });
  flagButton.classList.toggle("red", isMarked);
  flagButton.textContent = "⚑";
  flagButton.onclick = (function(question) {
    return function() { markQuestion(question); };
  })(q);
  flagAndQuestion.appendChild(flagButton);

  const questionText = document.createElement("p");
  questionText.innerHTML = q.question.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
  flagAndQuestion.appendChild(questionText);
  questionDiv.appendChild(flagAndQuestion);

  const answersDiv = document.createElement("div");
  answersDiv.classList.add("answers");
  q.answers.forEach(function(ans, ansIndex) {
    const answerButton = document.createElement("button");
    answerButton.textContent = ans;
    answerButton.classList.add("answer-button");
    answerButton.onclick = (function(ai, btn) {
      return function() { selectAnswer(currentQuestion, ai, btn); };
    })(ansIndex, answerButton);
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
  buttons.forEach(function(button, index) {
    if (button.classList.contains("selected")) { candidateSelected.push(index); }
  });
  buttons.forEach(function(button, index) {
    if (q.correct.includes(index)) {
      button.classList.add("correct");
      if (button.classList.contains("selected")) {
        if (!button.querySelector(".check-mark")) {
          button.insertAdjacentHTML("afterbegin", "<span class='check-mark'>✓ </span>");
        }
        button.classList.remove("selected");
      }
    } else if (button.classList.contains("selected")) {
      button.classList.add("incorrect");
      button.classList.remove("selected");
    }
  });
  const missingCorrect = q.correct.filter(function(correctIndex) { return !candidateSelected.includes(correctIndex); });
  if (q.correct.length > 1 && missingCorrect.length > 0) {
    const messageElem = document.createElement("p");
    messageElem.className = "missing-message";
    messageElem.textContent = "Attention il y a plusieurs bonnes réponses";
    questionDiv.appendChild(messageElem);
  }
  const correctSelected = candidateSelected.filter(function(ans) { return q.correct.includes(ans); }).length;
  const incorrectSelected = candidateSelected.length - correctSelected;
  if (correctSelected === q.correct.length && incorrectSelected === 0) { score++; }
  document.getElementById("score").textContent = "Score: " + score + "/" + numQuestions;
}

function endExam() {
  clearInterval(timerInterval);
  const questionsDiv = document.getElementById("questions");
  const questionDivs = questionsDiv.querySelectorAll(".question");
  questionDivs.forEach(function(questionDiv, index) {
    const q = quiz[index];
    const buttons = questionDiv.querySelectorAll(".answer-button");
    let candidateSelected = [];
    buttons.forEach(function(button, i) {
      if (button.classList.contains("selected")) { candidateSelected.push(i); }
    });
    buttons.forEach(function(button, i) {
      if (q.correct.includes(i)) {
        button.classList.add("correct");
        if (button.classList.contains("selected")) {
          if (!button.querySelector(".check-mark")) {
            button.insertAdjacentHTML("afterbegin", "<span class='check-mark'>✓ </span>");
          }
          button.classList.remove("selected");
        }
      } else if (button.classList.contains("selected")) {
        button.classList.add("incorrect");
        button.classList.remove("selected");
      }
    });
    const missingCorrect = q.correct.filter(function(idx) { return !candidateSelected.includes(idx); });
    if (q.correct.length > 1 && missingCorrect.length > 0) {
      const messageElem = document.createElement("p");
      messageElem.className = "missing-message";
      messageElem.textContent = "Attention il y a plusieurs bonnes réponses";
      questionDiv.appendChild(messageElem);
    }
    if (mode === 'exam' && !markedQuestions.some(function(markedQ) { return markedQ.question === q.question; })) {
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
  document.getElementById("score").textContent = "Score final : " + score + "/" + numQuestions + " (" + percentage.toFixed(2) + "%)";
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
  alert("Vous avez terminé l'exercice avec un score de " + percentage.toFixed(2) + "%");
  if (mode === 'exercise' && currentRangeKey) {
    exerciseResults[currentRangeKey] = percentage.toFixed(2);
    localStorage.setItem('exerciseResults', JSON.stringify(exerciseResults));
  }
  goBackToHome();
}

function resetQuiz() {
  currentQuestion = 0;
  score = 0;
  mode = '';
  numQuestions = 50;
  shuffledQuiz = [];
  currentRangeKey = '';
  document.getElementById("game").classList.add("hidden");
  document.querySelector(".quiz-container").classList.remove("hidden");
  document.getElementById("footer").style.display = "block";
  document.getElementById("timer").classList.add("hidden");
  document.getElementById("score").classList.add("hidden");
  document.getElementById("feedback").classList.add("hidden");
  const backButton = document.getElementById("game").querySelector("button#backButton");
  if (backButton) { backButton.remove(); }
}

function showHistory() {
  document.querySelector(".quiz-container").classList.add("hidden");
  document.getElementById("footer").style.display = "none";
  document.getElementById("historyPage").classList.remove("hidden");
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
  examHistory.forEach(function(s, index) {
    const listItem = document.createElement("li");
    listItem.textContent = "Examen " + (index + 1) + ": " + s.toFixed(2) + "%";
    historyList.appendChild(listItem);
  });
  historyContent.appendChild(historyList);
}

function goBackToHome() {
  document.getElementById("exerciseRangePage").classList.add("hidden");
  document.getElementById("historyPage").classList.add("hidden");
  document.getElementById("flashcardsPage").classList.add("hidden");
  document.getElementById("flashcardDeckPage").classList.add("hidden");
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
    document.getElementById("timer").textContent = "Temps restant : " + minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }, 1000);
}

function resetCache() {
  localStorage.removeItem('examHistory');
  localStorage.removeItem('markedQuestions');
  localStorage.removeItem('exerciseResults');
  examHistory = [];
  markedQuestions = [];
  exerciseResults = {};
  alert("Le cache a été réinitialisé.");
  displayHistory();
  if (!document.getElementById("exerciseRangePage").classList.contains("hidden")) {
    chooseExerciseRange();
  }
}

// ─── FLASHCARDS ───────────────────────────────────────────────────────────────

var flashcardsData = null;

var flashcardDecks = [
  "Physiologie et Chimie",
  "La Cellule",
  "Les Tissus",
  "Système Cardio-vasculaire",
  "Système Lymphatique",
  "Système Respiratoire",
  "Système Nerveux",
  "Système Endocrinien",
  "Système Digestif",
  "Système Urinaire",
  "Système Reproducteur",
  "Système Locomoteur",
  "Les Sens",
  "Traumatologie"
];

function showFlashcards() {
  document.querySelector(".quiz-container").classList.add("hidden");
  document.getElementById("footer").style.display = "none";
  document.getElementById("flashcardsPage").classList.remove("hidden");

  // Charger flashcards.json si pas encore chargé
  if (flashcardsData === null) {
    fetch("flashcards.json")
      .then(function(response) { return response.json(); })
      .then(function(data) {
        flashcardsData = data;
        renderFlashcardFolders();
      })
      .catch(function(error) {
        console.error("Erreur chargement flashcards.json:", error);
        flashcardsData = {};
        renderFlashcardFolders();
      });
  } else {
    renderFlashcardFolders();
  }
}

function renderFlashcardFolders() {
  var container = document.getElementById("flashcardsFolders");
  container.innerHTML = "";

  for (var i = 0; i < flashcardDecks.length; i++) {
    var deckName = flashcardDecks[i];
    var cards = flashcardsData[deckName];
    var count = (cards && cards.length) ? cards.length : 0;

    var btn = document.createElement("button");
    btn.textContent = "📁 " + deckName + (count > 0 ? " (" + count + ")" : "");
    btn.setAttribute("data-deck", deckName);
    btn.addEventListener("click", function() {
      openFlashcardDeck(this.getAttribute("data-deck"));
    });
    container.appendChild(btn);
  }
}

function backToFlashcards() {
  document.getElementById("flashcardDeckPage").classList.add("hidden");
  document.getElementById("flashcardsPage").classList.remove("hidden");
}

var currentDeckCards = [];
var currentCardIndex = 0;

function openFlashcardDeck(deckName) {
  document.getElementById("flashcardsPage").classList.add("hidden");
  document.getElementById("flashcardDeckPage").classList.remove("hidden");

  var cards = (flashcardsData && flashcardsData[deckName]) ? flashcardsData[deckName] : [];
  currentDeckCards = cards;
  currentCardIndex = 0;

  var content = document.getElementById("flashcardDeckContent");

  if (cards.length === 0) {
    content.innerHTML = "<h2>" + deckName + "</h2><p class='missing-message'>Aucune flashcard disponible pour ce dossier pour le moment.</p>";
    return;
  }

  content.innerHTML = "<h2>" + deckName + "</h2><div id='flashcardArea'></div><div id='flashcardNav'></div>";
  renderCard();
}

function renderCard() {
  var area = document.getElementById("flashcardArea");
  var nav = document.getElementById("flashcardNav");
  var card = currentDeckCards[currentCardIndex];

  area.innerHTML =
    "<p class='fc-counter'>" + (currentCardIndex + 1) + " / " + currentDeckCards.length + "</p>" +
    "<div class='fc-card' id='fcCard'>" +
      "<div class='fc-front'>" + card.front + "</div>" +
      "<div class='fc-back hidden'>" + card.back + "</div>" +
    "</div>" +
    "<button onclick='flipCard()'>Retourner</button>";

  nav.innerHTML = "";

  if (currentCardIndex > 0) {
    var prevBtn = document.createElement("button");
    prevBtn.textContent = "◀ Précédent";
    prevBtn.onclick = function() { currentCardIndex--; renderCard(); };
    nav.appendChild(prevBtn);
  }

  if (currentCardIndex < currentDeckCards.length - 1) {
    var nextBtn = document.createElement("button");
    nextBtn.textContent = "Suivant ▶";
    nextBtn.onclick = function() { currentCardIndex++; renderCard(); };
    nav.appendChild(nextBtn);
  }
}

function flipCard() {
  var front = document.querySelector("#fcCard .fc-front");
  var back = document.querySelector("#fcCard .fc-back");
  if (back.classList.contains("hidden")) {
    front.classList.add("hidden");
    back.classList.remove("hidden");
  } else {
    back.classList.add("hidden");
    front.classList.remove("hidden");
  }
}
