// Catalog các nút phân quyền { menuKey: { btnKey: { label } } }: cho cây phân quyền ở User Manager và PermBtn. Cần đăng nhập.
export default defineEventHandler(async (event) => {
  await requireStaffSession(event)
  return { catalog: (await rpcOrThrow(event, 'get_perm_catalog')) ?? {} }
})
