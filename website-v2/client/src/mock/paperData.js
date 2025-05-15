// Add AI model definitions at the top of the file
const AI_REVIEWERS = {
  'gpt4': {
    name: 'GPT-4',
    provider: 'OpenAI',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GPT4',
    model: 'gpt-4-turbo-preview',
    version: '2024-03-15',
    capabilities: ['Advanced reasoning', 'Code analysis', 'Technical evaluation'],
    style: 'Detailed and analytical, with strong focus on technical implementation and practical implications',
    expertise: ['Computer Vision', 'Deep Learning', 'Software Engineering']
  },
  'claude3': {
    name: 'Claude 3',
    provider: 'Anthropic',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Claude3',
    model: 'claude-3-opus-20240229',
    version: '2024-03-15',
    capabilities: ['Long-form analysis', 'Ethical considerations', 'Cross-domain knowledge'],
    style: 'Balanced and thorough, with emphasis on broader implications and ethical considerations',
    expertise: ['AI Ethics', 'Research Methodology', 'Interdisciplinary Analysis']
  },
  'palm2': {
    name: 'PaLM 2',
    provider: 'Google',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PaLM2',
    model: 'palm-2-unicorn',
    version: '2024-03-15',
    capabilities: ['Mathematical reasoning', 'Scientific analysis', 'Multilingual understanding'],
    style: 'Precise and quantitative, with strong focus on mathematical foundations and experimental validation',
    expertise: ['Mathematics', 'Scientific Computing', 'Experimental Design']
  },
  'llama2': {
    name: 'Llama 2',
    provider: 'Meta',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Llama2',
    model: 'llama-2-70b-chat',
    version: '2024-03-15',
    capabilities: ['Open-source expertise', 'Hardware efficiency', 'Deployment considerations'],
    style: 'Practical and implementation-focused, with emphasis on deployment and resource efficiency',
    expertise: ['System Architecture', 'Hardware Optimization', 'Open Source']
  },
  'gemini': {
    name: 'Gemini Pro',
    provider: 'Google',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gemini',
    model: 'gemini-pro',
    version: '2024-03-15',
    capabilities: ['Multimodal analysis', 'Real-time processing', 'Cross-modal reasoning'],
    style: 'Innovative and forward-looking, with focus on emerging technologies and future applications',
    expertise: ['Multimodal AI', 'Real-time Systems', 'Emerging Technologies']
  }
};

// Helper function to get a random AI reviewer
const getRandomReviewer = () => {
  const models = Object.values(AI_REVIEWERS);
  return models[Math.floor(Math.random() * models.length)];
};

// Mock data for papers and matches that can be reused across components
export const mockPapers = {
  'mock-1': {
    paperId: 'mock-1',
    title: 'Deep Learning Approaches for Real-time Object Detection',
    authors: ['Dr. Sarah Chen', 'Prof. Michael Zhang', 'Dr. Lisa Wang'],
    venue: '2024 International Conference on Computer Vision',
    abstract: 'This paper presents a novel deep learning approach for real-time object detection, achieving state-of-the-art performance while maintaining high efficiency. Our method introduces an innovative architecture that significantly reduces computational complexity without sacrificing accuracy.',
    keywords: ['deep learning', 'object detection', 'real-time', 'computer vision'],
    pdfUrl: 'https://example.com/papers/mock-1.pdf',
    codeUrl: 'https://github.com/example/mock-1',
    year: 2024,
    citations: 45,
    score: 95,
    matches: ['mock-match-1-2', 'mock-match-1-3']
  },
  'mock-2': {
    paperId: 'mock-2',
    title: 'Self-supervised Learning for Medical Image Analysis',
    authors: ['Prof. James Wilson', 'Dr. Emily Brown', 'Dr. David Lee'],
    venue: '2024 Medical Image Computing Conference',
    abstract: 'We propose a self-supervised learning framework specifically designed for medical image analysis. Our approach leverages unlabeled medical data to learn robust representations, demonstrating significant improvements in various medical imaging tasks.',
    keywords: ['self-supervised learning', 'medical imaging', 'deep learning', 'healthcare'],
    pdfUrl: 'https://example.com/papers/mock-2.pdf',
    codeUrl: 'https://github.com/example/mock-2',
    year: 2024,
    citations: 38,
    score: 88,
    matches: ['mock-match-1-2', 'mock-match-2-3']
  },
  'mock-3': {
    paperId: 'mock-3',
    title: 'Vision Transformers for Video Understanding',
    authors: ['Dr. Alex Thompson', 'Prof. Rachel Green', 'Dr. Mark Wilson'],
    venue: '2024 Conference on Computer Vision and Pattern Recognition',
    abstract: 'This work explores the application of transformer architectures to video understanding tasks. We introduce a novel spatiotemporal attention mechanism that effectively captures both spatial and temporal relationships in video data.',
    keywords: ['transformers', 'video understanding', 'computer vision', 'deep learning'],
    pdfUrl: 'https://example.com/papers/mock-3.pdf',
    codeUrl: 'https://github.com/example/mock-3',
    year: 2024,
    citations: 32,
    score: 85,
    matches: ['mock-match-1-3', 'mock-match-2-3']
  }
};

export const mockMatches = {
  'mock-match-1-2': {
    matchId: 'mock-match-1-2',
    date: '2024-03-15T10:30:00Z',
    papers: {
      'mock-1': {
        paperId: 'mock-1',
        score: 92,
        result: 'win',
        reviews: [
          {
            reviewer: AI_REVIEWERS.gpt4,
            metrics: {
              'Technical Quality': 9,
              'Novelty': 8,
              'Impact': 9,
              'Clarity': 9,
              'Implementation': 9,
              'Efficiency': 8
            },
            analysis: `The paper presents a sophisticated approach to real-time object detection that demonstrates significant improvements in both accuracy and computational efficiency. The architectural innovations, particularly in the feature extraction pipeline, show careful consideration of real-world deployment constraints.

Key Technical Strengths:
- Novel attention mechanism that reduces computational overhead by 40% while maintaining accuracy
- Efficient memory management strategy that enables deployment on edge devices
- Comprehensive ablation studies validating design choices

Areas for Enhancement:
- Consider quantization-aware training for further optimization
- Additional benchmarks on mobile platforms would strengthen the practical impact

The implementation details are particularly impressive, with clear documentation of the optimization techniques used. The paper's focus on practical deployment considerations sets it apart from similar works in the field.`
          },
          {
            reviewer: AI_REVIEWERS.palm2,
            metrics: {
              'Technical Quality': 9,
              'Novelty': 8,
              'Impact': 8,
              'Clarity': 9,
              'Mathematical Rigor': 9,
              'Experimental Design': 9
            },
            analysis: `From a mathematical and experimental perspective, this work demonstrates exceptional rigor. The theoretical foundations are sound, with clear derivations of the computational complexity bounds.

Quantitative Analysis:
- Time complexity: O(n log n) for feature extraction, improved from O(n²)
- Memory usage: 45% reduction compared to baseline
- Accuracy metrics: mAP@0.5 = 0.89, mAP@0.75 = 0.82

The experimental design is particularly noteworthy, with:
- Comprehensive ablation studies (n=12 configurations)
- Statistical significance testing (p < 0.01)
- Cross-dataset validation on 5 benchmark datasets

The mathematical formulation of the attention mechanism is elegant and well-justified.`
          }
        ]
      },
      'mock-2': {
        paperId: 'mock-2',
        score: 88,
        result: 'loss',
        reviews: [
          {
            reviewer: AI_REVIEWERS.claude3,
            metrics: {
              'Technical Quality': 8,
              'Novelty': 9,
              'Impact': 8,
              'Clarity': 8,
              'Ethical Considerations': 9,
              'Clinical Relevance': 9
            },
            analysis: `This work on self-supervised learning for medical image analysis presents an important contribution to healthcare AI. The paper thoughtfully addresses both technical and ethical considerations in medical AI applications.

Ethical and Clinical Analysis:
- Strong emphasis on patient privacy and data security
- Clear documentation of model limitations and potential biases
- Comprehensive validation across diverse patient demographics

Technical Assessment:
The self-supervised approach shows promise, particularly in:
- Reducing dependency on labeled medical data
- Improving generalization across different imaging modalities
- Maintaining high accuracy in critical diagnostic tasks

Areas for Consideration:
- Additional validation needed for rare conditions
- Consider expanding the demographic diversity of the validation set
- More detailed discussion of failure cases and their clinical implications

The paper's balanced approach to both technical innovation and ethical considerations is particularly commendable.`
          },
          {
            reviewer: AI_REVIEWERS.llama2,
            metrics: {
              'Technical Quality': 8,
              'Novelty': 8,
              'Impact': 8,
              'Clarity': 8,
              'Deployment Feasibility': 9,
              'Resource Efficiency': 8
            },
            analysis: `From a deployment and efficiency perspective, this work shows strong potential for real-world medical applications. The implementation choices demonstrate careful consideration of healthcare infrastructure constraints.

Deployment Analysis:
- Model size: 45MB (compressed), suitable for edge deployment
- Inference time: 120ms on standard medical imaging hardware
- Memory footprint: 2.1GB during training, 512MB during inference

Resource Optimization:
- Efficient data loading pipeline reduces I/O bottlenecks
- Gradient checkpointing implementation reduces memory usage
- Mixed precision training reduces computational requirements

The paper provides excellent documentation for deployment, including:
- Docker container configuration
- Hardware requirements specification
- Performance optimization guidelines

Considerations for Production:
- Add support for ONNX export
- Implement dynamic batch sizing
- Consider model quantization for further optimization`
          }
        ]
      }
    },
    comparison: {
      winner: 'mock-1',
      analysis: 'Paper 1 demonstrated superior technical quality and clearer presentation of results.',
      keyPoints: ['Better handling of complex scenes', 'More efficient architecture']
    },
    feedback: {
      likes: 25,
      dislikes: 5,
      comments: [
        { 
          id: 1, 
          user: 'Anonymous', 
          text: 'Great comparison! The real-time performance improvements are impressive.', 
          date: '2024-03-15T11:00:00Z',
          likes: 5,
          tags: ['technical', 'performance']
        },
        {
          id: 3,
          user: 'Anonymous',
          text: 'The medical applications are very promising.',
          date: '2024-03-15T11:30:00Z',
          likes: 3,
          tags: ['medical', 'applications']
        }
      ],
      tags: ['technical', 'performance', 'medical', 'applications'],
      sentiment: { positive: 20, neutral: 5, negative: 5 }
    }
  },
  'mock-match-1-3': {
    matchId: 'mock-match-1-3',
    date: '2024-03-10T15:45:00Z',
    papers: {
      'mock-1': {
        paperId: 'mock-1',
        score: 90,
        result: 'win',
        reviews: [
          {
            reviewer: { 
              name: 'Claude 3', 
              provider: 'Anthropic',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Claude3',
              model: 'claude-3-sonnet-20240229',
              version: '2024-03-10'
            },
            metrics: {
              'Technical Quality': 9,
              'Novelty': 8,
              'Impact': 9,
              'Clarity': 8
            },
            analysis: 'The paper demonstrates excellent practical implementation of real-time object detection. The architecture choices and optimization techniques are well-justified.'
          }
        ]
      },
      'mock-3': {
        paperId: 'mock-3',
        score: 85,
        result: 'loss',
        reviews: [
          {
            reviewer: { 
              name: 'GPT-4', 
              provider: 'OpenAI',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GPT4',
              model: 'gpt-4-turbo-preview',
              version: '2024-03-10'
            },
            metrics: {
              'Technical Quality': 8,
              'Novelty': 9,
              'Impact': 8,
              'Clarity': 7
            },
            analysis: 'The transformer-based approach for video understanding shows promise, but the computational complexity could be a limiting factor for real-world applications.'
          }
        ]
      }
    },
    comparison: {
      winner: 'mock-1',
      analysis: 'Paper 1 shows better practical applicability and clearer implementation details.',
      keyPoints: ['Better practical implementation', 'Clearer documentation']
    },
    feedback: {
      likes: 20,
      dislikes: 5,
      comments: [
        {
          id: 2,
          user: 'Anonymous',
          text: 'The practical implementation details are very well explained.',
          date: '2024-03-10T16:00:00Z',
          likes: 4,
          tags: ['implementation', 'practical']
        },
        {
          id: 5,
          user: 'Anonymous',
          text: 'The video understanding capabilities are impressive.',
          date: '2024-03-10T16:30:00Z',
          likes: 2,
          tags: ['video', 'transformers']
        }
      ],
      tags: ['implementation', 'practical', 'video', 'transformers'],
      sentiment: { positive: 16, neutral: 4, negative: 5 }
    }
  },
  'mock-match-2-3': {
    matchId: 'mock-match-2-3',
    date: '2024-03-12T14:20:00Z',
    papers: {
      'mock-2': {
        paperId: 'mock-2',
        score: 85,
        result: 'win',
        reviews: [
          {
            reviewer: { 
              name: 'GPT-4', 
              provider: 'OpenAI',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GPT4',
              model: 'gpt-4-turbo-preview',
              version: '2024-03-12'
            },
            metrics: {
              'Technical Quality': 8,
              'Novelty': 9,
              'Impact': 9,
              'Clarity': 8
            },
            analysis: 'The self-supervised learning framework shows excellent potential for medical applications. The clinical validation results are particularly impressive.'
          }
        ]
      },
      'mock-3': {
        paperId: 'mock-3',
        score: 82,
        result: 'loss',
        reviews: [
          {
            reviewer: { 
              name: 'Claude 3', 
              provider: 'Anthropic',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Claude3',
              model: 'claude-3-opus-20240229',
              version: '2024-03-12'
            },
            metrics: {
              'Technical Quality': 8,
              'Novelty': 8,
              'Impact': 7,
              'Clarity': 8
            },
            analysis: 'While the transformer architecture is well-implemented, the paper could benefit from more extensive ablation studies and comparisons with existing video understanding methods.'
          }
        ]
      }
    },
    comparison: {
      winner: 'mock-2',
      analysis: 'Paper 2 demonstrated superior medical applications and clearer clinical relevance.',
      keyPoints: ['Better medical applications', 'Stronger clinical validation']
    },
    feedback: {
      likes: 21,
      dislikes: 5,
      comments: [
        {
          id: 4,
          user: 'Anonymous',
          text: 'The clinical validation is particularly impressive.',
          date: '2024-03-12T15:00:00Z',
          likes: 6,
          tags: ['clinical', 'validation']
        },
        {
          id: 6,
          user: 'Anonymous',
          text: 'The transformer architecture is well implemented.',
          date: '2024-03-12T15:30:00Z',
          likes: 3,
          tags: ['architecture', 'transformers']
        }
      ],
      tags: ['clinical', 'validation', 'architecture', 'transformers'],
      sentiment: { positive: 18, neutral: 3, negative: 5 }
    }
  }
};

// Helper function to get leaderboard data
export const getMockLeaderboardData = () => {
  return Object.values(mockPapers).map(paper => {
    const matches = paper.matches.map(matchId => {
      const match = mockMatches[matchId];
      const opponentId = Object.keys(match.papers).find(id => id !== paper.paperId);
      const opponent = mockPapers[opponentId];
      const paperMatch = match.papers[paper.paperId];
      
      // Ensure each match has at least two different AI reviewers
      const reviewers = new Set();
      while (reviewers.size < 2) {
        const reviewer = getRandomReviewer();
        if (!reviewers.has(reviewer.name)) {
          reviewers.add(reviewer.name);
          if (!paperMatch.reviews) paperMatch.reviews = [];
          if (paperMatch.reviews.length < 2) {
            paperMatch.reviews.push({
              reviewer,
              metrics: {
                'Technical Quality': Math.floor(Math.random() * 3) + 7,
                'Novelty': Math.floor(Math.random() * 3) + 7,
                'Impact': Math.floor(Math.random() * 3) + 7,
                'Clarity': Math.floor(Math.random() * 3) + 7,
                ...(reviewer.capabilities.reduce((acc, cap) => ({...acc, [cap]: Math.floor(Math.random() * 3) + 7}), {}))
              },
              analysis: `[${reviewer.name} Analysis] ${reviewer.style}`
            });
          }
        }
      }
      
      return {
        matchId,
        opponent: {
          paperId: opponent.paperId,
          title: opponent.title,
          score: match.papers[opponentId].score
        },
        score: paperMatch.score,
        result: paperMatch.result,
        date: match.date,
        reviews: paperMatch.reviews,
        comparison: match.comparison,
        feedback: match.feedback
      };
    });

    const wins = matches.filter(m => m.result === 'win').length;
    const winRate = matches.length > 0 ? wins / matches.length : 0;

    return {
      ...paper,
      matches,
      winRate,
      rank: paper.paperId === 'mock-1' ? 1 : paper.paperId === 'mock-2' ? 2 : 3
    };
  });
};

// Helper function to get paper details
export const getMockPaperDetails = (paperId) => {
  const paper = mockPapers[paperId];
  if (!paper) return null;

  const matches = paper.matches.map(matchId => {
    const match = mockMatches[matchId];
    const opponentId = Object.keys(match.papers).find(id => id !== paperId);
    const opponent = mockPapers[opponentId];
    const paperMatch = match.papers[paperId];
    
    return {
      matchId,
      opponent: {
        paperId: opponent.paperId,
        title: opponent.title,
        authors: opponent.authors,
        venue: opponent.venue,
        score: match.papers[opponentId].score
      },
      score: paperMatch.score,
      result: paperMatch.result,
      date: match.date,
      reviews: paperMatch.reviews,
      comparison: match.comparison,
      feedback: match.feedback
    };
  });

  return {
    ...paper,
    matches
  };
};

// Helper function to get match details
export const getMockMatchDetails = (matchId) => {
  const match = mockMatches[matchId];
  if (!match) return null;

  const paperIds = Object.keys(match.papers);
  return {
    ...match,
    papers: paperIds.map(paperId => ({
      ...mockPapers[paperId],
      ...match.papers[paperId]
    }))
  };
}; 