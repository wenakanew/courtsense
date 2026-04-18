// CourtSense - Legal document analyzer powered by Lovable AI (Gemini)
// Returns structured plain-English analysis: summary, risks, rights, next steps, draft response.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CourtSense, a calm, plain-spoken legal aid assistant for everyday people who cannot afford a lawyer. The user is often scared, confused, or vulnerable. Be warm, direct, and never condescending.

Your job: read a legal document the user received (a letter, summons, lease, contract, notice, demand, eviction, etc.) and explain what it actually means in plain English at roughly an 8th-grade reading level. NEVER invent facts. If something is ambiguous, say so.

Always:
- Identify the document type plainly (e.g. "debt collection notice", "eviction notice", "rental lease", "cease and desist letter")
- Use everyday words. Avoid Latin and legalese unless you immediately translate it.
- Be specific about deadlines and dollar amounts that appear in the document.
- Flag clauses or claims that are unfair, predatory, unenforceable, or commonly disputed.
- Explain the user's rights in the context of the document. Note that this is general guidance, not legal advice.
- Suggest concrete next steps.
- If a response letter is appropriate, draft one in a calm, formal, respectful tone. Never threaten.

You MUST call the "return_legal_analysis" tool exactly once with your full structured analysis.`;

const tools = [
  {
    type: "function",
    function: {
      name: "return_legal_analysis",
      description: "Return the full structured plain-English legal analysis.",
      parameters: {
        type: "object",
        properties: {
          documentType: {
            type: "string",
            description: "Plain name for the document, e.g. 'Eviction notice', 'Debt collection letter', 'Residential lease'.",
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Overall urgency: how quickly the user should act.",
          },
          urgencySummary: {
            type: "string",
            description: "One short sentence: how urgent is this and why. Mention the soonest deadline if any.",
          },
          plainSummary: {
            type: "string",
            description: "2-4 short paragraphs in plain English explaining what the document actually says and what it means for the user.",
          },
          keyFacts: {
            type: "array",
            description: "The most important concrete facts pulled from the document (deadlines, amounts, parties, dates).",
            items: {
              type: "object",
              properties: {
                label: { type: "string", description: "Short label, e.g. 'Deadline to respond', 'Amount claimed', 'Sender'." },
                value: { type: "string", description: "The actual value as it appears or is implied in the document." },
              },
              required: ["label", "value"],
              additionalProperties: false,
            },
          },
          risks: {
            type: "array",
            description: "Clauses, demands, or claims that are risky, unfair, predatory, or commonly unenforceable. 0-6 items.",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Short label for the risk, e.g. 'Waiver of right to sue'." },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                quote: { type: "string", description: "Short quoted or paraphrased snippet from the document this refers to. May be empty if implied." },
                explanation: { type: "string", description: "Why this matters, in plain English." },
              },
              required: ["title", "severity", "quote", "explanation"],
              additionalProperties: false,
            },
          },
          rights: {
            type: "array",
            description: "The user's rights in the context of this document. 2-6 items. Generic but contextual. Always note this is general info, not legal advice.",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                explanation: { type: "string" },
              },
              required: ["title", "explanation"],
              additionalProperties: false,
            },
          },
          nextSteps: {
            type: "array",
            description: "Ordered concrete actions the user should consider, soonest first. 3-6 items.",
            items: { type: "string" },
          },
          draftResponse: {
            type: "object",
            description: "A draft response letter the user can send. If a response is not appropriate, set 'applicable' to false and leave body empty.",
            properties: {
              applicable: { type: "boolean" },
              subject: { type: "string", description: "Subject line or 'Re:' line for the response." },
              body: { type: "string", description: "Full letter body in formal, calm, respectful tone. Use [BRACKETS] for any info the user must fill in (their name, address, etc.)." },
            },
            required: ["applicable", "subject", "body"],
            additionalProperties: false,
          },
          disclaimer: {
            type: "string",
            description: "A short disclaimer that this is general information, not legal advice, and that they should consult a lawyer for binding decisions.",
          },
        },
        required: [
          "documentType",
          "severity",
          "urgencySummary",
          "plainSummary",
          "keyFacts",
          "risks",
          "rights",
          "nextSteps",
          "draftResponse",
          "disclaimer",
        ],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null);
    const documentText: string | undefined = body?.documentText;
    const region: string | undefined = body?.region;

    if (!documentText || typeof documentText !== "string" || documentText.trim().length < 30) {
      return new Response(
        JSON.stringify({ error: "Please provide the document text (at least a few sentences)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (documentText.length > 60000) {
      return new Response(
        JSON.stringify({ error: "Document is too long. Please paste up to 60,000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userContent = `Region/country (for context, may be empty): ${region || "unspecified"}

Here is the document the user received. Read it carefully and return the full structured analysis by calling the return_legal_analysis tool.

--- BEGIN DOCUMENT ---
${documentText}
--- END DOCUMENT ---`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_legal_analysis" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text().catch(() => "");
      console.error("AI gateway error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "We're getting a lot of requests right now. Please try again in a minute." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "Something went wrong analyzing the document. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call in AI response", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "We couldn't read the analysis. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let analysis: unknown;
    try {
      analysis = JSON.parse(argsStr);
    } catch (e) {
      console.error("Failed to parse tool args", e);
      return new Response(
        JSON.stringify({ error: "We couldn't parse the analysis. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-document error", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
