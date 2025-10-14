// app/admin/create/quiz/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlusCircle, Trash2, Save, Loader2 } from 'lucide-react';

// Define types for our quiz structure
interface Question {
    id: string;
    question: string;
    choices: string[];
    answerIndex: number;
    explanation: string;
}

export default function CreateQuizPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Params for creating a new quiz
    const courseId = searchParams.get('courseId');
    const topicId = searchParams.get('topicId');

    // Param for editing an existing quiz
    const materialId = searchParams.get('materialId');

    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialCourseId, setInitialCourseId] = useState<string | null>(courseId);

    // Fetch existing quiz data if we are in "edit" mode
    useEffect(() => {
        if (materialId) {
            setLoading(true);
            fetch(`/api/admin/materials/${materialId}`)
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch quiz data");
                    return res.json();
                })
                .then(data => {
                    setTitle(data.item.title);
                    setQuestions(data.item.content.questions || []);
                    setInitialCourseId(data.courseId); // Store the courseId for navigation
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    alert("Could not load quiz data for editing.");
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [materialId]);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: `q${Date.now()}`,
                question: '',
                choices: ['', '', '', ''],
                answerIndex: 0,
                explanation: ''
            }
        ]);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        (newQuestions[index] as any)[field] = value;
        setQuestions(newQuestions);
    };

    const updateChoice = (qIndex: number, cIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].choices[cIndex] = value;
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSaveQuiz = async () => {
        if (!title.trim() || questions.length === 0) {
            alert('Please provide a title and at least one question.');
            return;
        }

        const isEditing = !!materialId;
        const url = isEditing ? `/api/admin/materials/${materialId}` : '/api/admin/materials';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = {
            // For POST (creation), we must include courseId and topicId.
            // For PUT (editing), these are not needed in the body.
            ...(!isEditing && { courseId, topicId }),
            item: {
                type: 'Quiz',
                title: title,
                content: {
                    questions: questions,
                }
            }
        };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to save the quiz.');

            alert('Quiz saved successfully!');
            // Navigate back to the course customization page
            router.push(`/admin/customize/${initialCourseId}`);
            router.refresh(); // Ensures the page reloads data
        } catch (error) {
            console.error(error);
            alert('An error occurred while saving the quiz.');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-slate-600">Loading Quiz Editor...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-2">{materialId ? 'Edit Quiz' : 'Create New Quiz'}</h1>
            <p className="text-slate-600 mb-6">Build the questions and choices for your quiz.</p>

            <div className="space-y-6">
                {/* Quiz Title */}
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                    <label className="block text-lg font-semibold text-slate-800 mb-2">Quiz Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Midterm 1 Review"
                        className="w-full p-2 border rounded"
                    />
                </div>

                {/* Questions */}
                {questions.map((q, qIndex) => (
                    <div key={q.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
                        <h3 className="font-bold text-lg mb-3">Question {qIndex + 1}</h3>
                        <textarea
                            value={q.question}
                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                            placeholder="Type the question here..."
                            className="w-full p-2 border rounded mb-3"
                            rows={2}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            {q.choices.map((choice, cIndex) => (
                                <div key={cIndex} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name={`answer_${q.id}`}
                                        checked={q.answerIndex === cIndex}
                                        onChange={() => updateQuestion(qIndex, 'answerIndex', cIndex)}
                                        className="h-5 w-5 flex-shrink-0 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <input
                                        type="text"
                                        value={choice}
                                        onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                                        placeholder={`Choice ${cIndex + 1}`}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                            ))}
                        </div>
                        <textarea
                            value={q.explanation}
                            onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                            placeholder="Explanation for the correct answer..."
                            className="w-full p-2 border rounded"
                            rows={2}
                        />
                        <button onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 p-1 text-red-500 rounded-md hover:bg-red-100 hover:text-red-700">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                    <button onClick={addQuestion} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                        <PlusCircle size={18} /> Add Question
                    </button>
                    <button onClick={handleSaveQuiz} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold text-lg hover:bg-emerald-700">
                        <Save size={20} /> Save Quiz
                    </button>
                </div>
            </div>
        </div>
    );
}