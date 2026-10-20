// config/StudentActions.js
//
// Danh sách CÁC LOẠI action có thể gắn vào cột Action / toolbar chi tiết SV.
// Khác với field (khai tĩnh, cố định theo schema import), action ở đây
// CŨNG khai tĩnh — nhưng lý do khác: hành vi khi bấm (mở modal nào, làm gì)
// cần được lập trình cụ thể, không thể "tự phát hiện" như nút thường
// (PermBtn ở chỗ khác trong app tự phát hiện được vì bản thân nút đó đã
// có sẵn @click ngay tại chỗ nó được vẽ — còn ở đây, action là 1 khái niệm
// dùng CHUNG cho nhiều phòng ban, nên cần 1 nơi tra cứu "action này làm gì").
//
// Thêm action mới = thêm 1 dòng vào đây + tạo modal component tương ứng.
// Việc CẤP QUYỀN action này cho phòng ban nào vẫn tự động (dùng lại đúng
// cơ chế PermBtn/useButtonRegistry đã có — mỗi action ở đây khi render ra
// sẽ tự đăng ký vào cây Phân quyền, không cần khai tay thêm ở đâu khác).

export const studentActions = [
  {
    key: 'edit_student',
    label: 'Edit Student',
    icon: 'mdiPencilOutline',
    modal: 'edit', // khớp với case trong components/StudentActionModal.vue
  },
  {
    key: 'view_grades',
    label: 'View Grades',
    icon: 'mdiSchoolOutline',
    modal: 'grades',
  },
  {
    key: 'view_schedule',
    label: 'View Schedule',
    icon: 'mdiCalendarClock',
    modal: 'schedule',
  },
  {
    key: 'view_payment',
    label: 'View Payment Status',
    icon: 'mdiCashCheck',
    modal: 'payment',
  },
]
