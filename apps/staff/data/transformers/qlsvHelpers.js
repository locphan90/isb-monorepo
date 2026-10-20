import { MyPivot } from './pivot.js'

export function getEmailSubject (AlertType, friendlyTerm) {
    if (AlertType=="SUBJECT") {
        return "Action Required | Incomplete subject enrolment or Leave of Absence Term " + friendlyTerm
    } else {
        return "Action Required | Incomplete class registration or Leave of Absence Term " + friendlyTerm
    }
}

export function getEmailBody4ErollmentReminder (AlertType, friendlyTerm) {
    let KQ = ""
    if (AlertType=="SUBJECT") {
        KQ = "<br><br>Our system shows that you have not registered for any subjects for Term " + friendlyTerm 
    } else {
        KQ = "<br><br>Our system shows that you have completed Phase 1 of the subject enrolment but have not registered for Phase 2 (Class selection). "
        KQ = KQ + "Therefore, your enrolment for Term " + friendlyTerm +" remains incomplete."
    }
    KQ = KQ + "<br><br><strong>Missed the registration deadlines?</strong>"
    KQ = KQ + "<br>If you missed the class registration deadlines due to unexpected circumstances, you may email us no later than 7 days before the new term starts for further support."
    KQ = KQ + "<br>Please note that if your request is approved, you will be allocated to any available classes based on their current availability. Requests for specific classes or schedules will not be accommodated."
    KQ = KQ + "<br><br><strong>Taking a term break from your study?</strong>"
    KQ = KQ + "<br>If you plan to take a break from your study and will not register for any classes for Term " + friendlyTerm
    KQ = KQ + ", you must submit a Leave of Absence (LOA) request "
    KQ = KQ + "(Guide <a href='https://sites.google.com/westernsydney.edu.vn/mywsuvn/home/student-support/student-requests?authuser=0'>HERE</a>)"
    KQ = KQ + " to formally apply for your leave."
    KQ = KQ + "<br>Kindly note that withdrawing from all subjects or failing to register in subjects for the current term does not constitute Leave of Absence. Students who do not register in subjects for the current term of their program, and who have not applied for Leave of Absence, will be considered as having abandoned from program and may lose their place at the University. "
    KQ = KQ + "<br><br>If you have any questions, you can reach out to Student Advisor team by creating a ticket at MyWSU.vn (Student Request)."
    KQ = KQ + "<br>Kindly disregard this email if you have completed the required actions."
    KQ = KQ + "<br><br>Best regards,"
    KQ = KQ + "<br>Student Hub"
    KQ = KQ + "<br>Western Sydney Vietnam"
    return KQ
}
            
export function getEmailBody4CollectingS2StudentIDCard () {
    let KQ = "Dear student,"
    KQ = KQ + "<br>Your Stage 2 Student ID card is now available for collection."
    KQ = KQ + "<br>Please arrange to collect your card at the Reception Desk, 196 Tran Quang Khai, during our working hours within 20 working days from the date of this email."
    KQ = KQ + "<br>Please note that cards not collected within the above period will no longer be under our responsibility. We will not be responsible for any loss or damage after the collection period ends. "
    KQ = KQ + "<br>If you have any questions, feel free to log a request at mywsu.vn > Student request > Ask a question."
    KQ = KQ + "<br><br>Kind regards,"
    KQ = KQ + "<br>Western Sydney Vietnam Team"
    return KQ
}    

export function buildHeaders(rows) {
    if (!rows?.length) return []
    const keys = new Set()
    for (const r of rows) for (const k of Object.keys(r)) keys.add(k)
        return [...keys].map(k => ({
            title: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            key: k,
        }
    ))
}

export function buildTable4A(rows) {
    const segments = [
        { prg_major: 'BBUS AF',    filter: r => r.StdtPRG === 'BBUS' && r.Major === 'AF'  },
        { prg_major: 'BBUS IB',    filter: r => r.StdtPRG === 'BBUS' && r.Major === 'IB'  },
        { prg_major: 'BBUS MK',    filter: r => r.StdtPRG === 'BBUS' && r.Major === 'MK'  },
        { prg_major: 'BBUS Total', filter: r => r.StdtPRG === 'BBUS'                       },
        { prg_major: 'BCOMM',      filter: r => r.StdtPRG === 'BCOMM'                      },
        { prg_major: 'BDATA',      filter: r => r.PRG === 'BDATA'                          },
    ]

    const aggMap = {}
    segments.forEach(seg => {
        rows.filter(seg.filter).forEach(r => {
            const key = `${seg.prg_major}|${r.Term}`
            if (!aggMap[key]) aggMap[key] = { prg_major: seg.prg_major, Term: r.Term, enrollments: 0, students: new Set() }
            aggMap[key].enrollments++
            aggMap[key].students.add(r.MSSV)
        })
    })

    const aggregated = Object.values(aggMap).map(r => ({
        prg_major: r.prg_major,
        Term: r.Term,
        avg_subj: +(r.enrollments / r.students.size).toFixed(2)
    }))

    return MyPivot(aggregated, {
        keys: ['prg_major'],
        value: 'avg_subj',
        pivot: 'Term',
    })
}



export function Progression_getEmailBody_AR (term) {
    let KQ = "Dear Students,"
    KQ = KQ + `<br><br>We would like to remind you of the Academic Progression of ${term} has been released.`
    KQ = KQ + "<br><br>At Western, we regularly review students’ academic progress to ensure they stay on track. Once enrolled, it is essential that you successfully complete the required subjects to progress towards graduation. Progression checks help identify any academic challenges early, allowing you the opportunity to seek advice, access counselling, and improve performance, while also preventing potential financial burdens due to continued poor performance."
    KQ = KQ + "<br><br>After the official results release date, your grades, and Term Grade Point Average (GPA) will be reviewed to assess whether your academic progress is satisfactory. You will receive an email with details of your calculated Academic Standing and Progression Outcome. This will include a breakdown of your academic performance based on the Progression Policy and an overall progression outcome based on the most consequential sanction, if applicable."
    KQ = KQ + "<br><br>Additionally, you will receive a notification in MySR (My Student Records) advising you of your Academic Standing, which you must acknowledge."
    KQ = KQ + "<br><br>We recommend that you familiarise yourself with the <a href='https://www.westernsydney.edu.au/students/progression'>Academic Progression</a> webpage for detailed explanations on each Progression Rule. Further information regarding the stages of Academic Standing can be found in the <a href='https://policies.westernsydney.edu.au/document/view.current.php?id=27'>Progression Policy</a>."
    KQ = KQ + "<br><br>We’re here to help, if you have any questions or need further information, feel free to contact us by creating a ticket at mywsu.vn > student request > ask a question."
    KQ = KQ + "<br><br>Best regards,"
    KQ = KQ + "<br>Western Sydney Vietnam"
    return KQ
}

export function Progression_getEmailBody_CE (term, nextTerm) {
    let KQ = "Dear Students,"
    KQ = KQ + `<br><br>This is a reminder that your overall academic standing of ${term} is Conditional Enrolment. You can refer to the <a href='https://www.westernsydney.edu.au/students/progression'>Academic Progression</a> page for more details.`
    KQ = KQ + `<br><br>Conditional Enrolment indicates that you are not satisfactorily meeting the Progression Rules. As a condition of your enrolment, you must reduce your enrolment of ${nextTerm} to a maximum of 2 subjects.`
    KQ = KQ + "<br><br>We understand that there might be instances when you believe that you should not be placed in that academic standing. If that happens, you may apply to an official Show Cause application along with supporting documents. Please refer to the link <a href='https://www.westernsydney.edu.au/students/progression/progression-appeal-process'>Progression Show Cause</a> for more information about the process."
    KQ = KQ + "<br><br>We’re here to help, if you have any questions or need further information, feel free to contact us by creating a ticket at mywsu.vn > student request > ask a question."
    KQ = KQ + "<br><br>Best regards,"
    KQ = KQ + "<br>Western Sydney Vietnam"
    return KQ
}

export function Progression_getEmailBody_EX (term, nextTerm) {
    let KQ = "Dear Students,"
    KQ = KQ + `<br><br>This is a reminder that your overall academic standing of ${term} is Exclusion. You can refer to the <a href='https://www.westernsydney.edu.au/students/progression'>Academic Progression</a> page for more details.`
    KQ = KQ + `<br><br>Exclusion indicates that you have not met the necessary requirements for continued enrollment. Your exclusion period is 12 months (equivalent to 3 terms), starting from ${nextTerm}. During this period, you will lose access to your Western Account and will be unable to study at Western or any other Australian university.`
    KQ = KQ + "<br><br>We understand that there might be instances when you believe that you should not be placed in that academic standing. If that happens, you may apply to an official Show Cause application along with supporting documents. Please refer to the link <a href='https://www.westernsydney.edu.au/students/progression/progression-appeal-process'>Progression Show Cause</a> for more information about the process."
    KQ = KQ + "<br><br>After your Exclusion period has ended, you can apply for re-admission to the university through the normal channels, but not less than one year from the date the Exclusion was applied. Please note that re-admission is not automatic and is subject to approval as per the <a href='https://policies.westernsydney.edu.au/document/view.current.php?id=7'>Admission Policy</a>."
    KQ = KQ + "<br><br>If your readmission is approved, you will resume your studies under the most updated program structure and course requirements in effect at the time of your return."
    KQ = KQ + "<br><br>We’re here to help, if you have any questions or need further information, feel free to contact us by creating a ticket at mywsu.vn > student request > ask a question."
    KQ = KQ + "<br><br>Best regards,"
    KQ = KQ + "<br>Western Sydney Vietnam"
    return KQ
}


