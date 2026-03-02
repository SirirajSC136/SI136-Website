export interface IActivity {
	id: string;
	type: "event" | "assignment" | "examination";
	courseCode: string;
	title: string;
	dateTime: string; // Using string for simplicity in hardcoded data
	details?: string;
	tag?: string;
}

// Define the possible tags for a topic
export type TopicTag = "Lec" | "Async" | "GA" | "LAB" | "Test" | "FC" | "TBL" | "Online";

export interface Resource {
	type: "PDF" | "Slides" | "Video" | "Link";
	title: string;
	url: string;
}

// Define the type for an assignment
export interface Assignment {
	title: string;
	dueDate: string;
	url: string;
}

export interface AssignmentItem {
	id: string; // A unique ID, we'll use the row index for this
	workName: string;
	deadline: string;
	subject: string;
	detailsUrl: string;
}

export type TopicItemType =
	| "Header"
	| "Page"
	| "File"
	| "Link"
	| "Quiz"
	| "Flashcard";

export type ImageAsset = {
	path: string;
	url: string;
	alt: string;
};

export type QuizFeedbackMode = "instant" | "after_submit";
export type ShortAnswerMatchMode =
	| "exact"
	| "ignore_case"
	| "ignore_case_and_whitespace";

export type QuizMcqOption = {
	id: string;
	textMarkdown: string;
	weight: number;
};

export type QuizQuestionBase = {
	id: string;
	promptMarkdown: string;
	image?: ImageAsset;
	maxPoints: number;
	explanationMarkdown?: string;
};

export type QuizMcqQuestion = QuizQuestionBase & {
	kind: "mcq";
	options: QuizMcqOption[];
};

export type QuizShortAnswerQuestion = QuizQuestionBase & {
	kind: "short_answer";
	acceptedAnswers: string[];
	matchMode: ShortAnswerMatchMode;
};

export type QuizQuestion = QuizMcqQuestion | QuizShortAnswerQuestion;

export type QuizContent = {
	settings: {
		feedbackMode: QuizFeedbackMode;
		shuffleQuestions: boolean;
	};
	questions: QuizQuestion[];
};

export type Flashcard = {
	id: string;
	frontMarkdown: string;
	frontImage?: ImageAsset;
	backMarkdown: string;
	backImage?: ImageAsset;
};

export type FlashcardContent = {
	settings: {
		shuffleAllowed: boolean;
	};
	cards: Flashcard[];
};

type TopicItemBase = {
	id: string; // The Canvas or custom unique ID (e.g., "custom-123")
	_id?: string;
	title: string;
	isCustom?: boolean;
};

export type HeaderTopicItem = TopicItemBase & {
	type: "Header";
};

export type PageTopicItem = TopicItemBase & {
	type: "Page";
	htmlContent?: string;
	canvasUrl?: string;
};

export type FileTopicItem = TopicItemBase & {
	type: "File";
	url?: string;
};

export type LinkTopicItem = TopicItemBase & {
	type: "Link";
	url?: string;
};

export type QuizTopicItem = TopicItemBase & {
	type: "Quiz";
	interactiveRefId?: string;
	content?: QuizContent;
};

export type FlashcardTopicItem = TopicItemBase & {
	type: "Flashcard";
	interactiveRefId?: string;
	content?: FlashcardContent;
};

export type TopicItemData = {
	id: string;
	_id?: string;
	title: string;
	type: TopicItemType;
	isCustom?: boolean;
	url?: string;
	htmlContent?: string;
	canvasUrl?: string;
	interactiveRefId?: string;
	content?: QuizContent | FlashcardContent;
};

// Update the Topic type to hold these new, richer items
export type Topic = {
	id: string;
	title: string;
	items: TopicItemData[]; // <-- Changed from 'files: TopicFile[]'
	isCustom?: boolean;
	category?: string; // <-- To classify where to put the topic
};

// The main Subject type
export type Subject = {
	_id: string;
	courseCode: string;
	title: string;
	year: number;
	semester: number;
	imageUrl: string;
	canvasUrl?: string; // <-- MAKE THIS OPTIONAL
	filesUrl?: string; // <-- MAKE THIS OPTIONAL
	syllabus: string;
	topics: Topic[];
};

export interface CalendarEvent {
	id: string;
	courseCode: string;
	title: string;
	startTime: string;
	endTime?: string;
	location?: string;
	tag: string;
	details: string;
	subjectPageUrl: string;
	category: "class" | "summative" | "exam" | "other";
	isAllDay: boolean;
	source: "google";
	htmlLink?: string;
}

export interface Task {
	id: string;
	type: "assignment" | "examination";
	courseCode: string;
	subjectTitle: string;
	title: string;
	deadline: string;
	subjectId: string;
}
