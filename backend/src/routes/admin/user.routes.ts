import { Router } from "express";
import { UserController } from "../../controllers/admin/user.controller.js";

const router = Router();

router.get('/search-phone', UserController.searchUserByPhone)

export default router;