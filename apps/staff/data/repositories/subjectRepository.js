// Danh sách "môn cần phải học" do người dùng tự nhập ở System > Required
// Subjects — lưu THÀNH 1 DÒNG DUY NHẤT trong tbl_misc (không phải 1 dòng/
// môn), arr_json chứa cả mảng:
//   cat='SUBJECTS', val='REQUIRED_LIST', arr_json={ subjects: [{code, name}] }
//
// Danh sách này sau đó được đọc lại ở form Add/Edit sinh viên
// (components/StudentProfile/StudentProfileForm.vue) để vẽ checkbox chọn
// môn cho từng sinh viên.

import { useSupabase } from '#imports'

const TABLE = 'tbl_misc'
const CAT = 'SUBJECTS'
const VAL = 'REQUIRED_LIST'

let _client = null
function getClient() {
  if (!_client) _client = useSupabase()
  return _client
}

export async function fetchRequiredSubjects() {
  const { data, error } = await getClient()
    .from(TABLE)
    .select('id, arr_json')
    .eq('cat', CAT)
    .eq('val', VAL)
    .maybeSingle()

  if (error) throw error
  return data?.arr_json?.subjects ?? []
}

export async function saveRequiredSubjects(subjects) {
  const { data: existing, error: selectError } = await getClient()
    .from(TABLE)
    .select('id')
    .eq('cat', CAT)
    .eq('val', VAL)
    .maybeSingle()

  if (selectError) throw selectError

  if (existing) {
    const { error } = await getClient()
      .from(TABLE)
      .update({ arr_json: { subjects } })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await getClient()
      .from(TABLE)
      .insert({ cat: CAT, val: VAL, arr_json: { subjects }, i_status: 0 })
    if (error) throw error
  }
}