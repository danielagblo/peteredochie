import { Router } from 'express';
import healthCheck from './health-check.js';
import paystack from './paystack.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/paystack', paystack);

    return router;
};

