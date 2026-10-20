import * as XLSX from 'xlsx';

export async function ChunkingArray(orrArray, ChunkSize = 128){
    const batches = []
    for (let i = 0; i < orrArray.length; i += ChunkSize) {
        batches.push(orrArray.slice(i, i + ChunkSize))
    }
    return batches
}

// Master rules for valid tests and minimum scores
const ADMISSION_ENGLISH_RULES = [
  { testName: 'IELTS', minScore: 5.5 },
  { testName: 'TOEFL', minScore: 70 }, 
  { testName: 'PTE',   minScore: 50 }  
];

function parseBandScore(bandStr) {
  if (!bandStr || typeof bandStr !== 'string') return {};

  const matches = bandStr.match(/([LSRW]):\s*([\d.]+)/gi);
  if (!matches) return {};

  const bandObj = {};
  matches.forEach(item => {
    const [skill, score] = item.split(':').map(s => s.trim());
    bandObj[skill.toUpperCase()] = Number(score);
  });

  return bandObj; 
}


function validateAndStandardizeEnglish(input) {
  if (!input || typeof input !== 'string') return '';
  const cleanInput = input.trim();
  const match = cleanInput.match(/^([A-Za-z]+)\s*([\d.]+)/);
  if (!match) return ''; // Rejects VEPT, internal/design tests, or unparseable formats
  const rawTestName = match[1].toUpperCase();
  const score = parseFloat(match[2]);
  const rule = ADMISSION_ENGLISH_RULES.find(r => r.testName === rawTestName);
  if (!rule || isNaN(score) || score < rule.minScore) {
    return '';
  }
  return `${rule.testName} ${score}`;
}


export async function ReadNewOfferedFromXls(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const filteredRows = rows.slice(5).filter(f => f[2] && f[2].toString().trim() !== '' &&  f[24] && !f[24].toString().includes('ALL'));
  
  const result = filteredRows.map((row, index) => {
    try {
      const validEnglishTest = validateAndStandardizeEnglish(row[31]);
      const rawScholarship = row[25]?.toString() || '';
      const matchScholarship = rawScholarship.match(/\((\d+(?:\.\d+)?)\s*%\)/);
      const scholarshipVal = matchScholarship ? Number(matchScholarship[1]) : 0;
      let HBUEH_Val = 0;
      const rawHBUEH = row[26]?.toString() || '';
      if (!rawHBUEH.toLowerCase().includes('none')) {
        const matchHBUEH = rawHBUEH.match(/(\d+(?:\.\d+)?)/);
        if (matchHBUEH) {
          const num = Number(matchHBUEH[1]);
          HBUEH_Val = (num > 0 && num <= 1) ? Math.round(num * 100) : Math.round(num);
        }
      }      
      return {
        Sales: row[1] =='EduFin' ? row[1] : 'WSU', 
        MSSV: row[2],
        ApplicationID: row[4],
        PRG: row[6] ? row[6].toString().split(' ')[2].toUpperCase() : '',
        FullName: row[7],
        Gender: row[11],
        DOB: toISODate(row[12]),
        POB: row[13],
        PhoneNo: row[15],
        CCCD: row[17] || '',
        CCCDDate: toISODate(row[18]),
        Email: row[20],
        CtcPhone: row[21],
        THPT: row[22],
        SchoolCity: row[22]?.split('-')[1]?.trim() || '',
        SchoolName: row[22]?.split('-')[5]?.trim() || '',
        DirectOrEAP: row[24] ? row[24].toString().split('-')[1]?.trim() : '',
        Scholarship: scholarshipVal,
        HBUEH: HBUEH_Val,
        System: row[27],
        Intake: row[28] ? row[28].split(' ')[1] : '',
        GradType: row[29],
        GPA: row[30],
        English: validEnglishTest, 
        TestDate: toISODate(row[32]),
        Band: JSON.stringify(parseBandScore(row[33])),
        Issuer: row[37], 
        AcceptDate: row[41] ? row[41].split(' ')[0] : '',
        PreEnroll: row[45], 
      };

    } catch (error) {
      console.error(`Error processing row at index ${index}:`, {
        errorMessage: error.message,
        problematicRow25: row[25],
        fullRowData: row
      });
      
      // Rethrow if you want the script to stop, or return null/fallback object
      throw error; 
    }
  });

  return result;

}



function toISODate(val) {
  if (val == null || val === '') return null;

  // Real Excel date serial (number)
  if (typeof val === 'number') {
    return XLSX.SSF.format('yyyy-mm-dd', val);
  }

  // Already a JS Date (if you read with cellDates: true)
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }

  // Text date like "17/03/2008" (dd/mm/yyyy)
  if (typeof val === 'string') {
    const m = val.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const [, d, mo, y] = m;
      return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  return null; // unparseable
}

export async function ReadS2StdtIDFromXls(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  // Get the whole sheet as an array of arrays
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  // Skip header row (index 0) and extract only columns A (0) and I (8)
  const result = rows.slice(1).map(row => ({
    StdtID: row[0] || '',
    S1Mail: row[8] || ''
  }));
  return result;
}

export async function ReadGPW2WSUFromXls(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  // Get the whole sheet as an array of arrays
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  // Skip header row (index 0) and extract only columns A (0) and I (8)
  const result = rows.slice(1).filter(f=>f[0] && f[0]!='').map(row => ({
    GPW_ID: row[0] || '',
    PRG: row[1] || '',
    SBU: (!row[2] || row[2]=='') ? 'WSU' : 'GPW'
  }));
  return result;
}


export async function ReadEAP5romXls(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  // Get the whole sheet as an array of arrays
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  // Skip header row (index 0) and extract only columns A (0) and I (8)
  const result = rows.slice(1).filter(f=>f[10]=='DONE').map(row => ({
    MSSV: row[2] || '',
    Klass: row[5] || ''
  }));
  return result;
}



export async function ReadBudgetFromXls(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // ✅ header row is the FIRST row
  const headers = rows[0];
  
  const keyC = headers[1]; // 2025T1
  const keyD = headers[2]; // 2025T2
  const keyE = headers[3]; // 2025T3
  const keyF = headers[4]; // 2025T3
  const arrKQ = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[0] && r[0]!=''){
      arrKQ.push({ MMC: r[0], Term: keyC, Amount: r[1] });
      arrKQ.push({ MMC: r[0], Term: keyD, Amount: r[2] });
      arrKQ.push({ MMC: r[0], Term: keyE, Amount: r[3] });
      if (keyF){
        arrKQ.push({ MMC: r[0], Term: keyF, Amount: r[4] });
      }
    }
  }
  return arrKQ
}

export async function ReadKTChiFromXls(file, uEmail) {
  const result = {
    success: false,
    data: [],
    message: ''
  };

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "buffer" });

    if (workbook.SheetNames.length > 1) {
      result.message = 'File must contain exactly one sheet';
      return result;
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // chi lay ban ghi co cot X
    const filtered = rows.slice(6).filter(row => row[23] && row[23] != '' && row[11] && row[11] != '');
    const SBU_MAP = { "MARKETING": "MKTG", "PSO": "MBA" };

    // check neu thang ko dung hoac ko co NCC
    for (let i = 0; i < filtered.length; i++) {
      const row = filtered[i];
      const thang = Number(row[22]);

      if (!Number.isInteger(thang) || thang < 1 || thang > 12) {
        result.message = `Row ${i + 7}: Tháng (column W) must be between 1 and 12, got "${row[22]}"`;
        return result;
      }
    }    

    result.data = filtered.map(row => ({
      SBU: SBU_MAP[row[0]] ?? row[0],
      MMC: row[1],
      PRJ: row[18],
      Thang: `Tháng ${row[22]}`,
      UNCDate: XLSX.SSF.format('yyyy-mm-dd', row[4]),
      Term: row[11].trim().replace(/^(T\d)\/(\d{4})-?$/, "$2$1"),
      REF: row[5] + row[23],
      NDTT: row[7],
      Amount: row[12],
      NCC: row[16],
      FOP: "Chuyển khoản",
      Curr: "VND",
      ROE: 1,
      RQType: '99-KTChi'
    }));
    result.success = true;
    return result;

  } catch (e) {
    result.message = e.message || 'Failed to parse file';
    // fire-and-forget email; don't await, don't let it crash this function
    $fetch('/api/send-email', {
      method: 'POST',
      body: {
        to: uEmail,
        alias: 'Budget Compass',
        subject: '[Do NOT Reply] Error uploading Expenses by Accounting',
        message: e.message || String(e)
      }
    }).catch(() => { /* swallow email errors */ });
    return result;
  }
}

export async function ReadS2ProgressionFromXls(file, Term) {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const filtered = rows.slice(2).filter(row => row[25]!='Good Standing' || row[28]);
    const result = filtered.map(row => ({
      Term,
      StdtID: row[4],
      TotalStand: row[28] ? row[28] : row[24],
      ShowCause: row[31].toUpperCase(),
      Credit: row[39]
    }));
    return result;
  } catch(e){
  }
}

export async function ReadCheckLisenceFee(file) {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "buffer" });
    const arrKQ = []
    for (let i = 1; i < workbook.SheetNames.length; i++) {
        const sheetName = workbook.SheetNames[i];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        rows.shift()
        const result = rows.map(row => ({
            UnitName: row[19],
            StdtID: row[24]
        }));
        arrKQ.push(...result)
    }
    return arrKQ;
  } catch(e){
  }
}

export async function ReadAnnualNewTuition(file, frmTerm) {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "buffer" });
    const arrKQ = []
    for (let i = 0; i < workbook.SheetNames.length; i++) {
        const sheetName = workbook.SheetNames[i];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        rows.shift()
        rows.shift()
        const colCount = rows[0].length
        const result = rows.filter(f=>f[colCount-2] && f[colCount-1] ).map(row => ({
            FromTerm: frmTerm,
            CurrFee: row[colCount-2],
            NewFee: row[colCount-1]
        }));
        arrKQ.push(...result)
      }
    return arrKQ;
  } catch(e){
      console.log (e.message)
  }
}


export async function ReadProfileFromOtherSources(file ) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const filteredRows = rows.slice(1).filter(f=>f[3] && f[3].toString().trim()!='')
  const result = filteredRows.map(row => ({
    MSSV: '',
    ApplicationID: 'OTHER' + VietnameseName2UpperKhongDau(row[3]).replaceAll(' ','') + row[5],
    PRG: row[2].toString().split(' ')[2],
    FullName: row[3],
    Gender: row[4],
    DOB: XLSX.SSF.format('yyyy-mm-dd', row[5]),
    DirectOrEAP: row[6].toString().split('-')[1].trim(),
    Scholarship: (!row[7] || row[7] === '') 
      ? 0 
      : Number(row[7].split('(')[1].split(')')[0].replace('%', '').trim()) ,
    HBUEH: (!row[8] || row[8].includes('none') ) 
      ? 0 
      : Number(row[8].split('%')[0].trim()) ,
    Intake: row[9],
    PreEnroll: row[10],
    Fee: row[11],
    PhoneNo: row[12],
    Email: row[13],
    AcceptDate: XLSX.SSF.format('yyyy-mm-dd', row[5]),
    English: '', 
    GPA: 0,
    SchoolCity: '',
    POB: '',
    CCCD: '',
    CCCDDate: '1945-01-01',
    CtcPhone: '',
    THPT: '',
    SchoolName: '',
    System: '',
    GradType: '',
    TestDate: '1945-01-01',
    Band: '',
  }));
  return result;
}




export async function ReadDSCapTheSVGD2(file ) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const filteredRows = rows.slice(1).filter(f=>f[0])
  const result = filteredRows.map(row => ({
    student_id: row[0],
    FullName: row[1],
  }));
  return result;
}

export async function ReadConferralDate(file ) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const filteredRows = rows.slice(1).filter(f=>f[0])
  const result = filteredRows.map(row => ({
    SID: row[3],
    PRG: row[21].replace('Bachelor of ',''),
    CDate: XLSX.SSF.format('yyyy-mm-dd', row[32]),
  }));
  return result;
}

export async function ReadBanGiaoHoSo(file ) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const isChecked = (val) => val != null && val.toString().trim().toLowerCase() === 'x';
  const filteredRows = rows.slice(4).filter(f=>f[2] && f[2].toString().trim()!=='')
  const result = filteredRows.map(row => {
    const notes = [row[18], row[19]]
    .filter(val => val != null && val.toString().trim() !== '')
    .map(val => val.toString().trim());
    return {
      MSSV: row[2].toString().trim(),
      Photos: isChecked(row[8]),
      Application_Form: isChecked(row[9]),
      ID_Card: isChecked(row[10]) || isChecked(row[11]),
      HS_Completion_Certificate: isChecked(row[12]),
      Interim_Completion_Certificate: isChecked(row[13]),
      HS_Transcript: isChecked(row[14]),
      EnglishTest: row[15] ? row[15].toString().trim() : '',
      English_Certificate: false,    
      "Health_Certificate_(S1)": isChecked(row[16]),
      Acceptance: isChecked(row[17]),
      Note: notes.join(' | ')
    };
  });
  return result;
}

export async function ReadBHYTV1(file ) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const filteredRows = rows.slice(1).filter(f=>f[0])
  const result = filteredRows.map(row => ({
    MSSV: row[0],
    Amt: row[5],
    RMK: `BHYT den ${row[2]} = ${row[3]} thang x VND${row[4]}`,
    ValidThru: (row[5] !== null && row[5] !== undefined && row[5] !== '') ? null : toISODate(row[4])
  }));
  return result;
}

