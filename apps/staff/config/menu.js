export const menuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'mdiViewDashboard', path: '/', public: true },
  {
    key: 'system',
    label: 'System',
    icon: 'mdiCog',
    children: [
      { key: 'user-manager', label: 'User Manager', icon: 'mdiAccountMultiple', path: '/System/User-Manager' },
      { key: 'test-page', label: 'Test', icon: 'mdiHeadQuestion', path: '/System/Test-Page' },
      {
        key: 'system-subjects',
        label: 'Required Subjects',
        icon: 'mdiBookMultiple',
        path: '/System/Subjects',
      },
      {
        key: 'system-student-display',
        label: 'Student Data Display',
        icon: 'mdiEyeSettingsOutline',
        path: '/System/Student-Display',
      },
      { key: 'system-student-self-edit', label: 'Student Self-Edit', icon: 'mdiAccountEdit', path: '/System/Student-Self-Edit' },
    ]
  },
  {
    key: 'academic-admin',
    label: 'Academic Admin',
    icon: 'mdiHumanMaleBoard',
    path: '/AcademicAdmin/Academic-Admin',
    children: [
      { key: 'eap-specific', label: 'EAP Specific', icon: 'mdiTranslate', path: '/AcademicAdmin/EAP-Specific', domain: 'EAP' },
      { key: 'isp-specific', label: 'ISP Specific', icon: 'mdiWeb', path: '/AcademicAdmin/ISP-Specific', domain: 'ISP' },
      { key: 'academic-course-create', label: 'Create Course', icon: 'mdiBookPlus', path: '/AcademicAdmin/Course-Create' },
      { key: 'academic-lecturer-profile', label: 'Lecturer Profile', icon: 'mdiAccountTie', path: '/AcademicAdmin/Lecturer-Profile' }
    ]
  },
  { key: 'admission', label: 'Admission', icon: 'mdiAccountSchool', path: '/' },
  {
    key: 'registrar',
    label: 'Registrar',
    icon: 'mdiBookEducation',
    children: [
      {
        key: 'registrar-student-list',
        label: 'Student List',
        icon: 'mdiAccountSchool',
        path: '/Registrar/Student-List',
        studentList: true, // menu có trang danh sách sinh viên -> hiện trong System > Student Data Display
      },
      {
        key: 'registrar-student-add',
        label: 'Add Student',
        icon: 'mdiAccountPlus',
        path: '/Registrar/Student-Add',
      },
    ],
  },
  { key: 'student-advisor', label: 'Student Advisor', icon: 'mdiAccountMultiple', path: '/' },
  {
    key: 'accounting',
    label: 'Accounting',
    icon: 'mdiCurrencyUsd',
    children: [
      {
        key: 'accounting-student-list',
        label: 'Student List',
        icon: 'mdiAccountCash',
        path: '/Accounting/Student-List',
        studentList: true, // menu có trang danh sách sinh viên -> hiện trong System > Student Data Display
      },
    ],
  },
  { key: 'hemis', label: 'HEMIS', icon: 'mdiFileAccount', path: '/' },
]