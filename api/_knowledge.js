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
    text: `Ajinkya is currently interning at Emerson as a PMO AI/ML Intern. The internship started in December 2025 and is ongoing — this is his present role, not a past one. He architected a multi-agent AI system framework for the Project Management Office, designed with LangGraph, deploying autonomous SQL and extraction agents and integrating a self-correcting retry loop so that complex PMO data workflows run without manual intervention.`,
  },
  {
    id: 'emerson-architecture',
    title: 'Emerson — system architecture',
    section: 'Experience',
    text: `The Emerson PMO project is called Intelligent PMO Analytics. Its architecture has three parts. A Dynamic Query Orchestrator built on Azure OpenAI evaluates incoming enterprise PMO requests and routes them to specialised sub-agents. A dual-agent execution layer pairs an Azure SQL Database agent for secure schema querying with a document processing agent for unstructured parsing and summarisation. A self-healing interaction layer captures execution failures, analyses the traceback through an LLM, and corrects the query logic before re-running it. The stack is LangGraph, Python, LLMs, SQL, prompt engineering, agentic AI and data analytics.`,
  },
  {
    id: 'emerson-impact',
    title: 'Emerson — what the system changed',
    section: 'Experience',
    text: `The Emerson work replaced static PMO dashboards with an adaptive conversational analytics assistant, automating manual project tracking. It improved query accuracy and semantic search across large unstructured project databases, and delivered a secure, high-availability architecture that gives project leadership real-time forecasting, resource projections and financial S-curve analysis.`,
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
