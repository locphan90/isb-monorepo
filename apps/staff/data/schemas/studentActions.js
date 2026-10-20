export const studentActions = [
  {
    key: 'edit_student',
    label: 'Edit Student',
    icon: 'mdiPencilOutline',
    modal: 'edit', // khớp với case trong components/StudentProfile/StudentActionModal.vue
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
