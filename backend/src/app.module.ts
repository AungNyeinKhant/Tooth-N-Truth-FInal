import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CoreModule } from './core/core.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { SlotsModule } from './modules/slots/slots.module';
import { WalkinsModule } from './modules/walkins/walkins.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UploadModule } from './modules/upload/upload.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CoreModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    BranchesModule,
    DoctorsModule,
    ServicesModule,
    AppointmentsModule,
    SlotsModule,
    WalkinsModule,
    MedicalRecordsModule,
    AnalyticsModule,
    UploadModule,
    CalendarModule,
  ],
})
export class AppModule {}
