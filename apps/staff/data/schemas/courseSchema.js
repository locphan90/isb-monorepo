// Khai báo cấu trúc bảng tbl_course (chỉ khai báo, không có logic)
// Cột: course_name, subject, coef, startdate, enddate, obj_lecturer, i_status, create_at, create_by, update_at

export const COURSE_TABLE = 'tbl_course'
export const COURSE_STATUS = { ACTIVE: 0, DELETED: 1 } // xóa luôn là soft delete (i_status = 1)

export const COURSE_LECTURER_ROLES = ['Lecturer', 'Teaching assistant']
export const QUARTERS = [1, 2, 3, 4]

export const emptyCourseLecturer = () => ({
  lecturer: null,  // giảng viên chọn từ danh sách: { email, name }
  role: 'Lecturer',
  cost_up: 0,      // lương theo giờ
  cost_qty: 0,     // số giờ dạy
  noofsection: 0   // số buổi dạy
})

export const emptyCourseForm = () => ({
  subj_code: '',
  quarter: 1,
  year: new Date().getFullYear(),
  class_name: '',
  coef: 1,
  startdate: null,
  enddate: null,
  lecturers: [emptyCourseLecturer()]
})