import axiosInstance from './axiosInstance';

/**
 * Fetch admin dashboard analytics data.
 */
export const getAnalytics = () => {
  return axiosInstance.get('/api/admin/analytics');
};

/**
 * Fetch all flagged posts pending review.
 */
export const getFlaggedPosts = () => {
  return axiosInstance.get('/api/admin/flagged-posts');
};

/**
 * Approve a flagged post (triggers categorization + embedding).
 * @param {string} postId
 */
export const approvePost = (postId) => {
  return axiosInstance.put(`/api/admin/approve/${postId}`);
};

/**
 * Permanently delete a post.
 * @param {string} postId
 */
export const deletePost = (postId) => {
  return axiosInstance.delete(`/api/admin/delete/${postId}`);
};

/**
 * Change a post's category.
 * @param {string} postId
 * @param {string} category
 */
export const changeCategory = (postId, category) => {
  return axiosInstance.put(`/api/admin/category/${postId}`, { category });
};
