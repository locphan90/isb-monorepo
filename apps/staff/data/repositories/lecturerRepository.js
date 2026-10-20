// Nơi DUY NHẤT gọi Supabase cho hồ sơ giảng viên (tbl_misc, cat = 'LECTURER')
import { useSupabase } from '#imports'
import { LECTURER_CAT, LECTURER_STATUS } from '../schemas/lecturerSchema'

export async function fetchActiveLecturers() {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('tbl_misc')
    .select('id, val, obj_json')
    .eq('cat', LECTURER_CAT)
    .eq('i_status', LECTURER_STATUS.ACTIVE)
  if (error) throw error
  return data || []
}

export async function fetchLecturerById(id) {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('tbl_misc')
    .select('id, val, obj_json')
    .eq('id', id)
    .eq('cat', LECTURER_CAT)
    .maybeSingle()
  if (error) throw error
  return data
}

// Trùng email (kể cả bản ghi đã xóa mềm)
export async function lecturerEmailExists(email) {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('tbl_misc')
    .select('id')
    .eq('cat', LECTURER_CAT)
    .ilike('val', email)
    .limit(1)
  if (error) throw error
  return (data || []).length > 0
}

export async function insertLecturer(row) {
  const supabase = useSupabase()
  const { error } = await supabase.from('tbl_misc').insert(row)
  if (error) throw error
}

export async function updateLecturer(id, objJson, userEmail) {
  const supabase = useSupabase()
  const { error } = await supabase
    .from('tbl_misc')
    .update({ obj_json: objJson, last_user: userEmail })
    .eq('id', id)
    .eq('cat', LECTURER_CAT)
  if (error) throw error
}