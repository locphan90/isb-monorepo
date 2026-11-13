// Chi tiết một sinh viên theo MSSV. ?menuKey=  Cần quyền menu đó; chỉ trả các nhóm trường phòng ban được xem.
import { filterStudentJson, isValidMssv } from '~/data/transformers/studentJson'

export default defineEventHandler(async (event) => {
  const { groups } = await requireStudentAccess(event, getQuery(event).menuKey)

  const mssv = String(getRouterParam(event, 'mssv') ?? '').trim()
  if (!isValidMssv(mssv)) throw createError({ statusCode: 400, statusMessage: 'INVALID_BODY' })

  const row = await rpcOrThrow(event, 'get_student', { p_mssv: mssv })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'STUDENT_NOT_FOUND' })
  return { id: row.id, mssv: row.mssv, i_status: row.i_status, obj_json: filterStudentJson(row.obj_json, groups) }
})
