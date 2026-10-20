import { menuItems } from './menu.js'
export const availableRanks = ['USER', 'MANAGER', 'SYSADMIN', 'ACCOUNTING', 'SUPERVISOR']
export const availableRights = {
  ISB_APP: menuItems
    .filter(item => item.right !== null)
    .map(item => ({ key: item.right, label: item.label, sub: item.sub })),
}
