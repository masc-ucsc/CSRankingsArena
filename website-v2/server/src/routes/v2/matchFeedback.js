const Joi = require('joi');
const Boom = require('@hapi/boom');

// Commenting out all routes as they are now handled in matches.js
const matchFeedbackRoutes = [
  // {
  //   method: 'GET',
  //   path: '/api/v2/matches/{matchId}/feedback',
  //   options: {
  //     auth: false,
  //     validate: {
  //       params: Joi.object({
  //         matchId: Joi.string().required()
  //       })
  //     },
  //     handler: async (request, h) => {
  //       try {
  //         const { matchId } = request.params;
  //         const feedback = await request.server.app.db.MatchFeedback.findAll({
  //           where: { matchId },
  //           include: [{
  //             model: request.server.app.db.Comment,
  //             include: [{
  //               model: request.server.app.db.User,
  //               attributes: ['username']
  //             }]
  //           }]
  //         });

  //         return h.response({
  //           success: true,
  //           data: feedback
  //         });
  //       } catch (error) {
  //         return Boom.badImplementation('Error fetching match feedback');
  //       }
  //     }
  //   }
  // },
  // {
  //   method: 'POST',
  //   path: '/api/v2/matches/{matchId}/feedback',
  //   options: {
  //     // auth: 'jwt', // Temporarily disabled auth
  //     auth: false,
  //     validate: {
  //       params: Joi.object({
  //         matchId: Joi.string().required()
  //       }),
  //       payload: Joi.object({
  //         type: Joi.string().valid('like', 'dislike').required(),
  //         action: Joi.string().valid('add', 'remove').required()
  //       })
  //     },
  //     handler: async (request, h) => {
  //       try {
  //         const { matchId } = request.params;
  //         const { type, action } = request.payload;
  //         // const userId = request.auth.credentials.id; // Temporarily disabled auth
  //         const userId = 'anonymous'; // Temporary anonymous user

  //         console.log("HELOOOOOOOOOOO", request.auth);

  //         const [feedback, created] = await request.server.app.db.MatchFeedback.findOrCreate({
  //           where: { matchId },
  //           defaults: { likes: 0, dislikes: 0 }
  //         });

  //         const [userFeedback, userFeedbackCreated] = await request.server.app.db.UserMatchFeedback.findOrCreate({
  //           where: { userId, matchId },
  //           defaults: { liked: false, disliked: false }
  //         });

  //         if (type === 'like') {
  //           if (action === 'add') {
  //             feedback.likes += 1;
  //             userFeedback.liked = true;
  //             if (userFeedback.disliked) {
  //               feedback.dislikes -= 1;
  //               userFeedback.disliked = false;
  //             }
  //           } else {
  //             feedback.likes -= 1;
  //             userFeedback.liked = false;
  //           }
  //         } else {
  //           if (action === 'add') {
  //             feedback.dislikes += 1;
  //             userFeedback.disliked = true;
  //             if (userFeedback.liked) {
  //               feedback.likes -= 1;
  //               userFeedback.liked = false;
  //             }
  //           } else {
  //             feedback.dislikes -= 1;
  //             userFeedback.disliked = false;
  //           }
  //         }

  //         await feedback.save();
  //         await userFeedback.save();

  //         return h.response({
  //           success: true,
  //           data: {
  //             feedback: {
  //               likes: feedback.likes,
  //               dislikes: feedback.dislikes
  //             },
  //             userFeedback: {
  //               liked: userFeedback.liked,
  //               disliked: userFeedback.disliked
  //             }
  //           }
  //         });
  //       } catch (error) {
  //         return Boom.badImplementation('Error updating match feedback');
  //       }
  //     }
  //   }
  // },
  // {
  //   method: 'POST',
  //   path: '/api/v2/matches/{matchId}/comments',
  //   options: {
  //     // auth: 'jwt', // Temporarily disabled auth
  //     auth: false,
  //     validate: {
  //       params: Joi.object({
  //         matchId: Joi.string().required()
  //       }),
  //       payload: Joi.object({
  //         text: Joi.string().required().min(1).max(1000)
  //       })
  //     },
  //     handler: async (request, h) => {
  //       try {
  //         const { matchId } = request.params;
  //         const { text } = request.payload;
  //         // const userId = request.auth.credentials.id; // Temporarily disabled auth
  //         const userId = 'anonymous'; // Temporary anonymous user

  //         const [feedback, created] = await request.server.app.db.MatchFeedback.findOrCreate({
  //           where: { matchId },
  //           defaults: { likes: 0, dislikes: 0 }
  //         });

  //         const comment = await request.server.app.db.Comment.create({
  //           text,
  //           userId,
  //           matchFeedbackId: feedback.id
  //         });

  //         const updatedFeedback = await request.server.app.db.MatchFeedback.findOne({
  //           where: { id: feedback.id },
  //           include: [{
  //             model: request.server.app.db.Comment,
  //             include: [{
  //               model: request.server.app.db.User,
  //               attributes: ['username']
  //             }]
  //           }]
  //         });

  //         return h.response({
  //           success: true,
  //           data: {
  //             likes: updatedFeedback.likes,
  //             dislikes: updatedFeedback.dislikes,
  //             comments: updatedFeedback.Comments.map(comment => ({
  //               id: comment.id,
  //               text: comment.text,
  //               username: comment.User?.username,
  //               createdAt: comment.createdAt
  //             }))
  //           }
  //         });
  //       } catch (error) {
  //         return Boom.badImplementation('Error adding comment');
  //       }
  //     }
  //   }
  // }
];

module.exports = matchFeedbackRoutes; 