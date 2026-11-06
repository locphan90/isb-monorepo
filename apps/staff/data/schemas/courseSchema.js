// Khai báo cấu trúc bảng tbl_course (chỉ khai báo, không có logic)
// Cột: id, course_name, subject, coef, rate, start_date, end_date, obj_lecturer, i_status, created_by, created_at, updated_at
// File này server cũng import (qua courseRules.js) nên không import gì từ Vue/Nuxt.

export const COURSE_TABLE = 'tbl_course'
export const COURSE_STATUS = { ACTIVE: 0, DELETED: 1 } // xóa luôn là soft delete (i_status = 1)
export const COURSE_MENU_KEY = 'academic-course-create' // khớp key trong config/menu.js

export const COURSE_LECTURER_ROLES = ['Lecturer', 'Teaching assistant']

export const emptyCourseLecturer = () => ({
  lecturer: null,  // giảng viên chọn từ danh sách: { email, name }
  role: 'Lecturer',
  cost_up: 0,      // lương theo giờ
  cost_qty: 0,     // số giờ dạy
  noofsection: 0   // số buổi dạy
})

// quarter: quý dạng 'YYYYQn' (vd '2026Q4'); khóa kéo dài cả quý nên không còn nhập ngày bắt đầu/kết thúc
// subject_key: khóa của dòng môn đã chọn ('<prg>|<mã môn>'): cùng mã môn có thể có ở nhiều program
// Program (để đặt tên lớp) và Rate (tra theo loại môn + quý) không nhập tay: lấy từ môn học và bảng Rate
export const emptyCourseForm = () => ({
  subject_key: '',
  quarter: '',
  coef: 1,
  lecturers: [emptyCourseLecturer()]
})
