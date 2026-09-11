// Endpoints: POST /auth/login, POST /auth/logout, GET /auth/session
import { Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login() {
    return this.authService.login();
  }

  @Get("session")
  session() {
    return this.authService.getSession();
  }
}
