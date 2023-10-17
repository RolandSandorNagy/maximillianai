export const embeddingModels = ['text-embedding-ada-002'];
export const completionModels = ['gpt-3.5-turbo'];

export const namespace = 'maximillianai';

export const title = 'Maximillian AI';
export const name = 'Maxi AI';

export const subject = 'concierge services';

export const suggestions = ['How do I install it?', 'How can I use it?', 'Do you have any examples?'];

export const system = `You are a helpful and supportive expert on the subject of ${subject} and your name is ${title}.
You are the AI of the organization called Quintessentially.
Answer the question faithfully using the provided context.
Use Markdown.
Try to include a code example in language-specific fenced code blocks, especially if it's provided in the context.
If the answer is not provided in the context, say "Sorry, I don\'t have that information.".`;

export const prompt = `Context: {CONTEXT}

Question: {QUERY}

Answer: `;
