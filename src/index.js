export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Handle API route for parsing text & images via Gemini
    if (request.method === "POST" && url.pathname === "/api/parse") {
      try {
        const body = await request.json();
        const userText = body.text || "";
        const requestedModel = body.model || "gemini-3.1-flash-lite";
        const currentState = body.currentState || {};
        const imageBase64 = body.image; // Optional base64 image input

        if (!userText && !imageBase64) {
          return new Response(JSON.stringify({ error: "Missing both text input and image input" }), {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" }
          });
        }

        const API_KEY = body.geminiApiKey || env.GEMINI_API_KEY || "";
        if (!API_KEY) {
          return new Response(JSON.stringify({ error: "Gemini API Key 未設定，請在 AI 助理的設定欄位中填入您的 Gemini API Key！" }), {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" }
          });
        }

        // Validate and select model
        let modelId = "gemini-3.5-flash";
        if (requestedModel === "gemini-3.1-flash-lite") {
          modelId = "gemini-3.1-flash-lite";
        }

        const systemPrompt = `You are a helpful receipt data extraction assistant. Your job is to extract receipt details from the user's text and/or image, and UPDATE the current state of the form.

The current state of the form is:
${JSON.stringify(currentState, null, 2)}

Your task is to merge the new information from the user's input into this current state and return the updated state.
Extract information as a JSON object matching this schema:
{
  "purpose": string (default to ""),
  "department": string (default to "會計部"),
  "amount": number (default to null),
  "tax_rate": number (default to null),
  "name": string (default to ""),
  "date": string (default to "", formatted as YYYY-MM-DD),
  "citizenship": "ROC" | "foreign" (default to "ROC"),
  "id_number": string (default to ""),
  "tax_id": string (default to ""),
  "birthday": string (default to "", formatted as YYYY-MM-DD),
  "nationality": string (default to ""),
  "arc_number": string (default to ""),
  "address_registered": string (default to ""),
  "address_mailing": string (default to ""),
  "phone": string (default to ""),
  "mobile": string (default to ""),
  "income_category": "salary" | "rent" | "commission" | "professional" | "contest" | "other" (default to "professional")
}

Guidelines:
1. Start with the values in the "current state" provided above.
2. If the user mentions or uploads new details, update those fields.
3. If a field is not mentioned or visible, you MUST retain the exact value from the "current state". Do NOT overwrite it with defaults or empty values.
4. If the user corrects a field (e.g. "Wait, change the name to Tom"), update it.
5. If the details imply they are a Taiwanese/ROC citizen or provides a standard ROC ID (starts with a letter followed by 9 digits, e.g. A123456789), set citizenship to "ROC".
6. If they are foreign or have an ARC/居留證 or passport number, set citizenship to "foreign".
7. Convert R.O.C. birth years (民國) to standard YYYY-MM-DD. (Formula: R.O.C. year + 1911. E.g. 民國 80 年 -> 1991).
8. If the user specifies income categories like:
   - "薪資", "薪水", "salary", "wage" -> set income_category to "salary"
   - "租金", "房租", "rent" -> set income_category to "rent"
   - "佣金", "commission" -> set income_category to "commission"
   - "翻譯費", "稿費", "演講費", "會計師", "professional fee", "lecture fee" -> set income_category to "professional"
   - "獎金", "中獎", "競技", "prize", "award" -> set income_category to "contest"
   - Otherwise, map to "other" or "professional" depending on context.
9. Auto-correction of typos: Automatically correct typos using contextual knowledge (especially for names, purpose description, and Taiwan addresses). Correct "台南市永坑區" to "台南市永康區", "高雄市苓牙區" to "高雄市苓雅區", "中畫路" to "中華路", "信宜路" to "信義路", "五福錄" to "五福路", or "高熊市" to "高雄市".
10. Distinguish phone and mobile (Taiwan phone number format rules):
    - If a number starts with "09" (e.g. 0922764763, 0912-345678, or is described as "手機", "行動電話"), it is STRICTLY a mobile phone number. You MUST set it to the "mobile" field and leave "phone" unchanged.
    - If a number starts with local area codes (e.g. 02, 03, 04, 05, 06, 07, 08, such as 06-3126533, 02-27001234, or is described as "電話", "市話", "聯絡電話"), it is STRICTLY a landline telephone. You MUST set it to the "phone" field and leave "mobile" unchanged.

Ensure the output is ONLY valid JSON. Return only the JSON object.`;

        // Prepare request contents for Gemini API
        const parts = [];
        if (userText) {
          parts.push({ text: `Extract from this user input: "${userText}"` });
        } else {
          parts.push({ text: "Extract receipt details from the attached image." });
        }

        if (imageBase64) {
          try {
            const matches = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
            if (matches) {
              parts.push({
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
                }
              });
            } else {
              parts.push({
                inlineData: {
                  mimeType: "image/png",
                  data: imageBase64.split(",")[1] || imageBase64
                }
              });
            }
          } catch (err) {
            return new Response(JSON.stringify({ error: "Failed to parse base64 image", details: err.message }), {
              status: 400,
              headers: { "Content-Type": "application/json; charset=utf-8" }
            });
          }
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [
              {
                role: "user",
                parts: parts
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          return new Response(JSON.stringify({ error: "Gemini API request failed", details: errText }), {
            status: response.status,
            headers: { "Content-Type": "application/json; charset=utf-8" }
          });
        }

        const geminiData = await response.json();
        let rawResult = "";
        try {
          rawResult = geminiData.candidates[0].content.parts[0].text;
        } catch (e) {
          return new Response(JSON.stringify({ error: "Failed to extract content from Gemini response", details: JSON.stringify(geminiData) }), {
            status: 500,
            headers: { "Content-Type": "application/json; charset=utf-8" }
          });
        }

        let successfullyUsedModel = modelId;
        let parsedData = null;

        if (rawResult && typeof rawResult === "object") {
          parsedData = rawResult;
        } else if (typeof rawResult === "string") {
          let cleanedText = rawResult.trim();
          
          // Remove any thinking tags (e.g. <think>...</think>)
          cleanedText = cleanedText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

          // Extract first occurrence of { and last occurrence of } to get clean JSON
          const firstBrace = cleanedText.indexOf("{");
          const lastBrace = cleanedText.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
          } else {
            // Strip markdown block markers as fallback
            if (cleanedText.startsWith("```json")) {
              cleanedText = cleanedText.slice(7);
            }
            if (cleanedText.endsWith("```")) {
              cleanedText = cleanedText.slice(0, -3);
            }
            cleanedText = cleanedText.trim();
          }
          
          try {
            parsedData = JSON.parse(cleanedText);
          } catch (e) {
            console.error("Failed to parse AI string response as JSON:", cleanedText);
            parsedData = { 
              error: "AI output is not valid JSON", 
              raw: cleanedText
            };
          }
        } else {
          parsedData = { 
            error: "Unknown response type from AI", 
            raw: String(rawResult)
          };
        }

        if (parsedData) {
          parsedData._model = successfullyUsedModel;
        }

        return new Response(JSON.stringify(parsedData), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }
    }

    // 2. Allow CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // 3. Serve static assets
    return env.ASSETS.fetch(request);
  }
};
