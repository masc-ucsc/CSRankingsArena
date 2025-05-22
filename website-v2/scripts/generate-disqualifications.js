const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Define the base structure for a disqualification file
const createDisqualificationTemplate = (title, abstract, keywords, document) => ({
  papers: [{
    title,
    abstract,
    keywords,
    document,
    decisions: {
      evaluation_prompt: 'Disqualified: no evaluation. Reason: The paper is a survey and discussion of technologies, but it lacks any empirical, experimental, or quantitative evaluation of its own. It does not include sections or paragraphs dedicated to evaluation, experiments, results, or empirical analysis, nor does it present any benchmarks, metrics, comparisons, datasets, or performance measurements.',
      related_work_prompt: '- Qualified. Reason: The paper meaningfully engages with prior research by providing numerous academic citations throughout the text, discussing various aspects of the technology, and comparing different implementations and methodologies. It includes a comprehensive survey of existing literature, tools, and methods, demonstrating a thorough engagement with previous work in the field.',
      novelty_prompt: 'Disqualified: no novelty. Reason: The paper is a comprehensive survey on the technology, covering its basics, implementation, and methods. It does not propose any new methods, algorithms, architectures, datasets, or insights, nor does it apply known techniques in a novel context or domain. The paper primarily summarizes existing literature and suggests potential research areas without making any clear claims of novel contributions.',
      review_only_prompt: 'Disqualified: review paper. Reason: The title contains the word "survey," and the main body primarily summarizes existing work without introducing new methods, datasets, experiments, or frameworks.'
    }
  }]
});

// Function to create a disqualification file
const createDisqualificationFile = (category, subcategory, year, title, abstract, keywords, document) => {
  const basePath = path.join('papers', category, subcategory, year.toString());
  const fileName = `${category}-${subcategory}-${year}-disqualification.yaml`;
  const filePath = path.join(basePath, fileName);

  // Create directory if it doesn't exist
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  const content = createDisqualificationTemplate(title, abstract, keywords, document);
  const yamlContent = yaml.dump(content, {
    indent: 2,
    lineWidth: -1, // No line wrapping
    noRefs: true,
    quotingType: '"'
  });

  fs.writeFileSync(filePath, yamlContent);
  console.log(`Created disqualification file at: ${filePath}`);
};

// Function to generate files for a range of years
const generateFilesForYearRange = (category, subcategory, startYear, endYear, paperData) => {
  for (let year = startYear; year <= endYear; year++) {
    createDisqualificationFile(
      category,
      subcategory,
      year,
      paperData.title,
      paperData.abstract,
      paperData.keywords,
      paperData.document
    );
  }
};

// Example paper data
const examplePaper = {
  title: '**Quantum-dot Cellular Automata (QCA): A Survey**',
  abstract: '',
  keywords: '**— QCA (Quantum-dot Cellular Automata), Defect, fault model, testing.**',
  document: `#### I. INTRODUCTION

Continued and fast dimensional scaling of CMOS eventually will approach the fundamental limit [1]. Also, Short channel effects, high power dissipation, quantum effects are limiting the further scaling of current CMOS technology devices [2-3]. Emerging device technology can overcome the scaling limitation in the current CMOS technology [1]. Single Electron Transistor (SET) [4], Quantum-dot Cellular Automata (QCA) [5] and Resonant Tunneling Diodes (RTD) [6] are some of the "Beyond CMOS" technologies. Among these evolving nanotechnologies, Quantum-dot Cellular Automata is the most favorable technology [1]. QCA is transistorless computational paradigm which can achieve device density of 10<sup>12</sup> devices/cm<sup>2</sup> and operating speed of THz. QCA device paradigm replaces FET based logic and exploit the quantum effects of small size.`
};

// Generate files for years 2020-2025
generateFilesForYearRange('ai', 'vision', 2020, 2025, examplePaper);

// Export the functions for use in other files
module.exports = {
  createDisqualificationFile,
  generateFilesForYearRange
}; 