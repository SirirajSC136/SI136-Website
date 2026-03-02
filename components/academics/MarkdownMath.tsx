"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type Props = {
	value: string;
	className?: string;
};

export default function MarkdownMath({ value, className }: Props) {
	return (
		<div className={className}>
			<ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
				{value}
			</ReactMarkdown>
		</div>
	);
}
