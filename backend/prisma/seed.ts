import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.branchService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.branchManager.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.systemSettings.deleteMany();

  console.log('🗑️  Cleaned existing data\n');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@toothandtruth.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '09123456789',
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // Create Branches
  const branches = await Promise.all([
    prisma.branch.create({
      data: {
        name: 'South Okkalapa Branch',
        address: 'No. 123, Main Road, South Okkalapa, Yangon',
        phone: '09111111111',
        email: 'southokkalapa@toothandtruth.com',
      },
    }),
    prisma.branch.create({
      data: {
        name: 'Downtown Branch',
        address: 'No. 456, Center St, Downtown, Yangon',
        phone: '09222222222',
        email: 'downtown@toothandtruth.com',
      },
    }),
    prisma.branch.create({
      data: {
        name: 'Hlaing Branch',
        address: 'No. 789, Hlaing Road, Hlaing, Yangon',
        phone: '09333333333',
        email: 'hlaing@toothandtruth.com',
      },
    }),
    prisma.branch.create({
      data: {
        name: 'Kamayut Branch',
        address: 'No. 321, Insein Road, Kamayut, Yangon',
        phone: '09444444444',
        email: 'kamayut@toothandtruth.com',
      },
    }),
    prisma.branch.create({
      data: {
        name: 'Thingangyun Branch',
        address: 'No. 654, Thingangyun Road, Thingangyun, Yangon',
        phone: '09555555555',
        email: 'thingangyun@toothandtruth.com',
      },
    }),
  ]);
  console.log(`✅ Created ${branches.length} branches`);

  // Create Branch Managers
  const managerPassword = await bcrypt.hash('manager123', 10);
  const managers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'manager1@toothandtruth.com',
        password: managerPassword,
        role: UserRole.BRANCH_MANAGER,
        firstName: 'John',
        lastName: 'Doe',
        phone: '09666666666',
        branchManager: {
          create: {
            branchId: branches[0].id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager2@toothandtruth.com',
        password: managerPassword,
        role: UserRole.BRANCH_MANAGER,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '09777777777',
        branchManager: {
          create: {
            branchId: branches[1].id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager3@toothandtruth.com',
        password: managerPassword,
        role: UserRole.BRANCH_MANAGER,
        firstName: 'Michael',
        lastName: 'Johnson',
        phone: '09888888888',
        branchManager: {
          create: {
            branchId: branches[2].id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager4@toothandtruth.com',
        password: managerPassword,
        role: UserRole.BRANCH_MANAGER,
        firstName: 'Sarah',
        lastName: 'Williams',
        phone: '09999999999',
        branchManager: {
          create: {
            branchId: branches[3].id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager5@toothandtruth.com',
        password: managerPassword,
        role: UserRole.BRANCH_MANAGER,
        firstName: 'David',
        lastName: 'Brown',
        phone: '09101010101',
        branchManager: {
          create: {
            branchId: branches[4].id,
          },
        },
      },
    }),
  ]);
  console.log(`✅ Created ${managers.length} branch managers`);

  // Create Services with Fixed Pricing
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'General Checkup',
        description: 'Routine dental examination including visual inspection and basic consultation',
        duration: 30,
        price: 15000,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Dental Cleaning',
        description: 'Professional teeth cleaning to remove plaque and tartar buildup',
        duration: 30,
        price: 25000,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Tooth Extraction',
        description: 'Removal of damaged or problematic teeth with local anesthesia',
        duration: 45,
        price: 35000,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Teeth Whitening',
        description: 'Professional cosmetic whitening treatment for brighter smile',
        duration: 60,
        price: 80000,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Braces Application',
        description: 'Orthodontic braces installation for teeth alignment',
        duration: 90,
        price: 150000,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Root Canal Treatment',
        description: 'Endodontic procedure to save infected or damaged teeth',
        duration: 120,
        price: 200000,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Dental Filling',
        description: 'Restoration of decayed or damaged teeth with composite or amalgam',
        duration: 45,
        price: 40000,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Crown & Bridge',
        description: 'Prosthetic devices to restore damaged or missing teeth',
        duration: 60,
        price: 180000,
      },
    }),
  ]);
  console.log(`✅ Created ${services.length} services`);

  // Enable all services for all branches
  for (const branch of branches) {
    await Promise.all(
      services.map((service) =>
        prisma.branchService.create({
          data: {
            branchId: branch.id,
            serviceId: service.id,
            isActive: true,
          },
        }),
      ),
    );
  }
  console.log('✅ Enabled all services for all branches');

  // Create Doctors for each branch
  const doctorsData = [
    { branchIndex: 0, firstName: 'Sarah', lastName: 'Johnson', specialization: 'General Dentistry', phone: '09111111112', email: 'sarah.j@toothandtruth.com' },
    { branchIndex: 0, firstName: 'Michael', lastName: 'Torres', specialization: 'Orthodontics', phone: '09111111113', email: 'michael.t@toothandtruth.com' },
    { branchIndex: 1, firstName: 'Emily', lastName: 'Park', specialization: 'Cosmetic Dentistry', phone: '09222222223', email: 'emily.p@toothandtruth.com' },
    { branchIndex: 1, firstName: 'Robert', lastName: 'Chen', specialization: 'Endodontics', phone: '09222222224', email: 'robert.c@toothandtruth.com' },
    { branchIndex: 2, firstName: 'Lisa', lastName: 'Anderson', specialization: 'Periodontics', phone: '09333333334', email: 'lisa.a@toothandtruth.com' },
    { branchIndex: 2, firstName: 'James', lastName: 'Wilson', specialization: 'General Dentistry', phone: '09333333335', email: 'james.w@toothandtruth.com' },
    { branchIndex: 3, firstName: 'Maria', lastName: 'Garcia', specialization: 'Pediatric Dentistry', phone: '09444444445', email: 'maria.g@toothandtruth.com' },
    { branchIndex: 3, firstName: 'William', lastName: 'Taylor', specialization: 'Prosthodontics', phone: '09444444446', email: 'william.t@toothandtruth.com' },
    { branchIndex: 4, firstName: 'Jennifer', lastName: 'Martinez', specialization: 'Oral Surgery', phone: '09555555556', email: 'jennifer.m@toothandtruth.com' },
    { branchIndex: 4, firstName: 'Christopher', lastName: 'Lee', specialization: 'General Dentistry', phone: '09555555557', email: 'christopher.l@toothandtruth.com' },
  ];

  const doctors = await Promise.all(
    doctorsData.map((doc) =>
      prisma.doctor.create({
        data: {
          branchId: branches[doc.branchIndex].id,
          firstName: doc.firstName,
          lastName: doc.lastName,
          specialization: doc.specialization,
          phone: doc.phone,
          email: doc.email,
          bio: `${doc.firstName} ${doc.lastName} is an experienced ${doc.specialization.toLowerCase()} with over 10 years of practice. Dedicated to providing the best dental care for patients.`,
          isActive: true,
        },
      }),
    ),
  );
  console.log(`✅ Created ${doctors.length} doctors`);

  // Create Doctor Schedules (Monday-Friday, 9 AM - 5 PM)
  for (const doctor of doctors) {
    for (let day = 1; day <= 5; day++) {
      // Monday=1 to Friday=5
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,
          branchId: doctor.branchId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
          bufferTime: 10,
          isActive: true,
        },
      });
    }
  }
  console.log(`✅ Created doctor schedules`);

  // Create Sample Patients
  const patientPassword = await bcrypt.hash('patient123', 10);
  const patients = await Promise.all([
    prisma.user.create({
      data: {
        email: 'patient1@example.com',
        password: patientPassword,
        role: UserRole.PATIENT,
        firstName: 'Alice',
        lastName: 'Wonder',
        phone: '09777777777',
        patient: {
          create: {
            dateOfBirth: new Date('1990-01-15'),
            address: 'No. 123, Sample Street, Yangon',
            emergencyContact: '09888888888',
            medicalHistory: 'No significant medical history',
            allergies: 'None known',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'patient2@example.com',
        password: patientPassword,
        role: UserRole.PATIENT,
        firstName: 'Bob',
        lastName: 'Smith',
        phone: '09777777778',
        patient: {
          create: {
            dateOfBirth: new Date('1985-05-20'),
            address: 'No. 456, Test Avenue, Yangon',
            emergencyContact: '09888888889',
            medicalHistory: 'Hypertension',
            allergies: 'Penicillin',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'patient3@example.com',
        password: patientPassword,
        role: UserRole.PATIENT,
        firstName: 'Carol',
        lastName: 'Davis',
        phone: '09777777779',
        patient: {
          create: {
            dateOfBirth: new Date('1995-10-10'),
            address: 'No. 789, Demo Road, Yangon',
            emergencyContact: '09888888880',
            medicalHistory: 'Asthma',
            allergies: 'Sulfa drugs',
          },
        },
      },
    }),
  ]);
  console.log(`✅ Created ${patients.length} patients`);

  // Create System Settings
  await prisma.systemSettings.createMany({
    data: [
      {
        key: 'BUSINESS_HOURS_START',
        value: '09:00',
        description: 'Default business hours start time',
      },
      {
        key: 'BUSINESS_HOURS_END',
        value: '17:00',
        description: 'Default business hours end time',
      },
      {
        key: 'DEFAULT_SLOT_DURATION',
        value: '30',
        description: 'Default appointment slot duration in minutes',
      },
      {
        key: 'DEFAULT_BUFFER_TIME',
        value: '10',
        description: 'Default buffer time between appointments in minutes',
      },
      {
        key: 'REMINDER_HOURS_BEFORE',
        value: '2',
        description: 'Send reminder X hours before appointment',
      },
    ],
  });
  console.log('✅ Created system settings');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@toothandtruth.com');
  console.log('  Password: admin123');
  console.log('\nBranch Managers:');
  managers.forEach((manager, i) => {
    console.log(`  Branch ${i + 1}:`);
    console.log(`    Email: ${manager.email}`);
    console.log(`    Password: manager123`);
  });
  console.log('\nPatients:');
  patients.forEach((patient, i) => {
    console.log(`  Patient ${i + 1}:`);
    console.log(`    Email: ${patient.email}`);
    console.log(`    Password: patient123`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
