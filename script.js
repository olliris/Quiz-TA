function showQuestion() {
  const questionsDiv = document.getElementById("questions");
  questionsDiv.innerHTML = "";
  
  if (!shuffledQuiz.length) {
    questionsDiv.innerHTML = "<p>Aucune question disponible.</p>";
    return;
  }
  if (currentQuestion >= numQuestions) {
    showFinalScore();
    return;
  }
  
  const q = shuffledQuiz[currentQuestion];
  const questionDiv = document.createElement("div");
  questionDiv.classList.add("question");
  
  // Bloc drapeau et question
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
  
  // Bloc réponses
  const answersDiv = document.createElement("div");
  answersDiv.classList.add("answers");
  q.answers.forEach((ans, ansIndex) => {
    const answerButton = document.createElement("button");
    answerButton.textContent = ans;
    answerButton.classList.add("answer-button");
    answerButton.onclick = () => {
      console.log("Réponse cliquée :", ansIndex);
      selectAnswer(currentQuestion, ansIndex, answerButton);
    };
    answersDiv.appendChild(answerButton);
  });
  questionDiv.appendChild(answersDiv);
  
  // Boutons pour mode exercice/flagged
  if (mode === 'exercise' || mode === 'flagged') {
    const submitButton = document.createElement("button");
    submitButton.textContent = "Soumettre";
    
    const nextButton = document.createElement("button");
    nextButton.textContent = "Suivant";
    nextButton.style.display = "none";
    nextButton.onclick = () => {
      console.log("Bouton Suivant cliqué");
      nextQuestion();
    };
    
    const endButton = document.createElement("button");
    endButton.textContent = "Terminer";
    endButton.onclick = () => {
      console.log("Bouton Terminer cliqué");
      resetQuiz();
    };
    
    submitButton.onclick = function() {
      console.log("Bouton Soumettre cliqué");
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

function checkAnswer(questionIndex) {
  const questionsDiv = document.getElementById("questions");
  // Utilisation de firstElementChild pour récupérer le conteneur de la question affichée
  const questionDiv = questionsDiv.firstElementChild;
  if (!questionDiv) {
    console.error("Aucune question trouvée dans le conteneur.");
    return;
  }
  
  const q = shuffledQuiz[questionIndex];
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
