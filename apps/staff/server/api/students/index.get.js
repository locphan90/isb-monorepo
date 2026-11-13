// Danh sách sinh viên (phân trang) cho trang danh sách của một phòng ban. ?menuKey=&search=&page=&pageSize=
// Cần quyền menu đó; dữ liệu trả về chỉ gồm các nhóm trường phòng ban được cấu hình xem (xem data/transformers/studentJson.js).
import { filterStudentJson } from '~/data/transformers/studentJson'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const { groups } = await requireStudentAccess(event, q.menuKey)

  const res = await rpcOrThrow(event, 'list_students', {
    p_search: String(q.search ?? '').trim().slice(0, 100),
    p_search_name: true, // tên (objProfile.FullName) vốn luôn hiện ở danh sách / chi tiết nên cho tìm theo tên
    p_page: clampInt(q.page, 1, 100000, 1),
    p_page_size: clampInt(q.pageSize, 1, 100, 20),
  })

  return {
    data: (res?.rows ?? []).map((r) => ({ id: r.id, mssv: r.mssv, obj_json: filterStudentJson(r.obj_json, groups) })),
    count: Number(res?.count ?? 0),
  }
})
