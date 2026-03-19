import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // @prisma/client событие 'beforeExit' больше не типизируется как допустимое для $on(...),
    // и параметр события схлопывается в never
    (this as PrismaClient).$on('beforeExit' as never, async () => {
      await app.close();
    });
  }
}