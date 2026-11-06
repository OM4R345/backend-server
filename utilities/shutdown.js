const { closeConnection } = require("../database/database.js");
let shuttingDown = false;

const handleShutdown = async (signal, server) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  const forcetimer = setTimeout(() => {
    console.error(
      "Couldn't close connections in time. Forcefull shutting down.",
    );
    process.exit(1);
  }, 20000);
  forcetimer.unref();

  const services = [{ name: "mongoDB", close: () => closeConnection() }];

  server.close(async () => {
    console.log("HTTP server closed. No new requests accepted.");
    try {
      const results = await Promise.allSettled(services.map((i) => i.close()));

      let hasFailure = false;

      results.forEach((result, i) => {
        const { name } = services[i];
        if (result.status === "fulfilled") {
          console.log(`${name} closed successfully.`);
        } else {
          hasFailure = true;
          console.error(`Error while closing ${name}: `, result.reason);
        }
      });

      if (hasFailure) {
        console.error("Shutdown completed with errors.");
        process.exit(1);
      }

      console.log("All connections closed. Exiting process safly.");
      process.exit(0);
    } catch (err) {
      console.error("Unexpected error during shutdown: ", err);
      process.exit(1);
    }
  });
};

module.exports = handleShutdown;
