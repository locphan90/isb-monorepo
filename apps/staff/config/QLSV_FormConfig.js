export const Schema_tuitionMenuItems = (ctx) => [
    { label: 'Refresh Fee of Selected Student',  action: () => ctx.ManuallyRefreshTuitionFee() },
    { label: 'Export to OCB',      action: () => ctx.RunReport_OCB('WSU_EXPORT') },
    { label: 'Pending by OCB',     action: () => ctx.ToggleView('showOCB') },
    { label: 'Y23 Scholarship',    action: () => ctx.ToggleView('showY23Scholarship') },
    { label: 'SGN_TCP',            action: () => ctx.RunReport_byParam('TCP_GetBill_SGNTCP_Student') },
    { label: 'Tuition Details',    action: () => ctx.RunReport_OCB('WSU_BANGKEHP')},
]

export const Schema_UploadItems = (ctx) => [
    {label: 'Annually Fee Adjust', accept: '.xls,.xlsx', action: (e) => ctx.importNewFee(e),
        hint: 'Column A: Term applied should be yyyyT3 or T2 or T1 \nSecond last column = Current unit price \nLast column = Updated unit price \nOnly first row imported'
     },
    {label: 'Upload S2 Progression', accept: '.xls,.xlsx', action: (e) => ctx.HandleUploadS2Progression(e),
        hint: 'Make sure:\n - No hidden sheets\n - Sheet #2 to be imported\n - column Z = CALC Standing Desc'
    },
    { label: 'Check License Fee', accept: '.xls,.xlsx', action: (e) => ctx.HandleCheckLisenceFee(e)}, 
    { label: 'Student IDCard Advice', accept: '.xls,.xlsx, application/pdf', action: (e) => ctx.HandleReadFileS2Card(e), 
        hint: 'Make sure Column 1 is ID'
    },
    { label: 'Upload Conferral', accept: '.xls,.xlsx', action: (e) => ctx.Handle_UploadConferral(e),
        hint: 'Make sure:\n - Col D: StudentID \n - Col V: PRG\n - Col AG: Conferral Date'
    },
    { label: 'Check Result from Nhieuloc', accept: '.xls,.xlsx', action: (e) => ctx.Handle_UploadCheckResultFrmNhieuloc(e),
        hint: 'Need file format va Ghi vao dau'
    },
]

export const Schema_studentAdminItems = (ctx) => [
    { label: 'Exam Status',      action: () => ctx.ToggleView('showExamStatus') },
    { label: 'Progression S1',    action: () => ctx.ToggleView('showProgression_S1') },
    { label: 'Progression S2',    action: () => ctx.ToggleView('showProgression_S2') },
    { label: 'Export Schedule',            action: () => ctx.uiStore.view2Show.ExportSchedule=true },
    { label: 'Enrollment Check',    action: () => ctx.HandleExportEnrollmentCheck ('EXPORT') },
    { label: 'Enrollment Reminder',    action: () => ctx.HandleExportEnrollmentCheck ('REMIND') },
    { label: 'Transfer to Edufin',    action: () => ctx.ToggleView('showTransferToEdufin') },
    { label: 'Update Study Plan',    action: () => ctx.ToggleView('showStudyPlan') },
    { label: 'Student Onboarding',    action: () => ctx.ToggleView('showOnboarding') },
    { label: 'Study Status Change',    action: () => ctx.ToggleView('showStudyStatusChange') },
    { label: 'Chatbot V2',    action: () => ctx.goToChat() },
]

export const Schema_reportItems = (ctx) => [
    { label: 'S1 Not Yet Taken by PRG', action: () => { ctx.objParam.Stage = 1; ctx.RunReport_byParam('RPT_YetTaken') }},
    { label: 'S2 Not Yet Taken by PRG', action: () => { ctx.objParam.Stage = 2; ctx.RunReport_byParam('RPT_YetTaken') }},
    { label: 'Myanmar Students',      action: () => ctx.HandleExport_JMC('MYANMAR'), enable: 'SA_RP '},
    { label: 'WSU_Edufin Channel Change',      action: () => ctx.RunReport_byParam('Edufin_ChannelChange')},
    { label: 'Timetable 4 Tran',      action: () => ctx.RunReport_byParam('SKED_TimeTable4Tran')},
    { label: 'Graduating',      action: () => ctx.HandleExport_Graduating()},
    { label: 'Graduated',      action: () => ctx.HandleExport_Graduated()},
    { label: 'JMC Report 1',      action: () => ctx.HandleExport_JMC('RPT1')},
    { label: 'JMC Report 2',      action: () => ctx.HandleExport_JMC('RPT2')},
    { label: 'Insurance Info',      action: () => ctx.HandleExport_InsuranceInfo()},
    { label: 'Enrollment Result',      action: () => ctx.HandleExport_EnrollmentResult()}
]

export const Schema_InsuranceItems = (ctx) => [
    { label: 'List 4NhieuLoc 2Check', action: () => ctx.HandleExport_NhieuLoc2Check() },
    { label: 'Insurance Registration', action: () => ctx.ToggleView('Insurance') },
]
