/**
 * @fileoverview Admin account loaders.
 * @module utils/admin-users-data
 */

import { defineLoader } from "@sun/ssr";
import { executeDocument, getCookieValue } from "@sun/api";
import { MyRolesDocument } from "~/generated/graphql";
import { AUTH_COOKIE } from "~/utils/auth";
import { FREE_CHESS_ADMIN_ROLE } from "~/utils/roles";
import {
  ListAccountsDocument,
  GetAccountDocument,
  type ListAccountsQuery,
  type GetAccountQuery,
} from "~/generated/graphql";
import { emptyUserPage, type AdminUserPage } from "./admin-user-types";

/**
 * Checks whether the caller may read admin data.
 *
 * @param cookie Raw request cookie header.
 * @returns True when the caller may read the data.
 */
async function canRead(cookie: string | undefined): Promise<boolean> {
  const token = getCookieValue(cookie, AUTH_COOKIE);
  if (!token) return false;
  const res = await executeDocument<{ gaiaQueries: { myRoles: string[] } }>(
    MyRolesDocument,
    {},
    token,
  );
  const roles = res.success ? (res.data?.gaiaQueries.myRoles ?? []) : [];
  return roles.includes(FREE_CHESS_ADMIN_ROLE);
}

defineLoader({
  pattern: "adminUsers",
  async loader(params, context) {
    const page = Math.max(0, Number(params.page ?? 0) || 0);
    const allowed = await canRead(context.cookie);
    if (!allowed) {
      return { adminUsers: emptyUserPage(page, 20) };
    }

    try {
      const result = await executeDocument<ListAccountsQuery>(
        ListAccountsDocument,
        {
          pagination: { page, size: 20 },
        },
      );
      const items = result?.success
        ? (result.data?.gaiaQueries.accounts.items ?? [])
        : [];
      const total = result?.success
        ? (result.data?.gaiaQueries.accounts.pageInfo.totalCount ?? 0)
        : 0;
      const adminUsers: AdminUserPage = {
        users: items.map((u) => ({
          id: u.id,
          email: u.username,
          name: u.username,
          role: "user",
          banned: u.status === "SUSPENDED",
          banReason: null,
          banExpires: null,
          createdAt: String(u.createdAt ?? ""),
          updatedAt: String(u.updatedAt ?? ""),
        })),
        total,
        page,
        pageSize: 10,
        totalPages: Math.ceil(total / 20) || 1,
      };
      return { adminUsers };
    } catch (error) {
      console.error("Failed to list admin users:", error);
      return { adminUsers: emptyUserPage(page, 20) };
    }
  },
});

defineLoader({
  pattern: "adminUser",
  async loader(params, context) {
    const id = typeof params.id === "string" ? params.id : "";
    const allowed = await canRead(context.cookie);
    if (!allowed || !id) {
      return { adminUser: null };
    }

    try {
      const result = await executeDocument<GetAccountQuery>(
        GetAccountDocument,
        { id },
      );
      if (!result?.success || !result.data?.gaiaQueries.account) {
        return { adminUser: null };
      }
      const u = result.data.gaiaQueries.account;
      return {
        adminUser: {
          id: u.id,
          email: u.username,
          name: u.username,
          role: "user",
          banned: u.status === "SUSPENDED",
          banReason: null,
          banExpires: null,
          createdAt: String(u.createdAt ?? ""),
          updatedAt: String(u.updatedAt ?? ""),
        },
      };
    } catch (error) {
      console.error("Failed to load admin user:", error);
      return { adminUser: null };
    }
  },
});

defineLoader({
  pattern: "adminUserSessions",
  async loader() {
    return { adminUserSessions: [] };
  },
});
