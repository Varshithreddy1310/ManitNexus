import axiosInstance from './axiosInstance';

export const createPost = async (content, links) => {
  return axiosInstance.post('/api/posts', { content, links });
};

export const getPosts = async (category = '', page = 1, limit = 10, sort = 'votes') => {
  const params = { page, limit, sort };
  if (category) {
    params.category = category;
  }
  return axiosInstance.get('/api/posts', { params });
};

export const votePost = async (postId, voteType) => {
  return axiosInstance.put('/api/posts/vote', { postId, voteType });
};

export const getMyPosts = async () => {
  return axiosInstance.get('/api/posts/mine');
};
