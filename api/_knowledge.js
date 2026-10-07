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
    text: `Ajinkya Chavan is an AI/ML engineering student and developer based in Pune, India. He builds production-grade generative AI systems — multi-agent LangGraph pipelines, retrieval-augmented generation, and MCP and A2A agent services — delivered as full-stack applications with FastAPI and React and deployed on Azure. He is studying B.Tech Computer Science and Engineering (AI/ML) at VIIT Pune with a CGPA of 9.55, is a co-author on an IEEE ICICIS 2026 paper, and is currently a PMO AI/ML intern at Emerson. He is open to further internships and collaboration, and can be reached at frozenfalcon8494@gmail.com.`,
  },
  {
    id: 'emerson-role',
    title: 'Emerson — PMO AI/ML Intern (December 2025 to present)',
    section: 'Experience',
    text: `Ajinkya is currently interning at Emerson as a PMO AI/ML Intern. The internship started in December 2025 and is ongoing — this is his present role, not a past one. He has built two multi-agent systems there: the PMO Command Centre, which serves the POR and PPR reporting products from one shared agent graph, and the S&OP Agent, which turns natural-language Sales and Operations Planning questions into validated SQL. Both run on Azure and share the same agent conventions.`,
  },
  {
    id: 'emerson-por',
    title: 'Emerson — PMO Command Centre (POR / PPR)',
    section: 'Experience',
    text: `The PMO Command Centre is a multi-agent system on LangGraph and Azure OpenAI over Azure SQL. It deploys a SQL agent and an Extraction agent with a self-correcting retry loop wrapped around them, so a failed generation is corrected inside the run rather than surfacing as an error. Ajinkya unified what had been two separate codebases, POR and PPR, into a single shared agent graph with config-driven, dynamically loaded modules: a new reporting module plugs in through configuration without anyone changing shared agent code, which is what stopped the two reporting lines drifting apart.`,
  },
  {
    id: 'emerson-snop',
    title: 'Emerson — S&OP Agent',
    section: 'Experience',
    text: `The S&OP Agent is a production LangGraph multi-agent pipeline that turns a natural-language Sales and Operations Planning question into validated SQL over Azure PostgreSQL. The graph runs a guardrail, a conversation router, typed intent extraction, an orchestrator, a planner, a SQL generator, an AST-level validator built on sqlglot, a data executor and an output agent. Validation happens before execution, so structurally wrong queries never reach the database. Answers stream to a React and TypeScript front end over server-sent events, deployed on Azure App Service. Ajinkya also used TimeGPT for demand and resource forecasting, benchmarked against classical SARIMA and SARIMAX baselines. The architecture is described on the case-study page of this site; the queries, schema and business content stay inside Emerson.`,
  },
  {
    id: 'education',
    title: 'Education — B.Tech CSE (AI/ML), VIIT Pune',
    section: 'Education',
    text: `Ajinkya is studying for a B.Tech in Computer Science and Engineering with an AI/ML specialisation at the Vishwakarma Institute of Information Technology, Pune, from 2023 to 2027. His CGPA is 9.55 out of 10. He has also completed CISCO CCNAv7: Introduction to Networks and a course in Machine Learning and Deep Learning in Python and R.`,
  },
  {
    id: 'publication',
    title: 'Publication — IEEE ICICIS 2026',
    section: 'Education',
    text: `Ajinkya is a co-author of "Intrinsic Uncertainty Modeling for Pre-Output Truthfulness Control in Large Language Models", published at ICICIS 2026 (IEEE). The paper is about reading a language model's own uncertainty before it commits to an answer and using that signal to govern truthfulness at generation time, rather than auditing the output afterwards.`,
  },
  {
    id: 'aimss',
    title: 'AIMSS VIIT — Technical Lead (2024 to 2026)',
    section: 'Leadership',
    text: `Separately from his Emerson internship, Ajinkya is Technical Lead of the AIMSS club at VIIT from 2024 to 2026. He leads the club's technical track: running AI/ML workshops, mentoring juniors and shipping the club's own machine-learning projects. This is a college leadership position, not a professional internship, and should never be merged with his Emerson role.`,
  },
  {
    id: 'finmcp',
    title: 'FinMCP — a multi-client finance platform built on MCP',
    section: 'Work',
    text: `FinMCP is a personal finance platform whose business logic is an MCP server rather than a web backend with AI bolted on. Every feature is exposed as one of 34 MCP tools, alongside 13 resources and 4 prompts, so the React web app, an in-app AI assistant, Claude Desktop, Claude Code and Cursor are all clients of the same ledger under the same rules. Ajinkya used the full protocol rather than just its tool calls: elicitation asks the user to confirm low-confidence category guesses and deletes, sampling categorises unknown merchants without the server ever holding an API key, roots sandboxes file imports, and resource subscriptions refresh every other client the moment one writes. Multi-tenant isolation lives in Postgres row-level security, so every request runs as the caller's account and no tool can read another account's rows; each write is stamped with the client that made it and surfaces as an audit trail. The server services cover deduplicated statement, receipt and SMS imports, a categoriser that learns from corrections, budgets projected to month-end, subscription and recurring-bill detection, EMI tracking, savings goals, trend reports and guarded read-only SQL. The front end adds a live MCP architecture view, a touch photo cropper, animated charts and passkey sign-in, with per-client API tokens for external AI clients and 220+ pytest tests. Built with Python, FastAPI, PostgreSQL, Supabase, React 19 and TypeScript, deployed on Vercel and Render.`,
  },
  {
    id: 'trailhead',
    title: 'Trailhead — AI codebase onboarding',
    section: 'Work',
    text: `Trailhead is a full-stack app that reads any public GitHub repository and helps a newcomer find their way around it. It answers questions with cited sources, plans step-by-step reading tours toward a goal, and ranks the open issues that suit a first-time contributor. An ingestion pipeline parses code into files, symbols and import graphs and links commits, pull requests and issues to the files they touch; repository code is only ever read, never executed, and secrets are redacted before any text reaches a model. The AI design is hybrid: a structured decision engine makes the routing, navigation and ranking choices and an LLM on Groq writes only the prose, so every answer traces back to the step that produced it. It ships with 130+ tests and an evaluation harness that includes prompt-injection cases. The web app is React 19 and Vite with Supabase auth over GitHub, Google, email and passkeys, an interactive repository map, a code viewer and line-range links back to GitHub, plus real-time phone pairing over Supabase Realtime that turns a phone into a remote for the dashboard. The API runs on Render and the web app on Vercel, at trail-head-tau.vercel.app.`,
  },
  {
    id: 'swarm',
    title: 'Swarm — multi-agent GitHub repository maintenance',
    section: 'Work',
    text: `Swarm is a multi-agent system that maintains GitHub repositories. Four specialised LLM agents — Triager, Coder, Tester and Reviewer — each run as a separate Agent2Agent (A2A) service, find the next peer by skill, and hand off work with streamed progress through a state-machine task board where nothing merges without a human. It targets flaky tests specifically: the Tester agent writes its own test harness, checks that it catches the bug on the old code and passes on the fix, and saves it to a searchable registry for later tasks. Agent-generated code runs in sandboxed Docker containers with no network access and resource limits; the worker runs on GitHub Actions and is started on demand by a FastAPI hub on Render, and merges open real pull requests through OAuth. The LLM layer falls back across providers — Groq, Gemini, OpenRouter, Anthropic, plus optional local Ollama — and combines model verdicts with heuristics, sending low-confidence decisions to a human. The system is exposed both as an MCP server usable from Claude and other MCP clients and as a public A2A agent, with passkey (WebAuthn) sign-in and Firestore rules that stop the browser moving a task itself. The React and TypeScript dashboard has a live task board, charts, notifications and scroll-driven SVG motion graphics, shipped with a Firebase deploy script, GitHub Actions CI and a 65-test pytest suite. Live at swarm-4ce56.web.app and open source at github.com/FrozenFalcon-Byte/Swarm.`,
  },
  {
    id: 'risk',
    title: 'Construction Risk Predictor',
    section: 'Work',
    text: `The Construction Risk Predictor is a dual-database retrieval-augmented generation system that predicts construction violations, stop-work orders and safety risks before they land. Ajinkya engineered a retrieval confidence filter on normalised vector distance, so that for unseen projects the system drops into a LOW_CONFIDENCE_MODE and declines rather than hallucinating. He split the schema in two — the LLM's raw generation target and the API's output model — so malformed generations never break downstream JSON parsing. He matched backend query templates to the structural formatting of the vectorised chunks, which sharply improved historical match accuracy, and containerised the Python, SQLite and ChromaDB environment for Hugging Face Spaces. Built with React, FastAPI, ChromaDB, SQLite, LangChain, Gemini and Docker.`,
  },
  {
    id: 'billing',
    title: 'Business Billing — SimpleSight Solutions',
    section: 'Work',
    text: `Business Billing is a full-stack invoicing platform built for SimpleSight Solutions Pvt. Ltd. in November 2025: invoices, receipts, role-based access and analytics on a single Postgres tenant model. Ajinkya architected role-based access control for secure tenant isolation across every table, built real-time dashboard analytics on complex PostgreSQL aggregations, and automated receipt and PDF invoice generation, ledger updates and the email delivery pipeline behind them. Built with React, Supabase and PostgreSQL.`,
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
