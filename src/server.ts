import type { Server } from "node:http";
import type { Socket } from "node:net";

import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/prisma.js";
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
     * Stop idle keep-alive connections immediately.
     * Active requests still get time to complete until SHUTDOWN_TIMEOUT_MS.
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

const safeDisconnectDatabase = async (): Promise<void> => {
  try {
    await disconnectDatabase();
  } catch (error) {
    logger.error({ err: error }, "Failed to disconnect database cleanly.");
  }
};

const gracefulShutdown = async (
  signal: string,
  exitCode = 0,
): Promise<never | void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info({ signal }, "Graceful shutdown started.");

  const forceExitTimer = setTimeout(() => {
    logger.error(
      {
        signal,
        timeoutMs: env.SHUTDOWN_TIMEOUT_MS,
        openSockets: sockets.size,
      },
      "Graceful shutdown timed out. Forcing exit.",
    );

    destroyOpenSockets();

    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);

  forceExitTimer.unref();

  try {
    await closeHttpServer();

    logger.info("HTTP server closed.");

    await safeDisconnectDatabase();

    clearTimeout(forceExitTimer);

    logger.info({ signal, exitCode }, "Graceful shutdown completed.");

    process.exit(exitCode);
  } catch (error) {
    clearTimeout(forceExitTimer);

    logger.error({ err: error }, "Graceful shutdown failed.");

    destroyOpenSockets();

    await safeDisconnectDatabase();

    process.exit(1);
  }
};

const configureServerTimeouts = (httpServer: Server): void => {
  httpServer.requestTimeout = env.REQUEST_TIMEOUT_MS;
  httpServer.headersTimeout = env.HEADERS_TIMEOUT_MS;
  httpServer.keepAliveTimeout = env.KEEP_ALIVE_TIMEOUT_MS;
};

const trackOpenSockets = (httpServer: Server): void => {
  httpServer.on("connection", (socket: Socket) => {
    sockets.add(socket);

    socket.once("close", () => {
      sockets.delete(socket);
    });
  });
};

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const serverInstance = app.listen(env.PORT, "0.0.0.0", () => {
      logger.info(
        {
          port: env.PORT,
          host: "0.0.0.0",
          environment: env.NODE_ENV,
          healthCheck: `http://localhost:${env.PORT}/health`,
        },
        "Server started successfully.",
      );
    });

    server = serverInstance;

    configureServerTimeouts(serverInstance);
    trackOpenSockets(serverInstance);

    serverInstance.on("error", (error: Error & { code?: string }) => {
      logger.error({ err: error }, "Server error.");

      if (error.code === "EADDRINUSE") {
        logger.error(
          {
            port: env.PORT,
          },
          "Port is already in use.",
        );
      }

      void gracefulShutdown("SERVER_ERROR", 1);
    });
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start server.");

    await safeDisconnectDatabase();

    process.exit(1);
  }
};

void startServer();

process.once("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.once("uncaughtException", (error: Error) => {
  logger.fatal({ err: error }, "Uncaught exception.");

  void gracefulShutdown("UNCAUGHT_EXCEPTION", 1);
});

process.once("unhandledRejection", (reason: unknown) => {
  logger.fatal({ reason }, "Unhandled promise rejection.");

  void gracefulShutdown("UNHANDLED_REJECTION", 1);
});
