import { UserToken } from "@prisma/client";

export interface Session extends UserToken {
  is_active: boolean;
}