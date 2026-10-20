// Hàm THUẦN đọc/ghi 1 field trong obj_json của sinh viên, theo định nghĩa
// group/field khai ở data/schemas/studentProfileSchema.js. Không đụng Vue,
// không gọi Supabase — nhận vào trả ra, test được độc lập.

// Đọc giá trị 1 field từ obj_json của 1 sinh viên, theo định nghĩa group/field ở trên.
export function getStudentFieldValue(objJson, group, field) {
  const base = group.groupJsonPath ? objJson?.[group.groupJsonPath] : objJson
  return base?.[field.jsonKey]
}

// Ghi giá trị 1 field NGƯỢC LẠI vào obj_json (dùng cho form Add/Edit) — sửa
// trực tiếp lên objJson truyền vào (mutate in place), tự tạo group con nếu
// obj_json chưa có group đó (trường hợp sinh viên mới, obj_json rỗng).
export function setStudentFieldValue(objJson, group, field, value) {
  if (!group.groupJsonPath) {
    objJson[field.jsonKey] = value
    return
  }
  if (!objJson[group.groupJsonPath]) objJson[group.groupJsonPath] = {}
  objJson[group.groupJsonPath][field.jsonKey] = value
}
