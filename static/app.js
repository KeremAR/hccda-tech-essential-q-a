document.addEventListener('DOMContentLoaded', () => {
    const quizContainer = document.getElementById('quiz-container');
    const loadingElement = document.getElementById('loading');
    const questionNumberElement = document.getElementById('question-number');
    const questionTextElement = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const resultContainer = document.getElementById('result-container');
    const resultTextElement = document.getElementById('result-text');
    const explanationTextElement = document.getElementById('explanation-text');
    const nextButton = document.getElementById('next-button');

    let questions = [];
    let currentQuestionIndex = 0;
    let selectedOptions = [];
    let answered = false;

    async function fetchQuestions() {
        try {
            // Fetch the clean, static JSON file
            const response = await fetch('/questions_clean.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            questions = await response.json();
            
            // Shuffle the questions for a random order each time
            questions.sort(() => Math.random() - 0.5);

            if (questions.length > 0) {
                loadingElement.style.display = 'none';
                quizContainer.classList.remove('hidden');
                displayQuestion();
            } else {
                loadingElement.textContent = 'Could not load questions.';
            }
        } catch (error) {
            console.error('Fetch error:', error);
            loadingElement.textContent = 'An error occurred while loading questions.';
        }
    }

    function displayQuestion() {
        answered = false;
        selectedOptions = [];
        resultContainer.style.display = 'none';
        resultContainer.className = 'result-container';
        nextButton.textContent = 'Check Answer';
        nextButton.disabled = true;

        const question = questions[currentQuestionIndex];
        questionNumberElement.textContent = `Question ${currentQuestionIndex + 1} / ${questions.length}`;
        questionTextElement.textContent = question.question;

        optionsContainer.innerHTML = '';
        const isMultiChoice = Array.isArray(question.answer);

        question.options.forEach(optionText => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = optionText;
            optionElement.addEventListener('click', () => selectOption(optionElement, optionText, isMultiChoice));
            optionsContainer.appendChild(optionElement);
        });
    }

    function selectOption(optionElement, optionText, isMultiChoice) {
        if (answered) return;

        const index = selectedOptions.indexOf(optionElement);

        if (isMultiChoice) {
            if (index > -1) {
                selectedOptions.splice(index, 1);
                optionElement.classList.remove('selected');
            } else {
                selectedOptions.push(optionElement);
                optionElement.classList.add('selected');
            }
        } else {
            if (selectedOptions.length > 0) {
                selectedOptions[0].classList.remove('selected');
            }
            selectedOptions = [optionElement];
            optionElement.classList.add('selected');
        }
        
        nextButton.disabled = selectedOptions.length === 0;
    }

    function checkAnswer() {
        if (answered) {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                displayQuestion();
            } else {
                showFinalScreen();
            }
            return;
        }

        answered = true;
        const question = questions[currentQuestionIndex];
        const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
        
        let allCorrect = true;
        
        const selectedAnswersText = selectedOptions.map(opt => opt.textContent.split('.')[0].trim());

        if (correctAnswers.length !== selectedAnswersText.length || !correctAnswers.every(ans => selectedAnswersText.includes(ans))) {
            allCorrect = false;
        }

        // Highlight correct and incorrect answers
        Array.from(optionsContainer.children).forEach(opt => {
            const optValue = opt.textContent.split('.')[0].trim();
            if (correctAnswers.includes(optValue)) {
                opt.classList.add('correct');
            }
        });

        if (!allCorrect) {
            selectedOptions.forEach(opt => {
                 const optValue = opt.textContent.split('.')[0].trim();
                if (!correctAnswers.includes(optValue)) {
                    opt.classList.add('incorrect');
                }
            });
        }


        if (allCorrect) {
            resultTextElement.textContent = 'Correct!';
            resultContainer.classList.add('correct');
        } else {
            resultTextElement.textContent = `Incorrect! The correct answer is: ${correctAnswers.join(', ')}`;
            resultContainer.classList.add('incorrect');
        }

        explanationTextElement.textContent = question.explanation || '';
        resultContainer.style.display = 'block';

        if (currentQuestionIndex < questions.length - 1) {
            nextButton.textContent = 'Next Question';
        } else {
            nextButton.textContent = 'Finish Quiz';
        }
    }
    
    function showFinalScreen() {
        quizContainer.innerHTML = `
            <h2>You have completed the quiz!</h2>
            <p>You answered a total of ${questions.length} questions.</p>
            <button onclick="location.reload()">Restart</button>
        `;
        const restartButton = quizContainer.querySelector('button');
        restartButton.style.backgroundColor = '#1a73e8';
        restartButton.style.color = '#fff';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '8px';
        restartButton.style.padding = '0.8rem 1.5rem';
        restartButton.style.fontSize = '1rem';
        restartButton.style.cursor = 'pointer';
    }


    nextButton.addEventListener('click', checkAnswer);

    quizContainer.classList.add('hidden');
    fetchQuestions();
}); 