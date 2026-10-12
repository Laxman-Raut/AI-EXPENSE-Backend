/**
 * ─────────────────────────────────────────────────────────
 * Recurring Automation Feature — Integration Test
 * ─────────────────────────────────────────────────────────
 * Tests the full lifecycle:
 *   1. Login to get JWT token
 *   2. CREATE a recurring template (due in the past → fires immediately)
 *   3. Trigger the scheduler manually
 *   4. Verify a real transaction was auto-generated
 *   5. Test PAUSE / RESUME toggle
 *   6. Test EMI installment tracking
 *   7. Test UPDATE template
 *   8. Clean up (DELETE template + generated transaction)
 * ─────────────────────────────────────────────────────────
 * Usage: node test-recurring-automation.js
 * ─────────────────────────────────────────────────────────
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

// ─── Config ───────────────────────────────────────────────
const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;
const MONGODB_URI = process.env.MONGODB_URI;

// Test credentials — change to a real test user in DB
const TEST_EMAIL = 'test@example.com';   // ← Update if needed
const TEST_PASSWORD = 'Test@1234';       // ← Update if needed

// ─── Helpers ─────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;

function log(msg, type = 'info') {
  const icons = { info: '  ℹ', pass: '  ✅', fail: '  ❌', header: '\n🔷', sub: '  →' };
  console.log(`${icons[type] || '  '} ${msg}`);
}

function assert(condition, label, detail = '') {
  if (condition) {
    passed++;
    log(`PASS: ${label}`, 'pass');
  } else {
    failed++;
    log(`FAIL: ${label}${detail ? ' — ' + detail : ''}`, 'fail');
  }
}

// ─── Main Test ────────────────────────────────────────────
async function runTests() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  🔄  Recurring Automation — Integration Test Suite  ');
  console.log('════════════════════════════════════════════════════\n');

  let token = null;
  let createdRecurringId = null;
  let emiRecurringId = null;
  let generatedTxnId = null;

  // ───────────────────────────────────────────────
  // STEP 1: Authenticate
  // ───────────────────────────────────────────────
  log('STEP 1: Authentication', 'header');
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
    assert(!!token, 'Login returns a valid JWT token');
  } catch (err) {
    log(`Login failed: ${err.response?.data?.message || err.message}`, 'fail');
    log('Cannot proceed without auth — update TEST_EMAIL / TEST_PASSWORD at the top of this file.', 'info');
    failed++;
    return summarize();
  }

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // ───────────────────────────────────────────────
  // STEP 2: Create Recurring Template (due in past → fires immediately)
  // ───────────────────────────────────────────────
  log('STEP 2: Create Recurring Template', 'header');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const createRes = await api.post('/recurring-transactions', {
      type: 'expense',
      amount: 999,
      category: 'Subscriptions',
      description: '[TEST] Netflix Auto-Test',
      frequency: 'monthly',
      paymentMethod: 'UPI',
      startDate: yesterday,
      note: 'Automated test recurring',
    });

    assert(createRes.status === 201, 'POST /recurring-transactions returns 201');
    assert(createRes.data?.success === true, 'Response has success:true');

    const rec = createRes.data?.data;
    assert(!!rec?._id, 'Created template has an _id');
    assert(rec?.status === 'active', 'New template status is "active"');
    assert(rec?.frequency === 'monthly', 'Frequency is monthly');
    assert(rec?.amount > 0, 'Amount is stored correctly');

    createdRecurringId = rec?._id;
    log(`Created recurring ID: ${createdRecurringId}`, 'sub');

    // nextExecutionDate should be set to startDate (yesterday)
    const nextExec = new Date(rec?.nextExecutionDate);
    assert(nextExec <= new Date(), 'nextExecutionDate is in the past (due now)');
  } catch (err) {
    log(`Create failed: ${err.response?.data?.message || err.message}`, 'fail');
    failed++;
  }

  // ───────────────────────────────────────────────
  // STEP 3: Fetch All — Verify template appears in list
  // ───────────────────────────────────────────────
  log('STEP 3: Fetch Recurring List', 'header');
  try {
    const listRes = await api.get('/recurring-transactions');
    assert(listRes.status === 200, 'GET /recurring-transactions returns 200');
    assert(Array.isArray(listRes.data?.data), 'Response data is an array');

    const found = listRes.data.data.find((r) => r._id === createdRecurringId);
    assert(!!found, 'Created template appears in list');
    assert(found?.description === '[TEST] Netflix Auto-Test', 'Description matches');
  } catch (err) {
    log(`Fetch list failed: ${err.response?.data?.message || err.message}`, 'fail');
    failed++;
  }

  // ───────────────────────────────────────────────
  // STEP 4: Fetch by ID
  // ───────────────────────────────────────────────
  log('STEP 4: Fetch Single Recurring Template', 'header');
  if (createdRecurringId) {
    try {
      const singleRes = await api.get(`/recurring-transactions/${createdRecurringId}`);
      assert(singleRes.status === 200, 'GET /recurring-transactions/:id returns 200');
      assert(singleRes.data?.data?._id === createdRecurringId, 'Returned correct template by ID');
    } catch (err) {
      log(`Fetch by ID failed: ${err.response?.data?.message || err.message}`, 'fail');
      failed++;
    }
  }

  // ───────────────────────────────────────────────
  // STEP 5: Scheduler — Trigger & verify transaction generated
  // ───────────────────────────────────────────────
  log('STEP 5: Scheduler Auto-Execution', 'header');
  log('Waiting 35 seconds for scheduler to fire (runs every 30s)...', 'sub');
  await delay(35000);

  // Check if a transaction was auto-generated from this template
  try {
    const txnRes = await api.get('/transactions?limit=10&sortBy=createdAt&order=desc');
    const txns = txnRes.data?.data || txnRes.data?.transactions || [];

    const autoTxn = txns.find(
      (t) =>
        t.description === '[TEST] Netflix Auto-Test' &&
        t.amount === 999
    );

    assert(!!autoTxn, 'Scheduler auto-generated a transaction from the template');

    if (autoTxn) {
      generatedTxnId = autoTxn._id;
      log(`Auto-generated transaction ID: ${generatedTxnId}`, 'sub');
      assert(autoTxn.type === 'expense', 'Generated transaction type is expense');
      assert(autoTxn.category === 'Subscriptions', 'Generated transaction category matches');
      assert(autoTxn.amount === 999, 'Generated transaction amount matches');
    }

    // Also verify the recurring template's nextExecutionDate was advanced
    if (createdRecurringId) {
      const updatedRec = await api.get(`/recurring-transactions/${createdRecurringId}`);
      const newNextExec = new Date(updatedRec.data?.data?.nextExecutionDate);
      const now = new Date();
      assert(newNextExec > now, 'nextExecutionDate advanced to next month after execution');
      log(`Next execution date: ${newNextExec.toDateString()}`, 'sub');
    }
  } catch (err) {
    log(`Scheduler check failed: ${err.response?.data?.message || err.message}`, 'fail');
    log('(Server may not be running locally — start with: cd server && npm run dev)', 'info');
    failed++;
  }

  // ───────────────────────────────────────────────
  // STEP 6: Update Template
  // ───────────────────────────────────────────────
  log('STEP 6: Update Recurring Template', 'header');
  if (createdRecurringId) {
    try {
      const updateRes = await api.put(`/recurring-transactions/${createdRecurringId}`, {
        type: 'expense',
        amount: 1299,
        category: 'Subscriptions',
        description: '[TEST] Netflix Auto-Test (Updated)',
        frequency: 'monthly',
        paymentMethod: 'Credit Card',
        startDate: new Date().toISOString(),
        note: 'Updated test',
      });

      assert(updateRes.status === 200, 'PUT /recurring-transactions/:id returns 200');
      assert(updateRes.data?.success === true, 'Update response has success:true');
      assert(
        updateRes.data?.data?.description === '[TEST] Netflix Auto-Test (Updated)',
        'Description updated correctly'
      );
      assert(updateRes.data?.data?.paymentMethod === 'Credit Card', 'Payment method updated');
    } catch (err) {
      log(`Update failed: ${err.response?.data?.message || err.message}`, 'fail');
      failed++;
    }
  }

  // ───────────────────────────────────────────────
  // STEP 7: Pause → Resume Toggle
  // ───────────────────────────────────────────────
  log('STEP 7: Pause / Resume Toggle', 'header');
  if (createdRecurringId) {
    try {
      // Pause it
      const pauseRes = await api.patch(`/recurring-transactions/${createdRecurringId}/status`, {
        status: 'paused',
      });
      assert(pauseRes.status === 200, 'PATCH /status returns 200 for pause');
      assert(pauseRes.data?.data?.status === 'paused', 'Status changed to paused');

      // Resume it
      const resumeRes = await api.patch(`/recurring-transactions/${createdRecurringId}/status`, {
        status: 'active',
      });
      assert(resumeRes.status === 200, 'PATCH /status returns 200 for resume');
      assert(resumeRes.data?.data?.status === 'active', 'Status changed back to active');

      // Test invalid status
      try {
        await api.patch(`/recurring-transactions/${createdRecurringId}/status`, {
          status: 'invalid_status',
        });
        assert(false, 'Invalid status should have been rejected');
      } catch (errInvalid) {
        assert(
          errInvalid.response?.status === 400,
          'Invalid status returns 400 error'
        );
      }
    } catch (err) {
      log(`Toggle status failed: ${err.response?.data?.message || err.message}`, 'fail');
      failed++;
    }
  }

  // ───────────────────────────────────────────────
  // STEP 8: EMI Template — Installment Tracking
  // ───────────────────────────────────────────────
  log('STEP 8: EMI Installment Tracking', 'header');
  try {
    const emiRes = await api.post('/recurring-transactions', {
      type: 'expense',
      amount: 5000,
      category: 'EMI/Bill',
      description: '[TEST] Car Loan EMI',
      frequency: 'emi',
      totalInstallments: 3,
      paymentMethod: 'Bank Transfer',
      startDate: yesterday,
      note: 'Test EMI automation',
    });

    assert(emiRes.status === 201, 'EMI template created (201)');
    const emi = emiRes.data?.data;
    assert(emi?.totalInstallments === 3, 'Total installments set to 3');
    assert(emi?.paidInstallments === 0, 'Paid installments starts at 0');
    emiRecurringId = emi?._id;
    log(`EMI recurring ID: ${emiRecurringId}`, 'sub');

    // After scheduler runs, paidInstallments should increment
    log('Waiting 35s for scheduler to process EMI...', 'sub');
    await delay(35000);

    if (emiRecurringId) {
      const emiCheck = await api.get(`/recurring-transactions/${emiRecurringId}`);
      const updated = emiCheck.data?.data;
      assert(
        (updated?.paidInstallments || 0) >= 1,
        `paidInstallments incremented (got ${updated?.paidInstallments})`
      );
      log(`EMI progress: ${updated?.paidInstallments}/${updated?.totalInstallments}`, 'sub');
    }
  } catch (err) {
    log(`EMI test failed: ${err.response?.data?.message || err.message}`, 'fail');
    failed++;
  }

  // ───────────────────────────────────────────────
  // STEP 9: Not-Found Error Handling
  // ───────────────────────────────────────────────
  log('STEP 9: Error Handling — Non-existent ID', 'header');
  try {
    await api.get('/recurring-transactions/000000000000000000000000');
    assert(false, 'Should have returned 404');
  } catch (err) {
    assert(err.response?.status === 404, 'GET with fake ID returns 404');
  }

  // ───────────────────────────────────────────────
  // STEP 10: Delete Templates (Cleanup)
  // ───────────────────────────────────────────────
  log('STEP 10: Cleanup — Delete Test Templates', 'header');
  const toDelete = [createdRecurringId, emiRecurringId].filter(Boolean);
  for (const id of toDelete) {
    try {
      const delRes = await api.delete(`/recurring-transactions/${id}`);
      assert(delRes.status === 200, `DELETE /recurring-transactions/${id} returns 200`);
    } catch (err) {
      log(`Delete ${id} failed: ${err.response?.data?.message || err.message}`, 'fail');
      failed++;
    }
  }

  // Also delete auto-generated transaction if found
  if (generatedTxnId) {
    try {
      const txnDelRes = await api.delete(`/transactions/${generatedTxnId}`);
      assert(txnDelRes.status === 200, 'Auto-generated test transaction deleted');
      log(`Cleaned up generated transaction: ${generatedTxnId}`, 'sub');
    } catch (err) {
      log(`Could not delete generated transaction: ${err.response?.data?.message || err.message}`, 'info');
    }
  }

  summarize();
}

function summarize() {
  const total = passed + failed;
  console.log('\n════════════════════════════════════════════════════');
  console.log(`  Results: ${passed}/${total} tests passed`);
  if (failed === 0) {
    console.log('  🎉 All tests passed! Recurring automation is working correctly.');
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed. Check output above.`);
  }
  console.log('════════════════════════════════════════════════════\n');
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('\n❌ Unhandled test error:', err.message);
  process.exit(1);
});
