const { Router } = require("express");

const cartsRouter = require("./carts.routes");
const usersRouter = require("./users.routes");
const dishesRouter = require("./dishes.routes");
const sessionsRouter = require("./sessions.routes");

const routes = Router();

routes.use("/carts", cartsRouter)
routes.use("/users", usersRouter)
routes.use("/dishes", dishesRouter)
routes.use("/sessions", sessionsRouter)

module.exports = routes;