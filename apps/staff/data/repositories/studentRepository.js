import { useSupabase } from '#imports'

export const STUDENT_TABLE = 'tbl_student'

let _client = null
function getClient() {
  if (!_client) _client = useSupabase()
  return _client
}

// Phân trang bằng .range() của Supabase (không tải hết rồi cắt ở client)
// + { count: 'exact' } để biết tổng số dòng, dùng tính tổng số trang.
export async function fetchStudentList({ search = '', page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = getClient()
    .from(STUDENT_TABLE)
    .select('id, mssv, obj_json', { count: 'exact' })
    .eq('i_status', 0)
    .order('mssv')
    .range(from, to)

  if (search?.trim()) {
    // Bỏ các ký tự có nghĩa trong cú pháp .or() của PostgREST (dấu phẩy, ngoặc, nháy, \ % *):
    // gõ "Nguyen, A" không còn làm vỡ câu lọc. FullName nằm trong objProfile.
    const term = search.trim().replace(/[,()"\\%*]/g, ' ').trim()
    if (term) {
      query = query.or(`mssv.ilike.%${term}%,obj_json->objProfile->>FullName.ilike.%${term}%`)
    }
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

export async function fetchStudentByMssv(mssv) {
  const { data, error } = await getClient()
    .from(STUDENT_TABLE)
    .select('id, mssv, obj_json, i_status')
    .eq('mssv', mssv)
    .maybeSingle()

  if (error) throw error
  return data
}

// Tạo sinh viên mới
export async function createStudent(mssv, objJson, domain = null) {
  const { data, error } = await getClient()
    .from(STUDENT_TABLE)
    .insert({ mssv, obj_json: objJson, domain: domain || null, i_status: 0 })
    .select('id, mssv, obj_json, i_status')
    .single()
 
  if (error) throw error
  return data
}

export async function updateStudent(id, objJson) {
  const { error } = await getClient()
    .from(STUDENT_TABLE)
    .update({ obj_json: objJson })
    .eq('id', id)

  if (error) throw error
}

// Xoá sinh viên - tạm thời cập nhật istatus = 1 (retire)
export async function retireStudent(id) {
  const { error } = await getClient()
    .from(STUDENT_TABLE)
    .update({ i_status: 1 })
    .eq('id', id)

  if (error) throw error
}
