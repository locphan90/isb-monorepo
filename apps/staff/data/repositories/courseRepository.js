// Nơi DUY NHẤT gọi dữ liệu khóa học / môn học cho Create Course và Course Schedule
// data/ không được Nuxt tự quét nên phải import tay
import { useSupabase } from '#imports'
import { COURSE_TABLE, COURSE_STATUS } from '../schemas/courseSchema'

// Môn học theo domain đang đăng nhập (kèm program: cùng mã môn có thể có ở nhiều program)
export async function fetchSubjectsByDomain(domain) {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from('tbl_subject')
    .select('subj_code, prg, obj_json')
    .eq('domain', domain)
    .or('i_status.is.null,i_status.eq.0') // bỏ môn đã xóa mềm
    .order('subj_code')
    .order('prg')
  if (error) throw error
  return data || []
}

// Tên các khóa đang dùng bắt đầu bằng một tiền tố (để xem trước số thứ tự tiếp theo; DB mới là nơi chốt số)
export async function fetchCourseNamesByPrefix(prefix) {
  const supabase = useSupabase()
  const { data, error } = await supabase
    .from(COURSE_TABLE)
    .select('course_name')
    .like('course_name', `${prefix}%`) // '_' trong tiền tố là ký tự đại diện: có thể lấy dư, hàm nextSequence lọc lại chính xác
    .eq('i_status', COURSE_STATUS.ACTIVE)
  if (error) throw error
  return (data || []).map(r => r.course_name)
}

// Rate hiệu lực cho (môn, quý): tra theo loại môn của môn học. => { subjectType, rate } (rate null nếu chưa có)
export async function fetchCourseRate({ domain, prg, subjCode, quarter }) {
  return await $fetch('/api/course/rate', { query: { domain, prg, subjCode, quarter } })
}

// Tạo khóa qua server (kiểm tra quyền menu, domain, môn học; DB cấp số thứ tự và tra Rate). => { course: { id, courseName, rate } }
export async function createCourseViaApi(payload) {
  return await $fetch('/api/course/create', { method: 'POST', body: payload })
}
