"use client";

import { PlusCircle, Trash2 } from "lucide-react";

export default function QuizForm({
	content,
	setContent,
}: {
	content: any;
	setContent: (content: any) => void;
}) {
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
		const newQuestions = [
			...questions,
			{
				id: `q${Date.now()}`,
				question: "",
				choices: ["", "", "", ""],
				answerIndex: 0,
				explanation: "",
			},
		];
		setContent({ ...content, questions: newQuestions });
	};

	const removeQuestion = (qIndex: number) => {
		const newQuestions = questions.filter((_: any, index: number) => index !== qIndex);
		setContent({ ...content, questions: newQuestions });
	};

	return (
		<div className="max-h-[50vh] space-y-4 overflow-y-auto p-1">
			{questions.map((question: any, qIndex: number) => (
				<div
					key={question.id || qIndex}
					className="relative rounded-lg border border-border bg-secondary-background p-3"
				>
					<h4 className="mb-2 font-semibold text-foreground">Question {qIndex + 1}</h4>
					<textarea
						value={question.question}
						onChange={(event) => handleQuestionChange(qIndex, event.target.value)}
						placeholder="Question text..."
						className="mb-2 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
						rows={2}
					/>
					<div className="mb-2 grid grid-cols-2 gap-2">
						{question.choices.map((choice: string, cIndex: number) => (
							<div key={cIndex} className="flex items-center gap-2">
								<input
									type="radio"
									name={`answer_${question.id || qIndex}`}
									checked={question.answerIndex === cIndex}
									onChange={() => setCorrectAnswer(qIndex, cIndex)}
									className="h-4 w-4"
								/>
								<input
									type="text"
									value={choice}
									onChange={(event) =>
										handleChoiceChange(qIndex, cIndex, event.target.value)
									}
									placeholder={`Choice ${cIndex + 1}`}
									className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
								/>
							</div>
						))}
					</div>
					<button
						type="button"
						onClick={() => removeQuestion(qIndex)}
						className="absolute right-2 top-2 rounded-md p-1 text-red-500 hover:bg-red-500/10"
					>
						<Trash2 size={16} />
					</button>
				</div>
			))}
			<button
				type="button"
				onClick={addQuestion}
				className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
			>
				<PlusCircle size={16} /> Add Question
			</button>
		</div>
	);
}
