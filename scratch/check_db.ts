import { createConnection } from '@nestjs/typeorm';
import { User } from '../backend/src/modules/users/entities/user.entity';
import { WorkSchedule } from '../backend/src/modules/work-schedules/entities/work-schedule.entity';
import { Role } from '../backend/src/common/enums/role.enum';

async function check() {
  const conn = await createConnection({
    type: 'postgres',
    url: 'postgresql://neondb_owner:npg_7sNlHmoX3kQD@ep-summer-meadow-am8lckvt-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    entities: [User, WorkSchedule],
    synchronize: false,
  });

  const users = await conn.getRepository(User).find();
  console.log('Users:', users.map(u => ({ id: u.id, name: u.name, role: u.role, isActive: u.isActive })));

  const schedules = await conn.getRepository(WorkSchedule).find();
  console.log('Schedules count:', schedules.length);

  await conn.close();
}

check().catch(console.error);
