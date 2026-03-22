import express from 'express';
import usersRoutes from './routes/users.js';
import listingsRoutes from './routes/listings.js';
import bookingsRoutes from './routes/bookings.js';
import verificationsRoutes from './routes/verifications.js';
import messagesRoutes from './routes/messages.js';
import reviewsRoutes from './routes/reviews.js';
import reportsRoutes from './routes/reports.js';
import savedRoutes from './routes/saved.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: "ok", database: "sqlite", timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/users', usersRoutes);
router.use('/listings', listingsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/verifications', verificationsRoutes);
router.use('/messages', messagesRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/reports', reportsRoutes);
router.use('/saved', savedRoutes);

export default router;
