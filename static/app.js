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
    let selectedOption = null;
    let answered = false;

    async function fetchQuestions() {
        try {
            const response = await fetch('/api/questions');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            questions = await response.json();
            if (questions.length > 0) {
                loadingElement.style.display = 'none';
                quizContainer.classList.remove('hidden');
                displayQuestion();
            } else {
                loadingElement.textContent = 'Sorular yüklenemedi.';
            }
        } catch (error) {
            console.error('Fetch error:', error);
            loadingElement.textContent = 'Sorular yüklenirken bir hata oluştu.';
        }
    }

    function displayQuestion() {
        answered = false;
        selectedOption = null;
        resultContainer.style.display = 'none';
        resultContainer.className = 'result-container';
        nextButton.textContent = 'Cevabı Kontrol Et';
        nextButton.disabled = true;

        const question = questions[currentQuestionIndex];
        questionNumberElement.textContent = `Soru ${currentQuestionIndex + 1} / ${questions.length}`;
        questionTextElement.textContent = question.question;

        optionsContainer.innerHTML = '';
        question.options.forEach(optionText => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = optionText;
            optionElement.addEventListener('click', () => selectOption(optionElement, optionText));
            optionsContainer.appendChild(optionElement);
        });
    }

    function selectOption(optionElement, optionText) {
        if (answered) return;

        if (selectedOption) {
            selectedOption.classList.remove('selected');
        }
        selectedOption = optionElement;
        selectedOption.classList.add('selected');
        nextButton.disabled = false;
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
        const selectedAnswer = selectedOption.textContent;
        const correctAnswer = question.answer;

        let isCorrect = false;
        if (Array.isArray(correctAnswer)) { // Multiple choice
            const selectedAnswers = selectedAnswer.split(',').map(s => s.trim());
            isCorrect = correctAnswer.length === selectedAnswers.length && correctAnswer.every(val => selectedAnswers.includes(val));
        } else { // Single choice or True/False
            // Handle cases where answer is like "B) some text"
            const simpleAnswer = correctAnswer.split(')')[0].trim();
            const simpleSelected = selectedAnswer.split(')')[0].trim();
            isCorrect = simpleSelected === simpleAnswer;
        }

        Array.from(optionsContainer.children).forEach(opt => {
             const simpleOptText = opt.textContent.split(')')[0].trim();
             if (Array.isArray(correctAnswer) ? correctAnswer.includes(simpleOptText) : simpleOptText === correctAnswer.split(')')[0].trim()) {
                opt.classList.add('correct');
             }
        });


        if (isCorrect) {
            resultTextElement.textContent = 'Doğru!';
            resultContainer.classList.add('correct');
        } else {
            selectedOption.classList.add('incorrect');
            resultTextElement.textContent = `Yanlış! Doğru Cevap: ${Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}`;
            resultContainer.classList.add('incorrect');
        }

        explanationTextElement.textContent = question.explanation || '';
        resultContainer.style.display = 'block';

        if (currentQuestionIndex < questions.length - 1) {
            nextButton.textContent = 'Sonraki Soru';
        } else {
            nextButton.textContent = 'Testi Bitir';
        }
    }
    
    function showFinalScreen() {
        quizContainer.innerHTML = `
            <h2>Testi tamamladınız!</h2>
            <p>Toplam ${questions.length} soruyu cevapladınız.</p>
            <button onclick="location.reload()">Yeniden Başla</button>
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