import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: '系统管理员',
      code: 'admin',
      description: '系统最高权限',
      type: 1,
      status: 1,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { code: 'user' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: '普通用户',
      code: 'user',
      description: '基本功能权限',
      type: 1,
      status: 1,
    },
  });

  const adminPermissions = [
    'user:read', 'user:write', 'user:delete',
    'task:create', 'task:read', 'task:update', 'task:delete', 'task:assign',
    'supervise:read', 'supervise:manage',
    'report:view', 'report:export',
    'system:config', 'system:log',
  ];

  for (const perm of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionCode: {
          roleId: adminRole.id,
          permissionCode: perm,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionCode: perm,
      },
    });
  }

  const userPermissions = [
    'task:create', 'task:read', 'task:update',
    'task:assign',
    'supervise:read',
    'report:view',
  ];

  for (const perm of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionCode: {
          roleId: userRole.id,
          permissionCode: perm,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionCode: perm,
      },
    });
  }

  const techDept = await prisma.department.upsert({
    where: { code: 'TECH' },
    update: {},
    create: {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: '技术部',
      code: 'TECH',
      description: '技术研发部门',
      status: 1,
    },
  });

  const hrDept = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: {
      id: '660e8400-e29b-41d4-a716-446655440002',
      name: '人力资源部',
      code: 'HR',
      description: '人力资源管理部门',
      status: 1,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@taskmaster.com' },
    update: {},
    create: {
      id: '770e8400-e29b-41d4-a716-446655440001',
      username: 'admin',
      email: 'admin@taskmaster.com',
      phone: '13800138000',
      password: hashedPassword,
      nickname: '管理员',
      status: 1,
      departmentId: techDept.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@taskmaster.com' },
    update: {},
    create: {
      id: '770e8400-e29b-41d4-a716-446655440002',
      username: 'demo',
      email: 'demo@taskmaster.com',
      phone: '13900139000',
      password: hashedPassword,
      nickname: '演示用户',
      status: 1,
      departmentId: techDept.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: demoUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      roleId: userRole.id,
    },
  });

  const systemConfigs = [
    { key: 'task_no_prefix', value: 'TASK', type: 'string', name: '任务编号前缀', group: 'task' },
    { key: 'default_feedback_cycle', value: 'weekly', type: 'string', name: '默认反馈周期', group: 'task' },
    { key: 'feedback_reminder_time', value: '10:00', type: 'string', name: '反馈提醒时间', group: 'task' },
    { key: 'overdue_warning_hours', value: '24', type: 'number', name: '超时预警提前时间(小时)', group: 'task' },
    { key: 'password_min_length', value: '8', type: 'number', name: '密码最小长度', group: 'security' },
    { key: 'login_max_attempts', value: '3', type: 'number', name: '登录最大失败次数', group: 'security' },
    { key: 'login_lock_duration', value: '15', type: 'number', name: '登录锁定时长(分钟)', group: 'security' },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  console.log('Seed completed successfully!');
  console.log('Admin user: admin@taskmaster.com / admin123');
  console.log('Demo user: demo@taskmaster.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
