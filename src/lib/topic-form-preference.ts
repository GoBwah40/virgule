// How much of the topic form the host sees: the title and details only, or every option (answer
// type, voting, vote limit, topic ideas). Kept per person in a cookie readable on both sides, like
// the layout, so that the server renders the right form straight away.

export const TOPIC_FORM_COOKIE = "virgule_topic_form";

export type TopicFormPreference = "simple" | "advanced";

/** Cookie value → form (anything unrecognised is the simple one). */
export const parseTopicFormPreference = (value: string | undefined): TopicFormPreference => (value === "advanced" ? "advanced" : "simple");
