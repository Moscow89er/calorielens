import { Request } from 'express';

import { CurrentUser } from "./current-user.type";

export type RequestWithUser = Request & {
  user: CurrentUser;
};
