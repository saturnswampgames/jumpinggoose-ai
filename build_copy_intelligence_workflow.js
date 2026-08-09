const fs = require("fs");
const path = require("path");

// ============================================================================
// JUMPINGGOOSE Agency Text Workflow Generator
// Strategy + Communication + Social + Copy + General + Discovery + Memory
// Visual/image-generation work is intentionally excluded.
// ============================================================================

const WORKFLOW_FILE = "JumpingGoose_TextAgency_n8n_Workflow.json";

const MODELS = {
  MEMORY: ["openai/gpt-oss-20b:free", "inclusionai/ling-3.0-tiny:free", "google/gemma-4-26b-a4b-it:free"],
  DISCOVERY: ["google/gemma-4-31b-it:free", "inclusionai/ling-3.0-tiny:free", "openai/gpt-oss-20b:free"],
  STRATEGY: ["nvidia/nemotron-3-super-120b-a12b:free", "google/gemma-4-31b-it:free", "openai/gpt-oss-20b:free"],
  COMMS: ["google/gemma-4-26b-a4b-it:free", "openai/gpt-oss-20b:free", "inclusionai/ling-3.0-tiny:free"],
  SOCIAL: ["openai/gpt-oss-20b:free", "google/gemma-4-26b-a4b-it:free", "inclusionai/ling-3.0-tiny:free"],
  COPY: ["openai/gpt-oss-20b:free", "google/gemma-4-26b-a4b-it:free", "inclusionai/ling-3.0-tiny:free"],
  GENERAL: ["openai/gpt-oss-20b:free", "inclusionai/ling-3.0-tiny:free", "google/gemma-4-26b-a4b-it:free"],
  MEMORY_WRITE: ["openai/gpt-oss-20b:free", "inclusionai/ling-3.0-tiny:free", "google/gemma-4-26b-a4b-it:free"]
};

const agencyVoice = [
  "JUMPINGGOOSE Agency voice:",
  "- Warm, sharp, direct, curious, and human.",
  "- Strategic before clever. Specific before polished.",
  "- Ask 1-3 useful questions when the brief is thin.",
  "- Avoid corporate filler, fake certainty, and vague claims.",
  "- No visual identity, image prompts, logo, palette, typography, or art direction in this workflow."
].join("\n");

const memoryPrompt = `You are the Memory Agent for JUMPINGGOOSE Agency.
Analyze user input, current memory, and feedback.
Return only JSON: {updated_memory, context_injection, specificity_flags, follow_up_probes, action_type, needs_web_research, research_query, meta}.
action_type must be DISCOVERY, STRATEGY, COMMS, SOCIAL, COPY, GENERAL, or FEEDBACK.
Respect any initial_action_type passed in by the workflow unless the user clearly asks for something else.
Set needs_web_research true only for current facts, competitor/category context, trends, SEO, platform norms, claims, or examples that need external context.`;

const discoveryPrompt = `You are the Discovery Agent for JUMPINGGOOSE Agency.
Guide brand discovery conversations: warm, direct, curious.
Ask only the matched questions provided. Max 1-3 questions.
If answers are vague, probe deeper instead of moving ahead.
Do not ask visual-design questions.
Return normal conversational text only. Do not wrap the answer in JSON or code fences.`;

const strategyPrompt = `You are the Brand Strategist for JUMPINGGOOSE Agency.
Apply only the selected strategy framework provided.
Use brief facts, memory, and research context. Do not invent proof.
Provide structured strategic direction with rationale and next copy implications.
Return clean Markdown/plain text only. Do not wrap the answer in JSON or code fences.`;

const commsPrompt = `You are the Communication Architect for JUMPINGGOOSE Agency.
Apply only the selected communication framework provided.
Build text-first messaging, campaign, stakeholder, or channel communication guidance.
Make ideas executable with message examples and strategic rationale.
Return clean Markdown/plain text only. Do not wrap the answer in JSON or code fences.`;

const socialPrompt = `You are the Social Content Strategist for JUMPINGGOOSE Agency.
Create platform-native text/content direction for social media.
Focus on post ideas, captions, hooks, series, calendars, community prompts, and messaging.
Do not create image prompts, visual directions, moodboards, palettes, or design guidance.
Return clean Markdown/plain text only. Do not wrap the answer in JSON or code fences.`;

const copyPrompt = `You are the Copywriter for JUMPINGGOOSE Agency.
Follow the selected voice guidelines, method, and requested deliverable.
Match the brand's tone and user need.
Provide primary copy plus useful alternatives and brief strategic rationale.
Return clean Markdown/plain text only. Do not wrap the answer in JSON or code fences.`;

const generalPrompt = `You are JUMPINGGOOSE Agency.
Answer general brand, copy, strategy, communication, and social-content questions in the agency voice.
If the user actually needs a brief, ask 1-3 sharp questions.
Stay text-first; do not produce visual/image-generation guidance.
Return normal conversational text only. Do not wrap the answer in JSON or code fences.`;

const memoryWritePrompt = `You are the Memory Curator for JUMPINGGOOSE Agency.
Return only JSON: {updated_memory, session_summary, final_output}.
Keep durable brand facts, preferences, audience details, offer details, tone choices, decisions, and reusable direction.
final_output must preserve the user-facing answer exactly.`;

const questionnaireReference = {
  INTRO: {
    triggers: ["new brand", "start", "hello", "hi", "begin", "brand name"],
    questions: {
      I1: "What is your brand name?",
      I2: "What type of project are we working on? Brand Strategy, Brand Communication, Social Content, Copywriting, Rebranding, or General Brand Help?",
      I3: "What category does the brand operate in?"
    }
  },
  CORE_IDENTITY: {
    triggers: ["conviction", "belief", "purpose", "why", "mission", "values"],
    questions: {
      C1: "What is the one conviction that drives your brand? Not a tagline, the belief behind everything.",
      C2: "When your brand fulfils its promise, what changes in your customer's life?"
    }
  },
  CORE_AUDIENCE: {
    triggers: ["customer", "audience", "target", "buyer", "persona", "demographic"],
    questions: {
      C3: "Describe one person who needs this brand the most: age, city, context, and day-in-life.",
      C4: "What does your customer actively avoid? Brands, messages, behaviours, or tones they would reject."
    }
  },
  CORE_COMPETITION: {
    triggers: ["competitor", "competition", "differentiation", "unique", "better"],
    questions: {
      C5: "Who are your top 3 competitors, and where are they strong or weak?",
      C6: "What is the one specific thing you do better or differently?"
    }
  },
  CORE_PERSONALITY: {
    triggers: ["personality", "tone", "voice", "character", "vibe", "feel", "words"],
    questions: {
      C7: "Pick 5 words that must describe your brand, and 5 words that must never describe it.",
      C8: "Give me one sentence your brand would say, and one it would never say.",
      C9: "If the brand were a person in a room, how would it behave?"
    }
  },
  CORE_POSITIONING: {
    triggers: ["reference", "aspiration", "price", "positioning", "channel", "timeline", "goals"],
    questions: {
      C10: "Who is an aspirational reference brand and what do you admire about them?",
      C11: "What is the price positioning: budget, value, mid-premium, premium, or luxury?",
      C12: "What are the top 3 business goals for the next 12 months?"
    }
  },
  COMMS_ADDON: {
    triggers: ["campaign", "message", "channel", "content", "format", "asset", "launch"],
    questions: {
      M1: "What is the communication objective: awareness, consideration, conversion, loyalty, or trust?",
      M2: "What single message should feel true across everything?",
      M3: "Which channels matter most?"
    }
  },
  SOCIAL_ADDON: {
    triggers: ["social", "instagram", "linkedin", "post", "reel", "caption", "calendar", "ugc"],
    questions: {
      S1: "Which social platform matters most right now?",
      S2: "What should the audience do after seeing the content?",
      S3: "What content formats are realistic for the team to produce consistently?"
    }
  },
  REBRANDING_ADDON: {
    triggers: ["rebrand", "refresh", "evolve", "change", "broken"],
    questions: {
      R1: "Why is the brand changing now?",
      R2: "What must stay sacred through the change?",
      R3: "What audience perception needs to shift?"
    }
  }
};

const strategyFrameworks = {
  EQUATION_OF_TRUTH: {
    triggers: ["truth", "intersection", "consumer", "product truth", "brand truth"],
    framework: "Consumer Truth (drivers, fears, aspirations) + Product Truth (craft, advantages) = Brand Truth (the ownable intersection)."
  },
  GOLDEN_CIRCLE: {
    triggers: ["why", "purpose", "how", "what"],
    framework: "Why -> How -> What. Start with belief, then method, then product."
  },
  ARCHETYPE_PAIRING: {
    triggers: ["archetype", "personality", "character", "persona"],
    framework: "Select Primary Archetype + Secondary Archetype, then define behaviour, voice, and proof."
  },
  BRAND_PILLARS: {
    triggers: ["pillar", "foundation", "principle", "value prop"],
    framework: "4-6 strategic pillars with rationale, proof points, and expression guidelines."
  },
  POSITIONING: {
    triggers: ["positioning", "statement", "differentiation", "category"],
    framework: "For [target], [brand] is the [category] that [differentiation] because [reasons to believe]."
  },
  MANIFESTO: {
    triggers: ["manifesto", "anthem", "story", "soul", "narrative"],
    framework: "A belief-led narrative that captures the brand's point of view, tension, promise, and invitation."
  }
};

const communicationFrameworks = {
  CAMPAIGN_STRATEGY: {
    triggers: ["campaign", "kpi", "objective", "awareness", "conversion"],
    framework: "Objective and KPIs -> Audience segments -> Message hierarchy -> Channel roles -> Execution rhythm."
  },
  CONTENT_ARCHITECTURE: {
    triggers: ["content", "calendar", "pillar", "cadence", "format"],
    framework: "Content pillars -> Series ideas -> Cadence -> Format recommendations -> Measurement."
  },
  SIX_PILLAR_SOCIAL: {
    triggers: ["social", "instagram", "post", "reel", "engagement", "ugc"],
    framework: "6 pillars: Brand Posts, Product Posts, Engagement Posts, Moment Posts, Announcement Posts, Culture Posts."
  },
  CAMPAIGN_TERRITORIES: {
    triggers: ["territory", "direction", "idea", "concept", "hashtag"],
    framework: "Territory name -> Core idea -> Message hook -> Content series -> Hashtag -> Platform priority."
  },
  BRAND_COMMS_GUIDELINES: {
    triggers: ["guidelines", "dos", "donts", "crisis", "pr", "media", "stakeholder"],
    framework: "Messaging dos/donts -> Stakeholder templates -> PR guidance -> Crisis response principles."
  }
};

const voiceCopyReference = {
  VOICE: {
    characteristics: [
      "Warm but sharp. Never preachy or corporate.",
      "Short punchy sentences mixed with longer flowing ones.",
      "Specific sensory detail over empty premium language.",
      "Human, conversational, and strategically grounded.",
      "Ownable vocabulary that feels true to the brand."
    ]
  },
  METHODS: {
    triggers: {
      tagline: "AIDA",
      headline: "PAS",
      description: "FAB",
      benefit: "Benefit Laddering",
      email: "Problem -> Stakes -> Offer -> Action",
      website: "Promise -> Proof -> Fit -> Action"
    }
  },
  DELIVERABLES: {
    triggers: {
      tagline: "Taglines across tonal spectrums",
      headline: "Headlines and sub-headlines",
      manifesto: "Brand anthem or manifesto",
      product: "Product descriptions",
      social: "Social captions and hooks",
      website: "Website copy",
      email: "Email sequences",
      packaging: "Packaging copy"
    }
  }
};

function openRouterNode(id, name, model, systemPrompt, userExpression, temperature, position) {
  const modelField = Array.isArray(model)
    ? `models: ${JSON.stringify(model)},`
    : `model: "${model}",`;

  return {
    id,
    name,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.1,
    position,
    parameters: {
      method: "POST",
      url: "https://openrouter.ai/api/v1/chat/completions",
      authentication: "predefinedCredentialType",
      nodeCredentialType: "openRouterApi",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "Content-Type", value: "application/json" },
          { name: "HTTP-Referer", value: "https://jumpinggoose.ai" },
          { name: "X-Title", value: "JUMPINGGOOSE Text Agency" }
        ]
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: `={{ JSON.stringify({
        ${modelField}
        messages: [
          { role: "system", content: ${JSON.stringify(systemPrompt)} },
          { role: "user", content: ${userExpression} }
        ],
        temperature: ${temperature},
        max_tokens: 4096
      }) }}`,
      options: { timeout: 120000 }
    },
    credentials: {
      openRouterApi: {
        id: "7WTmdhjFDdhIURLL",
        name: "OpenRouter account"
      }
    }
  };
}

function waitNode(id, name, amount, position) {
  return {
    id,
    name,
    type: "n8n-nodes-base.wait",
    typeVersion: 1,
    position,
    parameters: {
      resume: "timeInterval",
      amount,
      unit: "seconds"
    }
  };
}

function referenceNode(id, name, value, position, fieldName) {
  return {
    id,
    name,
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position,
    parameters: {
      jsCode: `const input = $input.first().json || {};
return [{ json: { ...input, ${fieldName}: ${JSON.stringify(value)} } }];`
    }
  };
}

function prepNode(id, name, mode, position) {
  const code = {
    DISCOVERY: `const d = $input.first().json || {};
const questionnaire = d.questionnaireReference || {};
const completed = d.updated_memory?.completed_questions || d.updatedMemory?.completed_questions || [];
const text = String(d.userInput || "").toLowerCase();
let matched = {};
for (const [category, data] of Object.entries(questionnaire)) {
  if ((data.triggers || []).some((trigger) => text.includes(trigger))) {
    for (const [qid, question] of Object.entries(data.questions || {})) {
      if (!completed.includes(qid)) matched[qid] = question;
    }
  }
}
if (Object.keys(matched).length === 0) {
  for (const category of ["INTRO", "CORE_IDENTITY", "CORE_AUDIENCE", "CORE_PERSONALITY"]) {
    const questions = questionnaire[category]?.questions || {};
    for (const [qid, question] of Object.entries(questions)) {
      if (!completed.includes(qid)) matched[qid] = question;
    }
    if (Object.keys(matched).length) break;
  }
}
const selected = Object.entries(matched).slice(0, 3);
return [{ json: { ...d, matchedQuestions: selected.map(([id, q]) => \`\${id}: \${q}\`).join("\\n") } }];`,
    STRATEGY: `const d = $input.first().json || {};
const frameworks = d.strategyFrameworks || {};
const text = String(d.userInput || "").toLowerCase();
let selectedKey = Object.keys(frameworks).find((key) => (frameworks[key].triggers || []).some((trigger) => text.includes(trigger))) || "POSITIONING";
return [{ json: { ...d, selectedFrameworkName: selectedKey, selectedFramework: frameworks[selectedKey]?.framework || "" } }];`,
    COMMS: `const d = $input.first().json || {};
const frameworks = d.communicationFrameworks || {};
const text = String(d.userInput || "").toLowerCase();
let selectedKey = Object.keys(frameworks).find((key) => (frameworks[key].triggers || []).some((trigger) => text.includes(trigger))) || "CAMPAIGN_STRATEGY";
return [{ json: { ...d, selectedFrameworkName: selectedKey, selectedFramework: frameworks[selectedKey]?.framework || "" } }];`,
    SOCIAL: `const d = $input.first().json || {};
const frameworks = d.communicationFrameworks || {};
const selectedKey = "SIX_PILLAR_SOCIAL";
return [{ json: { ...d, selectedFrameworkName: selectedKey, selectedFramework: frameworks[selectedKey]?.framework || "" } }];`,
    COPY: `const d = $input.first().json || {};
const ref = d.voiceCopyReference || {};
const text = String(d.userInput || "").toLowerCase();
const deliverableKey = Object.keys(ref.DELIVERABLES?.triggers || {}).find((key) => text.includes(key)) || "copy";
const methodKey = Object.keys(ref.METHODS?.triggers || {}).find((key) => text.includes(key)) || deliverableKey;
return [{ json: {
  ...d,
  requestedDeliverable: ref.DELIVERABLES?.triggers?.[deliverableKey] || "Brand copy or messaging output",
  selectedMethod: ref.METHODS?.triggers?.[methodKey] || "Brief -> Audience -> Promise -> Proof -> Action",
  voiceGuidelines: (ref.VOICE?.characteristics || []).join("\\n")
} }];`,
    GENERAL: `const d = $input.first().json || {};
return [{ json: { ...d, generalContext: d.context_injection || "" } }];`
  }[mode];

  return {
    id,
    name,
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position,
    parameters: { jsCode: code }
  };
}

const n8nWorkflow = {
  id: "JGTextAgencyAgent",
  name: "JUMPINGGOOSE Agency Text Intelligence",
  active: true,
  updatedAt: new Date().toISOString(),
  settings: { executionOrder: "v1" },
  nodes: [
    {
      id: "chat-trigger",
      name: "n8n Chat Trigger",
      type: "@n8n/n8n-nodes-langchain.chatTrigger",
      typeVersion: 1.1,
      position: [80, 160],
      parameters: { options: {} }
    },
    {
      id: "webhook-trigger",
      name: "Webhook Trigger",
      type: "n8n-nodes-base.webhook",
      typeVersion: 1,
      position: [80, 420],
      webhookId: "jumpinggoose-text-agency",
      parameters: {
        httpMethod: "POST",
        path: "jumpinggoose-text-agency",
        responseMode: "lastNode",
        options: {
          responseHeaders: {
            entries: [
              { name: "Access-Control-Allow-Origin", value: "*" },
              { name: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" }
            ]
          }
        }
      }
    },
    {
      id: "standardize-input",
      name: "Standardize Input",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [340, 300],
      parameters: {
        jsCode: `const raw = $input.first()?.json || {};
const body = raw.body || raw;
const userInput = body.chatInput || body.message || body.prompt || body.text || body.userInput || raw.chatInput || "";
return [{
  json: {
    userInput: String(userInput || "").trim(),
    sessionId: body.sessionId || raw.sessionId || "default_session",
    currentMemory: body.memory || raw.memory || {},
    feedback: body.feedback || raw.feedback || {}
  }
}];`
      }
    },
    {
      id: "conversation-gate",
      name: "Conversation Gate",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [580, 300],
      parameters: {
        jsCode: `const d = $input.first().json || {};
const text = String(d.userInput || "").trim();
const t = text.toLowerCase();
const words = t.split(/\\s+/).filter(Boolean);
const memory = d.currentMemory || {};
const brandName = memory.brand_name || memory.brandName || memory.name || memory.brand?.name || "";
const category = memory.category || memory.brand_category || memory.brand?.category || "";
const audience = memory.audience || memory.target_audience || memory.brand?.audience || "";
const offer = memory.offer || memory.product || memory.service || memory.brand?.offer || "";
const hasEnoughBrandContext = Boolean(brandName && (category || audience || offer));

const hasAny = (terms) => terms.some((term) => t.includes(term));
const greetingOnly = /^(hi|hello|hey|yo|gm|good morning|good afternoon|good evening|namaste|sup|heyy+|helloo+)[!.\\s]*$/i.test(text);
const lightGeneral = words.length <= 8 && hasAny(["how are you", "what can you do", "help", "start over", "thanks", "thank you"]);
const brandSignal = hasAny(["my brand", "brand is", "brand name", "we are", "we sell", "we make", "we provide", "new brand", "starting a brand", "launching", "rebrand", "position my brand"]);
const explicitSearch = hasAny(["search", "google", "look up", "research", "web search", "find online", "latest", "current", "today", "trend", "competitor"]);
const researchQuery = explicitSearch
  ? text.replace(/\\b(search|google|look up|research|web search|find online)\\b/gi, "").replace(/\\s+/g, " ").trim()
  : "";

const routeChecks = [
  { action: "SOCIAL", terms: ["instagram", "linkedin", "social", "caption", "reel", "post", "content calendar", "content pillar", "ugc"] },
  { action: "COPY", terms: ["copy", "tagline", "headline", "website", "email", "ad", "script", "bio", "product description", "rewrite", "landing page"] },
  { action: "COMMS", terms: ["campaign", "communication", "messaging", "launch plan", "announcement", "pr", "stakeholder", "message hierarchy"] },
  { action: "STRATEGY", terms: ["strategy", "positioning", "brand pillar", "archetype", "manifesto", "value proposition", "brand truth", "purpose"] }
];
const requested = routeChecks.find((check) => hasAny(check.terms))?.action || "";

let gateRoute = "GENERAL_FAST";
let action_type = "GENERAL";
let reason = "general_or_light_conversation";
let needsWebResearch = false;
const statusUpdates = ["Thinking through your request", "Finding the right JUMPINGGOOSE agent"];

if (explicitSearch) {
  gateRoute = "SPECIALIST";
  action_type = requested || "GENERAL";
  reason = "explicit_web_search_requested";
  needsWebResearch = true;
  statusUpdates.push("Searching the web", "Taking notes from useful results", "Writing a clean answer");
} else if (greetingOnly) {
  gateRoute = "GREETING";
  action_type = "GENERAL";
  reason = "simple_greeting";
} else if (lightGeneral) {
  gateRoute = "GENERAL_FAST";
  action_type = "GENERAL";
  reason = "light_general";
} else if (brandSignal && !requested) {
  gateRoute = "DISCOVERY";
  action_type = "DISCOVERY";
  reason = "brand_context_first";
} else if (requested && !hasEnoughBrandContext) {
  gateRoute = "DISCOVERY";
  action_type = "DISCOVERY";
  reason = "specialist_request_needs_brand_discovery";
} else if (requested) {
  gateRoute = "SPECIALIST";
  action_type = requested;
  reason = "specialist_request_with_brand_context";
} else {
  gateRoute = "GENERAL_FAST";
  action_type = "GENERAL";
}

return [{ json: { ...d, gateRoute, action_type, initial_action_type: action_type, needsWebResearch, research_query: researchQuery || text, statusUpdates, conversationGate: { reason, requested, hasEnoughBrandContext, explicitSearch } } }];`
      }
    },
    {
      id: "early-router",
      name: "Early Router",
      type: "n8n-nodes-base.switch",
      typeVersion: 2,
      position: [820, 300],
      parameters: {
        mode: "rules",
        outputsAmount: 4,
        dataType: "string",
        value1: "={{ $json.gateRoute }}",
        rules: {
          rules: [
            { value2: "GREETING", output: 0 },
            { value2: "GENERAL_FAST", output: 1 },
            { value2: "DISCOVERY", output: 2 },
            { value2: "SPECIALIST", output: 3 }
          ]
        }
      }
    },
    {
      id: "premade-greeting",
      name: "Premade Greeting",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1060, 0],
      parameters: {
        jsCode: `const d = $input.first().json || {};
const greetings = [
  "Hey there, welcome to JUMPINGGOOSE AI. We are here to help you create strategy for your brand, write copy for social media, and brainstorm fun ideas.",
  "Hi, welcome to JUMPINGGOOSE AI. Bring us your brand, campaign, caption, or half-formed thought, and we will help shape it into something useful.",
  "Hey there. JUMPINGGOOSE AI can help with brand strategy, social copy, communication ideas, and sharper ways to say what your brand means.",
  "Welcome to JUMPINGGOOSE AI. Tell us what you are building, and we can help with strategy, copy, social content, or a few fresh ideas to get things moving.",
  "Hello from JUMPINGGOOSE AI. We can help you think through your brand, write better copy, plan social content, or turn a loose idea into a clear direction."
];
const message = greetings[Math.floor(Math.random() * greetings.length)];
return [{
  json: {
    message,
    text: message,
    output: message,
    response: message,
    progress: {
      state: "completed",
      placeholders: ["Reading your message", "Opening a fresh JUMPINGGOOSE thread"]
    },
    statusUpdates: ["Reading your message", "Opening a fresh JUMPINGGOOSE thread"],
    sessionId: d.sessionId || "default_session",
    memory: d.currentMemory || {},
    sessionSummary: ""
  }
}];`
      }
    },
    {
      id: "discovery-reference-builder",
      name: "Discovery Reference Builder",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1060, 160],
      parameters: {
        jsCode: `const d = $input.first().json || {};
return [{
  json: {
    ...d,
    action_type: "DISCOVERY",
    context_injection: d.context_injection || "",
    questionnaireReference: ${JSON.stringify(questionnaireReference)},
    research_context: { query: "", abstract: "", source: "", url: "", related: [] },
    statusUpdates: d.statusUpdates || ["Thinking through your request", "Preparing brand discovery questions"],
    selectedReferenceKinds: ["questionnaireReference"]
  }
}];`
      }
    },
    waitNode("wait-memory-read", "Wait: Memory Agent", 8, [1060, 420]),
    openRouterNode(
      "memory-agent",
      "Memory Agent",
      MODELS.MEMORY,
      memoryPrompt,
      "`USER INPUT:\\n${$json.userInput}\\n\\nINITIAL ACTION TYPE:\\n${$json.initial_action_type || \"\"}\\n\\nCURRENT MEMORY:\\n${JSON.stringify($json.currentMemory || {})}\\n\\nFEEDBACK:\\n${JSON.stringify($json.feedback || {})}`",
      0.15,
      [1300, 420]
    ),
    {
      id: "parse-memory-route",
      name: "Parse Memory & Route",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1540, 420],
      parameters: {
        jsCode: `const raw = $input.first()?.json || {};
const content = raw.choices?.[0]?.message?.content || "{}";
let parsed;
try {
  parsed = JSON.parse(content.replace(/^\`\`\`json\\s*/i, "").replace(/\`\`\`$/i, "").trim());
} catch (error) {
  parsed = {};
}
const initialAction = String($node["Conversation Gate"].json.initial_action_type || "").toUpperCase();
const action = String(parsed.action_type || initialAction || "GENERAL").toUpperCase();
const allowed = ["DISCOVERY", "STRATEGY", "COMMS", "SOCIAL", "COPY", "GENERAL", "FEEDBACK"];
const gate = $node["Conversation Gate"].json || {};
const needsWebResearch = Boolean(gate.needsWebResearch || (parsed.needs_web_research && parsed.research_query));
const researchQuery = parsed.research_query || gate.research_query || $node["Standardize Input"].json.userInput;
return [{
  json: {
    ...parsed,
    action_type: allowed.includes(action) ? action : "GENERAL",
    needsWebResearch,
    research_query: researchQuery,
    statusUpdates: gate.statusUpdates || ["Thinking through your request", "Finding the right JUMPINGGOOSE agent"],
    userInput: $node["Standardize Input"].json.userInput,
    sessionId: $node["Standardize Input"].json.sessionId,
    currentMemory: $node["Standardize Input"].json.currentMemory,
    feedback: $node["Standardize Input"].json.feedback
  }
}];`
      }
    },
    {
      id: "reference-context-builder",
      name: "Reference Context Builder",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1780, 420],
      parameters: {
        jsCode: `const d = $input.first().json || {};
const action = String(d.action_type || "GENERAL").toUpperCase();

const references = {
  questionnaireReference: ${JSON.stringify(questionnaireReference)},
  strategyFrameworks: ${JSON.stringify(strategyFrameworks)},
  communicationFrameworks: ${JSON.stringify(communicationFrameworks)},
  voiceCopyReference: ${JSON.stringify(voiceCopyReference)}
};

const contextKinds = {
  DISCOVERY: ["questionnaireReference"],
  STRATEGY: ["strategyFrameworks"],
  COMMS: ["communicationFrameworks"],
  SOCIAL: ["communicationFrameworks", "voiceCopyReference"],
  COPY: ["voiceCopyReference"],
  FEEDBACK: ["voiceCopyReference"],
  GENERAL: ["questionnaireReference", "strategyFrameworks", "communicationFrameworks", "voiceCopyReference"]
}[action] || ["questionnaireReference", "strategyFrameworks", "communicationFrameworks", "voiceCopyReference"];

const selectedReferences = {};
for (const key of contextKinds) selectedReferences[key] = references[key];

return [{ json: { ...d, ...selectedReferences, selectedReferenceKinds: contextKinds } }];`
      }
    },
    {
      id: "research-router",
      name: "Research Router",
      type: "n8n-nodes-base.switch",
      typeVersion: 1,
      position: [2020, 420],
      parameters: {
        dataType: "boolean",
        value1: "={{ $json.needsWebResearch }}",
        rules: { rules: [{ value2: true, output: 0 }, { value2: false, output: 1 }] }
      }
    },
    waitNode("wait-web-research", "Wait: Web Research", 1, [2260, 280]),
    {
      id: "web-research",
      name: "Web Research",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.1,
      position: [2500, 280],
      parameters: {
        method: "GET",
        url: "={{ 'https://api.duckduckgo.com/?format=json&no_redirect=1&no_html=1&q=' + encodeURIComponent($json.research_query || $json.userInput) }}",
        options: { timeout: 30000 }
      }
    },
    {
      id: "normalize-research",
      name: "Normalize Research",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [2740, 280],
      parameters: {
        jsCode: `const result = $input.first()?.json || {};
const related = Array.isArray(result.RelatedTopics)
  ? result.RelatedTopics.slice(0, 5).map((item) => ({ text: item.Text || "", url: item.FirstURL || "" })).filter((item) => item.text || item.url)
  : [];
return [{
  json: {
    ...$node["Reference Context Builder"].json,
    statusUpdates: [
      ...($node["Reference Context Builder"].json.statusUpdates || []),
      "Search complete",
      "Turning notes into the answer"
    ],
    research_context: {
      query: $node["Reference Context Builder"].json.research_query || "",
      abstract: result.AbstractText || "",
      source: result.AbstractSource || "",
      url: result.AbstractURL || "",
      related
    }
  }
}];`
      }
    },
    {
      id: "skip-research",
      name: "Skip Research",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [2500, 560],
      parameters: {
        jsCode: `return [{
  json: {
    ...$input.first().json,
    research_context: { query: "", abstract: "", source: "", url: "", related: [] }
  }
}];`
      }
    },
    {
      id: "action-router",
      name: "Action Router",
      type: "n8n-nodes-base.switch",
      typeVersion: 2,
      position: [3000, 420],
      parameters: {
        mode: "rules",
        outputsAmount: 7,
        dataType: "string",
        value1: "={{ $json.action_type }}",
        rules: {
          rules: [
            { value2: "DISCOVERY", output: 0 },
            { value2: "STRATEGY", output: 1 },
            { value2: "COMMS", output: 2 },
            { value2: "SOCIAL", output: 3 },
            { value2: "COPY", output: 4 },
            { value2: "FEEDBACK", output: 5 },
            { value2: "GENERAL", output: 6 }
          ]
        }
      }
    },
    prepNode("discovery-prep", "Discovery Prep", "DISCOVERY", [3240, -20]),
    waitNode("wait-discovery-agent", "Wait: Discovery Agent", 5, [3480, -20]),
    openRouterNode("discovery-agent", "Discovery Agent", MODELS.DISCOVERY, discoveryPrompt, "`MATCHED QUESTIONS:\\n${$json.matchedQuestions}\\n\\nCONTEXT:\\n${$json.context_injection || \"\"}\\n\\nRESEARCH:\\n${JSON.stringify($json.research_context || {})}\\n\\nUSER:\\n${$json.userInput}`", 0.45, [3720, -20]),

    prepNode("strategy-prep", "Strategy Prep", "STRATEGY", [3240, 140]),
    waitNode("wait-strategy-agent", "Wait: Strategy Agent", 5, [3480, 140]),
    openRouterNode("strategy-agent", "Strategy Agent", MODELS.STRATEGY, strategyPrompt, "`SELECTED FRAMEWORK: ${$json.selectedFrameworkName}\\n${$json.selectedFramework}\\n\\nCONTEXT:\\n${$json.context_injection || \"\"}\\n\\nRESEARCH:\\n${JSON.stringify($json.research_context || {})}\\n\\nUSER:\\n${$json.userInput}`", 0.4, [3720, 140]),

    prepNode("comms-prep", "Communication Prep", "COMMS", [3240, 300]),
    waitNode("wait-comms-agent", "Wait: Communication Agent", 5, [3480, 300]),
    openRouterNode("comms-agent", "Communication Agent", MODELS.COMMS, commsPrompt, "`SELECTED FRAMEWORK: ${$json.selectedFrameworkName}\\n${$json.selectedFramework}\\n\\nCONTEXT:\\n${$json.context_injection || \"\"}\\n\\nRESEARCH:\\n${JSON.stringify($json.research_context || {})}\\n\\nUSER:\\n${$json.userInput}`", 0.5, [3720, 300]),

    prepNode("social-prep", "Social Prep", "SOCIAL", [3240, 460]),
    waitNode("wait-social-agent", "Wait: Social Agent", 5, [3480, 460]),
    openRouterNode("social-agent", "Social Agent", MODELS.SOCIAL, socialPrompt, "`SELECTED FRAMEWORK: ${$json.selectedFrameworkName}\\n${$json.selectedFramework}\\n\\nCONTEXT:\\n${$json.context_injection || \"\"}\\n\\nRESEARCH:\\n${JSON.stringify($json.research_context || {})}\\n\\nUSER:\\n${$json.userInput}`", 0.55, [3720, 460]),

    prepNode("copy-prep", "Copy Prep", "COPY", [3240, 620]),
    waitNode("wait-copy-agent", "Wait: Copy Agent", 5, [3480, 620]),
    openRouterNode("copy-agent", "Copy Agent", MODELS.COPY, copyPrompt, "`REQUESTED DELIVERABLE:\\n${$json.requestedDeliverable}\\n\\nMETHOD: ${$json.selectedMethod}\\n\\nVOICE GUIDELINES:\\n${$json.voiceGuidelines}\\n\\nCONTEXT:\\n${$json.context_injection || \"\"}\\n\\nRESEARCH:\\n${JSON.stringify($json.research_context || {})}\\n\\nUSER:\\n${$json.userInput}`", 0.58, [3720, 620]),

    prepNode("general-prep", "General Prep", "GENERAL", [3240, 780]),
    waitNode("wait-general-agent", "Wait: General Agent", 5, [3480, 780]),
    openRouterNode("general-agent", "General Agent", MODELS.GENERAL, generalPrompt, "`CONTEXT:\\n${$json.context_injection || \"\"}\\n\\nRESEARCH:\\n${JSON.stringify($json.research_context || {})}\\n\\nUSER:\\n${$json.userInput}`", 0.5, [3720, 780]),

    {
      id: "capture-output",
      name: "Capture Output",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [3980, 380],
      parameters: {
        jsCode: `const raw = $input.first()?.json || {};
const finalOutput = raw.choices?.[0]?.message?.content || raw.output || raw.text || raw.response || "";
const gate = $node["Conversation Gate"].json || {};
return [{
  json: {
    userInput: $node["Standardize Input"].json.userInput,
    sessionId: $node["Standardize Input"].json.sessionId,
    currentMemory: $node["Standardize Input"].json.currentMemory,
    route: gate.initial_action_type || "",
    context_injection: "",
    research_context: {},
    statusUpdates: gate.statusUpdates || ["Thinking through your request", "Writing the answer"],
    finalOutput
  }
}];`
      }
    },
    waitNode("wait-memory-write", "Wait: Memory Write Agent", 8, [4220, 380]),
    openRouterNode("memory-write-agent", "Memory Write Agent", MODELS.MEMORY_WRITE, memoryWritePrompt, "`USER INPUT:\\n${$json.userInput}\\n\\nROUTE: ${$json.route}\\n\\nCURRENT MEMORY:\\n${JSON.stringify($json.currentMemory || {})}\\n\\nCONTEXT:\\n${$json.context_injection || \"\"}\\n\\nRESEARCH:\\n${JSON.stringify($json.research_context || {})}\\n\\nFINAL OUTPUT:\\n${$json.finalOutput}`", 0.1, [4460, 380]),
    {
      id: "final-response",
      name: "Final Response",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [4720, 380],
      parameters: {
        jsCode: `const raw = $input.first()?.json || {};
const content = raw.choices?.[0]?.message?.content || "{}";
let parsed = {};
try {
  parsed = JSON.parse(content.replace(/^\`\`\`json\\s*/i, "").replace(/\`\`\`$/i, "").trim());
} catch (error) {
  parsed = {};
}
const output = parsed.final_output || $node["Capture Output"].json.finalOutput || "";
const clean = String(output || "")
  .replace(/^\`\`\`(?:json|markdown|md)?\\s*/i, "")
  .replace(/\`\`\`$/i, "")
  .trim();
const statusUpdates = $node["Capture Output"].json.statusUpdates || ["Thinking through your request", "Writing the answer"];
return [{
  json: {
    message: clean,
    text: clean,
    output: clean,
    response: clean,
    progress: {
      state: "completed",
      placeholders: statusUpdates
    },
    statusUpdates,
    sessionId: $node["Standardize Input"].json.sessionId,
    memory: parsed.updated_memory || {},
    sessionSummary: parsed.session_summary || ""
  }
}];`
      }
    }
  ],
  connections: {
    "n8n Chat Trigger": { main: [[{ node: "Standardize Input", type: "main", index: 0 }]] },
    "Webhook Trigger": { main: [[{ node: "Standardize Input", type: "main", index: 0 }]] },
    "Standardize Input": { main: [[{ node: "Conversation Gate", type: "main", index: 0 }]] },
    "Conversation Gate": { main: [[{ node: "Early Router", type: "main", index: 0 }]] },
    "Early Router": {
      main: [
        [{ node: "Premade Greeting", type: "main", index: 0 }],
        [{ node: "General Prep", type: "main", index: 0 }],
        [{ node: "Discovery Reference Builder", type: "main", index: 0 }],
        [{ node: "Wait: Memory Agent", type: "main", index: 0 }]
      ]
    },
    "Discovery Reference Builder": { main: [[{ node: "Discovery Prep", type: "main", index: 0 }]] },
    "Wait: Memory Agent": { main: [[{ node: "Memory Agent", type: "main", index: 0 }]] },
    "Memory Agent": { main: [[{ node: "Parse Memory & Route", type: "main", index: 0 }]] },
    "Parse Memory & Route": { main: [[{ node: "Reference Context Builder", type: "main", index: 0 }]] },
    "Reference Context Builder": { main: [[{ node: "Research Router", type: "main", index: 0 }]] },
    "Research Router": {
      main: [
        [{ node: "Wait: Web Research", type: "main", index: 0 }],
        [{ node: "Skip Research", type: "main", index: 0 }]
      ]
    },
    "Wait: Web Research": { main: [[{ node: "Web Research", type: "main", index: 0 }]] },
    "Web Research": { main: [[{ node: "Normalize Research", type: "main", index: 0 }]] },
    "Normalize Research": { main: [[{ node: "Action Router", type: "main", index: 0 }]] },
    "Skip Research": { main: [[{ node: "Action Router", type: "main", index: 0 }]] },
    "Action Router": {
      main: [
        [{ node: "Discovery Prep", type: "main", index: 0 }],
        [{ node: "Strategy Prep", type: "main", index: 0 }],
        [{ node: "Communication Prep", type: "main", index: 0 }],
        [{ node: "Social Prep", type: "main", index: 0 }],
        [{ node: "Copy Prep", type: "main", index: 0 }],
        [{ node: "General Prep", type: "main", index: 0 }],
        [{ node: "General Prep", type: "main", index: 0 }]
      ]
    },
    "Discovery Prep": { main: [[{ node: "Wait: Discovery Agent", type: "main", index: 0 }]] },
    "Wait: Discovery Agent": { main: [[{ node: "Discovery Agent", type: "main", index: 0 }]] },
    "Discovery Agent": { main: [[{ node: "Capture Output", type: "main", index: 0 }]] },
    "Strategy Prep": { main: [[{ node: "Wait: Strategy Agent", type: "main", index: 0 }]] },
    "Wait: Strategy Agent": { main: [[{ node: "Strategy Agent", type: "main", index: 0 }]] },
    "Strategy Agent": { main: [[{ node: "Capture Output", type: "main", index: 0 }]] },
    "Communication Prep": { main: [[{ node: "Wait: Communication Agent", type: "main", index: 0 }]] },
    "Wait: Communication Agent": { main: [[{ node: "Communication Agent", type: "main", index: 0 }]] },
    "Communication Agent": { main: [[{ node: "Capture Output", type: "main", index: 0 }]] },
    "Social Prep": { main: [[{ node: "Wait: Social Agent", type: "main", index: 0 }]] },
    "Wait: Social Agent": { main: [[{ node: "Social Agent", type: "main", index: 0 }]] },
    "Social Agent": { main: [[{ node: "Capture Output", type: "main", index: 0 }]] },
    "Copy Prep": { main: [[{ node: "Wait: Copy Agent", type: "main", index: 0 }]] },
    "Wait: Copy Agent": { main: [[{ node: "Copy Agent", type: "main", index: 0 }]] },
    "Copy Agent": { main: [[{ node: "Capture Output", type: "main", index: 0 }]] },
    "General Prep": { main: [[{ node: "Wait: General Agent", type: "main", index: 0 }]] },
    "Wait: General Agent": { main: [[{ node: "General Agent", type: "main", index: 0 }]] },
    "General Agent": { main: [[{ node: "Capture Output", type: "main", index: 0 }]] },
    "Capture Output": { main: [[{ node: "Wait: Memory Write Agent", type: "main", index: 0 }]] },
    "Wait: Memory Write Agent": { main: [[{ node: "Memory Write Agent", type: "main", index: 0 }]] },
    "Memory Write Agent": { main: [[{ node: "Final Response", type: "main", index: 0 }]] }
  }
};

const targetPath = path.join(__dirname, WORKFLOW_FILE);
fs.writeFileSync(targetPath, JSON.stringify(n8nWorkflow, null, 2));
console.log("Generated JUMPINGGOOSE Agency text workflow:");
console.log("  " + targetPath);
