import { Topic } from "@/types";

export function classifyTopics(topics: Topic[]) {
    const MAIN_KEYWORDS = ["siid", "scid", "itcs", "egid"];

    const main = topics.filter((t) =>
        MAIN_KEYWORDS.some((kw) => t.title?.toLowerCase().includes(kw))
    );
    const others = topics.filter((t) => !main.includes(t));

  return { main, others };
}