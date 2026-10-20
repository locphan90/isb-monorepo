// Nơi DUY NHẤT gọi Supabase cho khóa học / môn học
// data/ không được Nuxt tự quét nên phải import tay
import { useSupabase } from '#imports'
import { COURSE_TABLE, COURSE_STATUS } from '../schemas/courseSchema'

// Môn học theo domain đang đăng nhập
export async function fetchSubjectsByDomain(domain) {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('tbl_subject')
    .select('subj_code, obj_json')
    .eq('domain', domain)
    .order('subj_code')
  if (error) throw error
  return data || []
}

// Trùng course_name (bỏ qua khóa đã xóa mềm)
export async function courseNameExists(courseName) {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from(COURSE_TABLE)
    .select('course_name')
    .eq('course_name', courseName)
    .eq('i_status', COURSE_STATUS.ACTIVE)
    .limit(1)
  if (error) throw error
  return (data || []).length > 0
}

export async function insertCourse(row) {
  const supabase = useSupabase()
  const { error } = await supabase.from(COURSE_TABLE).insert(row)
  if (error) throw error
}