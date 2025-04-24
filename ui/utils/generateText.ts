import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const THERAPIST_PROMPT = `You are an AI therapist. Your goal is to provide empathetic, supportive, and helpful responses to the user's questions. You should respond in a warm, friendly, and understanding manner, offering advice or listening to the user's concerns without judgment. 

User Query: "{user_query}"

Please respond as though you are a compassionate and knowledgeable therapist, keeping in mind that you are here to help and support the user. Your responses should sound natural, thoughtful, and emotionally intelligent. Focus on helping the user feel heard and understood.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function generateText(
  prompt: string,
  conversation: Message[]
): Promise<string> {
  try {
    // Format conversation history into a single string
    const conversationHistory = conversation
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Therapist"}: ${msg.content}`
      )
      .join("\n\n");

    const fullPrompt = `Previous Conversation:\n${conversationHistory}\n\n${THERAPIST_PROMPT.replace(
      "{user_query}",
      prompt
    )}`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 100,
            return_full_text: false,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get response from LLM");
    }

    const data = await response.json();
    return data[0].generated_text;
  } catch (error) {
    console.error("Error getting LLM response:", error);
    throw new Error("Error getting response from LLM. Please try again.");
  }
}

export async function testOpenAI(prompt: string, conversation: Message[]) {
  console.log(conversation);
  try {
    const messages = [
      {
        role: "system" as const,
        content:
          "You are an AI therapist. Your goal is to provide empathetic, supportive, and helpful responses to the user's questions. You should respond in a warm, friendly, and understanding manner, offering advice or listening to the user's concerns without judgment.",
      },
      ...conversation.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo",
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw error;
  }
}
