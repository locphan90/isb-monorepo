// Tiện ích cho danh sách / sửa khóa ở Create Course.
export const COURSE_LIST_COLUMNS = 'id, course_name, subject, coef, rate, pic, start_date, end_date, obj_lecturer'

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// obj_lecturer là mảng giảng viên; khóa tạo ngoài form có thể là {} (mặc định của cột) nên coi như rỗng
export const courseLecturersOf = (row) =>
  (Array.isArray(row.obj_lecturer) ? row.obj_lecturer : [])
    .filter((l) => l?.email)
    .map((l) => ({
      email: String(l.email).trim().toLowerCase(),
      name: l.name || l.email,
      role: l.role || '',
      cost_up: num(l.cost_up),
      cost_qty: num(l.cost_qty),
      noofsection: num(l.noofsection),
    }))

// Dòng tbl_course -> dữ liệu trả cho trình duyệt; status: ended / upcoming / running theo ngày hôm nay (giờ Việt Nam)
export const toCourseRow = (row, today) => {
  const startDate = toDateOnly(row.start_date)
  const endDate = toDateOnly(row.end_date)
  return {
    id: Number(row.id),
    courseName: row.course_name,
    subject: row.subject || '',
    coef: row.coef == null ? null : Number(row.coef),
    rate: row.rate == null ? null : Number(row.rate),
    pic: row.pic || '',
    startDate,
    endDate,
    status: endDate && endDate < today ? 'ended' : startDate && startDate > today ? 'upcoming' : 'running',
    lecturers: courseLecturersOf(row),
  }
}
