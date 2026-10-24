const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");

const environmentPath = path.join(__dirname, "..", ".env");

if (process.env.NODE_ENV === "production") {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
        console.error("Production requires SESSION_SECRET to be set to a random value of at least 32 characters.");
        process.exit(1);
    }
    process.exit(0);
}

if (!fs.existsSync(environmentPath)) {
    const localEnvironment = [
        "NODE_ENV=development",
        "PORT=3000",
        "HOST=127.0.0.1",
        `SESSION_SECRET=${randomBytes(48).toString("hex")}`,
        ""
    ].join("\n");
    fs.writeFileSync(environmentPath, localEnvironment, { flag: "wx", mode: 0o600 });
    console.log("Created a private local .env file. It is excluded from Git.");
}

const existingEnvironment = fs.readFileSync(environmentPath, "utf8");
const secret = existingEnvironment
    .split(/\r?\n/)
    .find(line => line.startsWith("SESSION_SECRET="))
    ?.slice("SESSION_SECRET=".length)
    .trim();

if (!secret || secret.length < 32) {
    console.error("Add a random SESSION_SECRET of at least 32 characters to .env before starting CODIGEASS.");
    process.exit(1);
}
