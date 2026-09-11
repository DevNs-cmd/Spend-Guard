// App bootstrap. Shared file — edit via PR only.
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ credentials: true, origin: process.env.WEB_URL });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
