import { spawn } from "child_process";

const BASE_PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${BASE_PORT}`;

// Randomized IP generator for isolated test cases
function randomIp() {
  return `10.42.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`;
}

let serverProcess = null;

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/v1/auth/me`, {
        headers: { "X-Forwarded-For": randomIp() },
      });
      if (res.status === 401 || res.status === 200) return true;
    } catch {
      // Waiting for socket to open
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server failed to start at ${url} within ${timeoutMs}ms`);
}

async function startServer() {
  // Check if server is already running
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`);
    if (res.status) {
      console.log(`📡 Using active server on ${BASE_URL}`);
      return;
    }
  } catch {
    // Not running, launch next start
  }

  console.log(`🚀 Starting Next.js production server on port ${BASE_PORT}...`);
  serverProcess = spawn("npm", ["run", "start", "--", "-p", String(BASE_PORT)], {
    stdio: "pipe",
    env: { ...process.env, PORT: String(BASE_PORT) },
  });

  serverProcess.stdout.resume();
  serverProcess.stderr.resume();

  await waitForServer(BASE_URL);
  console.log(`✅ Server online at ${BASE_URL}`);
}

async function stopServer() {
  if (serverProcess) {
    console.log("🛑 Stopping server process...");
    serverProcess.kill("SIGTERM");
  }
}

// Test Suite Runner
const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function test(name, fn) {
  try {
    process.stdout.write(`  ⏳ ${name}... `);
    await fn();
    console.log(`\x1b[32mPASS\x1b[0m`);
    results.push({ name, status: "PASS" });
  } catch (err) {
    console.log(`\x1b[31mFAIL\x1b[0m`);
    console.error(`     \x1b[31m${err.message}\x1b[0m`);
    results.push({ name, status: "FAIL", error: err.message });
  }
}

async function runSuite() {
  console.log("\n=======================================================");
  console.log(" Expense Application Architecture Verification");
  console.log("=======================================================\n");

  await startServer();

  try {
    // Shared state between assertion steps
    let userACookie = "";
    let userAId = "";
    let userBCookie = "";
    let userATxId = "";
    let systemCategoryId = "";

    // AC-1: Authentication & Session Verification
    await test("AC-1: Authentication, registration, and unauthorized route rejection", async () => {
      const ip = randomIp();

      // 1. Unauthenticated request to /transactions must return 401
      const unauthRes = await fetch(`${BASE_URL}/api/v1/transactions`, {
        headers: { "X-Forwarded-For": ip },
      });
      assert(unauthRes.status === 401, `Expected 401 Unauthorized, got ${unauthRes.status}`);
      const unauthBody = await unauthRes.json();
      assert(unauthBody.success === false, "Expected success: false");
      assert(unauthBody.error === "UNAUTHORIZED", "Expected error: UNAUTHORIZED");

      // 2. Register User A
      const emailA = `test-user-a-${Date.now()}@expense.dev`;
      const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
        body: JSON.stringify({
          email: emailA,
          password: "SecurePassword123!",
          fullName: "User Alpha",
        }),
      });
      assert(regRes.status === 201, `Expected 201 Created, got ${regRes.status}`);
      const regBody = await regRes.json();
      assert(regBody.success === true, "Expected success: true");
      userAId = regBody.data.user.id;

      // Extract cookie
      const setCookie = regRes.headers.get("set-cookie");
      assert(setCookie && setCookie.includes("expense_session="), "Expected HttpOnly expense_session cookie");
      userACookie = setCookie.split(";")[0];

      // 3. Verify /auth/me returns User A
      const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      assert(meRes.status === 200, `Expected 200 OK, got ${meRes.status}`);
      const meBody = await meRes.json();
      assert(meBody.data.id === userAId, "User ID matches registered user");

      // 4. Register User B for Anti-IDOR testing
      const emailB = `test-user-b-${Date.now()}@expense.dev`;
      const regBRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": randomIp() },
        body: JSON.stringify({
          email: emailB,
          password: "SecurePassword123!",
          fullName: "User Beta",
        }),
      });
      const regBBody = await regBRes.json();
      assert(regBBody.data?.user?.id, "User B registered successfully");
      userBCookie = regBRes.headers.get("set-cookie").split(";")[0];
    });

    // Obtain a system category ID & verify category creation and taxonomy
    await test("Setup: Fetch categories & verify custom category creation", async () => {
      const catRes = await fetch(`${BASE_URL}/api/v1/categories`, {
        headers: { Cookie: userACookie, "X-Forwarded-For": randomIp() },
      });
      assert(catRes.status === 200, "Categories returned 200");
      const catBody = await catRes.json();
      assert(catBody.data.categories.length >= 14, "Enriched standard categories exist (>= 14)");
      const groceriesCat = catBody.data.categories.find((c) => c.name === "Groceries");
      systemCategoryId = (groceriesCat || catBody.data.categories[0]).id;

      // Create Custom Category as User A
      const customCatRes = await fetch(`${BASE_URL}/api/v1/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": randomIp() },
        body: JSON.stringify({
          name: "Pet Care & Veterinary",
          type: "EXPENSE",
        }),
      });
      assert(customCatRes.status === 201, "Custom category created with 201");
      const customCatBody = await customCatRes.json();
      assert(customCatBody.data.category.name === "Pet Care & Veterinary", "Custom category name matches");

      // Verify Duplicate Rejection (409)
      const dupCatRes = await fetch(`${BASE_URL}/api/v1/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": randomIp() },
        body: JSON.stringify({
          name: "Pet Care & Veterinary",
          type: "EXPENSE",
        }),
      });
      assert(dupCatRes.status === 409, "Duplicate category rejected with 409 Conflict");

      // Verify User B does not see User A's custom category (Tenant Isolation)
      const userBCatRes = await fetch(`${BASE_URL}/api/v1/categories`, {
        headers: { Cookie: userBCookie, "X-Forwarded-For": randomIp() },
      });
      const userBCatBody = await userBCatRes.json();
      const bFoundCustom = userBCatBody.data.categories.some((c) => c.name === "Pet Care & Veterinary");
      assert(!bFoundCustom, "User B isolated from User A custom category");
    });

    // AC-2: Strict Anti-IDOR Isolation
    await test("AC-2: Mathematical Anti-IDOR tenant isolation", async () => {
      const ip = randomIp();

      // User A creates a transaction
      const createRes = await fetch(`${BASE_URL}/api/v1/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": ip },
        body: JSON.stringify({
          type: "EXPENSE",
          amount: 55.00,
          categoryId: systemCategoryId,
          date: "2026-10-15",
          description: "User A Private Grocery",
        }),
      });
      assert(createRes.status === 201, "User A created transaction");
      const createBody = await createRes.json();
      userATxId = createBody.data.id;

      // User B attempts to read User A's transaction
      const readRes = await fetch(`${BASE_URL}/api/v1/transactions/${userATxId}`, {
        headers: { Cookie: userBCookie, "X-Forwarded-For": randomIp() },
      });
      assert(readRes.status === 404, `User B reading User A tx should return 404, got ${readRes.status}`);

      // User B attempts to modify User A's transaction
      const modRes = await fetch(`${BASE_URL}/api/v1/transactions/${userATxId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: userBCookie, "X-Forwarded-For": randomIp() },
        body: JSON.stringify({ amount: 999.00 }),
      });
      assert(modRes.status === 404, `User B updating User A tx should return 404, got ${modRes.status}`);

      // User B attempts to delete User A's transaction
      const delRes = await fetch(`${BASE_URL}/api/v1/transactions/${userATxId}`, {
        method: "DELETE",
        headers: { Cookie: userBCookie, "X-Forwarded-For": randomIp() },
      });
      assert(delRes.status === 404, `User B deleting User A tx should return 404, got ${delRes.status}`);
    });

    // AC-3: Transaction Creation and Aggregate Summary Calculations
    await test("AC-3: Transaction creation & live aggregate calculations", async () => {
      const ip = randomIp();

      // Create an INCOME transaction
      const salaryRes = await fetch(`${BASE_URL}/api/v1/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": ip },
        body: JSON.stringify({
          type: "INCOME",
          amount: 1000.00,
          categoryId: systemCategoryId,
          date: "2026-10-15",
          description: "Test Client Retainer",
        }),
      });
      assert(salaryRes.status === 201, "Income transaction created");

      // Query analytics summary
      const sumRes = await fetch(`${BASE_URL}/api/v1/analytics/summary`, {
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      assert(sumRes.status === 200, "Summary returns 200");
      const sumBody = await sumRes.json();
      const metrics = sumBody.data.metrics;
      assert(metrics.totalIncome >= 1000.00, "Total income reflects created income");
      assert(metrics.totalExpenses >= 55.00, "Total expenses reflects created expense");
      assert(metrics.netBalance === Number((metrics.totalIncome - metrics.totalExpenses).toFixed(2)), "Net balance is exactly Income - Expenses");
      assert(typeof metrics.savingsRate === "number", "Savings rate calculated");
    });

    // AC-4: Decimal Monetary Validation Constraints
    await test("AC-4: Decimal validation constraints (reject negative, zero, >2 decimals)", async () => {
      const ip = randomIp();

      // Negative amount
      const negRes = await fetch(`${BASE_URL}/api/v1/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": ip },
        body: JSON.stringify({
          type: "EXPENSE",
          amount: -25.00,
          categoryId: systemCategoryId,
          date: "2026-10-15",
          description: "Negative Invalid Test",
        }),
      });
      assert(negRes.status === 400, `Expected 400 for negative amount, got ${negRes.status}`);

      // Zero amount
      const zeroRes = await fetch(`${BASE_URL}/api/v1/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": ip },
        body: JSON.stringify({
          type: "EXPENSE",
          amount: 0,
          categoryId: systemCategoryId,
          date: "2026-10-15",
          description: "Zero Invalid Test",
        }),
      });
      assert(zeroRes.status === 400, `Expected 400 for zero amount, got ${zeroRes.status}`);

      // More than 2 decimal places (e.g. 15.999)
      const tripleDecRes = await fetch(`${BASE_URL}/api/v1/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": ip },
        body: JSON.stringify({
          type: "EXPENSE",
          amount: 15.999,
          categoryId: systemCategoryId,
          date: "2026-10-15",
          description: "3 Decimal Places Test",
        }),
      });
      assert(tripleDecRes.status === 400, `Expected 400 for >2 decimal places, got ${tripleDecRes.status}`);
    });

    // AC-5: Field-Level Update Diff & AuditLog Persistence
    await test("AC-5: Field-level update diff computation & audit trail", async () => {
      const ip = randomIp();

      const updateRes = await fetch(`${BASE_URL}/api/v1/transactions/${userATxId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": ip },
        body: JSON.stringify({
          amount: 65.50,
          description: "User A Updated Grocery Restock",
        }),
      });
      assert(updateRes.status === 200, `Expected 200 OK, got ${updateRes.status}`);
      const updateBody = await updateRes.json();
      assert(updateBody.data.amount === 65.50, "Amount successfully updated");
      assert(updateBody.data.diff !== undefined, "Diff object returned in response");
      assert(updateBody.data.diff.amount !== undefined, "Amount recorded in diff");
      assert(updateBody.data.diff.amount.from === 55, "Diff recorded correct from value");
      assert(updateBody.data.diff.amount.to === 65.50, "Diff recorded correct to value");

      // Verify AuditLog entry is present when fetching single transaction
      const getRes = await fetch(`${BASE_URL}/api/v1/transactions/${userATxId}`, {
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      const getBody = await getRes.json();
      const logs = getBody.data.auditLogs;
      assert(Array.isArray(logs) && logs.length >= 2, "Transaction contains CREATE and UPDATE audit logs");
      const updateLog = logs.find((l) => l.action === "UPDATE");
      assert(updateLog !== undefined, "UPDATE action found in audit log");
    });

    // AC-6: Soft-Archival Lifecycle and Restoration
    await test("AC-6: Soft-archival lifecycle and restoration", async () => {
      const ip = randomIp();

      // 1. Soft-archive transaction
      const archiveRes = await fetch(`${BASE_URL}/api/v1/transactions/${userATxId}`, {
        method: "DELETE",
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      assert(archiveRes.status === 200, "Archive returns 200");
      const archiveBody = await archiveRes.json();
      assert(archiveBody.data.isArchived === true, "isArchived set to true");
      assert(archiveBody.data.archivedAt !== null, "archivedAt timestamp set");

      // 2. Verify it is excluded from active ledger
      const listRes = await fetch(`${BASE_URL}/api/v1/transactions`, {
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      const listBody = await listRes.json();
      const activeFound = listBody.data.transactions.some((t) => t.id === userATxId);
      assert(!activeFound, "Soft-archived transaction omitted from active list");

      // 3. Restore transaction
      const restoreRes = await fetch(`${BASE_URL}/api/v1/transactions/${userATxId}/restore`, {
        method: "POST",
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      assert(restoreRes.status === 200, "Restore returns 200");
      const restoreBody = await restoreRes.json();
      assert(restoreBody.data.isArchived === false, "isArchived restored to false");
      assert(restoreBody.data.archivedAt === null, "archivedAt cleared to null");

      // 4. Verify it reappears in active ledger
      const listRes2 = await fetch(`${BASE_URL}/api/v1/transactions`, {
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      const listBody2 = await listRes2.json();
      const restoredFound = listBody2.data.transactions.some((t) => t.id === userATxId);
      assert(restoredFound, "Restored transaction visible in active list");

      // 5. Permanent Purge Lifecycle
      const tempTxRes = await fetch(`${BASE_URL}/api/v1/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": ip },
        body: JSON.stringify({
          type: "EXPENSE",
          amount: 19.99,
          categoryId: systemCategoryId,
          date: "2026-10-15",
          description: "Temporary Purge Candidate",
        }),
      });
      assert(tempTxRes.status === 201, "Created temporary transaction for purge");
      const tempTxBody = await tempTxRes.json();
      const purgeId = tempTxBody.data.id;

      const purgeRes = await fetch(`${BASE_URL}/api/v1/transactions/${purgeId}?permanent=true`, {
        method: "DELETE",
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      assert(purgeRes.status === 200, "Purge returns 200 OK");
      const purgeBody = await purgeRes.json();
      assert(purgeBody.data.deletedPermanently === true, "deletedPermanently flag is true");

      const verifyPurgedRes = await fetch(`${BASE_URL}/api/v1/transactions/${purgeId}`, {
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      assert(verifyPurgedRes.status === 404, "Permanently purged record returns 404 Not Found");
    });

    // AC-7: Sliding-Window Rate Limiting Enforcement
    await test("AC-7: Sliding-window rate limit enforcement (HTTP 429 & Retry-After)", async () => {
      const fixedIp = `10.99.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
      let hit429 = false;
      let retryAfterHeader = null;

      // Mutation quota is 20 requests/minute. Send 22 requests from the exact same IP
      for (let i = 0; i < 22; i++) {
        const res = await fetch(`${BASE_URL}/api/v1/transactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: userACookie,
            "X-Forwarded-For": fixedIp,
          },
          body: JSON.stringify({
            type: "EXPENSE",
            amount: 10.00,
            categoryId: systemCategoryId,
            date: "2026-10-15",
            description: `Burst Test ${i}`,
          }),
        });

        if (res.status === 429) {
          hit429 = true;
          retryAfterHeader = res.headers.get("retry-after");
          break;
        }
      }

      assert(hit429, "Rate limiter correctly responded with HTTP 429 upon exceeding quota");
      assert(retryAfterHeader !== null && parseInt(retryAfterHeader, 10) > 0, "Response includes valid Retry-After header");
    });

    // AC-8: Security Gate Verification (CWE-1236, CWE-601, Headers, Malformed JSON)
    await test("AC-8: Defensive engineering matrix (CWE-1236, CWE-601, security headers)", async () => {
      const ip = randomIp();

      // 1. Mandatory Security Headers
      const headRes = await fetch(`${BASE_URL}/api/v1/categories`, {
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      assert(headRes.headers.get("x-content-type-options") === "nosniff", "Contains X-Content-Type-Options: nosniff");
      assert(headRes.headers.get("x-frame-options") === "DENY", "Contains X-Frame-Options: DENY");
      assert(headRes.headers.get("referrer-policy") === "strict-origin-when-cross-origin", "Contains Referrer-Policy");

      // 2. Malformed JSON Body -> 400 Bad Request
      const badJsonRes = await fetch(`${BASE_URL}/api/v1/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: userACookie,
          "X-Forwarded-For": ip,
        },
        body: "{ this is invalid json : true ",
      });
      assert(badJsonRes.status === 400, `Expected 400 for malformed JSON, got ${badJsonRes.status}`);

      // 3. CWE-1236 CSV Formula Injection Sanitization
      const formulaPayload = "=CMD|' /C calc'!A0";
      await fetch(`${BASE_URL}/api/v1/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: userACookie, "X-Forwarded-For": ip },
        body: JSON.stringify({
          type: "EXPENSE",
          amount: 42.00,
          categoryId: systemCategoryId,
          date: "2026-10-15",
          description: formulaPayload,
        }),
      });

      const csvRes = await fetch(`${BASE_URL}/api/v1/transactions/export`, {
        headers: { Cookie: userACookie, "X-Forwarded-For": ip },
      });
      const csvBuffer = Buffer.from(await csvRes.arrayBuffer());
      const hasBom = csvBuffer[0] === 0xef && csvBuffer[1] === 0xbb && csvBuffer[2] === 0xbf;
      assert(hasBom, "CSV starts with UTF-8 BOM bytes (0xEF, 0xBB, 0xBF)");
      const csvText = csvBuffer.toString("utf-8");
      assert(csvText.includes("'" + formulaPayload) || csvText.includes('"\'='), "Formula injected cell sanitized with leading quote prefix");
    });

  } finally {
    await stopServer();
  }

  // Summary Report
  console.log("\n=======================================================");
  console.log(" Evaluation Summary Matrix");
  console.log("=======================================================");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`\n  Total Tests : ${results.length}`);
  console.log(`  Passed      : \x1b[32m${passed}\x1b[0m`);
  console.log(`  Failed      : ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : "0"}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Runner crashed:", err);
  stopServer().finally(() => process.exit(1));
});
