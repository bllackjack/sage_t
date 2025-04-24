import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function generateText(prompt: string): Promise<string> {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
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

export async function testOpenAI() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Tell me a joke" }],
      model: "gpt-3.5-turbo",
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw error;
  }
}
