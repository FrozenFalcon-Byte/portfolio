/* The corpus the assistant is allowed to answer from.
 *
 * Every chunk is a fact that already appears somewhere on this site.
 * Keeping them here rather than scraping the DOM means the retrieval
 * layer has clean, self-contained passages to rank, and means the model
 * is never shown anything the site does not already say out loud.
 */

export const PROFILE = {
  name: 'Ajinkya Chavan',
  role: 'AI/ML engineering student and developer',
  location: 'Pune, India',
  email: 'frozenfalcon8494@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ajinkyachavan4829/',
  github: 'https://github.com/FrozenFalcon-Byte',
};

export const CHUNKS = [
  {
    id: 'intro',
    title: 'Who Ajinkya is',
    section: 'About',
    text: `Ajinkya Chavan is an AI/ML engineering student and developer based in Pune, India. He specialises in generative AI, multi-agent frameworks, and full-stack system architecture: building the model layer and the application that carries it into production. He is currently an AI/ML intern at Emerson and is open to further internships and collaboration. He can be reached at frozenfalcon8494@gmail.com.`,
  },
  {
    id: 'emerson-role',
    title: 'Emerson — PMO AI/ML Intern (December 2025 to present)',
    section: 'Experience',
    text: `Ajinkya is currently interning at Emerson as a PMO AI/ML Intern. The internship started in December 2025 and is ongoing — this is his present role, not a past one. He builds the SNOP GenAI Pipeline: a production multi-agent LLM system that turns natural-language business questions into correct SQL over Emerson's Sales and Operations Planning database, covering workforce utilisation, demand and supply forecasting, financial recovery and operational effectiveness. It runs on Azure, streams its answers, and is actively maintained by Ajinkya and one teammate.`,
  },
  {
    id: 'emerson-architecture',
    title: 'Emerson — SNOP pipeline architecture',
    section: 'Experience',
    text: `The SNOP GenAI Pipeline is a nine-node LangGraph graph. A guardrail filters unsafe or out-of-scope questions. A conversation router decides whether the message is a follow-up, a fresh query or general chat. A query intent extractor pulls metrics, filters and grouping into a typed IntentResult. An orchestrator routes to the metric tools the intent needs and deduplicates overlapping ones. A planner composes the SQL template, applies the business glossary and enforces row limits. A SQL generator writes the query and the explanation that ships with the answer. A SQL validator parses the AST with sqlglot and catches join fan-out and malformed filters before execution. A data executor runs the query on Azure PostgreSQL, partitioned quarterly on fiscal period. An output agent formats the Markdown table and selects a chart. Pipeline state is checkpointed per session so multi-turn conversations keep context. The stack is LangGraph, LangChain, Azure OpenAI, FastAPI with server-sent events, Azure PostgreSQL, sqlglot, React and TypeScript.`,
  },
  {
    id: 'emerson-impact',
    title: 'Emerson — why the SNOP pipeline is hard',
    section: 'Experience',
    text: `The difficulty is correctness, not prompting. Emerson's fiscal year starts in October and the fp_posted column stores a fiscal literal, so 2026-01 means fiscal October 2026 rather than January — every date filter has to be translated through that. Hierarchies run World Area to CoE to project class, and a business glossary maps what a person says, such as "PSS Pune", to the column value the database actually holds, so the planner never invents an invalid filter combination. Validation happens at the AST level because an LLM will happily produce SQL that parses and returns the wrong number, and each answer carries its own methodology so a planner can check the working. Checkpointing keeps session context without letting a previous turn's filters leak into the next question. Shipping next is a geopolitical-impact tool: web search wired into the same graph, so the system can answer how current events affect an industry and Emerson's supply chain.`,
  },
  {
    id: 'aimss',
    title: 'AIMSS VIIT — Technical Lead (2024 to 2026)',
    section: 'Leadership',
    text: `Separately from his Emerson internship, Ajinkya is Technical Lead at AIMSS VIIT, a student body, from 2024 to 2026. He leads technical initiatives, organises AI/ML workshops, and guides students in building intelligent systems. This is a leadership position at his college, not a professional internship.`,
  },
  {
    id: 'cr',
    title: 'VIIT — Class Representative (2023 to 2026)',
    section: 'Leadership',
    text: `Ajinkya has been Class Representative at VIIT from 2023 to 2026. He acts as the primary liaison between students and faculty to keep academic operations running smoothly. This is a college leadership role, distinct from both his Emerson internship and his AIMSS technical lead position.`,
  },
  {
    id: 'finmcp',
    title: 'FinMCP — a multi-client finance platform built on MCP',
    section: 'Work',
    text: `FinMCP is a personal finance platform whose business logic is an MCP server rather than a web backend with AI bolted on. Every feature — transactions, budgets, recurring-payment detection, statement and receipt imports, goals, text-to-SQL, the audit log — is exposed as one of 27 MCP tools, alongside 13 resources and 4 prompts, so the React web app, Claude Desktop, Claude Code and the in-app assistant are all clients of the same ledger with identical rules. Ajinkya used the protocol's two-way channel deliberately: sampling hands a weak category guess to the client's model for refinement, elicitation pauses a risky call so the app can ask the user, and subscriptions stream a write from any client into every open view in real time. Tenant isolation lives in Postgres row-level security — each request opens a transaction as the caller's account — so a leaked token still reads nothing. Categorisation, text-to-SQL and receipt parsing all have deterministic fallbacks, so the app works with no model key set. Built with the MCP SDK, React 19, Vite, TypeScript, FastAPI, PostgreSQL, Supabase and the Claude API, and hosted at finmcp.app.`,
  },
  {
    id: 'risk',
    title: 'Construction Risk Predictor',
    section: 'Work',
    text: `The Construction Risk Predictor is a dual-database retrieval-augmented generation system that predicts construction violations, stop-work orders and safety risks before they land. Ajinkya engineered a retrieval confidence filter on normalised vector distance, so that for unseen projects the system drops into a LOW_CONFIDENCE_MODE and declines rather than hallucinating. He split the schema in two — the LLM's raw generation target and the API's output model — so malformed generations never break downstream JSON parsing. He matched backend query templates to the structural formatting of the vectorised chunks, which sharply improved historical match accuracy, and containerised the Python, SQLite and ChromaDB environment for Hugging Face Spaces. Built with React, FastAPI, ChromaDB, SQLite, LangChain, Gemini and Docker.`,
  },
  {
    id: 'billing',
    title: 'Business Billing',
    section: 'Work',
    text: `Business Billing is a full-stack invoicing platform for small businesses: invoices, receipts, role-based access and analytics on a single Postgres tenant model. Ajinkya architected role-based access control for secure tenant isolation across every table, built real-time dashboard analytics on complex PostgreSQL aggregations, and automated PDF invoice generation and the email delivery pipeline behind it. Built with React, Supabase and PostgreSQL.`,
  },
  {
    id: 'imageproc',
    title: 'Image Processor',
    section: 'Work',
    text: `Image Processor combines OCR, background removal and AI summarisation of visual data in a single tool. Ajinkya built an automated background removal pipeline using segmentation-based computer vision, integrated Tesseract OCR for high-accuracy extraction from dense document images, and connected multimodal LLM APIs to turn visual data into structured written reports. Built with Python, Streamlit and Tesseract.`,
  },
  {
    id: 'nature',
    title: 'Nature Scene Classifier',
    section: 'Work',
    text: `Nature Scene Classifier is a deep convolutional network trained on augmented landscape data and deployed as a live inference app. Ajinkya designed and trained a deep CNN reaching 94% validation accuracy, applied heavy augmentation to stop the model overfitting a narrow landscape set, and packaged the inference engine behind an interactive Streamlit front end. Built with TensorFlow, Keras and a CNN architecture.`,
  },
  {
    id: 'stack-languages',
    title: 'Stack — languages and GenAI',
    section: 'Stack',
    text: `Ajinkya works in Python, Java, C++, JavaScript and SQL. For generative AI and machine learning he uses LangGraph, LangChain, NumPy, Pandas, TensorFlow and Keras, focusing on agent graphs, retrieval and the evaluation loops around them.`,
  },
  {
    id: 'stack-web-cloud',
    title: 'Stack — web, cloud and tooling',
    section: 'Stack',
    text: `On the web side Ajinkya uses React, FastAPI, Supabase, PostgreSQL and Streamlit. On cloud he works with AWS S3, AWS EC2, Azure and Azure AI. His tooling is Git, GitHub, Docker and Hugging Face.`,
  },
  {
    id: 'assistant-self',
    title: 'How this assistant works',
    section: 'Meta',
    text: `This assistant is part of Ajinkya's portfolio and he built it. A serverless function embeds your question, ranks it against a small corpus of passages drawn from this site, and passes only the top matches to Gemini with instructions to answer from that context and cite the passages it used. If the retrieved passages do not cover the question it says so instead of guessing. The API key stays on the server, and requests are rate limited per visitor.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    section: 'Contact',
    text: `Ajinkya can be reached by email at frozenfalcon8494@gmail.com, on LinkedIn at linkedin.com/in/ajinkyachavan4829, and on GitHub at github.com/FrozenFalcon-Byte. His résumé is available from the contact section of this site. He is open to internships and collaboration.`,
  },
];
