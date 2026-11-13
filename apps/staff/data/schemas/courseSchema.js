// Khai báo cấu trúc bảng tbl_course (chỉ khai báo, không có logic)
// Cột: id, course_name, subject, coef, rate, pic, start_date, end_date, obj_lecturer, i_status, created_by, created_at, updated_at
// File này server cũng import (qua courseRules.js) nên không import gì từ Vue/Nuxt.

export const COURSE_TABLE = 'tbl_course'
export const COURSE_STATUS = { ACTIVE: 0, DELETED: 1 } // xóa luôn là soft delete (i_status = 1)
export const COURSE_MENU_KEY = 'academic-course-create' // khớp key trong config/menu.js

export const COURSE_BUTTONS = { EDIT: 'edit' } // nút phân quyền (PermBtn) của menu Create Course

export const COURSE_LECTURER_ROLES = ['Lecturer', 'Teaching assistant']

export const emptyCourseLecturer = () => ({
  lecturer: null,  // giảng viên chọn từ danh sách: { email, name }
  role: 'Lecturer',
  cost_up: 0,      // lương theo giờ
  cost_qty: 0,     // số giờ dạy
  noofsection: 0   // số buổi dạy
})

// quarter: quý dạng 'YYYYQn' (vd '2026Q4'); khóa kéo dài cả quý nên không còn nhập ngày bắt đầu/kết thúc
// subject_key: khóa của dòng môn đã chọn ('<prg>|<mã môn>'): cùng mã môn có thể có ở nhiều dòng
// program: chỉ dùng khi môn học KHÔNG có program hợp lệ (môn cũ lưu tên domain trong cột prg): chọn program của lớp lúc tạo khóa
// class_name: chỉ dùng cho domain nhập tay tên lớp (vd WSU)
// pic: email người phụ trách (PIC) chọn từ tbl_misc (cat = 'PIC', val = domain); '' = chưa chọn. Lưu ở cột tbl_course.pic
// Rate không nhập tay: tra theo loại môn + quý
export const emptyCourseForm = () => ({
  subject_key: '',
  quarter: '',
  program: '',
  class_name: '',
  pic: '',
  coef: 1,
  lecturers: [emptyCourseLecturer()]
})
