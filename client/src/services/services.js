// services/auth.service.js — Auth API calls
import api from './api';

export const authService = {
  register: (data)         => api.post('/auth/register', data),
  login:    (email, pass)  => api.post('/auth/login', { email, password: pass }),
  logout:   ()             => api.post('/auth/logout'),
  getMe:    ()             => api.get('/auth/me'),
  refresh:  (token)        => api.post('/auth/refresh', { refresh_token: token }),
};

// services/swap.service.js — Swap API calls
export const swapService = {
  getMySwaps:    (status) => api.get('/swaps', { params: status ? { status } : {} }),
  getSwap:       (id)     => api.get(`/swaps/${id}`),
  createSwap:    (data)   => api.post('/swaps', data),
  updateStatus:  (id, status) => api.patch(`/swaps/${id}`, { status }),
};

// services/skill.service.js — Skill API calls
export const skillService = {
  getMySkills:  ()     => api.get('/skills/mine'),
  getUserSkills:(id)   => api.get(`/skills/user/${id}`),
  discover:     (params) => api.get('/skills/discover', { params }),
  getMatches:   ()     => api.get('/skills/matches'),
  addSkill:     (data) => api.post('/skills', data),
  deleteSkill:  (id)   => api.delete(`/skills/${id}`),
};

// services/rating.service.js — Rating API calls
export const ratingService = {
  submitRating:    (data) => api.post('/ratings', data),
  getUserRatings:  (id)   => api.get(`/ratings/user/${id}`),
};

// services/leaderboard.service.js — Leaderboard API calls
export const leaderboardService = {
  getLeaderboard: (params) => api.get('/leaderboard', { params }),
  getHallOfFame:  (year)   => api.get('/leaderboard/hof', { params: year ? { academic_year: year } : {} }),
  getMyRank:      ()       => api.get('/leaderboard/me'),
};
