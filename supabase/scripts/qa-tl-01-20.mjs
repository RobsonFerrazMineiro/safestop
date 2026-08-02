import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadSupabaseLocalEnv, runLocalSql } from "./_local-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const PASSWORD = "SafeStop-QA-Local-2026";

const USERS = {
  field: "qa-field@safestop.local",
  gestor: "qa-gestor@safestop.local",
  multi: "qa-multi@safestop.local",
  platform: "qa-platform@safestop.local",
  noperm: "qa-noperm@safestop.local",
};

const QA_ALPHA = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA = "f0000000-0000-4000-8000-000000000001";
const QA_BETA_CONTRACTOR = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_USER = "a0000000-0000-4000-8000-000000000001";

const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUWFxUVFRUXFxUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAG6p//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEAAQUCcJ//xAAUEQEAAAAAAAAAAAAAAAAAAACQ/9oACAEDAQE/AXCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAkP/aAAgBAgEBPwFwn//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEABj8CcJ//xAAUEAEAAAAAAAAAAAAAAAAAAACQ/9oACAEBAAE/IXCf/9k=",
  "base64",
);

const results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
  console.log(`${status === "PASS" ? "PASS" : "FAIL"} ${id}: ${detail}`);
}

function readRepo(rel) {
  return readFileSync(join(REPO_ROOT, rel), "utf8");
}

async function signIn(apiUrl, anonKey, email) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`Login ${email} (${response.status})`);
  return response.json();
}

async function rpc(apiUrl, anonKey, token, fn, body) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RPC ${fn} HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

async function uploadStorage(apiUrl, anonKey, token, path, body) {
  const encoded = path.split("/").map((s) => encodeURIComponent(s)).join("/");
  const response = await fetch(`${apiUrl}/storage/v1/object/occurrence-evidence/${encoded}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "false",
    },
    body,
  });
  if (!response.ok) throw new Error(`Storage HTTP ${response.status}`);
}

async function createPP(apiUrl, anonKey, token, title = "QA TL") {
  const result = await rpc(apiUrl, anonKey, token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title,
      task_description: title,
      location_description: "Local QA",
      condition_description: "Condição QA",
      severity: "HIGH",
    },
  });
  if (!result.success) throw new Error(JSON.stringify(result));
  return result.data.id;
}

async function timeline(apiUrl, anonKey, token, occurrenceId, cursor = null, limit = 30) {
  return rpc(apiUrl, anonKey, token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: limit,
    ...(cursor ? { p_cursor: cursor } : {}),
  });
}

async function uploadEvidence(apiUrl, anonKey, token, occurrenceId, name = "ev.jpg") {
  const prepare = await rpc(apiUrl, anonKey, token, "prepare_occurrence_attachment_upload", {
    payload: {
      occurrence_id: occurrenceId,
      attachment_type: "INITIAL_EVIDENCE",
      original_file_name: name,
      mime_type: "image/jpeg",
      file_size: MINIMAL_JPEG.byteLength,
    },
  });
  if (!prepare.success) return prepare;
  await uploadStorage(apiUrl, anonKey, token, prepare.data.storage_path, MINIMAL_JPEG);
  const complete = await rpc(apiUrl, anonKey, token, "complete_occurrence_attachment_upload", {
    target_attachment_id: prepare.data.attachment_id,
  });
  return { prepare, complete, attachmentId: prepare.data.attachment_id };
}

async function main() {
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();
  console.log("=== QA Sprint 2.3 — TL-01 a TL-20 ===\n");

  const field = await signIn(apiUrl, anonKey, USERS.field);
  const gestor = await signIn(apiUrl, anonKey, USERS.gestor);
  const multi = await signIn(apiUrl, anonKey, USERS.multi);
  const platform = await signIn(apiUrl, anonKey, USERS.platform);
  const noperm = await signIn(apiUrl, anonKey, USERS.noperm);

  const occurrenceId = await createPP(apiUrl, anonKey, field.access_token, "TL-01 PP");

  const tl01 = await timeline(apiUrl, anonKey, field.access_token, occurrenceId);
  const created = tl01.items?.filter((i) => i.kind === "OCCURRENCE_CREATED") ?? [];
  if (tl01.success && created.length === 1 && created[0].title === "Paralisação Preventiva registrada") {
    record("TL-01", "PASS", "timeline com OCCURRENCE_CREATED (PP registrada)");
  } else {
    record("TL-01", "FAIL", JSON.stringify(tl01));
  }

  const comment = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence_comment", {
    p_occurrence_id: occurrenceId,
    p_content: "Comentário TL-02 topo",
  });
  const tl02 = await timeline(apiUrl, anonKey, field.access_token, occurrenceId);
  const top = tl02.items?.[0];
  if (
    comment.success &&
    top?.kind === "COMMENT_ADDED" &&
    top.body === "Comentário TL-02 topo"
  ) {
    record("TL-02", "PASS", "COMMENT_ADDED no topo do feed DESC");
  } else {
    record("TL-02", "FAIL", `top=${JSON.stringify(top)}`);
  }

  const commentId = comment.comment.id;
  const updated = await rpc(apiUrl, anonKey, field.access_token, "update_occurrence_comment", {
    p_comment_id: commentId,
    p_content: "Comentário TL-03 editado",
  });
  const tl03 = await timeline(apiUrl, anonKey, field.access_token, occurrenceId);
  const editedItem = tl03.items?.find((i) => i.id === commentId && i.kind === "COMMENT_ADDED");
  const webComment = readRepo("apps/web/src/features/timeline/components/timeline-item-comment.tsx");
  if (
    updated.success &&
    updated.comment.editedAt &&
    editedItem?.body === "Comentário TL-03 editado" &&
    editedItem?.metadata?.isEdited === true &&
    webComment.includes("(editado)")
  ) {
    record("TL-03", "PASS", "conteúdo atualizado + isEdited + UI (editado)");
  } else {
    record("TL-03", "FAIL", JSON.stringify({ updated, editedItem }));
  }

  const alienUpdate = await rpc(apiUrl, anonKey, gestor.access_token, "update_occurrence_comment", {
    p_comment_id: commentId,
    p_content: "Tentativa gestor",
  });
  if (alienUpdate.success === false && alienUpdate.error?.code === "FORBIDDEN") {
    record("TL-04", "PASS", "editar alheio → FORBIDDEN");
  } else {
    record("TL-04", "FAIL", JSON.stringify(alienUpdate));
  }

  const deleted = await rpc(apiUrl, anonKey, field.access_token, "delete_occurrence_comment", {
    p_comment_id: commentId,
  });
  const tl05 = await timeline(apiUrl, anonKey, field.access_token, occurrenceId);
  const removed = tl05.items?.find((i) => i.kind === "COMMENT_REMOVED" && i.id === commentId);
  if (deleted.success && removed?.title === "Comentário removido" && removed.body === null) {
    record("TL-05", "PASS", "COMMENT_REMOVED com título correto");
  } else {
    record("TL-05", "FAIL", JSON.stringify({ deleted, removed }));
  }

  const gestorComment = await rpc(apiUrl, anonKey, gestor.access_token, "create_occurrence_comment", {
    p_occurrence_id: occurrenceId,
    p_content: "Comentário TL-06 gestor",
  });
  if (gestorComment.success) {
    record("TL-06", "PASS", "qa-gestor comenta com occurrence.read (PO-1)");
  } else {
    record("TL-06", "FAIL", JSON.stringify(gestorComment));
  }

  const nopermTimeline = await timeline(apiUrl, anonKey, noperm.access_token, occurrenceId);
  const webTimeline = readRepo("apps/web/src/features/timeline/components/occurrence-timeline.tsx");
  const mobileComposer = readRepo("apps/mobile/src/features/timeline/components/comment-composer-bar.tsx");
  if (
    (nopermTimeline.success === false && nopermTimeline.error?.code === "FORBIDDEN") &&
    webTimeline.includes("if (!canRead)") &&
    mobileComposer.includes("if (!canRead)")
  ) {
    record("TL-07", "PASS", "sem occurrence.read: timeline/composer ocultos + RPC FORBIDDEN");
  } else {
    record("TL-07", "FAIL", JSON.stringify(nopermTimeline));
  }

  const cross = await timeline(apiUrl, anonKey, multi.access_token, occurrenceId);
  if (cross.success === false && cross.error?.code === "FORBIDDEN") {
    record("TL-08", "PASS", "qa-multi cross-org → FORBIDDEN");
  } else {
    record("TL-08", "FAIL", JSON.stringify(cross));
  }

  const evOcc = await createPP(apiUrl, anonKey, field.access_token, "TL-09 EV");
  const evUp = await uploadEvidence(apiUrl, anonKey, field.access_token, evOcc, "tl09.jpg");
  const tl09 = await timeline(apiUrl, anonKey, field.access_token, evOcc);
  const evAdded = tl09.items?.find((i) => i.kind === "EVIDENCE_ADDED");
  if (evUp.complete?.success && evAdded?.title === "Evidência adicionada") {
    record("TL-09", "PASS", "EVIDENCE_ADDED após upload COMPLETED");
  } else {
    record("TL-09", "FAIL", JSON.stringify({ evUp, evAdded }));
  }

  const delEv = await rpc(apiUrl, anonKey, field.access_token, "delete_occurrence_attachment", {
    target_attachment_id: evUp.attachmentId,
  });
  const tl10 = await timeline(apiUrl, anonKey, field.access_token, evOcc);
  const evRemoved = tl10.items?.find(
    (i) => i.kind === "EVIDENCE_REMOVED" && i.id === evUp.attachmentId,
  );
  if (delEv.success && evRemoved?.title === "Evidência removida") {
    record("TL-10", "PASS", "EVIDENCE_REMOVED após delete");
  } else {
    record("TL-10", "FAIL", JSON.stringify({ delEv, evRemoved }));
  }

  const closedOcc = await createPP(apiUrl, anonKey, field.access_token, "TL-11 closed");
  runLocalSql(`update public.occurrences set status = 'ENCERRADA' where id = '${closedOcc}';`);
  const tl11 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence_comment", {
    p_occurrence_id: closedOcc,
    p_content: "bloqueado",
  });
  if (tl11.success === false && tl11.error?.code === "FORBIDDEN") {
    record("TL-11", "PASS", "ENCERRADA bloqueia create_occurrence_comment");
  } else {
    record("TL-11", "FAIL", JSON.stringify(tl11));
  }

  const pagOcc = await createPP(apiUrl, anonKey, field.access_token, "TL-12 pag");
  for (let i = 1; i <= 35; i += 1) {
    runLocalSql(`
      insert into public.occurrence_comments (
        organization_id, occurrence_id, author_id, comment_type, content, created_at
      ) values (
        '${QA_ALPHA}', '${pagOcc}', '${QA_FIELD_USER}', 'GENERAL',
        'Pag TL-12 #${i}', now() - interval '${36 - i} seconds'
      )
    `);
  }
  const page1 = await timeline(apiUrl, anonKey, field.access_token, pagOcc, null, 30);
  const page2 = await timeline(apiUrl, anonKey, field.access_token, pagOcc, page1.nextCursor, 30);
  const loadMoreUi = readRepo("apps/web/src/features/timeline/components/timeline-load-more.tsx");
  if (
    page1.nextCursor?.id &&
    page1.items.length === 30 &&
    page2.success &&
    page2.items.length > 0 &&
    loadMoreUi.includes("Carregar mais")
  ) {
    record("TL-12", "PASS", `page1=30 nextCursor OK; page2=${page2.items.length} itens`);
  } else {
    record("TL-12", "FAIL", `p1=${page1.items?.length} p2=${page2.items?.length}`);
  }

  const orgProvider = readRepo("apps/mobile/src/features/organization/provider/organization-provider.tsx");
  if (cross.success === false && orgProvider.includes("clearTenantCache")) {
    record("TL-13", "PASS", "cross-org bloqueado; clearTenantCache na troca org");
  } else {
    record("TL-13", "FAIL", "vazamento ou cache");
  }

  const authProvider = readRepo("apps/mobile/src/providers/auth-provider.tsx");
  if (authProvider.includes("clearTenantCache")) {
    record("TL-14", "PASS", "logout limpa cache tenant (auth-provider)");
  } else {
    record("TL-14", "FAIL", "logout não limpa cache");
  }

  const sw01 = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: {
      organization_id: QA_ALPHA,
      area_id: QA_ALPHA_AREA,
      contractor_organization_id: QA_BETA_CONTRACTOR,
      title: "TL-15 SW regressão",
      task_description: "TL-15 SW regressão",
      location_description: "Local",
      condition_description: "Condição",
      severity: "HIGH",
    },
  });
  if (sw01.success && sw01.data?.status === "PARALISACAO_PREVENTIVA") {
    record("TL-15", "PASS", `SW-01 regressão ${sw01.data.public_code}`);
  } else {
    record("TL-15", "FAIL", JSON.stringify(sw01));
  }

  const ev16Occ = await createPP(apiUrl, anonKey, field.access_token, "TL-16 EV");
  const ev16 = await uploadEvidence(apiUrl, anonKey, field.access_token, ev16Occ, "tl16.jpg");
  if (ev16.complete?.success) {
    record("TL-16", "PASS", "EV-01 regressão upload JPEG COMPLETED");
  } else {
    record("TL-16", "FAIL", JSON.stringify(ev16));
  }

  const empty = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence_comment", {
    p_occurrence_id: occurrenceId,
    p_content: "   ",
  });
  if (empty.success === false && empty.error?.code === "VALIDATION_ERROR") {
    record("TL-17", "PASS", "conteúdo vazio → VALIDATION_ERROR");
  } else {
    record("TL-17", "FAIL", JSON.stringify(empty));
  }

  const longContent = "x".repeat(2001);
  const tooLong = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence_comment", {
    p_occurrence_id: occurrenceId,
    p_content: longContent,
  });
  if (tooLong.success === false && tooLong.error?.code === "VALIDATION_ERROR") {
    record("TL-18", "PASS", ">2000 chars → VALIDATION_ERROR");
  } else {
    record("TL-18", "FAIL", JSON.stringify(tooLong));
  }

  const platformTimeline = await timeline(apiUrl, anonKey, platform.access_token, occurrenceId);
  if (platformTimeline.success && platformTimeline.items.length > 0) {
    record("TL-19", "PASS", `qa-platform read cross-org (${platformTimeline.items.length} itens)`);
  } else {
    record("TL-19", "FAIL", JSON.stringify(platformTimeline));
  }

  const refresh1 = await timeline(apiUrl, anonKey, field.access_token, occurrenceId);
  const refresh2 = await timeline(apiUrl, anonKey, field.access_token, occurrenceId);
  const sameLength = refresh1.items.length === refresh2.items.length;
  const sameFirst = refresh1.items[0]?.id === refresh2.items[0]?.id;
  if (refresh1.success && refresh2.success && sameLength && sameFirst) {
    record("TL-20", "PASS", `refresh consistente (${refresh1.items.length} itens, mesmo topo)`);
  } else {
    record("TL-20", "FAIL", `r1=${refresh1.items?.length} r2=${refresh2.items?.length}`);
  }

  console.log("\n=== RESUMO TL ===");
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  console.log(`PASS: ${pass}/20 | FAIL: ${fail}/20`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
