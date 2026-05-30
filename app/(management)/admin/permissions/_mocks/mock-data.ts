import type {
  RolePermissionMatrix,
  UserPermissionPage,
  MenuItem,
} from '../types';

export const MOCK_MENUS: MenuItem[] = [
  { id: 'menu-dashboard', name: 'Dashboard', code: 'DASHBOARD' },
  { id: 'menu-summary', name: 'Summary', code: 'SUMMARY' },
  { id: 'menu-case-by-line', name: 'Case By Line', code: 'CASE_BY_LINE' },
  { id: 'menu-exports', name: 'Exports', code: 'EXPORTS' },
  { id: 'menu-working-calendar', name: 'Working Calendar', code: 'WORKING_CALENDAR' },
  { id: 'menu-line-mapping', name: 'Line Mapping', code: 'LINE_MAPPING' },
  { id: 'menu-notifications', name: 'Notifications', code: 'NOTIFICATIONS' },
];

const ROLES = [
  { id: 'role-superadmin', name: 'Super Admin' },
  { id: 'role-admin', name: 'Admin' },
  { id: 'role-supervisor', name: 'Supervisor' },
  { id: 'role-viewer', name: 'Viewer' },
];

const DEFAULTS: Record<string, Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean; export: boolean }>> = {
  'role-superadmin': {
    'menu-dashboard':        { view: true,  create: true,  update: true,  delete: true,  export: true  },
    'menu-summary':          { view: true,  create: true,  update: true,  delete: true,  export: true  },
    'menu-case-by-line':     { view: true,  create: true,  update: true,  delete: true,  export: true  },
    'menu-exports':          { view: true,  create: true,  update: true,  delete: true,  export: true  },
    'menu-working-calendar': { view: true,  create: true,  update: true,  delete: true,  export: false },
    'menu-line-mapping':     { view: true,  create: true,  update: true,  delete: false, export: false },
    'menu-notifications':    { view: true,  create: true,  update: true,  delete: true,  export: false },
  },
  'role-admin': {
    'menu-dashboard':        { view: true,  create: true,  update: true,  delete: false, export: false },
    'menu-summary':          { view: true,  create: true,  update: false, delete: false, export: false },
    'menu-case-by-line':     { view: true,  create: true,  update: true,  delete: false, export: false },
    'menu-exports':          { view: true,  create: false, update: false, delete: false, export: true  },
    'menu-working-calendar': { view: true,  create: false, update: true,  delete: false, export: false },
    'menu-line-mapping':     { view: true,  create: false, update: false, delete: false, export: false },
    'menu-notifications':    { view: true,  create: true,  update: false, delete: false, export: false },
  },
  'role-supervisor': {
    'menu-dashboard':        { view: true,  create: false, update: false, delete: false, export: false },
    'menu-summary':          { view: true,  create: false, update: false, delete: false, export: false },
    'menu-case-by-line':     { view: true,  create: false, update: false, delete: false, export: false },
    'menu-exports':          { view: true,  create: false, update: false, delete: false, export: false },
    'menu-working-calendar': { view: true,  create: false, update: false, delete: false, export: false },
    'menu-line-mapping':     { view: true,  create: false, update: false, delete: false, export: false },
    'menu-notifications':    { view: true,  create: false, update: false, delete: false, export: false },
  },
  'role-viewer': {
    'menu-dashboard':        { view: true,  create: false, update: false, delete: false, export: false },
    'menu-summary':          { view: true,  create: false, update: false, delete: false, export: false },
    'menu-case-by-line':     { view: true,  create: false, update: false, delete: false, export: false },
    'menu-exports':          { view: false, create: false, update: false, delete: false, export: false },
    'menu-working-calendar': { view: true,  create: false, update: false, delete: false, export: false },
    'menu-line-mapping':     { view: false, create: false, update: false, delete: false, export: false },
    'menu-notifications':    { view: true,  create: false, update: false, delete: false, export: false },
  },
};

export const MOCK_ROLE_MATRIX: RolePermissionMatrix = ROLES.flatMap((role) =>
  MOCK_MENUS.map((menu) => ({
    roleId: role.id,
    roleName: role.name,
    menuId: menu.id,
    menuName: menu.name,
    actions: DEFAULTS[role.id]?.[menu.id] ?? {
      view: false,
      create: false,
      update: false,
      delete: false,
      export: false,
    },
  })),
);

const USERS = [
  { userId: 'u1', userName: 'Akaraphon Monkhong',       userInitials: 'AK', avatarUrl: null, roleId: 'role-superadmin', roleName: 'Super Admin' },
  { userId: 'u2', userName: 'Sirinapa Pangkhon',         userInitials: 'SP', avatarUrl: null, roleId: 'role-superadmin', roleName: 'Super Admin' },
  { userId: 'u3', userName: 'Benjathip Srihattapadungkit', userInitials: 'BS', avatarUrl: null, roleId: 'role-superadmin', roleName: 'Super Admin' },
  { userId: 'u4', userName: 'Pimontra Jantree',          userInitials: 'PJ', avatarUrl: null, roleId: 'role-superadmin', roleName: 'Super Admin' },
  { userId: 'u5', userName: 'Soontorn Thaweekarn',       userInitials: 'ST', avatarUrl: null, roleId: 'role-superadmin', roleName: 'Super Admin' },
  { userId: 'u6', userName: 'Orasa Mailiang',            userInitials: 'OM', avatarUrl: null, roleId: 'role-superadmin', roleName: 'Super Admin' },
  { userId: 'u7', userName: 'Sopida Jamnongnok',         userInitials: 'SJ', avatarUrl: null, roleId: 'role-admin',      roleName: 'Admin'       },
  { userId: 'u8', userName: 'Toru Kikuchi',              userInitials: 'TK', avatarUrl: null, roleId: 'role-admin',      roleName: 'Admin'       },
  { userId: 'u9', userName: 'Nuttapat Kaewwilai',        userInitials: 'NK', avatarUrl: null, roleId: 'role-admin',      roleName: 'Admin'       },
];

const USER_PERMS: Record<string, { view: boolean; create: boolean; update: boolean; delete: boolean }> = {
  u1: { view: true,  create: true,  update: true,  delete: false },
  u2: { view: true,  create: true,  update: true,  delete: false },
  u3: { view: true,  create: true,  update: true,  delete: true  },
  u4: { view: true,  create: true,  update: true,  delete: false },
  u5: { view: true,  create: true,  update: true,  delete: true  },
  u6: { view: true,  create: false, update: true,  delete: false },
  u7: { view: true,  create: false, update: true,  delete: false },
  u8: { view: false, create: false, update: false, delete: false },
  u9: { view: true,  create: false, update: true,  delete: false },
};

export function getMockUserPermissions(menuId: string): UserPermissionPage {
  const items = USERS.map((u) => ({
    ...u,
    menuId,
    actions: USER_PERMS[u.userId] ?? { view: false, create: false, update: false, delete: false },
  }));
  return { items, total: items.length, page: 1, pageSize: 20 };
}
