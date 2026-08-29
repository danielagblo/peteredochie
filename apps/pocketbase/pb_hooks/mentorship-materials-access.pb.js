/// <reference path="../pb_data/types.d.ts" />

const TIER_RANK = {
  scholarship: 1,
  standard: 2,
  patron: 3,
  legacy: 4,
};

function isAdmin(auth) {
  return (
    !!auth &&
    (auth.get("account_type") === "admin" ||
      auth.get("staff_role") === "super_admin")
  );
}

function findAcceptedMentorship(userId) {
  try {
    const records = $app.findRecordsByFilter(
      "mentorship_applications",
      'owner = {:uid} && status = "accepted"',
      "-created",
      1,
      0,
      { uid: userId },
    );
    return records.length ? records[0] : null;
  } catch (_) {
    return null;
  }
}

function userTierRank(auth) {
  const application = findAcceptedMentorship(auth.id);
  if (!application) return 0;
  const type =
    application.getString("registration_type") ||
    application.getString("requested_type") ||
    "standard";
  return TIER_RANK[type] || 0;
}

function materialTierRank(record) {
  const type = record.getString("registration_type") || "standard";
  return TIER_RANK[type] || 99;
}

onRecordsListRequest((e) => {
  const auth = e.requestInfo().auth;
  if (isAdmin(auth)) {
    e.next();
    return;
  }
  if (!auth) {
    throw new ForbiddenError("Sign in to access mentorship materials.");
  }
  const rank = userTierRank(auth);
  if (rank <= 0) {
    throw new ForbiddenError(
      "Accepted mentorship registration required to view materials.",
    );
  }
  e.records = e.records.filter((record) => {
    if (!record.getBool("published")) return false;
    return rank >= materialTierRank(record);
  });
  e.next();
}, "mentorship_materials");

onRecordViewRequest((e) => {
  const auth = e.requestInfo().auth;
  if (isAdmin(auth)) {
    e.next();
    return;
  }
  if (!auth) {
    throw new ForbiddenError("Sign in to access mentorship materials.");
  }
  const rank = userTierRank(auth);
  if (rank <= 0) {
    throw new ForbiddenError(
      "Accepted mentorship registration required to view materials.",
    );
  }
  const record = e.record;
  if (!record.getBool("published")) {
    throw new NotFoundError();
  }
  if (rank < materialTierRank(record)) {
    throw new ForbiddenError(
      "Your mentorship registration type does not include this material.",
    );
  }
  e.next();
}, "mentorship_materials");
