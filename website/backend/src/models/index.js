/**
 * Database Models
 * 
 * This file defines Mongoose schemas and models for the application.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Paper Schema
const paperSchema = new Schema({
  source: {
    type: String,
    required: true,
    enum: ['arxiv', 'conference', 'journal', 'university']
  },
  arxiv_id: String,
  title: {
    type: String,
    required: true,
    index: true
  },
  authors: {
    type: [String],
    required: true
  },
  abstract: {
    type: String,
    required: true
  },
  categories: [String],
  main_topic: {
    type: String,
    required: true,
    enum: ['Architecture', 'Programming', 'AI', 'Other'],
    index: true
  },
  pdf_url: String,
  published_date: {
    type: Date,
    required: true,
    index: true
  },
  updated_date: Date,
  collected_date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Match Schema
const matchSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paper_id: {
    type: Schema.Types.ObjectId,
    ref: 'Paper',
    required: true
  },
  paper: {
    title: {
      type: String,
      required: true
    },
    authors: [String],
    abstract: String,
    main_topic: String
  },
  agent1: {
    type: String,
    required: true
  },
  agent2: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'error'],
    default: 'pending',
    index: true
  },
  result: {
    type: String,
    enum: ['win_agent1', 'win_agent2', 'draw', null],
    default: null
  },
  error: String,
  created_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Result Schema
const resultSchema = new Schema({
  match_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paper_id: {
    type: Schema.Types.ObjectId,
    ref: 'Paper'
  },
  agent1: {
    type: String,
    required: true
  },
  agent2: {
    type: String,
    required: true
  },
  review1: {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    questions: [String],
    rating: {
      type: Number,
      min: 1,
      max: 10
    },
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  },
  review2: {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    questions: [String],
    rating: {
      type: Number,
      min: 1,
      max: 10
    },
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  },
  evaluation: {
    winner: String,
    reasoning: String,
    scores: {
      technical_correctness: {
        agent1: Number,
        agent2: Number
      },
      depth_of_analysis: {
        agent1: Number,
        agent2: Number
      },
      constructive_feedback: {
        agent1: Number,
        agent2: Number
      },
      clarity: {
        agent1: Number,
        agent2: Number
      },
      fairness: {
        agent1: Number,
        agent2: Number
      }
    },
    total_scores: {
      agent1: Number,
      agent2: Number
    }
  },
  result: {
    type: String,
    enum: ['win_agent1', 'win_agent2', 'draw'],
    required: true
  },
  completed_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Feedback Schema
const feedbackSchema = new Schema({
  match_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    index: true
  },
  username: String,
  comment: {
    type: String,
    required: true
  },
  vote: {
    type: String,
    enum: ['agree', 'disagree', null],
    default: null
  },
  likes: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// User Vote Schema (for tracking user votes on matches)
const userVoteSchema = new Schema({
  match_id: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  vote: {
    type: String,
    enum: ['agree', 'disagree'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index for user votes
userVoteSchema.index({ match_id: 1, user_id: 1 }, { unique: true });

// Create models
const Paper = mongoose.model('Paper', paperSchema);
const Match = mongoose.model('Match', matchSchema);
const Result = mongoose.model('Result', resultSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);
const UserVote = mongoose.model('UserVote', userVoteSchema);

module.exports = {
  Paper,
  Match,
  Result,
  Feedback,
  UserVote
};