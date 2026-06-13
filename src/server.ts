import { type Server } from "node:http";
import { type Socket } from "node:net";

import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

let server: Server | undefined;
let isShuttingDown = false;

const sockets = new Set<Socket>();

const closeHttpServer = async (): Promise<void> => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });

    /**
     * Close idle keep-alive connections immediately.
     * Active requests still get a chance to finish.
     */
    server?.closeIdleConnections?.();
  });
};

const destroyOpenSockets = (): void => {
  for (const socket of sockets) {
    socket.destroy();
  }

  sockets.clear();
};

const gracefulShutdown = async (
  signal: string,
  exitCode = 0,
): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");

    destroyOpenSockets();

    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);

  forceExitTimer.unref();

  try {
    /**
     * Later, when we add PostgreSQL/Prisma/Redis/etc,
     * cleanup should happen here after closing the HTTP server.
     */
    await closeHttpServer();

    clearTimeout(forceExitTimer);

    logger.info("HTTP server closed.");

    process.exit(exitCode);
  } catch (error) {
    clearTimeout(forceExitTimer);

    logger.error(error, "Graceful shutdown failed");

    destroyOpenSockets();

    process.exit(1);
  }
};

const startServer = (): void => {
  try {
    server = app.listen(env.PORT, "0.0.0.0", () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
          healthCheck: `http://localhost:${env.PORT}/health`,
        },
        "Server started successfully",
      );
    });

    server.requestTimeout = env.REQUEST_TIMEOUT_MS;
    server.headersTimeout = env.HEADERS_TIMEOUT_MS;
    server.keepAliveTimeout = env.KEEP_ALIVE_TIMEOUT_MS;

    server.on("connection", (socket) => {
      sockets.add(socket);

      socket.on("close", () => {
        sockets.delete(socket);
      });
    });

    server.on("error", (error: Error & { code?: string }) => {
      logger.error(error, "Server connection error");

      if (error.code === "EADDRINUSE") {
        logger.error(
          `Port ${env.PORT} is already in use. Free the port or use a different PORT.`,
        );
      }

      void gracefulShutdown("SERVER_ERROR", 1);
    });
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
};

startServer();

process.once("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.once("uncaughtException", (error) => {
  logger.fatal(error, "UNCAUGHT EXCEPTION");

  void gracefulShutdown("UNCAUGHT_EXCEPTION", 1);
});

process.once("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "UNHANDLED REJECTION");

  void gracefulShutdown("UNHANDLED_REJECTION", 1);
});
