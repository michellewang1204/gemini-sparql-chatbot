# gemini-sparql-chatbot

#  Gemini SPARQL Question Answering Bot

This is a command-line chatbot that uses [Google Gemini](https://ai.google.dev/) (via `@langchain/google-genai`) to convert natural language questions into SPARQL queries and execute them on the [DBpedia SPARQL endpoint](https://dbpedia.org/sparql).

---

##  Features

- Converts **natural language** into **SPARQL** queries using Google Gemini (`gemini-pro`)
- Queries **DBpedia knowledge base**
- Handles:
  - `SELECT`, `COUNT`, and `ASK` questions
  - Location-based lookups
  - Institution affiliations
  - Student population summing
  - Yes/No answers and value lists

---

##  Technologies Used

| Component     | Technology                          |
|---------------|--------------------------------------|
| Language      | JavaScript (ESM)                    |
| AI Model      | Gemini-Pro via LangChain            |
| SPARQL Source | [DBpedia SPARQL endpoint](https://dbpedia.org/sparql) |
| Runtime       | Node.js + readline                  |
| HTTP Client   | Axios                               |

---

##  How to Run

### 1. Install dependencies
```bash
npm install axios @langchain/google-genai readline

##  Result

