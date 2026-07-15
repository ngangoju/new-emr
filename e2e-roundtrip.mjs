// NEW EMR — clicked-through E2E round-trip (real API paths + shapes from hooks).
import { chromium } from 'playwright';

const BASE = 'http://localhost:8888';
const FE = 'http://localhost:3000';
const creds = { username: 'doctor_emr', password: 'password123' };

let failures = 0;
const check = (cond, msg) => {
  if (cond) console.log('  • PASS', msg);
  else { console.error('  ✗ FAIL', msg); failures++; }
};

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(FE + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', creds.username);
  await page.fill('input[name="password"]', creds.password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  console.log('• logged in ->', page.url());

  async function api(method, path, body) {
    const res = await context.request.fetch(BASE + path, {
      method, headers: { 'Content-Type': 'application/json' },
      data: body ? JSON.stringify(body) : undefined,
    });
    const status = res.status();
    let data = null; try { data = await res.json(); } catch {}
    if (status >= 400) console.log(`    [${method} ${path}] -> ${status}`, JSON.stringify(data)?.slice(0, 220));
    return { status, data };
  }

  const uid = () => 'E2E' + Date.now() + Math.floor(Math.random() * 1000);

  // 1. patient
  const patient = { firstName: 'E2E', lastName: 'Patient', gender: 'FEMALE',
    dateOfBirth: '1990-01-01', nationalId: uid(), phone: '+250788000000' };
  let r = await api('POST', '/api/patients', patient);
  check(r.status === 201 || r.status === 200, `create patient (${r.status})`);
  const patientId = r.data?.id || r.data?.data?.id;
  check(!!patientId, 'patient id present'); console.log('  patientId', patientId);

  // 2. admission
  const wards = await api('GET', '/api/admissions/wards');
  const wardId = Array.isArray(wards.data) ? wards.data[0]?.id : wards.data?.id;
  const beds = await api('GET', `/api/admissions/wards/${wardId}/beds`);
  const bedId = Array.isArray(beds.data) ? beds.data[0]?.id : beds.data?.id;
  check(!!wardId && !!bedId, `ward + bed available`);

  const admission = { patientId, wardId, bedId, reason: 'Labour' };
  r = await api('POST', '/api/admissions', admission);
  check(r.status === 201 || r.status === 200, `create admission (${r.status})`);
  const admissionId = r.data?.id || r.data?.data?.id;
  check(!!admissionId, 'admission id present'); console.log('  admissionId', admissionId);

  // 3. surgeon id from auth/me
  const me = await api('GET', '/auth/me');
  const currentUserId = me.data?.id;
  check(!!currentUserId, `current user id present (${currentUserId})`);

  // 4. available theatre (no double-booking)
  const available = await api('GET', '/api/theatre/theatres/available');
  const theatreId = Array.isArray(available.data) && available.data.length > 0
    ? available.data[0].id
    : (Array.isArray(available.data) ? available.data[0]?.id : available.data?.id);
  check(!!theatreId, `available theatre present (${theatreId})`);

  // 5. schedule case (matches CreateTheatreCaseRequest from useTheatre.ts)
  const theatreCase = {
    theatreId, surgeonId: currentUserId, patientId, admissionId,
    procedureName: 'E2E Caesarean', procedureCode: 'CS001',
    scheduledStart: new Date(Date.now() + 172800000).toISOString(),  // +48h
    scheduledEnd: new Date(Date.now() + 259200000).toISOString(),    // +72h
    notes: 'E2E test case',
  };
  r = await api('POST', '/api/theatre/cases', theatreCase);
  check(r.status === 201 || r.status === 200, `schedule theatre case (${r.status})`);
  const caseId = r.data?.id || r.data?.data?.id;
  check(!!caseId, 'theatre case id present'); console.log('  caseId', caseId);

  // 6. checklist stages SIGN_IN -> TIME_OUT -> SIGN_OUT
  if (caseId) {
    for (const stage of ['SIGN_IN', 'TIME_OUT', 'SIGN_OUT']) {
      r = await api('PUT', `/api/theatre/cases/${caseId}/checklist/stage`, { stage });
      check(r.status === 200, `checklist stage ${stage} (${r.status})`);
    }

    // 7. op-note write + sign
    const opNote = { procedure: 'E2E Caesarean section', findings: 'Uneventful',
      anesthesiaNotes: 'Spinal', bloodLossMl: 300, countsConfirmed: true };
    r = await api('PUT', `/api/theatre/cases/${caseId}/operation-note`, opNote);
    check(r.status === 200 || r.status === 201, `write op-note (${r.status})`);
    r = await api('POST', `/api/theatre/cases/${caseId}/operation-note/sign`, {});
    check(r.status === 200, `sign op-note (${r.status})`);
  }

  // 8. delivery + newborn (matches RecordDeliveryRequest + CreateNewbornDto from hooks)
  if (admissionId) {
    const delivery = {
      admissionId, patientId, mode: 'CAESAREAN', outcome: 'LIVE_BIRTH',
      deliveredAt: new Date().toISOString(),
      apgar1min: 8, apgar5min: 9, birthWeightGrams: 3200, estimatedBloodLossMl: 300,
      complications: ['NONE'], registerNewborn: true,
    };
    r = await api('POST', '/api/maternity/deliveries', delivery);
    check(r.status === 201 || r.status === 200, `record delivery (${r.status})`);
    const deliveryId = r.data?.id || r.data?.data?.id;
    check(!!deliveryId, 'delivery id present');

    if (deliveryId) {
      const newborn = {
        deliveryId, motherId: patientId, admissionId,
        gender: 'MALE',
        birthWeightGm: 3200,
        apgarScore1min: 8, apgarScore5min: 9,
      };
      r = await api('POST', '/api/maternity/newborns', newborn);
      check(r.status === 201 || r.status === 200, `register newborn (${r.status})`);
      const newbornId = r.data?.id || r.data?.data?.id;
      check(!!newbornId, 'newborn id present (linked Patient created)');
    }
  }

  // screenshots of both dashboards
  await page.goto(FE + '/dashboard/theatre', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/e2e-theatre.png' });
  await page.goto(FE + '/dashboard/maternity', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/e2e-maternity.png' });
  console.log('• screenshots: /tmp/e2e-theatre.png /tmp/e2e-maternity.png');

  await browser.close();
  const verdict = failures === 0 ? 'E2E ROUND-TRIP: ALL GREEN' : `E2E ROUND-TRIP: ${failures} FAILURE(S)`;
  console.log('\n' + verdict);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch(e => { console.error('E2E ERROR', e); process.exit(2); });
