let quiz = [];

fetch("questions.json")
  .then(function(response) { return response.json(); })
  .then(function(data) { quiz = data; })
  .catch(function(error) { console.error("Erreur chargement questions.json:", error); });

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

// ─── UTILITAIRE ───────────────────────────────────────────────────────────────

function hideAll() {
  var ids = ["game","exerciseRangePage","historyPage","flashcardsPage","flashcardDeckPage","schemasPage","schemaDetailPage"];
  ids.forEach(function(id) { document.getElementById(id).classList.add("hidden"); });
  document.querySelector(".quiz-container").classList.add("hidden");
  document.getElementById("footer").style.display = "none";
}

function goBackToHome() {
  window.scrollTo(0,0);
  var ids = ["game","exerciseRangePage","historyPage","flashcardsPage","flashcardDeckPage","schemasPage","schemaDetailPage"];
  ids.forEach(function(id) { document.getElementById(id).classList.add("hidden"); });
  document.querySelector(".quiz-container").classList.remove("hidden");
  document.getElementById("footer").style.display = "block";
}

// ─── MODE EXAMEN ──────────────────────────────────────────────────────────────

function startExam() {
  window.scrollTo(0,0);
  mode = 'exam';
  timeLeft = 120 * 60;
  numQuestions = Math.min(75, quiz.length);
  hideAll();
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("timer").classList.remove("hidden");
  document.getElementById("score").classList.remove("hidden");
  currentQuestion = 0;
  score = 0;
  showQuestions();
  startTimer();
}

// ─── MODE EXERCICE ────────────────────────────────────────────────────────────

function chooseExerciseRange() {
  window.scrollTo(0,0);
  hideAll();
  document.getElementById("exerciseRangePage").classList.remove("hidden");

  var markedRow = document.getElementById("exerciseMarkedRow");
  var markedCount = markedQuestions.length;
  markedRow.innerHTML = "";

  var markedBtn = document.createElement("button");
  markedBtn.className = "exercise-marked-btn";
  var flagSpan = document.createElement("span");
  flagSpan.textContent = "\u2691";
  flagSpan.style.marginRight = "6px";
  flagSpan.style.color = markedCount > 0 ? "red" : "#555";
  markedBtn.appendChild(flagSpan);
  markedBtn.appendChild(document.createTextNode("Questions Marqu\u00e9es"));
  if (markedCount > 0) {
    var countSpan = document.createElement("span");
    countSpan.className = "marked-count";
    countSpan.textContent = " (" + markedCount + ")";
    markedBtn.appendChild(countSpan);
  }
  markedBtn.onclick = function() { showMarkedQuestions(); };
  markedRow.appendChild(markedBtn);

  var sep = document.createElement("p");
  sep.className = "exercise-section-label";
  sep.textContent = "Choisissez une plage de questions :";
  markedRow.appendChild(sep);

  var exerciseRangeOptions = document.getElementById("exerciseRangeOptions");
  exerciseRangeOptions.innerHTML = '';
  for (var i = 0; i < quiz.length; i += 30) {
    var start = i + 1;
    var end = Math.min(i + 30, quiz.length);
    var rangeKey = start + "-" + end;
    var rangeButton = document.createElement("button");
    rangeButton.className = "exercise-range-btn";
    var percentage = exerciseResults[rangeKey];
    if (percentage !== undefined) {
      rangeButton.textContent = start + " \u00e0 " + end + "  \u2014  " + percentage + "%";
    } else {
      rangeButton.textContent = start + " \u00e0 " + end;
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
  hideAll();
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("timer").classList.add("hidden");
  document.getElementById("score").classList.add("hidden");
  document.getElementById("feedback").classList.add("hidden");
  currentQuestion = 0;
  score = 0;
  showQuestion();
}

function showMarkedQuestions() {
  shuffledQuiz = markedQuestions;
  mode = 'flagged';
  currentQuestion = 0;
  numQuestions = markedQuestions.length;
  hideAll();
  document.getElementById("game").classList.remove("hidden");
  showQuestion();
}

// ─── MARQUER UNE QUESTION ─────────────────────────────────────────────────────

function markQuestion(question) {
  var index = markedQuestions.findIndex(function(q) { return q.question === question.question; });
  if (index === -1) {
    markedQuestions.push(question);
  } else {
    markedQuestions.splice(index, 1);
  }
  localStorage.setItem('markedQuestions', JSON.stringify(markedQuestions));
  var flagButton = document.querySelector('.flag-button[data-question="' + question.question.replace(/"/g,'&quot;') + '"]');
  if (flagButton) {
    var isMarked = markedQuestions.some(function(mq) { return mq.question === question.question; });
    flagButton.classList.toggle("red", isMarked);
  }
}

// ─── AFFICHAGE DES QUESTIONS ──────────────────────────────────────────────────

function makeFlagButton(q) {
  var flagButton = document.createElement("button");
  flagButton.classList.add("flag-button");
  flagButton.setAttribute("data-question", q.question);
  var isMarked = markedQuestions.some(function(mq) { return mq.question === q.question; });
  if (isMarked) flagButton.classList.add("red");
  flagButton.textContent = "\u2691";
  flagButton.onclick = (function(question) {
    return function() { markQuestion(question); };
  })(q);
  return flagButton;
}

function showQuestions() {
  var questionsDiv = document.getElementById("questions");
  questionsDiv.innerHTML = "";
  var quizToShow = mode === 'exam' ? quiz.slice(0, numQuestions) : shuffledQuiz;
  quizToShow.forEach(function(q, index) {
    var questionDiv = document.createElement("div");
    questionDiv.classList.add("question");

    var flagAndQuestion = document.createElement("div");
    flagAndQuestion.classList.add("flag-and-question");
    flagAndQuestion.appendChild(makeFlagButton(q));

    var questionText = document.createElement("p");
    questionText.innerHTML = q.question.replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>');
    flagAndQuestion.appendChild(questionText);
    questionDiv.appendChild(flagAndQuestion);

    var answersDiv = document.createElement("div");
    answersDiv.classList.add("answers");
    q.answers.forEach(function(ans, ansIndex) {
      var answerButton = document.createElement("button");
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
  var questionsDiv = document.getElementById("questions");
  questionsDiv.innerHTML = "";

  if (!shuffledQuiz.length) {
    questionsDiv.innerHTML = "<p>Aucune question disponible.</p>";
    var homeButton = document.createElement("button");
    homeButton.textContent = "Retour \u00e0 l'accueil";
    homeButton.onclick = function() { goBackToHome(); };
    questionsDiv.appendChild(homeButton);
    return;
  }

  if (currentQuestion >= numQuestions) {
    showFinalScore();
    return;
  }

  var q = shuffledQuiz[currentQuestion];
  var questionDiv = document.createElement("div");
  questionDiv.classList.add("question");

  var flagAndQuestion = document.createElement("div");
  flagAndQuestion.classList.add("flag-and-question");
  flagAndQuestion.appendChild(makeFlagButton(q));

  var questionText = document.createElement("p");
  questionText.innerHTML = q.question.replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>');
  flagAndQuestion.appendChild(questionText);
  questionDiv.appendChild(flagAndQuestion);

  var answersDiv = document.createElement("div");
  answersDiv.classList.add("answers");
  q.answers.forEach(function(ans, ansIndex) {
    var answerButton = document.createElement("button");
    answerButton.textContent = ans;
    answerButton.classList.add("answer-button");
    answerButton.onclick = (function(ai, btn) {
      return function() { selectAnswer(currentQuestion, ai, btn); };
    })(ansIndex, answerButton);
    answersDiv.appendChild(answerButton);
  });
  questionDiv.appendChild(answersDiv);

  if (mode === 'exercise' || mode === 'flagged') {
    var submitButton = document.createElement("button");
    submitButton.textContent = "Soumettre";

    var nextButton = document.createElement("button");
    nextButton.textContent = "Suivant";
    nextButton.style.display = "none";
    nextButton.onclick = nextQuestion;

    var endButton = document.createElement("button");
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
  var q = shuffledQuiz[questionIndex];
  var questionDiv = document.querySelector("#questions .question:nth-child(1)");
  var buttons = questionDiv.querySelectorAll(".answer-button");
  var candidateSelected = [];
  buttons.forEach(function(button, index) {
    if (button.classList.contains("selected")) { candidateSelected.push(index); }
  });
  buttons.forEach(function(button, index) {
    if (q.correct.includes(index)) {
      button.classList.add("correct");
      if (button.classList.contains("selected")) {
        if (!button.querySelector(".check-mark")) {
          button.insertAdjacentHTML("afterbegin", "<span class='check-mark'>\u2713 </span>");
        }
        button.classList.remove("selected");
      }
    } else if (button.classList.contains("selected")) {
      button.classList.add("incorrect");
      button.classList.remove("selected");
    }
  });
  var missingCorrect = q.correct.filter(function(ci) { return !candidateSelected.includes(ci); });
  if (q.correct.length > 1 && missingCorrect.length > 0) {
    var msg = document.createElement("p");
    msg.className = "missing-message";
    msg.textContent = "Attention il y a plusieurs bonnes r\u00e9ponses";
    questionDiv.appendChild(msg);
  }
  var correctSelected = candidateSelected.filter(function(a) { return q.correct.includes(a); }).length;
  var incorrectSelected = candidateSelected.length - correctSelected;
  if (correctSelected === q.correct.length && incorrectSelected === 0) { score++; }
  document.getElementById("score").textContent = "Score: " + score + "/" + numQuestions;
}

function endExam() {
  clearInterval(timerInterval);
  var questionsDiv = document.getElementById("questions");
  var questionDivs = questionsDiv.querySelectorAll(".question");
  questionDivs.forEach(function(questionDiv, index) {
    var q = quiz[index];
    var buttons = questionDiv.querySelectorAll(".answer-button");
    var candidateSelected = [];
    buttons.forEach(function(button, i) {
      if (button.classList.contains("selected")) { candidateSelected.push(i); }
    });
    buttons.forEach(function(button, i) {
      if (q.correct.includes(i)) {
        button.classList.add("correct");
        if (button.classList.contains("selected")) {
          if (!button.querySelector(".check-mark")) {
            button.insertAdjacentHTML("afterbegin", "<span class='check-mark'>\u2713 </span>");
          }
          button.classList.remove("selected");
        }
      } else if (button.classList.contains("selected")) {
        button.classList.add("incorrect");
        button.classList.remove("selected");
      }
    });
    var missingCorrect = q.correct.filter(function(idx) { return !candidateSelected.includes(idx); });
    if (q.correct.length > 1 && missingCorrect.length > 0) {
      var msg = document.createElement("p");
      msg.className = "missing-message";
      msg.textContent = "Attention il y a plusieurs bonnes r\u00e9ponses";
      questionDiv.appendChild(msg);
    }
    if (mode === 'exam' && !markedQuestions.some(function(mq) { return mq.question === q.question; })) {
      markedQuestions.push(q);
    }
  });
  localStorage.setItem('markedQuestions', JSON.stringify(markedQuestions));
  var percentage = (score / numQuestions) * 100;
  var feedbackMessage = '';
  if (percentage < 85) {
    feedbackMessage = "Retourne au fourgon ket";
    document.getElementById("feedback").classList.add("red");
    document.getElementById("feedback").classList.remove("green");
  } else {
    feedbackMessage = "Bravo champion tu es pr\u00eat!";
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
    var backButton = document.createElement("button");
    backButton.textContent = "Retourner \u00e0 l'accueil";
    backButton.id = "backButton";
    backButton.onclick = resetQuiz;
    document.getElementById("game").appendChild(backButton);
  }
}

function showFinalScore() {
  var percentage = (score / numQuestions) * 100;
  alert("Vous avez termin\u00e9 l'exercice avec un score de " + percentage.toFixed(2) + "%");
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
  var backButton = document.getElementById("game").querySelector("button#backButton");
  if (backButton) { backButton.remove(); }
}

// ─── HISTORIQUE ───────────────────────────────────────────────────────────────

function showHistory() {
  window.scrollTo(0,0);
  hideAll();
  document.getElementById("historyPage").classList.remove("hidden");
  displayHistory();
}

function displayHistory() {
  var historyContent = document.getElementById("historyContent");
  historyContent.innerHTML = "";
  if (examHistory.length === 0) {
    historyContent.textContent = "Aucun examen effectu\u00e9.";
    return;
  }
  var historyList = document.createElement("ul");
  examHistory.forEach(function(s, index) {
    var listItem = document.createElement("li");
    listItem.textContent = "Examen " + (index + 1) + ": " + s.toFixed(2) + "%";
    historyList.appendChild(listItem);
  });
  historyContent.appendChild(historyList);
}

function startTimer() {
  timerInterval = setInterval(function() {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endExam();
      return;
    }
    timeLeft--;
    var minutes = Math.floor(timeLeft / 60);
    var seconds = timeLeft % 60;
    document.getElementById("timer").textContent = "Temps restant : " + minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }, 1000);
}

function resetCache() {
  localStorage.removeItem('examHistory');
  localStorage.removeItem('markedQuestions');
  localStorage.removeItem('exerciseResults');
  localStorage.removeItem('markedFlashcards');
  examHistory = [];
  markedQuestions = [];
  exerciseResults = {};
  markedFlashcards = [];
  alert("Le cache a \u00e9t\u00e9 r\u00e9initialis\u00e9.");
  displayHistory();
  if (!document.getElementById("exerciseRangePage").classList.contains("hidden")) {
    chooseExerciseRange();
  }
}

// ─── FLASHCARDS ───────────────────────────────────────────────────────────────

var flashcardsData = null;
var markedFlashcards = JSON.parse(localStorage.getItem('markedFlashcards')) || [];
var currentDeckCards = [];
var currentCardIndex = 0;

var flashcardDecks = [
  "Physiologie et Chimie","La Cellule","Les Tissus",
  "Syst\u00e8me Cardio-vasculaire","Syst\u00e8me Lymphatique","Syst\u00e8me Respiratoire",
  "Syst\u00e8me Nerveux","Syst\u00e8me Endocrinien","Syst\u00e8me Digestif",
  "Syst\u00e8me Urinaire","Syst\u00e8me Reproducteur","Syst\u00e8me Locomoteur",
  "Les Sens","Traumatologie"
];

function showFlashcards() {
  window.scrollTo(0,0);
  hideAll();
  document.getElementById("flashcardsPage").classList.remove("hidden");
  if (flashcardsData === null) {
    fetch("flashcards.json")
      .then(function(r) { return r.json(); })
      .then(function(data) { flashcardsData = data; renderFlashcardFolders(); })
      .catch(function() { flashcardsData = {}; renderFlashcardFolders(); });
  } else {
    renderFlashcardFolders();
  }
}

function renderFlashcardFolders() {
  var container = document.getElementById("flashcardsFolders");
  container.innerHTML = "";

  var markedCount = markedFlashcards.length;
  var markedBtn = document.createElement("button");
  markedBtn.className = "exercise-marked-btn";
  var flagSpan = document.createElement("span");
  flagSpan.textContent = "\u2691";
  flagSpan.style.marginRight = "6px";
  flagSpan.style.color = markedCount > 0 ? "red" : "#555";
  markedBtn.appendChild(flagSpan);
  markedBtn.appendChild(document.createTextNode("Flashcards Marqu\u00e9es"));
  if (markedCount > 0) {
    var countSpan = document.createElement("span");
    countSpan.className = "marked-count";
    countSpan.textContent = " (" + markedCount + ")";
    markedBtn.appendChild(countSpan);
  }
  markedBtn.onclick = function() { openMarkedFlashcards(); };
  container.appendChild(markedBtn);

  var sep = document.createElement("p");
  sep.className = "exercise-section-label";
  sep.textContent = "Choisissez un dossier :";
  container.appendChild(sep);

  for (var i = 0; i < flashcardDecks.length; i++) {
    var deckName = flashcardDecks[i];
    var cards = flashcardsData[deckName];
    var count = (cards && cards.length) ? cards.length : 0;
    var btn = document.createElement("button");
    btn.className = "fc-folder-btn";
    btn.textContent = "\uD83D\uDCC1 " + deckName + (count > 0 ? " (" + count + ")" : "");
    btn.setAttribute("data-deck", deckName);
    btn.addEventListener("click", function() {
      openFlashcardDeck(this.getAttribute("data-deck"));
    });
    container.appendChild(btn);
  }
}

function openMarkedFlashcards() {
  document.getElementById("flashcardsPage").classList.add("hidden");
  document.getElementById("flashcardDeckPage").classList.remove("hidden");
  currentDeckCards = markedFlashcards;
  currentCardIndex = 0;
  var content = document.getElementById("flashcardDeckContent");
  if (markedFlashcards.length === 0) {
    content.innerHTML = "<h2>Flashcards Marqu\u00e9es</h2><p class='missing-message'>Aucune flashcard marqu\u00e9e pour le moment.</p>";
    return;
  }
  content.innerHTML = "<h2>Flashcards Marqu\u00e9es</h2><div id='flashcardArea'></div><div id='flashcardNav'></div>";
  renderCard();
}

function backToFlashcards() {
  window.scrollTo(0,0);
  document.getElementById("flashcardDeckPage").classList.add("hidden");
  document.getElementById("flashcardsPage").classList.remove("hidden");
  renderFlashcardFolders();
}

function openFlashcardDeck(deckName) {
  window.scrollTo(0,0);
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

function markFlashcard(card) {
  var idx = markedFlashcards.findIndex(function(c) { return c.front === card.front; });
  if (idx === -1) {
    markedFlashcards.push(card);
  } else {
    markedFlashcards.splice(idx, 1);
  }
  localStorage.setItem('markedFlashcards', JSON.stringify(markedFlashcards));
}

function isFlashcardMarked(card) {
  return markedFlashcards.some(function(c) { return c.front === card.front; });
}

function renderCard() {
  var area = document.getElementById("flashcardArea");
  var nav  = document.getElementById("flashcardNav");
  var card = currentDeckCards[currentCardIndex];

  var cardDiv = document.createElement("div");
  cardDiv.className = "fc-card";
  cardDiv.id = "fcCard";

  var front = document.createElement("div");
  front.className = "fc-front";
  front.textContent = card.front;

  var back = document.createElement("div");
  back.className = "fc-back hidden";
  back.textContent = card.back;

  cardDiv.appendChild(front);
  cardDiv.appendChild(back);
  cardDiv.addEventListener("click", function() { flipCard(); });

  var counter = document.createElement("p");
  counter.className = "fc-counter";
  counter.textContent = (currentCardIndex + 1) + " / " + currentDeckCards.length;

  var flagBtn = document.createElement("button");
  flagBtn.className = "flag-button" + (isFlashcardMarked(card) ? " red" : "");
  flagBtn.textContent = "\u2691";
  flagBtn.title = "Marquer cette carte";
  flagBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    markFlashcard(card);
    flagBtn.className = "flag-button" + (isFlashcardMarked(card) ? " red" : "");
  });

  var topRow = document.createElement("div");
  topRow.className = "fc-top-row";
  topRow.appendChild(counter);
  topRow.appendChild(flagBtn);

  var hint = document.createElement("p");
  hint.className = "fc-hint";
  hint.textContent = "Cliquez sur la carte pour retourner";

  area.innerHTML = "";
  area.appendChild(topRow);
  area.appendChild(cardDiv);
  area.appendChild(hint);

  nav.innerHTML = "";
  if (currentCardIndex > 0) {
    var prevBtn = document.createElement("button");
    prevBtn.textContent = "\u25c4 Pr\u00e9c\u00e9dent";
    prevBtn.onclick = function() { currentCardIndex--; renderCard(); };
    nav.appendChild(prevBtn);
  }
  if (currentCardIndex < currentDeckCards.length - 1) {
    var nextBtn = document.createElement("button");
    nextBtn.textContent = "Suivant \u25ba";
    nextBtn.onclick = function() { currentCardIndex++; renderCard(); };
    nav.appendChild(nextBtn);
  }
}

function flipCard() {
  var front = document.querySelector("#fcCard .fc-front");
  var back  = document.querySelector("#fcCard .fc-back");
  if (!front || !back) return;
  if (back.classList.contains("hidden")) {
    front.classList.add("hidden");
    back.classList.remove("hidden");
  } else {
    back.classList.add("hidden");
    front.classList.remove("hidden");
  }
}

// ─── SCHEMAS ──────────────────────────────────────────────────────────────────

var schemasData = null;
var schemasLoaded = false;
var markedSchemas = JSON.parse(localStorage.getItem('markedSchemas')) || [];

function isSchemaMarked(name) {
  return markedSchemas.indexOf(name) !== -1;
}

function toggleSchemaMarked(name) {
  var idx = markedSchemas.indexOf(name);
  if (idx === -1) { markedSchemas.push(name); }
  else { markedSchemas.splice(idx, 1); }
  localStorage.setItem('markedSchemas', JSON.stringify(markedSchemas));
}

function showSchemas() {
  window.scrollTo(0,0);
  hideAll();
  document.getElementById("schemasPage").classList.remove("hidden");
  if (!schemasLoaded) {
    fetch("schemas.json")
      .then(function(r) { return r.json(); })
      .then(function(data) {
        schemasData = data;
        schemasLoaded = true;
        renderSchemasGrid();
      })
      .catch(function(e) {
        console.error("Erreur chargement schemas.json:", e);
        schemasData = [];
        renderSchemasGrid();
      });
  } else {
    renderSchemasGrid();
  }
}

function renderSchemasGrid() {
  var grid = document.getElementById("schemasGrid");
  grid.innerHTML = "";
  if (!schemasData || schemasData.length === 0) {
    grid.innerHTML = "<p class='missing-message'>Aucun sch\u00e9ma disponible pour le moment.</p>";
    return;
  }
  schemasData.forEach(function(schema, index) {
    var card = document.createElement("div");
    card.className = "schema-card";
    card.setAttribute("data-index", index);

    var img = document.createElement("img");
    img.src = schema.image;
    img.alt = schema.name;
    img.className = "schema-thumb";

    // Ligne label + drapeau
    var labelRow = document.createElement("div");
    labelRow.className = "schema-label-row";

    var cardFlag = document.createElement("button");
    cardFlag.className = "flag-button schema-card-flag" + (isSchemaMarked(schema.name) ? " red" : "");
    cardFlag.textContent = "\u2691";
    cardFlag.title = "Marquer";
    cardFlag.setAttribute("data-name", schema.name);
    cardFlag.addEventListener("click", function(e) {
      e.stopPropagation();
      toggleSchemaMarked(schema.name);
      this.className = "flag-button schema-card-flag" + (isSchemaMarked(schema.name) ? " red" : "");
    });

    var label = document.createElement("span");
    label.className = "schema-label";
    label.textContent = schema.name;

    labelRow.appendChild(cardFlag);
    labelRow.appendChild(label);
    card.appendChild(img);
    card.appendChild(labelRow);
    card.addEventListener("click", function() {
      openSchema(parseInt(this.getAttribute("data-index")));
    });
    grid.appendChild(card);
  });
}

function backToSchemas() {
  document.getElementById("schemaDetailPage").classList.add("hidden");
  document.getElementById("schemasPage").classList.remove("hidden");
  window.scrollTo(0, 0);
  renderSchemasGrid();
}

function openSchema(index) {
  var schema = schemasData[index];
  document.getElementById("schemasPage").classList.add("hidden");
  document.getElementById("schemaDetailPage").classList.remove("hidden");
  var content = document.getElementById("schemaDetailContent");

  var allAnswers = schema.elements.map(function(e) { return e.answer; });
  var uniqueAnswers = allAnswers.filter(function(v, i, a) { return a.indexOf(v) === i; });
  uniqueAnswers.sort();

  window.scrollTo(0, 0);
  var marked = isSchemaMarked(schema.name);
  var html = "<div class='schema-title-row'>";
  html += "<button class=\"flag-button schema-detail-flag" + (marked ? " red" : "") + "\" ";
  html += "onclick=\"toggleSchemaMarked('" + schema.name.replace(/'/g,"\\'") + "'); ";
  html += "this.className='flag-button schema-detail-flag'+(isSchemaMarked('" + schema.name.replace(/'/g,"\\'") + "')?' red':'');\">\u2691</button>";
  html += "<h2 style='display:inline;margin-left:8px'>" + schema.name + "</h2></div>";
  html += "<img src='" + schema.image + "' class='schema-full-img' alt='" + schema.name + "'>";
  html += "<div class='schema-elements'>";
  html += "<p class='schema-instructions'>Associez chaque num\u00e9ro au bon \u00e9l\u00e9ment :</p>";
  schema.elements.forEach(function(el) {
    html += "<div class='schema-row'>";
    html += "<span class='schema-number'>" + el.number + "</span>";
    html += "<select class='schema-select' data-answer='" + el.answer.replace(/'/g,"&#39;") + "'>";
    html += "<option value=''>\u2014 Choisir \u2014</option>";
    uniqueAnswers.forEach(function(ans) {
      html += "<option value='" + ans.replace(/'/g,"&#39;") + "'>" + ans + "</option>";
    });
    html += "</select>";
    html += "<span class='schema-result'></span>";
    html += "</div>";
  });
  html += "</div>";
  html += "<button onclick='checkSchema()' style='margin-top:15px'>\u2714 V\u00e9rifier</button>";
  html += "<button onclick='resetSchema()' style='margin-top:15px'>\u21ba Recommencer</button>";
  html += "<p id='schemaScore' class='schema-score'></p>";
  content.innerHTML = html;
}

function checkSchema() {
  var rows = document.querySelectorAll(".schema-row");
  var correct = 0;
  var total = rows.length;
  rows.forEach(function(row) {
    var select = row.querySelector(".schema-select");
    var result = row.querySelector(".schema-result");
    var expected = select.getAttribute("data-answer");
    var chosen = select.value;
    if (chosen === "") {
      result.textContent = "";
      result.className = "schema-result";
    } else if (chosen === expected) {
      result.textContent = " \u2713";
      result.className = "schema-result schema-correct";
      select.style.borderColor = "green";
      correct++;
    } else {
      result.textContent = " \u2717 \u2192 " + expected;
      result.className = "schema-result schema-incorrect";
      select.style.borderColor = "red";
    }
  });
  var pct = Math.round((correct / total) * 100);
  var scoreEl = document.getElementById("schemaScore");
  scoreEl.textContent = "Score : " + correct + " / " + total + " (" + pct + "%)";
  scoreEl.className = "schema-score " + (pct >= 80 ? "schema-score-good" : "schema-score-bad");
}

function resetSchema() {
  document.querySelectorAll(".schema-select").forEach(function(s) {
    s.value = "";
    s.style.borderColor = "";
  });
  document.querySelectorAll(".schema-result").forEach(function(r) {
    r.textContent = "";
    r.className = "schema-result";
  });
  document.getElementById("schemaScore").textContent = "";
}
