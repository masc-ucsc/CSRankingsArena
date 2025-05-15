// Mock data for development and testing

const mockPapers = [
    {
        id: 'paper1',
        title: 'Attention Is All You Need',
        abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms...',
        authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
        published: '2017-06-12',
        venue: 'NeurIPS',
        category: 'ai',
        subcategories: ['nlp', 'transformer'],
        citations: 50000,
        arxivId: '1706.03762'
    },
    {
        id: 'paper2',
        title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
        abstract: 'We introduce a new language representation model called BERT...',
        authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee'],
        published: '2018-10-11',
        venue: 'NAACL',
        category: 'ai',
        subcategories: ['nlp', 'transformer'],
        citations: 45000,
        arxivId: '1810.04805'
    },
    {
        id: 'paper3',
        title: 'ResNet: Deep Residual Learning for Image Recognition',
        abstract: 'Deeper neural networks are more difficult to train...',
        authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren'],
        published: '2015-12-10',
        venue: 'CVPR',
        category: 'ai',
        subcategories: ['vision', 'cnn'],
        citations: 40000,
        arxivId: '1512.03385'
    }
];

const mockMatches = [
    {
        id: 'match1',
        paper1: mockPapers[0],
        paper2: mockPapers[1],
        winner: 'paper1',
        timestamp: '2024-03-15T10:00:00Z',
        category: 'ai',
        subcategory: 'nlp'
    },
    {
        id: 'match2',
        paper1: mockPapers[1],
        paper2: mockPapers[2],
        winner: 'paper2',
        timestamp: '2024-03-15T11:00:00Z',
        category: 'ai',
        subcategory: 'vision'
    }
];

const mockLeaderboard = [
    {
        paperId: 'paper1',
        title: 'Attention Is All You Need',
        wins: 15,
        losses: 5,
        winRate: 0.75,
        eloRating: 1850,
        category: 'ai',
        subcategory: 'nlp'
    },
    {
        paperId: 'paper2',
        title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
        wins: 12,
        losses: 8,
        winRate: 0.60,
        eloRating: 1750,
        category: 'ai',
        subcategory: 'nlp'
    },
    {
        paperId: 'paper3',
        title: 'ResNet: Deep Residual Learning for Image Recognition',
        wins: 18,
        losses: 2,
        winRate: 0.90,
        eloRating: 1950,
        category: 'ai',
        subcategory: 'vision'
    }
];

mockPapers.push(
    {
        id: 'paper4',
        title: 'GPT-3: Language Models are Few-Shot Learners',
        abstract: 'We demonstrate that language models can be trained to perform tasks with few examples...',
        authors: ['Tom B. Brown', 'Benjamin Mann', 'Nick Ryder'],
        published: '2020-05-28',
        venue: 'NeurIPS',
        category: 'ai',
        subcategories: ['nlp', 'language-model'],
        citations: 35000,
        arxivId: '2005.14165'
    },
    {
        id: 'paper5',
        title: 'AlexNet: ImageNet Classification with Deep Convolutional Neural Networks',
        abstract: 'We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images...',
        authors: ['Alex Krizhevsky', 'Ilya Sutskever', 'Geoffrey E. Hinton'],
        published: '2012-09-30',
        venue: 'NeurIPS',
        category: 'ai',
        subcategories: ['vision', 'cnn'],
        citations: 60000,
        arxivId: '1207.0580'
    },
    {
        id: 'paper6',
        title: 'AlphaGo: Mastering the game of Go with deep neural networks and tree search',
        abstract: 'A program that combines deep neural networks and tree search to play the game of Go...',
        authors: ['David Silver', 'Aja Huang', 'Chris J Maddison'],
        published: '2016-01-27',
        venue: 'Nature',
        category: 'ai',
        subcategories: ['rl', 'games'],
        citations: 25000,
        arxivId: '1603.06106'
    }
);

mockMatches.push(
    {
        id: 'match3',
        paper1: mockPapers[2],
        paper2: mockPapers[4],
        winner: 'paper5',
        timestamp: '2024-03-16T09:00:00Z',
        category: 'ai',
        subcategory: 'vision'
    },
    {
        id: 'match4',
        paper1: mockPapers[3],
        paper2: mockPapers[5],
        winner: 'paper6',
        timestamp: '2024-03-16T10:00:00Z',
        category: 'ai',
        subcategory: 'rl'
    }
);

mockLeaderboard.push(
    {
        paperId: 'paper4',
        title: 'GPT-3: Language Models are Few-Shot Learners',
        wins: 10,
        losses: 7,
        winRate: 0.59,
        eloRating: 1700,
        category: 'ai',
        subcategory: 'nlp'
    },
    {
        paperId: 'paper5',
        title: 'AlexNet: ImageNet Classification with Deep Convolutional Neural Networks',
        wins: 20,
        losses: 3,
        winRate: 0.87,
        eloRating: 2000,
        category: 'ai',
        subcategory: 'vision'
    }
);

module.exports = {
    mockPapers,
    mockMatches,
    mockLeaderboard
}; 