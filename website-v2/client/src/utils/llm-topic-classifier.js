import axios from 'axios';

async function classifyPaperTopic(keywords, title, abstract, apiKey) {
  const categories = [
    "Artificial Intelligence", "Computer Vision", "Machine Learning", "Natural Language Processing",
    "The Web & Information Retrieval", "Computer Architecture", "Computer Networks", "Computer Security", "Databases", "Design Automation",
    "Embedded & Real-time Systems", "High-performance Computing", "Mobile Computing", "Measurement & Perf. Analysis", "Operating Systems",
    "Programming Languages", "Software Engineering", "Algorithms & Complexity", "Cryptography", "Logic & Verification", "Comp. Bio & Bioinformatics",
    "Computer Graphics", "Computer Science Education", "Economics & Computation", "Human-computer Interaction", "Robotics", "Visualization", "Other"
  ];

  const messages = [
    { role: "system", content: `Here is the abstract of a paper titled ${title} : ${abstract}. The paper has the following keywords: ${keywords}` },
    { role: "user", content: `Here is a list of topics for papers: ${categories.join(", ")}. What topic does this paper fit into? If only one applies, leave the secondary topic empty.` }
  ];

  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: messages
    }, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });

    const result = JSON.parse(response.data.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Error classifying paper topic:", error);
    return { main_topic: "", secondary_topic: "" };
  }
}

export default classifyPaperTopic;
