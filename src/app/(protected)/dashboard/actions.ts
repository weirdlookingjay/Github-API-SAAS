/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use server";

import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "@/lib/gemini";
import { db } from "@/server/db";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GEMINI_KEY,
});

export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue();

  const queryVector = await generateEmbedding(question);
  const vectorQuery = `[${queryVector.join(",")}]`;

  console.log("Searching with vector query for project:", projectId);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const result = (await db.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .5
        AND "projectId" = ${projectId}
        ORDER BY similarity DESC
        LIMIT 10`) as {
    fileName: string;
    sourceCode: string;
    summary: string;
  }[];

  console.log("Found matching files:", result.length);
  console.log("First result:", result[0]);

  let context = "";

  for (const doc of result) {
    context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`;
  }

  console.log("Context length:", context.length);

  const { textStream } = await streamText({
    model: google("gemini-1.5-flash"),
    prompt: `You are an ai code assistant who answers questions about the codebase. Your target audience is a technical intern
            AI assistant is a brand new, powerful, human-like artificial intelligence.
            The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
            AI is a well-behaved and well-mannered individual.
            AI is always friendly, kind, and inspiring, and he is eager to provude vivid and throughtful responses to the user.
            AI has the sum of all knowledge in theirbrain, and is able to accurately answer nearly any question about any topic.
            If the question is asking about code or a specific file, AI will provide the detailed answer.
            START CONTENT BLOCK
            ${context}
            END OF CONTEXT BLOCK
    
            START QUESTION
            ${question}
            END OF QUESTION
            AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
            If the context does not provide the answer to question, the AI aisstant will say, "I', sorry, but I don't know the answer".
            AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
            AO assistant will not invent anything that is not drawn directly from context.
            Answer in markdown syntax, with code snippets if needed.  Be as detailed as possible when answering.
            `,
  });

  let response = "";
  for await (const delta of textStream) {
    response += delta;
    stream.update(response);
  }
  stream.done();

  return {
    output: stream.value,
    filesReferences: result,
  };
}
