export function cleanProfiles(raw) {
    return raw.map((student) => {
        const courses = typeof student.ExamResult === "string"
        ? JSON.parse(student.ExamResult)
        : (student.ExamResult || []);
        return { ...student, ExamResult: courses.map((c) => convertExamRow(c)) };
    });
}

function getSequence(klass, subjCode) {
    const segments = klass.split("-");
    const firstSeg = segments[0];

    let rawSeq;
    if (firstSeg === subjCode) {
        rawSeq = segments[segments.length - 1];   // Family A: trailing -N
    } else if (firstSeg.startsWith(subjCode)) {
        rawSeq = firstSeg.slice(subjCode.length); // Family B: glued seq
    } else {
        return null;
    }

    const seq = parseInt(rawSeq, 10);           // "1.2" -> 1
    return Number.isNaN(seq) ? null : seq;
}

 function toCleanKlass(klass, subjCode, term) {
    const termCode = getTermCode(term);
    if (!termCode) {
        throw new Error(`Unmapped term "${term}" for Klass="${klass}"`);
    }
    const seq = getSequence(klass, subjCode);
    if (seq === null) {
        throw new Error(`Cannot parse sequence: Klass="${klass}" SubjCode="${subjCode}"`);
    }
    return `${subjCode}-${termCode}WSB-${seq}`;
}

function to100(v) {
    return v == null ? null : Number((v * 10).toFixed(2));
}

function toGrade(mark100) {
    if (mark100 < 50) return "F";
    if (mark100 < 65) return "P";
    if (mark100 < 75) return "C";
    if (mark100 < 85) return "D";
    return "H";
}

function convertExamRow(row) {
    const total = to100(row.Total);
    return {
        GPW_ID:  row.GPW_ID,
        Klass:   toCleanKlass(row.Klass, row.SubjCode, row.Term),
        Midterm: to100(row.Midterm),
        Exam:    to100(row.Exam),
        Total:   total,
        Grade:   total == null ? null : toGrade(total),
    };
}

function getTermCode(term) {
    if (!term) return null;
    const match = term.match(/([a-zA-Z]+)|(\d+)/g);
    if (!match || match.length < 2) return null;

    let monthStr = "";
    let yearStr = "";

    if (isNaN(match[0])) {
        monthStr = match[0]; // e.g., "Jan"
        yearStr = match[1];  // e.g., "26"
    } else {
        yearStr = match[0];  // e.g., "2024"
        monthStr = match[1]; // e.g., "Jan"
    }
    const shortYear = yearStr.slice(-2);
    const months = {
        jan: 1, feb: 2, mar: 3, apr: 4,
        may: 5, jun: 6, jul: 7, aug: 8,
        sep: 9, oct: 10, nov: 11, dec: 12
    };

    const monthKey = monthStr.toLowerCase().substring(0, 3);
    const monthNum = months[monthKey];

    if (!monthNum) return null; // Return null if month is invalid

    let period = "";
    if (monthNum >= 1 && monthNum <= 4) {
        period = "1"; // Jan - Apr
    } else if (monthNum >= 5 && monthNum <= 8) {
        period = "2"; // May - Aug
    } else if (monthNum >= 9 && monthNum <= 12) {
        period = "3"; // Sep - Dec
    }
    return `T${period}${shortYear}`;
}            


// function flattenCourses(cleaned) {
//    return cleaned.flatMap((s) => s.ExamResult);
//}            
