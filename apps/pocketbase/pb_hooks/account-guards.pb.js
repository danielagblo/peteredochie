/// <reference path="../pb_data/types.d.ts" />

// Public registration may never create administrators, and approval status is
// always decided server-side.
onRecordCreateRequest((e) => {
    const auth = e.requestInfo().auth;
    const isAdmin = !!auth && auth.get("account_type") === "admin";

    if (!isAdmin) {
        let type = e.record.get("account_type");
        if (type === "admin" || !type) {
            type = type === "admin" ? "subscriber" : "subscriber";
        }
        e.record.set("account_type", type);
        if (e.record.get("role") === "admin") {
            e.record.set("role", "supporter");
        }
        e.record.set(
            "approval_status",
            type === "distributor" || type === "sponsor" ? "pending" : "not_required",
        );
    }

    e.next();
}, "users");

onRecordUpdateRequest((e) => {
    const auth = e.requestInfo().auth;
    const isAdmin = !!auth && auth.get("account_type") === "admin";
    const body = e.requestInfo().body || {};

    if (!isAdmin && (body.account_type !== undefined || body.approval_status !== undefined || body.role !== undefined)) {
        throw new BadRequestError("Account type and approval status can only be changed by an administrator.");
    }

    e.next();
}, "users");
