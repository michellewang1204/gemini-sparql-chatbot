import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import readline from 'readline';
import axios from 'axios';

// 設置 Google Generative AI 模型
const model = new ChatGoogleGenerativeAI({
  model: "gemini-pro",
  maxOutputTokens: 500,  // 減少輸出 Token 數量以防超出限制
  apiKey: " "  // 請替換為您的 Google API Key
});

// 定義 SPARQL 查詢函數
async function querySparql(query) {
  const url = 'https://dbpedia.org/sparql';
  const params = {
    'default-graph-uri': 'http://dbpedia.org',
    query: query,
    format: 'application/sparql-results+json',
    timeout: 10000
  };

  // console.log('Querying:', query);
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error("Error executing SPARQL query:", error);
    return null;
  }
}

// 問答系統主函數
async function askQuestion() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Q: ', async (userInput) => {
    try {
      // 使用 Google Generative AI 模型生成 SPARQL 查詢
      const generatedQueryResponse = await model.call([
        { role: "system", content: `
          You are a helpful assistant that generates precise SPARQL queries based on user questions.
          
          **General Guidelines:**
          - For questions involving "located in," always map it to "dbo:city" for any relationship that implies a physical location.
          - For questions requesting specific counts or totals (e.g., "How many"), use a SELECT COUNT query with the syntax: SELECT COUNT(?x) WHERE { ... }.
         - For questions asking about the number of cities in a specific country (e.g., "How many cities are there in Taiwan?"), use the following format consistently:
  - SELECT COUNT(?city) WHERE { dbr:[Country] dbp:city ?city . }
          - For Yes/No questions that start with "Is" or "Are," use an ASK WHERE query to return a boolean result.
          - For questions starting with "Who," "What," "When," "Where," "Why," "Which," or "How" (also known as 5W1H questions), always use a SELECT query to retrieve specific information.
          
          **Prefix Usage Rules:**
          - Use the "dbr:" prefix for all specific names or entities (e.g., country names, city names, universities). Examples include:
            - "Taiwan" -> dbr:Taiwan
            - "National Chung Hsing University" -> dbr:National_Chung_Hsing_University
            - "Taipei" -> dbr:Taipei
          - For properties describing characteristics or attributes (such as names, leaders), use "dbp" as the prefix. Examples include:
            - "mayor" -> dbp:mayor
            - "city" -> dbp:city (for a list or collection of cities in a specific country)
            - "leader" -> dbp:leaderName
            - **"president" -> dbp:president**
          
          **Mappings for Common DBpedia Terms:**
          - "population" -> dbo:populationTotal
          - "capital" -> dbo:capital
          - "area" -> dbo:areaTotal
          - "Chinese" -> dbr:Standard_Chinese
          - "located in" -> dbo:city
          - "leader" -> dbp:leaderName
          - "president" -> dbp:president
          - **"part of" -> dbo:affiliation**
          - **"卓榮泰" -> dbr:Cho_Jung-tai**
          - **"台灣綜合大學系統" -> dbr:Taiwan_Comprehensive_University_System**

          **Handling for District-Based Location Queries:**
          - When the question asks about institutions or entities "in the same district" as another entity, use the following pattern:
            - Set "?university dbo:city ?x" to find universities in the same city.
            - Include "?x dbo:type <http://dbpedia.org/resource/District_(Taiwan)>" to ensure that ?x is a district.
            - Retrieve universities in the same district by setting "?university dbo:city ?x" where "?x" refers to the district variable.
            - Do not include any "FILTER" clauses with "owl:sameAs" unless explicitly needed.

          **Special Handling for Student Counts:**
          - For questions asking about the number of students at an institution, retrieve data from both "dbo:numberOfPostgraduateStudents" and "dbo:numberOfUndergraduateStudents", then sum the values.

          **Specific Instructions for "president":**
          - When a question asks, "Who is the president of [institution]?", always use "dbp:president".
          
          **Usage Guidelines for dbo and dbp:**
          - Use "dbo" for standardized properties and types such as population, capital, area, official language, and general classifications like City or University.
          - Use "dbp" for non-standard attributes directly derived from Wikipedia infoboxes, such as "leader," "mayor," or other varying properties.
          - For "city," use "dbp:city" when referring to lists or collections (e.g., counting cities within a country), and use "dbo:city" for location-based relationships (e.g., an entity physically located within a city).
          
          **Query Structure and Variable Placement Rules:**
          - Place the answer variable (e.g., ?ans, ?count) at the end of the SELECT clause whenever possible for SELECT queries.
          - For COUNT queries, use the syntax "SELECT (COUNT(?x) AS ?count) WHERE { ... }" to encapsulate the count in a single variable.
          - In ASK queries, no variable is needed, as the query only returns a boolean result.
          - For multi-variable SELECT queries, ensure that variables appear logically based on question context. For example:
            - "How many students..." -> SELECT COUNT(?x) WHERE { ... }
            - "Who is the leader..." -> SELECT ?leader WHERE { ... }
        
          Please adhere to these guidelines and mappings closely when generating SPARQL queries, particularly in differentiating "dbo:city" and "dbp:city" based on context.
        ` },
        { role: "user", content: userInput }
      ]);

      // 檢查生成的查詢是否包含有效的 SPARQL 查詢
      const queryMatch = generatedQueryResponse.content.match(/```sparql\n([\s\S]*?)\n```/);
      if (queryMatch && queryMatch[1]) {
        const generatedQuery = queryMatch[1];
        console.log("Generated SPARQL Query:\n", generatedQuery);

        // 執行 SPARQL 查詢並顯示結果
        const sparqlResult = await querySparql(generatedQuery);
        if (sparqlResult.boolean !== undefined) {
          console.log(`Answer: ${sparqlResult.boolean ? 'TRUE' : 'FALSE'}`);
        } else if (sparqlResult && sparqlResult.results && sparqlResult.results.bindings.length > 0) {
          // sparqlResult.results.bindings.forEach((binding, index) => {
          //   console.log(`Answer ${index + 1}:`, JSON.stringify(binding, null, 2));
          // });

        sparqlResult.results.bindings.forEach((binding, index) => {
            // 確保取出答案中的 value 值
            const answerValue = binding[Object.keys(binding)[0]].value;
            console.log(`Answer: ${answerValue}`);
          });
        } else {
          console.log('No results found for the query.');
        }
      } else {
        console.log("Failed to generate a valid SPARQL query.");
      }
    } catch (error) {
      console.error("Error occurred during Google Generative AI call:", error);
    }

    // 繼續問答循環
    rl.close();
    askQuestion();
  });
}

// 啟動問答系統
console.log("Welcome! Ask me a question (e.g., 'What is the population of Taiwan?')");
askQuestion();
