import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { CurrentOrgContext } from "@spendguard/shared-types";

// Real implementation, placeholder body: reads org context off the request
// once Neerav's auth guard populates `request.orgContext` there. The
// original stub (`() => () => {}`) was not a valid parameter decorator and
// broke compilation for anyone actually using @CurrentOrg() on a controller
// parameter — fixed here since it blocks every module, not just one.
export const CurrentOrg = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentOrgContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.orgContext as CurrentOrgContext;
  },
);
