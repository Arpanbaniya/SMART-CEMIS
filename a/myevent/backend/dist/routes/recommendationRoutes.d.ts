/**
 * RECOMMENDATION ROUTES
 *
 * Endpoints:
 * - GET /api/recommendations/:userId - Get recommendations for user
 * - POST /api/recommendations/admin/train - Admin: Trigger retraining
 * - GET /api/recommendations/admin/status - Admin: Get training status
 * - GET /api/recommendations/admin/health - Admin: Service health
 * - GET /api/recommendations/admin/cache - Admin: Cache statistics
 */
declare const router: import("express-serve-static-core").Router;
export default router;
