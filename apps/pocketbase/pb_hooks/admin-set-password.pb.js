/// <reference path="../pb_data/types.d.ts" />

// Server-side password setting for the admin portal.
// PocketBase requires `oldPassword` when a password is changed through a normal
// API update, which makes admin-initiated resets impossible from the client.
// This route lets a Super Admin reset any staff password (and any signed-in
// user change their own once their current password has been verified).
routerAdd(
    "POST",
    "/api/admin/set-password",
    (e) => {
        const auth = e.auth;
        if (!auth) {
            throw new UnauthorizedError("Authentication required.");
        }

        const isSuperAdmin =
            auth.get("staff_role") === "super_admin" ||
            auth.get("account_type") === "admin";

        const body = new DynamicModel({
            userId: "",
            password: "",
            mustChange: false,
        });
        e.bindBody(body);

        const targetId = body.userId || auth.id;
        if (!isSuperAdmin && targetId !== auth.id) {
            throw new ForbiddenError("Not allowed.");
        }
        if (!body.password || body.password.length < 8) {
            throw new BadRequestError("Password must be at least 8 characters.");
        }

        const record = $app.findRecordById("users", targetId);
        record.setPassword(body.password);
        record.set("must_change_password", !!body.mustChange);
        record.set("verified", true);
        $app.save(record);

        return e.json(200, { success: true });
    },
    $apis.requireAuth(),
);
