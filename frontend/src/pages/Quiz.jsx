import React, { useState, useEffect } from "react";
import api from "../api/api";
import confetti from "canvas-confetti";
import { Compass, CheckCircle2, XCircle, Award, History, RotateCcw, ArrowRight } from "lucide-react";

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Answering states
  const [selectedOption, setSelectedOption] = useState("");
  const [answered, setAnswered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [sessionCorrect, setSessionCorrect] = useState(0);

  // Completion states
  const [quizFinished, setQuizFinished] = useState(false);
  const [scoreStats, setScoreStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("stats"); // stats | history

  // Fetch randomized questions on load
  const loadQuiz = async () => {
    setLoading(true);
    setQuizFinished(false);
    setCurrentIndex(0);
    setSessionCorrect(0);
    setSelectedOption("");
    setAnswered(false);
    setFlipped(false);
    
    try {
      const res = await api.get("/quiz/questions?limit=10");
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  const handleOptionClick = async (option) => {
    if (answered || submitting) return;
    setSelectedOption(option);
    setSubmitting(true);

    try {
      const question = questions[currentIndex];
      const res = await api.post("/quiz/attempt", {
        question_id: question.id,
        selected: option,
      });

      const { is_correct, correct_answer } = res.data;
      setIsCorrect(is_correct);
      setCorrectAnswer(correct_answer);
      if (is_correct) {
        setSessionCorrect((prev) => prev + 1);
      }
      setAnswered(true);
      setFlipped(true);
    } catch (err) {
      console.error("Failed to submit attempt:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setSelectedOption("");
      setAnswered(false);
      setFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Quiz finished
      setQuizFinished(true);
      const pct = (sessionCorrect / questions.length) * 100;
      if (pct >= 70) {
        // Confetti party
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#F43F5E", "#F59E0B", "#FDA4AF", "#FFE4E6"],
        });
      }
      // Load stats & history from server
      try {
        const statsRes = await api.get("/quiz/score");
        const histRes = await api.get("/quiz/history");
        setScoreStats(statsRes.data);
        setHistory(histRes.data);
      } catch (err) {
        console.error("Failed to load post-quiz results:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-romantic-rose border-t-transparent"></div>
        <p className="text-sm font-medium text-romantic-gray/60">Preparing your romantic quiz...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-serif">No questions found. Please seed the database first!</p>
        <button onClick={loadQuiz} className="mt-4 px-6 py-2.5 bg-romantic-rose text-white rounded-full">
          Retry
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
      {!quizFinished ? (
        <div className="w-full flex flex-col items-center space-y-6">
          {/* Header Info */}
          <div className="w-full text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-romantic-rose">
              <Compass size={20} className="animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-xs uppercase tracking-widest font-bold">Relationship Quiz</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-romantic-gray">How well do you know him?</h2>
            <p className="text-sm text-romantic-gray/60">
              Answer the questions about your partner and test your bond 💛
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-semibold text-romantic-gray/60">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>Score: {sessionCorrect} correct</span>
            </div>
            <div className="w-full h-2 bg-rose-50 border border-rose-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-romantic-rose to-rose-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* 3D Card Area */}
          <div className="w-full max-w-md h-[340px] perspective-1000 relative select-none">
            <div className={`w-full h-full duration-700 transform-style-3d relative ${flipped ? "rotate-y-180" : ""}`}>
              {/* CARD FRONT */}
              <div className="absolute inset-0 backface-hidden bg-white border border-rose-100/60 shadow-xl rounded-3xl p-6 md:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  {currentQuestion.category && (
                    <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-romantic-rose text-[10px] font-bold uppercase tracking-wider">
                      {currentQuestion.category}
                    </span>
                  )}
                  <h3 className="text-lg md:text-xl font-serif text-romantic-gray leading-snug">
                    {currentQuestion.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-2.5 mt-4">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(option)}
                      disabled={submitting}
                      className="w-full py-3 px-4 rounded-xl border border-rose-100 bg-rose-50/20 hover:bg-rose-50 text-sm font-medium text-left text-romantic-gray active:scale-[0.99] transition-all hover:border-romantic-rose/50"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* CARD BACK */}
              <div
                className={`absolute inset-0 backface-hidden rotate-y-180 shadow-xl rounded-3xl p-6 md:p-8 flex flex-col justify-between text-white ${
                  isCorrect
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : "bg-gradient-to-br from-romantic-rose to-red-600"
                }`}
              >
                <div className="flex flex-col items-center justify-center flex-1 space-y-4 text-center">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 size={56} className="animate-bounce" />
                      <h3 className="text-2xl font-serif font-bold">You got it right! 🥰</h3>
                      <p className="text-sm text-white/90">
                        Indeed, the answer is: <strong className="underline decoration-wavy underline-offset-4">{correctAnswer}</strong>
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle size={56} className="animate-wiggle" />
                      <h3 className="text-2xl font-serif font-bold">Oh no! 😢</h3>
                      <p className="text-sm text-white/95">
                        You selected: <strong>{selectedOption}</strong>
                      </p>
                      <p className="text-sm text-white/90">
                        The correct answer was: <strong className="underline decoration-wavy underline-offset-4">{correctAnswer}</strong>
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  className="w-full py-3 px-4 rounded-xl bg-white text-romantic-gray font-semibold text-sm shadow-md hover:bg-rose-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-rose-600"
                >
                  <span>{currentIndex < questions.length - 1 ? "Next Question" : "See Final Score"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FINISHED SCORE SCREEN */
        <div className="w-full bg-white border border-rose-100 shadow-xl rounded-3xl p-6 md:p-8 space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <div className="inline-flex h-20 w-20 items-center justify-center bg-rose-50 text-romantic-rose rounded-full mb-2">
              <Award size={44} className="animate-pulse" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-romantic-gray">Quiz Completed!</h2>
            <p className="text-sm text-romantic-gray/60 max-w-sm mx-auto">
              {((sessionCorrect / questions.length) * 100) >= 70
                ? "Wow! You know him like the back of your hand. That's true love! 💖"
                : "A decent effort! There's always room to learn more about each other 💛"}
            </p>
          </div>

          {/* Current Score Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-rose-50/40 border border-rose-100 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xs uppercase text-romantic-gray/50 font-bold tracking-wider">Score</span>
              <p className="font-serif text-3xl font-bold text-romantic-rose">{sessionCorrect} / {questions.length}</p>
            </div>
            <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xs uppercase text-romantic-gray/50 font-bold tracking-wider">Accuracy</span>
              <p className="font-serif text-3xl font-bold text-romantic-gold">
                {Math.round((sessionCorrect / questions.length) * 100)}%
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Stats & History) */}
          <div className="space-y-4">
            <div className="flex border-b border-rose-100">
              <button
                onClick={() => setActiveTab("stats")}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "stats"
                    ? "border-romantic-rose text-romantic-rose"
                    : "border-transparent text-romantic-gray/50 hover:text-romantic-rose"
                }`}
              >
                <Award size={16} />
                Global Stats
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "history"
                    ? "border-romantic-rose text-romantic-rose"
                    : "border-transparent text-romantic-gray/50 hover:text-romantic-rose"
                }`}
              >
                <History size={16} />
                Attempt History
              </button>
            </div>

            {/* TAB PANES */}
            {activeTab === "stats" && scoreStats && (
              <div className="space-y-4 py-2">
                <h3 className="font-serif font-bold text-romantic-gray text-lg">Your Lifetime Stats</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-gray-50 border rounded-xl">
                    <span className="text-[10px] text-romantic-gray/50 font-bold uppercase">Total Answers</span>
                    <p className="text-lg font-semibold text-romantic-gray mt-1">{scoreStats.total}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">Correct</span>
                    <p className="text-lg font-semibold text-emerald-600 mt-1">{scoreStats.correct}</p>
                  </div>
                  <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                    <span className="text-[10px] text-rose-700 font-bold uppercase">Incorrect</span>
                    <p className="text-lg font-semibold text-rose-500 mt-1">{scoreStats.incorrect}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-rose-50/20 border border-rose-100 rounded-xl">
                  <span className="text-sm font-medium">All-time Accuracy</span>
                  <span className="font-serif font-bold text-romantic-rose text-xl">
                    {Math.round(scoreStats.percentage)}%
                  </span>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <h3 className="font-serif font-bold text-romantic-gray text-lg sticky top-0 bg-white py-1">Recent Attempts</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-romantic-gray/50 text-center py-4">No recent attempts found.</p>
                ) : (
                  history.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 border rounded-xl flex items-center justify-between gap-3 text-xs bg-rose-50/5"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-romantic-gray text-sm">{h.question_text}</p>
                        <p className="text-romantic-gray/50">
                          Selected: <span className="font-semibold">{h.selected}</span>
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full font-bold flex items-center gap-1 shrink-0 ${
                          h.is_correct
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {h.is_correct ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={loadQuiz}
              className="flex-1 py-3 bg-rose-50 border border-rose-100 text-romantic-rose hover:bg-rose-100 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
