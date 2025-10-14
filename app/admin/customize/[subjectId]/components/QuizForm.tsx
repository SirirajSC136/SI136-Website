// app/admin/customize/[subjectId]/components/QuizForm.tsx
"use client";

import { Trash2, PlusCircle } from 'lucide-react';

export default function QuizForm({ content, setContent }: { content: any, setContent: Function }) {
    const questions = content?.questions || [];

    const handleQuestionChange = (qIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].question = value;
        setContent({ ...content, questions: newQuestions });
    };

    const handleChoiceChange = (qIndex: number, cIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].choices[cIndex] = value;
        setContent({ ...content, questions: newQuestions });
    };

    const setCorrectAnswer = (qIndex: number, cIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answerIndex = cIndex;
        setContent({ ...content, questions: newQuestions });
    };

    const addQuestion = () => {
        const newQuestions = [...questions, {
            id: `q${Date.now()}`,
            question: '',
            choices: ['', '', '', ''],
            answerIndex: 0,
            explanation: ''
        }];
        setContent({ ...content, questions: newQuestions });
    };

    const removeQuestion = (qIndex: number) => {
        const newQuestions = questions.filter((_: any, index: number) => index !== qIndex);
        setContent({ ...content, questions: newQuestions });
    };

    return (
        <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1">
            {questions.map((q: any, qIndex: number) => (
                <div key={q.id || qIndex} className="p-3 border rounded-lg bg-slate-50 relative">
                    <h4 className="font-semibold mb-2">Question {qIndex + 1}</h4>
                    <textarea
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                        placeholder="Question text..."
                        className="w-full p-2 border rounded mb-2"
                        rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {q.choices.map((choice: string, cIndex: number) => (
                            <div key={cIndex} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name={`answer_${q.id || qIndex}`}
                                    checked={q.answerIndex === cIndex}
                                    onChange={() => setCorrectAnswer(qIndex, cIndex)}
                                    className="h-5 w-5"
                                />
                                <input
                                    type="text"
                                    value={choice}
                                    onChange={(e) => handleChoiceChange(qIndex, cIndex, e.target.value)}
                                    placeholder={`Choice ${cIndex + 1}`}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => removeQuestion(qIndex)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={addQuestion} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
                <PlusCircle size={16} /> Add Question
            </button>
        </div>
    );
}