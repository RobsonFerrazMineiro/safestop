import { loadQaCredentials, loadSupabaseLocalEnv } from "./_local-env.mjs";

const QA_ALPHA_ORG_ID = "b0000000-0000-4000-8000-000000000001";
const QA_ALPHA_AREA_ID = "f0000000-0000-4000-8000-000000000001";
const QA_ALPHA_CONTRACTOR_ID = "b0000000-0000-4000-8000-000000000002";
const QA_FIELD_USER_ID = "a0000000-0000-4000-8000-000000000001";
const QA_MULTI_EMAIL = "qa-multi@safestop.local";
const QA_GESTOR_EMAIL = "qa-gestor@safestop.local";

const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUWFxUVFRUXFxUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAG6p//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEAAQUCcJ//xAAUEQEAAAAAAAAAAAAAAAAAAACQ/9oACAEDAQE/AXCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAkP/aAAgBAgEBPwFwn//EABQQAQAAAAAAAAAAAAAAAAAAAJD/2gAIAQEABj8CcJ//xAAUEAEAAAAAAAAAAAAAAAAAAACQ/9oACAEBAAE/IXCf/9k=",
  "base64",
);

async function signInWithPassword(apiUrl, anonKey, email, password) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`signIn falhou (${response.status})`);
  }

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

async function uploadToStorage(apiUrl, anonKey, token, storagePath, body) {
  const encodedPath = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const response = await fetch(`${apiUrl}/storage/v1/object/occurrence-evidence/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "false",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Storage upload falhou (${response.status}): ${text}`);
  }
}

function buildOccurrencePayload() {
  return {
    organization_id: QA_ALPHA_ORG_ID,
    area_id: QA_ALPHA_AREA_ID,
    contractor_organization_id: QA_ALPHA_CONTRACTOR_ID,
    title: "QA timeline smoke",
    task_description: "Ocorrência para smoke timeline Sprint 2.3",
    location_description: "Local QA",
    condition_description: "Condição QA",
    severity: "HIGH",
  };
}

function assertTimelineDesc(items, label) {
  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1];
    const current = items[index];
    const prevTime = new Date(previous.occurredAt).getTime();
    const currTime = new Date(current.occurredAt).getTime();

    if (
      currTime > prevTime
      || (currTime === prevTime && current.id > previous.id)
    ) {
      throw new Error(`${label}: ordem DESC inválida entre ${previous.id} e ${current.id}`);
    }
  }
}

async function main() {
  const credentials = loadQaCredentials();
  const { apiUrl, anonKey } = loadSupabaseLocalEnv();

  console.log("1) TL-01 — create_occurrence + timeline inicial...");
  const field = await signInWithPassword(
    apiUrl,
    anonKey,
    credentials.email,
    credentials.password,
  );

  const createResult = await rpc(apiUrl, anonKey, field.access_token, "create_occurrence", {
    payload: buildOccurrencePayload(),
  });

  if (!createResult.success) {
    throw new Error(`create_occurrence falhou: ${JSON.stringify(createResult)}`);
  }

  const occurrenceId = createResult.data.id;

  let timeline = await rpc(apiUrl, anonKey, field.access_token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 30,
  });

  if (!timeline.success) {
    throw new Error(`timeline inicial falhou: ${JSON.stringify(timeline)}`);
  }

  const createdEvents = timeline.items.filter((item) => item.kind === "OCCURRENCE_CREATED");
  if (createdEvents.length !== 1) {
    throw new Error(`Esperado 1 OCCURRENCE_CREATED, recebido ${createdEvents.length}`);
  }

  if (createdEvents[0].title !== "Paralisação Preventiva registrada") {
    throw new Error(`Título criação inválido: ${createdEvents[0].title}`);
  }

  console.log("   OK — OCCURRENCE_CREATED deduplicado");

  console.log("2) TL-02 — create_occurrence_comment...");
  const createComment = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    "create_occurrence_comment",
    {
      p_occurrence_id: occurrenceId,
      p_content: "  Comentário smoke TL-02  ",
    },
  );

  if (!createComment.success || !createComment.comment?.id) {
    throw new Error(`create comment falhou: ${JSON.stringify(createComment)}`);
  }

  if (createComment.comment.content !== "Comentário smoke TL-02") {
    throw new Error(`Trim falhou: ${createComment.comment.content}`);
  }

  if (createComment.comment.authorId !== QA_FIELD_USER_ID) {
    throw new Error("authorId deve ser auth.uid()");
  }

  const commentId = createComment.comment.id;
  console.log(`   OK — comment_id=${commentId}`);

  console.log("3) update_occurrence_comment (PO-7)...");
  const updateComment = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    "update_occurrence_comment",
    {
      p_comment_id: commentId,
      p_content: "Comentário editado no smoke",
    },
  );

  if (!updateComment.success || !updateComment.comment.editedAt) {
    throw new Error(`update comment falhou: ${JSON.stringify(updateComment)}`);
  }

  console.log("   OK — editedAt preenchido");

  console.log("4) Evidência 2.2 retroativa na timeline...");
  const fileSize = MINIMAL_JPEG.byteLength;
  const prepareEvidence = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    "prepare_occurrence_attachment_upload",
    {
      payload: {
        occurrence_id: occurrenceId,
        attachment_type: "INITIAL_EVIDENCE",
        original_file_name: "tl-evidence.jpg",
        mime_type: "image/jpeg",
        file_size: fileSize,
        caption: "Evidência smoke timeline",
      },
    },
  );

  if (!prepareEvidence.success) {
    throw new Error(`prepare evidence falhou: ${JSON.stringify(prepareEvidence)}`);
  }

  await uploadToStorage(
    apiUrl,
    anonKey,
    field.access_token,
    prepareEvidence.data.storage_path,
    MINIMAL_JPEG,
  );

  const completeEvidence = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    "complete_occurrence_attachment_upload",
    { target_attachment_id: prepareEvidence.data.attachment_id },
  );

  if (!completeEvidence.success) {
    throw new Error(`complete evidence falhou: ${JSON.stringify(completeEvidence)}`);
  }

  timeline = await rpc(apiUrl, anonKey, field.access_token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 30,
  });

  const evidenceEvents = timeline.items.filter((item) => item.kind === "EVIDENCE_ADDED");
  if (evidenceEvents.length === 0) {
    throw new Error("EVIDENCE_ADDED ausente na timeline");
  }

  if (evidenceEvents[0].title !== "Evidência adicionada") {
    throw new Error(`Título evidência inválido: ${evidenceEvents[0].title}`);
  }

  console.log("   OK — EVIDENCE_ADDED retroativo");

  console.log("5) delete_occurrence_comment + COMMENT_REMOVED...");
  const deleteComment = await rpc(
    apiUrl,
    anonKey,
    field.access_token,
    "delete_occurrence_comment",
    { p_comment_id: commentId },
  );

  if (!deleteComment.success || !deleteComment.comment.deletedAt) {
    throw new Error(`delete comment falhou: ${JSON.stringify(deleteComment)}`);
  }

  timeline = await rpc(apiUrl, anonKey, field.access_token, "get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_limit: 30,
  });

  const removedEvents = timeline.items.filter((item) => item.kind === "COMMENT_REMOVED");
  if (removedEvents.length !== 1) {
    throw new Error(`Esperado 1 COMMENT_REMOVED, recebido ${removedEvents.length}`);
  }

  if (removedEvents[0].title !== "Comentário removido") {
    throw new Error(`Título remoção inválido: ${removedEvents[0].title}`);
  }

  if (removedEvents[0].body !== null) {
    throw new Error("Body de COMMENT_REMOVED deve ser null");
  }

  assertTimelineDesc(timeline.items, "timeline pós-delete");
  console.log(`   OK — ${timeline.items.length} eventos DESC`);

  console.log("6) TL-03 — qa-gestor lê timeline (read only)...");
  const gestor = await signInWithPassword(apiUrl, anonKey, QA_GESTOR_EMAIL, credentials.password);
  const gestorTimeline = await rpc(
    apiUrl,
    anonKey,
    gestor.access_token,
    "get_occurrence_timeline",
    { p_occurrence_id: occurrenceId },
  );

  if (!gestorTimeline.success || gestorTimeline.items.length === 0) {
    throw new Error(`gestor timeline falhou: ${JSON.stringify(gestorTimeline)}`);
  }

  const gestorCreate = await rpc(
    apiUrl,
    anonKey,
    gestor.access_token,
    "create_occurrence_comment",
    {
      p_occurrence_id: occurrenceId,
      p_content: "Gestor pode comentar com occurrence.read",
    },
  );

  if (!gestorCreate.success) {
    throw new Error(`gestor create comment falhou: ${JSON.stringify(gestorCreate)}`);
  }

  console.log("   OK — qa-gestor lê e comenta (PO-1)");

  console.log("7) TL-04 — cross-org qa-multi FORBIDDEN...");
  const multi = await signInWithPassword(apiUrl, anonKey, QA_MULTI_EMAIL, credentials.password);
  const crossTimeline = await rpc(
    apiUrl,
    anonKey,
    multi.access_token,
    "get_occurrence_timeline",
    { p_occurrence_id: occurrenceId },
  );

  if (crossTimeline.success !== false || crossTimeline.error?.code !== "FORBIDDEN") {
    throw new Error(`Esperado FORBIDDEN cross-org, recebido ${JSON.stringify(crossTimeline)}`);
  }

  console.log("   OK — cross-org bloqueado");

  console.log("8) INSERT direto negado...");
  const directInsert = await fetch(`${apiUrl}/rest/v1/occurrence_comments`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${field.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organization_id: QA_ALPHA_ORG_ID,
      occurrence_id: occurrenceId,
      author_id: QA_FIELD_USER_ID,
      comment_type: "GENERAL",
      content: "Bypass REST",
    }),
  });

  if (directInsert.status !== 401 && directInsert.status !== 403) {
    throw new Error(`Esperado 401/403 INSERT direto, recebido ${directInsert.status}`);
  }

  console.log(`   OK — HTTP ${directInsert.status}`);

  console.log("\nSmoke timeline (Sprint 2.3 G2) concluído com sucesso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
